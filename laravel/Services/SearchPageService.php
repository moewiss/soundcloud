<?php

namespace App\Services;

use App\Models\Track;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SearchPageService
{
    private TrendingService $trending;
    private RecommendationService $recommendation;
    private DeepSeekService $deepSeek;

    public function __construct(TrendingService $trending, RecommendationService $recommendation, DeepSeekService $deepSeek)
    {
        $this->trending = $trending;
        $this->recommendation = $recommendation;
        $this->deepSeek = $deepSeek;
    }

    /**
     * Get browse page data (no search query).
     */
    public function getBrowseData(?User $user): array
    {
        // Global sections (cached 5 min)
        $global = Cache::remember('search:browse:global', 300, function () {
            return [
                'trending_searches' => $this->getTrendingSearches(8),
                'categories' => $this->getCategories(),
                'moods' => $this->getMoods(),
                'top_charts' => [
                    'trending' => $this->hydrateTracks($this->trending->getTrending(6)),
                    'most_played' => $this->hydrateTracks($this->trending->getMostPlayed(6)),
                ],
            ];
        });

        $result = $global;

        // Personalized sections
        if ($user) {
            $personal = Cache::remember("search:browse:user:{$user->id}", 120, function () use ($user) {
                return [
                    'recent_searches' => $this->getRecentSearches($user->id, 5),
                    'for_you' => $this->hydrateTracks(
                        array_column(
                            $this->recommendation->getCachedRecommendations($user->id, 'recommended', 6),
                            'track_id'
                        )
                    ),
                ];
            });
            $result = array_merge($result, $personal);
        }

        return $result;
    }

    /**
     * Enhanced search with relevance scoring.
     */
    public function search(string $query, array $filters, ?User $user): array
    {
        $query = trim($query);
        if (empty($query)) {
            return ['tracks' => [], 'users' => [], 'playlists' => []];
        }

        $filter = $filters['filter'] ?? 'everything';
        $duration = $filters['duration'] ?? null;
        $category = $filters['category'] ?? null;
        $sort = $filters['sort'] ?? 'relevant';

        $tracks = [];
        $users = [];
        $playlists = [];

        // Search tracks
        if (in_array($filter, ['everything', 'tracks'])) {
            $tracks = $this->searchTracks($query, $duration, $category, $sort);
        }

        // Search users
        if (in_array($filter, ['everything', 'people', 'users'])) {
            $users = $this->searchUsers($query);
        }

        // Search playlists
        if (in_array($filter, ['everything', 'playlists'])) {
            $playlists = $this->searchPlaylists($query);
        }

        // Record search
        if ($user) {
            $this->recordSearch($user->id, $query, count($tracks));
        }

        return [
            'tracks' => $tracks,
            'users' => $users,
            'playlists' => $playlists,
        ];
    }

    /**
     * Generate fuzzy variants of a word to handle typos.
     * Produces: partial prefixes, character deletions, common substitutions.
     */
    private function generateFuzzyVariants(string $word): array
    {
        $word = strtolower($word);
        $variants = [$word];
        $len = strlen($word);

        if ($len < 3) return $variants;

        // Prefix (at least 3 chars) — catches truncated/incomplete words
        if ($len >= 4) {
            $variants[] = substr($word, 0, $len - 1);
            $variants[] = substr($word, 0, $len - 2);
        }

        // Single character deletion — catches extra character typos
        for ($i = 0; $i < $len; $i++) {
            $variants[] = substr($word, 0, $i) . substr($word, $i + 1);
        }

        // Adjacent character swap — catches transposition typos (e.g., "naheeds" → "nasheeds")
        for ($i = 0; $i < $len - 1; $i++) {
            $v = $word;
            $v[$i] = $word[$i + 1];
            $v[$i + 1] = $word[$i];
            $variants[] = $v;
        }

        // Common letter substitutions for Islamic terms
        $subs = [
            'sh' => 's', 's' => 'sh',
            'kh' => 'k', 'k' => 'kh',
            'th' => 't', 't' => 'th',
            'dh' => 'd', 'd' => 'dh',
            'ee' => 'i', 'i' => 'ee',
            'oo' => 'u', 'u' => 'oo',
            'aa' => 'a', 'a' => 'aa',
            'ph' => 'f', 'f' => 'ph',
            'qu' => 'q', 'q' => 'qu',
        ];
        foreach ($subs as $from => $to) {
            if (str_contains($word, $from)) {
                $variants[] = str_replace($from, $to, $word);
            }
        }

        return array_unique(array_filter($variants, fn($v) => strlen($v) >= 3));
    }

    /**
     * Search tracks with relevance scoring and typo tolerance.
     */
    private function searchTracks(string $query, ?string $duration, ?string $category, string $sort): array
    {
        $words = array_filter(explode(' ', $query), fn($w) => strlen($w) > 1);
        $queryLower = strtolower($query);

        // Generate fuzzy variants for each word
        $allVariants = [];
        foreach ($words as $word) {
            $allVariants = array_merge($allVariants, $this->generateFuzzyVariants($word));
        }
        $allVariants = array_unique($allVariants);

        // Build base query
        $q = Track::approved()->with(['user.profile'])->withCount(['likes', 'comments', 'reposts']);

        // Apply duration filter
        if ($duration === 'short') {
            $q->where('duration_seconds', '<', 300);
        } elseif ($duration === 'medium') {
            $q->whereBetween('duration_seconds', [300, 1800]);
        } elseif ($duration === 'long') {
            $q->where('duration_seconds', '>', 1800);
        }

        // Apply category filter
        if ($category) {
            $q->where('category', $category);
        }

        // Fuzzy search: title, description, tags + SOUNDEX + fuzzy variants
        $q->where(function ($qb) use ($query, $words, $allVariants) {
            // Exact/partial query match
            $qb->where('title', 'LIKE', "%{$query}%")
               ->orWhere('description', 'LIKE', "%{$query}%");

            // Each original word
            foreach ($words as $word) {
                $qb->orWhere('title', 'LIKE', "%{$word}%");
            }

            // Fuzzy variants (typo-tolerant)
            foreach ($allVariants as $variant) {
                $qb->orWhere('title', 'LIKE', "%{$variant}%");
            }

            // SOUNDEX matching — catches phonetic typos (e.g., "quoran" → "quran")
            foreach ($words as $word) {
                if (strlen($word) >= 3) {
                    $qb->orWhereRaw("SOUNDEX(title) = SOUNDEX(?)", [$word]);
                    // Also check each word in the title against the search word
                    $qb->orWhereRaw("SOUNDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(title, ' ', 1), ' ', -1)) = SOUNDEX(?)", [$word]);
                }
            }

            // Category matching (fuzzy — catches "lectuers" → "Lectures")
            foreach ($allVariants as $variant) {
                $qb->orWhere('category', 'LIKE', "%{$variant}%");
            }

            // Tag matching
            foreach ($words as $word) {
                $qb->orWhereRaw("JSON_SEARCH(tags, 'one', ?) IS NOT NULL", ["%{$word}%"]);
            }

            // Artist name matching (catches "maher zain" typos like "maher zein")
            foreach ($allVariants as $variant) {
                $qb->orWhereHas('user', function ($uq) use ($variant) {
                    $uq->where('name', 'LIKE', "%{$variant}%");
                });
            }
        });

        $candidates = $q->limit(40)->get();

        // If too few results, try broader SOUNDEX-only search
        if ($candidates->count() < 3 && count($words) > 0) {
            $broader = Track::approved()
                ->with(['user.profile'])
                ->withCount(['likes', 'comments', 'reposts']);

            if ($duration === 'short') $broader->where('duration_seconds', '<', 300);
            elseif ($duration === 'medium') $broader->whereBetween('duration_seconds', [300, 1800]);
            elseif ($duration === 'long') $broader->where('duration_seconds', '>', 1800);
            if ($category) $broader->where('category', $category);

            $broader->where(function ($qb) use ($words) {
                foreach ($words as $word) {
                    $qb->orWhereRaw("SOUNDEX(title) LIKE CONCAT(SOUNDEX(?), '%')", [$word]);
                }
            });

            $extraIds = $candidates->pluck('id')->toArray();
            $broader->whereNotIn('id', $extraIds)->limit(10);
            $candidates = $candidates->merge($broader->get());
        }

        // Score each candidate (with fuzzy scoring)
        $scored = $candidates->map(function ($track) use ($queryLower, $words, $allVariants) {
            $titleLower = strtolower($track->title);
            $score = 0;

            // Exact title match
            if ($titleLower === $queryLower) {
                $score += 100;
            } elseif (str_starts_with($titleLower, $queryLower)) {
                $score += 80;
            } elseif (str_contains($titleLower, $queryLower)) {
                $score += 60;
            }

            // Word matches in title (exact words = higher score)
            foreach ($words as $word) {
                if (str_contains($titleLower, strtolower($word))) {
                    $score += 30;
                }
            }

            // Fuzzy variant matches in title (lower score than exact)
            foreach ($allVariants as $variant) {
                if (!in_array($variant, array_map('strtolower', $words)) && str_contains($titleLower, $variant)) {
                    $score += 15;
                }
            }

            // SOUNDEX match bonus
            foreach ($words as $word) {
                $titleWords = explode(' ', $titleLower);
                foreach ($titleWords as $tw) {
                    if (strlen($tw) >= 3 && soundex($tw) === soundex($word)) {
                        $score += 25;
                    }
                }
            }

            // Artist name match
            $artistLower = strtolower($track->user?->name ?? '');
            foreach ($words as $word) {
                if (str_contains($artistLower, strtolower($word))) {
                    $score += 20;
                }
            }

            // Tag matches
            $tags = collect($track->tags ?? []);
            foreach ($words as $word) {
                if ($tags->contains(fn($t) => str_contains(strtolower($t), strtolower($word)))) {
                    $score += 20;
                }
            }

            // Category match
            if ($track->category && str_contains(strtolower($track->category), $queryLower)) {
                $score += 15;
            }

            // Description match
            if ($track->description && str_contains(strtolower($track->description), $queryLower)) {
                $score += 5;
            }

            // Popularity tiebreaker
            $popScore = DB::table('track_scores')->where('track_id', $track->id)->value('popularity_score') ?? 0;
            $score += $popScore * 0.01;

            $track->relevance_score = $score;
            return $track;
        });

        // Sort
        if ($sort === 'newest') {
            $scored = $scored->sortByDesc('created_at');
        } elseif ($sort === 'most_played') {
            $scored = $scored->sortByDesc('plays');
        } else {
            $scored = $scored->sortByDesc('relevance_score');
        }

        // Hydrate with auth info
        $likedIds = [];
        $repostedIds = [];
        if (auth()->check()) {
            $trackIds = $scored->pluck('id')->toArray();
            $likedIds = auth()->user()->likedTracks()->whereIn('track_id', $trackIds)->pluck('track_id')->toArray();
            $repostedIds = auth()->user()->repostedTracks()->whereIn('track_id', $trackIds)->pluck('track_id')->toArray();
        }

        return $scored->take(20)->values()->map(function ($track) use ($likedIds, $repostedIds) {
            return [
                'id' => $track->id,
                'title' => $track->title,
                'description' => $track->description,
                'audio_url' => $track->audio_url,
                'cover_url' => $track->cover_url,
                'duration' => $track->duration,
                'duration_seconds' => $track->duration_seconds,
                'plays_count' => $track->plays ?? 0,
                'likes_count' => $track->likes_count ?? 0,
                'comments_count' => $track->comments_count ?? 0,
                'reposts_count' => $track->reposts_count ?? 0,
                'is_liked' => in_array($track->id, $likedIds),
                'is_reposted' => in_array($track->id, $repostedIds),
                'category' => $track->category,
                'tags' => $track->tags,
                'created_at' => $track->created_at,
                'user' => $track->user,
            ];
        })->toArray();
    }

    /**
     * Search users/artists with typo tolerance.
     */
    private function searchUsers(string $query): array
    {
        $words = array_filter(explode(' ', $query), fn($w) => strlen($w) > 1);
        $allVariants = [];
        foreach ($words as $word) {
            $allVariants = array_merge($allVariants, $this->generateFuzzyVariants($word));
        }
        $allVariants = array_unique($allVariants);

        return User::where(function ($q) use ($query, $words, $allVariants) {
                $q->where('name', 'LIKE', "%{$query}%");
                foreach ($words as $word) {
                    $q->orWhere('name', 'LIKE', "%{$word}%");
                }
                // Fuzzy variants
                foreach ($allVariants as $variant) {
                    $q->orWhere('name', 'LIKE', "%{$variant}%");
                }
                // SOUNDEX
                foreach ($words as $word) {
                    if (strlen($word) >= 3) {
                        $q->orWhereRaw("SOUNDEX(name) = SOUNDEX(?)", [$word]);
                    }
                }
            })
            ->whereNull('deleted_at')
            ->whereNull('banned_at')
            ->with('profile')
            ->withCount('tracks')
            ->limit(10)
            ->get()
            ->map(function ($user) {
                $avatarUrl = null;
                if ($user->profile?->avatar_path) {
                    $baseUrl = rtrim(env('APP_URL', 'http://localhost'), '/');
                    $avatarUrl = $baseUrl . '/storage/' . $user->profile->avatar_path;
                }
                return [
                    'id' => $user->id,
                    'name' => $user->profile?->display_name ?? $user->name,
                    'avatar_url' => $avatarUrl,
                    'tracks_count' => $user->tracks_count,
                ];
            })
            ->toArray();
    }

    /**
     * Search playlists.
     */
    private function searchPlaylists(string $query): array
    {
        $words = array_filter(explode(' ', $query), fn($w) => strlen($w) > 1);

        return \App\Models\Playlist::where(function ($q) use ($query, $words) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%");
                foreach ($words as $word) {
                    $q->orWhere('name', 'LIKE', "%{$word}%");
                }
            })
            ->with('user.profile')
            ->withCount('tracks')
            ->limit(10)
            ->get()
            ->map(function ($playlist) {
                return [
                    'id' => $playlist->id,
                    'name' => $playlist->name,
                    'description' => $playlist->description,
                    'cover_url' => $playlist->cover_url ?? null,
                    'tracks_count' => $playlist->tracks_count,
                    'user' => [
                        'id' => $playlist->user->id,
                        'name' => $playlist->user->profile?->display_name ?? $playlist->user->name,
                    ],
                ];
            })
            ->toArray();
    }

    /**
     * AI-powered search using DeepSeek intent parsing.
     */
    public function getAISearchResults(string $query): array
    {
        $hash = md5(strtolower(trim($query)));

        // Check cache
        $cached = DB::table('ai_search_cache')
            ->where('query_hash', $hash)
            ->where('expires_at', '>', now())
            ->first();

        if ($cached) {
            $trackIds = json_decode($cached->track_ids, true) ?? [];
            return [
                'intent' => json_decode($cached->parsed_intent, true),
                'tracks' => $this->hydrateTracks($trackIds),
                'suggestion' => $cached->suggestion_text,
            ];
        }

        // Parse intent via DeepSeek
        $intent = $this->deepSeek->parseSearchQuery($query);
        if (!$intent) {
            return ['intent' => null, 'tracks' => [], 'suggestion' => null];
        }

        // Build targeted query from intent
        $q = Track::approved();

        if (!empty($intent['category'])) {
            $q->where('category', $intent['category']);
        }

        if (!empty($intent['duration_preference'])) {
            if ($intent['duration_preference'] === 'short') {
                $q->where('duration_seconds', '<', 300);
            } elseif ($intent['duration_preference'] === 'medium') {
                $q->whereBetween('duration_seconds', [300, 1800]);
            } elseif ($intent['duration_preference'] === 'long') {
                $q->where('duration_seconds', '>', 1800);
            }
        }

        if (!empty($intent['artist_name'])) {
            $q->whereHas('user', function ($uq) use ($intent) {
                $uq->where('name', 'LIKE', "%{$intent['artist_name']}%");
            });
        }

        // Search by concepts in title/tags/description
        $concepts = $intent['concepts'] ?? [];
        if (!empty($concepts)) {
            $q->where(function ($qb) use ($concepts) {
                foreach ($concepts as $concept) {
                    $qb->orWhere('title', 'LIKE', "%{$concept}%")
                       ->orWhere('description', 'LIKE', "%{$concept}%")
                       ->orWhereRaw("JSON_SEARCH(tags, 'one', ?) IS NOT NULL", ["%{$concept}%"]);
                }
            });
        }

        // Also include mood in title/description search
        if (!empty($intent['mood'])) {
            $q->orWhere(function ($qb) use ($intent) {
                $qb->where('title', 'LIKE', "%{$intent['mood']}%")
                    ->orWhere('description', 'LIKE', "%{$intent['mood']}%");
            });
        }

        // Get candidates, order by popularity
        $trackIds = $q->leftJoin('track_scores', 'tracks.id', '=', 'track_scores.track_id')
            ->orderByDesc('track_scores.popularity_score')
            ->limit(10)
            ->pluck('tracks.id')
            ->toArray();

        // Fallback: if too few results, broaden search
        if (count($trackIds) < 3) {
            $broadQ = Track::approved();
            foreach ($concepts as $concept) {
                $broadQ->orWhere('title', 'LIKE', "%{$concept}%");
            }
            $broadIds = $broadQ->orderByDesc('plays')->limit(10)->pluck('id')->toArray();
            $trackIds = array_unique(array_merge($trackIds, $broadIds));
            $trackIds = array_slice($trackIds, 0, 10);
        }

        $suggestion = $intent['suggestion_text'] ?? null;

        // Cache result
        DB::table('ai_search_cache')->updateOrInsert(
            ['query_hash' => $hash],
            [
                'query_text' => $query,
                'parsed_intent' => json_encode($intent),
                'track_ids' => json_encode(array_values($trackIds)),
                'suggestion_text' => $suggestion,
                'computed_at' => now(),
                'expires_at' => now()->addHour(),
            ]
        );

        return [
            'intent' => $intent,
            'tracks' => $this->hydrateTracks($trackIds),
            'suggestion' => $suggestion,
        ];
    }

    /**
     * Get autocomplete suggestions.
     */
    public function getSuggestions(string $prefix): array
    {
        $prefix = strtolower(trim($prefix));
        if (strlen($prefix) < 1) return [];

        return Cache::remember("search:suggest:" . md5($prefix), 600, function () use ($prefix) {
            $results = [];
            $variants = $this->generateFuzzyVariants($prefix);

            // Popular searches (exact + fuzzy prefix)
            $popular = DB::table('popular_searches')
                ->where(function ($q) use ($prefix, $variants) {
                    $q->where('query', 'LIKE', "{$prefix}%");
                    foreach ($variants as $v) {
                        $q->orWhere('query', 'LIKE', "{$v}%");
                    }
                })
                ->orderByDesc('search_count')
                ->limit(4)
                ->pluck('query')
                ->toArray();
            foreach ($popular as $q) {
                $results[] = ['text' => $q, 'type' => 'popular'];
            }

            // Artist names (exact + fuzzy + SOUNDEX)
            $artists = DB::table('users')
                ->where(function ($q) use ($prefix, $variants) {
                    $q->where('name', 'LIKE', "{$prefix}%");
                    foreach ($variants as $v) {
                        $q->orWhere('name', 'LIKE', "{$v}%");
                    }
                    if (strlen($prefix) >= 3) {
                        $q->orWhereRaw("SOUNDEX(name) = SOUNDEX(?)", [$prefix]);
                    }
                })
                ->whereNull('deleted_at')
                ->whereNull('banned_at')
                ->limit(2)
                ->pluck('name')
                ->toArray();
            foreach ($artists as $name) {
                $results[] = ['text' => $name, 'type' => 'artist'];
            }

            // Track titles (exact + fuzzy + SOUNDEX)
            $tracks = DB::table('tracks')
                ->where('status', 'approved')
                ->where(function ($q) use ($prefix, $variants) {
                    $q->where('title', 'LIKE', "{$prefix}%");
                    foreach ($variants as $v) {
                        $q->orWhere('title', 'LIKE', "{$v}%");
                    }
                    if (strlen($prefix) >= 3) {
                        $q->orWhereRaw("SOUNDEX(title) = SOUNDEX(?)", [$prefix]);
                    }
                })
                ->limit(2)
                ->pluck('title')
                ->toArray();
            foreach ($tracks as $title) {
                $results[] = ['text' => $title, 'type' => 'track'];
            }

            return array_slice($results, 0, 8);
        });
    }

    /**
     * Record a search query.
     */
    public function recordSearch(int $userId, string $query, int $resultCount): void
    {
        DB::table('search_history')->insert([
            'user_id' => $userId,
            'query' => strtolower(trim($query)),
            'result_count' => $resultCount,
            'searched_at' => now(),
        ]);

        // Increment popular searches
        DB::table('popular_searches')->updateOrInsert(
            ['query' => strtolower(trim($query))],
            ['search_count' => DB::raw('search_count + 1'), 'last_searched_at' => now()]
        );
    }

    public function getTrendingSearches(int $limit = 8): array
    {
        return Cache::remember('search:trending', 900, function () use ($limit) {
            return DB::table('popular_searches')
                ->orderByDesc('search_count')
                ->limit($limit)
                ->pluck('query')
                ->toArray();
        });
    }

    public function getRecentSearches(int $userId, int $limit = 5): array
    {
        return DB::table('search_history')
            ->where('user_id', $userId)
            ->orderByDesc('searched_at')
            ->limit($limit)
            ->get(['id', 'query', 'searched_at'])
            ->unique('query')
            ->values()
            ->take($limit)
            ->toArray();
    }

    public function clearSearchHistory(int $userId): void
    {
        DB::table('search_history')->where('user_id', $userId)->delete();
        Cache::forget("search:browse:user:{$userId}");
    }

    public function removeSearchHistoryItem(int $userId, int $id): void
    {
        DB::table('search_history')->where('id', $id)->where('user_id', $userId)->delete();
        Cache::forget("search:browse:user:{$userId}");
    }

    private function getCategories(): array
    {
        $counts = DB::table('tracks')
            ->where('status', 'approved')
            ->whereIn('category', ['Nasheeds', 'Broadcast', 'Lectures'])
            ->select('category', DB::raw('COUNT(*) as cnt'))
            ->groupBy('category')
            ->pluck('cnt', 'category');

        return [
            ['name' => 'Nasheeds', 'color' => '#1F7A5A', 'icon' => 'fa-music', 'track_count' => $counts['Nasheeds'] ?? 0],
            ['name' => 'Podcasts', 'color' => '#8c67ab', 'icon' => 'fa-podcast', 'track_count' => $counts['Broadcast'] ?? 0, 'category_value' => 'Broadcast'],
            ['name' => 'Lectures', 'color' => '#E8653A', 'icon' => 'fa-microphone', 'track_count' => $counts['Lectures'] ?? 0],
        ];
    }

    private function getMoods(): array
    {
        return [
            ['name' => 'Meditation', 'icon' => 'fa-spa', 'color' => '#1e8a6e', 'query' => 'calm meditation nasheeds'],
            ['name' => 'Focus', 'icon' => 'fa-brain', 'color' => '#477d95', 'query' => 'focus study background'],
            ['name' => 'Worship', 'icon' => 'fa-mosque', 'color' => '#1e3a5f', 'query' => 'worship prayer'],
            ['name' => 'Learning', 'icon' => 'fa-book-open', 'color' => '#bc5900', 'query' => 'educational islamic lectures'],
            ['name' => 'Calm', 'icon' => 'fa-cloud-moon', 'color' => '#503750', 'query' => 'peaceful relaxing sleep'],
        ];
    }

    /**
     * Hydrate track IDs into full track objects (reuse from HomePageService pattern).
     */
    private function hydrateTracks(array $ids): array
    {
        if (empty($ids)) return [];

        $tracks = Track::whereIn('id', $ids)
            ->where('status', 'approved')
            ->with(['user.profile'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->get()
            ->keyBy('id');

        $likedIds = [];
        $repostedIds = [];
        if (auth()->check()) {
            $likedIds = auth()->user()->likedTracks()->whereIn('track_id', $ids)->pluck('track_id')->toArray();
            $repostedIds = auth()->user()->repostedTracks()->whereIn('track_id', $ids)->pluck('track_id')->toArray();
        }

        $result = [];
        foreach ($ids as $id) {
            $track = $tracks[$id] ?? null;
            if (!$track) continue;
            $result[] = [
                'id' => $track->id,
                'title' => $track->title,
                'description' => $track->description,
                'audio_url' => $track->audio_url,
                'cover_url' => $track->cover_url,
                'duration' => $track->duration,
                'duration_seconds' => $track->duration_seconds,
                'plays_count' => $track->plays ?? 0,
                'likes_count' => $track->likes_count ?? 0,
                'comments_count' => $track->comments_count ?? 0,
                'reposts_count' => $track->reposts_count ?? 0,
                'is_liked' => in_array($track->id, $likedIds),
                'is_reposted' => in_array($track->id, $repostedIds),
                'category' => $track->category,
                'tags' => $track->tags,
                'created_at' => $track->created_at,
                'user' => $track->user,
            ];
        }
        return $result;
    }
}
