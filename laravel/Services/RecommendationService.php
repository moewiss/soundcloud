<?php

namespace App\Services;

use App\Models\Track;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RecommendationService
{
    /**
     * Get "Continue Listening" tracks for a user.
     */
    public function getContinueListening(User $user, int $limit = 6): array
    {
        // Get recent play events with duration info
        $events = DB::table('play_events')
            ->where('user_id', $user->id)
            ->select('track_id', DB::raw('MAX(played_at) as last_played'), DB::raw('MAX(duration_listened) as listened'))
            ->groupBy('track_id')
            ->orderByDesc('last_played')
            ->limit(20)
            ->get();

        if ($events->isNotEmpty()) {
            // Get track durations
            $trackDurations = DB::table('tracks')
                ->whereIn('id', $events->pluck('track_id'))
                ->where('status', 'approved')
                ->pluck('duration_seconds', 'id');

            // Filter to incomplete listens
            $incomplete = $events->filter(function ($e) use ($trackDurations) {
                $dur = $trackDurations[$e->track_id] ?? 0;
                return $dur > 0 && $e->listened < ($dur * 0.8);
            })->take($limit)->pluck('track_id')->toArray();

            if (!empty($incomplete)) {
                return $incomplete;
            }
        }

        // Fallback: recent history
        return DB::table('history')
            ->where('history.user_id', $user->id)
            ->join('tracks', 'history.track_id', '=', 'tracks.id')
            ->where('tracks.status', 'approved')
            ->orderByDesc('history.updated_at')
            ->limit($limit)
            ->pluck('tracks.id')
            ->toArray();
    }

    /**
     * Get tracks from artists the user follows.
     */
    public function getFromFollowedArtists(User $user, int $limit = 8): array
    {
        $followingIds = DB::table('follows')
            ->where('follower_id', $user->id)
            ->pluck('following_id');

        if ($followingIds->isEmpty()) {
            return [];
        }

        return DB::table('tracks')
            ->where('status', 'approved')
            ->whereIn('user_id', $followingIds)
            ->where('created_at', '>=', now()->subDays(30))
            ->orderByDesc('created_at')
            ->limit($limit)
            ->pluck('id')
            ->toArray();
    }

    /**
     * Get user's favorite category and top tracks in it.
     */
    public function getPopularInFavoriteCategory(User $user, int $limit = 8): array
    {
        // Determine favorite category from history + likes
        $favoriteCategory = DB::table('history')
            ->where('history.user_id', $user->id)
            ->join('tracks', 'history.track_id', '=', 'tracks.id')
            ->whereNotNull('tracks.category')
            ->select('tracks.category', DB::raw('COUNT(*) as cnt'))
            ->groupBy('tracks.category')
            ->orderByDesc('cnt')
            ->value('category');

        if (!$favoriteCategory) {
            $favoriteCategory = 'Nasheeds'; // default
        }

        $ids = app(TrendingService::class)->getTopInCategory($favoriteCategory, $limit);

        return [
            'category' => $favoriteCategory,
            'track_ids' => $ids,
        ];
    }

    /**
     * SQL-based "Because You Liked [X]" — find similar tracks by tag overlap + category.
     */
    public function getBecauseYouLiked(User $user, int $limit = 8): array
    {
        // Get most recently liked track
        $recentLike = DB::table('likes')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->first();

        if (!$recentLike) {
            return ['source_track' => null, 'track_ids' => []];
        }

        $sourceTrack = Track::find($recentLike->track_id);
        if (!$sourceTrack || $sourceTrack->status !== 'approved') {
            return ['source_track' => null, 'track_ids' => []];
        }

        // Get user's played track ids to exclude
        $playedIds = DB::table('history')
            ->where('user_id', $user->id)
            ->pluck('track_id')
            ->toArray();

        // Find candidates in same category, not yet played
        $candidates = Track::approved()
            ->where('id', '!=', $sourceTrack->id)
            ->when($sourceTrack->category, fn($q) => $q->where('category', $sourceTrack->category))
            ->whereNotIn('id', $playedIds)
            ->get(['id', 'title', 'tags', 'plays', 'category']);

        // Score by tag overlap
        $sourceTags = collect($sourceTrack->tags ?? []);
        $scored = $candidates->map(function ($track) use ($sourceTags) {
            $candidateTags = collect($track->tags ?? []);
            $overlap = $sourceTags->intersect($candidateTags)->count();
            return [
                'id' => $track->id,
                'score' => $overlap * 10 + ($track->plays ?? 0) * 0.01,
            ];
        })->sortByDesc('score')->take($limit);

        return [
            'source_track' => $sourceTrack,
            'track_ids' => $scored->pluck('id')->toArray(),
        ];
    }

    /**
     * Build user taste profile for DeepSeek AI.
     */
    public function buildUserProfile(User $user): array
    {
        $likedTracks = DB::table('likes')
            ->where('likes.user_id', $user->id)
            ->join('tracks', 'likes.track_id', '=', 'tracks.id')
            ->where('tracks.status', 'approved')
            ->orderByDesc('likes.created_at')
            ->limit(20)
            ->get(['tracks.id', 'tracks.title', 'tracks.category', 'tracks.tags']);

        $topCategories = $likedTracks
            ->groupBy('category')
            ->map(fn($g) => $g->count())
            ->sortDesc()
            ->toArray();

        $topTags = $likedTracks
            ->pluck('tags')
            ->map(fn($t) => is_string($t) ? json_decode($t, true) : $t)
            ->flatten()
            ->filter()
            ->countBy()
            ->sortDesc()
            ->take(15)
            ->toArray();

        $profile = [
            'liked_tracks' => $likedTracks->map(fn($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'category' => $t->category,
                'tags' => is_string($t->tags) ? json_decode($t->tags, true) : ($t->tags ?? []),
            ])->toArray(),
            'top_categories' => $topCategories,
            'top_tags' => $topTags,
        ];

        // Inject onboarding preferences if available
        $prefs = $user->preferences;
        if ($prefs && $prefs->onboarding_completed_at) {
            $profile['onboarding_preferences'] = [
                'languages' => $prefs->languages,
                'content_types' => $prefs->content_types,
                'style_preference' => $prefs->style_preference,
                'moods' => $prefs->moods,
                'contexts' => $prefs->contexts,
            ];
        }

        return $profile;
    }

    /**
     * Get AI recommendation candidates (tracks user hasn't played/liked).
     * When the user has onboarding preferences, filter candidates by their content types.
     */
    public function getAICandidates(User $user, int $limit = 80): array
    {
        $playedIds = DB::table('history')
            ->where('user_id', $user->id)
            ->pluck('track_id');

        $likedIds = DB::table('likes')
            ->where('user_id', $user->id)
            ->pluck('track_id');

        $excludeIds = $playedIds->merge($likedIds)->unique()->toArray();

        $query = Track::approved()
            ->whereNotIn('id', $excludeIds);

        // Filter by onboarding preferences if available and user is new
        $prefs = $user->preferences;
        if ($prefs && !empty($prefs->content_types) && $playedIds->isEmpty()) {
            $categories = $this->mapContentTypesToCategories($prefs->content_types);
            if (!empty($categories)) {
                $query->whereIn('category', $categories);
            }

            // Filter by style preference for nasheed tracks
            if ($prefs->style_preference && $prefs->style_preference !== 'no_preference') {
                $query->where(function ($q) use ($prefs) {
                    $q->where('style_tag', $prefs->style_preference)
                      ->orWhereNull('style_tag')
                      ->orWhere('category', '!=', 'Nasheeds');
                });
            }
        }

        return $query
            ->withCount('likes')
            ->orderByDesc('likes_count')
            ->limit($limit)
            ->get(['id', 'title', 'category', 'tags', 'plays'])
            ->map(fn($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'category' => $t->category,
                'tags' => $t->tags ?? [],
                'likes' => $t->likes_count,
                'plays' => $t->plays ?? 0,
            ])
            ->toArray();
    }

    private function mapContentTypesToCategories(array $contentTypes): array
    {
        $map = [
            'classical_nasheeds' => 'Nasheeds',
            'modern_nasheeds' => 'Nasheeds',
            'children_nasheeds' => 'Nasheeds',
            'full_recitations' => 'Quran',
            'short_surahs' => 'Quran',
            'tafsir' => 'Lectures',
            'aqeedah' => 'Lectures',
            'seerah' => 'Lectures',
            'fiqh' => 'Lectures',
            'tarbiyah' => 'Lectures',
            'islamic_podcasts' => 'Broadcast',
            'muslim_lifestyle' => 'Broadcast',
        ];

        $categories = [];
        foreach ($contentTypes as $type) {
            if (isset($map[$type])) {
                $categories[] = $map[$type];
            }
        }

        return array_unique($categories);
    }

    /**
     * Get cached AI recommendations from DB.
     */
    public function getCachedRecommendations(int $userId, string $section, int $limit = 10): array
    {
        return DB::table('user_recommendations')
            ->where('user_id', $userId)
            ->where('section', $section)
            ->where('computed_at', '>=', now()->subHours(6))
            ->orderByDesc('score')
            ->limit($limit)
            ->get(['track_id', 'score', 'reason', 'source_track_id'])
            ->toArray();
    }

    /**
     * Store AI recommendations to DB.
     */
    public function storeRecommendations(int $userId, string $section, array $recommendations, ?int $sourceTrackId = null): void
    {
        // Clear old recommendations for this section
        DB::table('user_recommendations')
            ->where('user_id', $userId)
            ->where('section', $section)
            ->delete();

        $rows = [];
        foreach ($recommendations as $rec) {
            $rows[] = [
                'user_id' => $userId,
                'track_id' => $rec['track_id'],
                'section' => $section,
                'score' => $rec['score'] ?? 0,
                'reason' => $rec['reason'] ?? null,
                'source_track_id' => $sourceTrackId,
                'computed_at' => now(),
            ];
        }

        if (!empty($rows)) {
            DB::table('user_recommendations')->insert($rows);
        }
    }
}
