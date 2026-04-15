<?php

namespace App\Services;

use App\Models\Track;
use App\Models\User;
use App\Jobs\ComputeUserRecommendations;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class HomePageService
{
    private TrendingService $trending;
    private RecommendationService $recommendation;

    public function __construct(TrendingService $trending, RecommendationService $recommendation)
    {
        $this->trending = $trending;
        $this->recommendation = $recommendation;
    }

    /**
     * Build the full home page response.
     */
    public function build(?User $user): array
    {
        $sections = [];

        // Hero
        $hero = $this->buildHero($user);

        // Global sections (cached 15 min)
        $global = Cache::remember('home:global', 900, function () {
            return $this->buildGlobalSections();
        });

        // Merge global sections
        $sections = array_merge($sections, $global);

        // Personalized sections (if authenticated)
        if ($user) {
            $personal = Cache::remember("home:user:{$user->id}", 300, function () use ($user) {
                return $this->buildPersonalizedSections($user);
            });
            $sections = array_merge($sections, $personal);
        }

        // Sort sections by their defined order
        usort($sections, fn($a, $b) => ($a['order'] ?? 99) - ($b['order'] ?? 99));

        // Remove 'order' key from response
        $sections = array_map(function ($s) {
            unset($s['order']);
            return $s;
        }, $sections);

        // Remove empty sections
        $sections = array_values(array_filter($sections, fn($s) => !empty($s['tracks'])));

        return [
            'hero' => $hero,
            'sections' => $sections,
        ];
    }

    private function buildHero(?User $user): array
    {
        $hour = (int) now()->format('H');
        if ($hour < 12) {
            $greeting = 'Good Morning';
        } elseif ($hour < 17) {
            $greeting = 'Good Afternoon';
        } else {
            $greeting = 'Good Evening';
        }

        return [
            'greeting' => $greeting,
            'user_name' => $user?->name ?? null,
        ];
    }

    private function buildGlobalSections(): array
    {
        $sections = [];

        // Trending Now (#3)
        $trendingIds = $this->trending->getTrending(12);
        if (empty($trendingIds)) {
            // Fallback: most played
            $trendingIds = DB::table('tracks')->where('status', 'approved')->orderByDesc('plays')->limit(12)->pluck('id')->toArray();
        }
        $sections[] = [
            'key' => 'trending',
            'label' => 'Trending Now',
            'arabic_label' => "\u{0627}\u{0644}\u{0623}\u{064E}\u{0643}\u{0652}\u{062B}\u{064E}\u{0631} \u{0631}\u{064E}\u{0648}\u{064E}\u{0627}\u{062C}\u{064B}\u{0627}",
            'type' => 'horizontal_scroll',
            'personalized' => false,
            'order' => 3,
            'tracks' => $this->hydrateTracks($trendingIds),
        ];

        // New Releases (#6)
        $newIds = DB::table('tracks')
            ->where('status', 'approved')
            ->where('created_at', '>=', now()->subDays(30))
            ->orderByDesc('created_at')
            ->limit(10)
            ->pluck('id')
            ->toArray();
        if (empty($newIds)) {
            $newIds = DB::table('tracks')->where('status', 'approved')->orderByDesc('created_at')->limit(10)->pluck('id')->toArray();
        }
        $sections[] = [
            'key' => 'new_releases',
            'label' => 'New Releases',
            'arabic_label' => "\u{0627}\u{0644}\u{0625}\u{0635}\u{062F}\u{0627}\u{0631}\u{0627}\u{062A} \u{0627}\u{0644}\u{062C}\u{062F}\u{064A}\u{062F}\u{0629}",
            'type' => 'horizontal_scroll',
            'personalized' => false,
            'order' => 6,
            'tracks' => $this->hydrateTracks($newIds),
        ];

        // Viral Hits (#9)
        $viralIds = $this->trending->getViral(10);
        $sections[] = [
            'key' => 'viral',
            'label' => 'Viral Hits',
            'arabic_label' => "\u{0627}\u{0644}\u{0623}\u{0643}\u{062B}\u{0631} \u{0627}\u{0646}\u{062A}\u{0634}\u{0627}\u{0631}\u{064B}\u{0627}",
            'type' => 'horizontal_scroll',
            'personalized' => false,
            'order' => 9,
            'tracks' => $this->hydrateTracks($viralIds),
        ];

        // Rising Artists (#10)
        $risingArtists = $this->getRisingArtists(6);
        $sections[] = [
            'key' => 'rising_artists',
            'label' => 'Rising Artists',
            'arabic_label' => "\u{0641}\u{0646}\u{0627}\u{0646}\u{0648}\u{0646} \u{0635}\u{0627}\u{0639}\u{062F}\u{0648}\u{0646}",
            'type' => 'artist_grid',
            'personalized' => false,
            'order' => 10,
            'tracks' => $risingArtists,
        ];

        // Most Played (#11)
        $mostPlayedIds = $this->trending->getMostPlayed(8);
        $sections[] = [
            'key' => 'most_played',
            'label' => 'Most Played',
            'arabic_label' => "\u{0627}\u{0644}\u{0623}\u{0643}\u{062B}\u{0631} \u{0627}\u{0633}\u{062A}\u{0645}\u{0627}\u{0639}\u{064B}\u{0627}",
            'type' => 'list',
            'personalized' => false,
            'order' => 11,
            'tracks' => $this->hydrateTracks($mostPlayedIds),
        ];

        // Category: Nasheeds (#12)
        $nasheedIds = $this->trending->getTopInCategory('Nasheeds', 8);
        $sections[] = [
            'key' => 'nasheeds',
            'label' => 'Nasheeds',
            'arabic_label' => "\u{0627}\u{0644}\u{0623}\u{064E}\u{0646}\u{0627}\u{0634}\u{064A}\u{062F}",
            'type' => 'horizontal_scroll',
            'personalized' => false,
            'order' => 12,
            'tracks' => $this->hydrateTracks($nasheedIds),
        ];

        // Category: Podcasts (#13) — maps to "Broadcast" category
        $podcastIds = $this->trending->getTopInCategory('Broadcast', 8);
        $sections[] = [
            'key' => 'podcasts',
            'label' => 'Podcasts',
            'arabic_label' => "\u{0628}\u{0648}\u{062F}\u{0643}\u{0627}\u{0633}\u{062A}",
            'type' => 'list',
            'personalized' => false,
            'order' => 13,
            'tracks' => $this->hydrateTracks($podcastIds),
        ];

        // Category: Lectures (#14)
        $lectureIds = $this->trending->getTopInCategory('Lectures', 8);
        $sections[] = [
            'key' => 'lectures',
            'label' => 'Lectures & Talks',
            'arabic_label' => "\u{0627}\u{0644}\u{0645}\u{064F}\u{062D}\u{0627}\u{0636}\u{064E}\u{0631}\u{0627}\u{062A}",
            'type' => 'list',
            'personalized' => false,
            'order' => 14,
            'tracks' => $this->hydrateTracks($lectureIds),
        ];

        return $sections;
    }

    private function buildPersonalizedSections(User $user): array
    {
        $sections = [];
        $isPremium = !in_array($user->plan_slug, ['free', null]);

        // Continue Listening (#2) — available to all authenticated users
        $continueIds = $this->recommendation->getContinueListening($user, 6);
        $sections[] = [
            'key' => 'continue_listening',
            'label' => 'Continue Listening',
            'arabic_label' => "\u{0623}\u{064E}\u{0643}\u{0652}\u{0645}\u{0650}\u{0644}\u{0650} \u{0627}\u{0644}\u{0627}\u{0633}\u{0652}\u{062A}\u{0650}\u{0645}\u{0627}\u{0639}",
            'type' => 'horizontal_scroll',
            'personalized' => true,
            'order' => 2,
            'tracks' => $this->hydrateTracks($continueIds),
        ];

        // Recommended For You (#4) — AI-powered, available to all authenticated users
        $aiRecs = $this->recommendation->getCachedRecommendations($user->id, 'recommended', 10);
        $recTrackIds = array_column($aiRecs, 'track_id');
        if (empty($recTrackIds)) {
            try {
                ComputeUserRecommendations::dispatch($user->id)->onQueue('default');
            } catch (\Exception $e) {}
            // Fallback: top trending tracks the user hasn't liked
            $likedIds = DB::table('likes')->where('user_id', $user->id)->pluck('track_id')->toArray();
            $query = DB::table('track_scores')
                ->join('tracks', 'track_scores.track_id', '=', 'tracks.id')
                ->where('tracks.status', 'approved')
                ->orderByDesc('track_scores.trending_score')
                ->limit(10);
            if (!empty($likedIds)) {
                $query->whereNotIn('tracks.id', $likedIds);
            }
            $recTrackIds = $query->pluck('tracks.id')->toArray();
        }
        $recTracks = $this->hydrateTracks($recTrackIds);
        foreach ($recTracks as &$track) {
            foreach ($aiRecs as $rec) {
                if ($rec->track_id == $track['id'] && !empty($rec->reason)) {
                    $track['ai_reason'] = $rec->reason;
                    break;
                }
            }
        }
        $sections[] = [
            'key' => 'recommended',
            'label' => 'Recommended For You',
            'arabic_label' => "\u{0645}\u{064F}\u{0642}\u{0652}\u{062A}\u{064E}\u{0631}\u{064E}\u{062D}\u{064E}\u{0627}\u{062A} \u{0644}\u{064E}\u{0643}",
            'type' => 'grid',
            'personalized' => true,
            'order' => 4,
            'tracks' => $recTracks,
        ];

        // Because You Liked [X] (#5) — available to all authenticated users
        $becauseLiked = $this->recommendation->getBecauseYouLiked($user, 8);
        if ($becauseLiked['source_track']) {
            $sections[] = [
                'key' => 'because_liked',
                'label' => 'Because You Liked "' . $becauseLiked['source_track']->title . '"',
                'arabic_label' => "\u{0644}\u{0623}\u{064E}\u{0646}\u{064E}\u{0651}\u{0643} \u{0623}\u{064E}\u{0639}\u{0652}\u{062C}\u{064E}\u{0628}\u{064E}\u{0643}",
                'type' => 'horizontal_scroll',
                'personalized' => true,
                'order' => 5,
                'source_track' => [
                    'id' => $becauseLiked['source_track']->id,
                    'title' => $becauseLiked['source_track']->title,
                ],
                'tracks' => $this->hydrateTracks($becauseLiked['track_ids']),
            ];
        }

        // From Artists You Follow (#7)
        $followedIds = $this->recommendation->getFromFollowedArtists($user, 8);
        $sections[] = [
            'key' => 'from_followed',
            'label' => 'From Artists You Follow',
            'arabic_label' => "\u{0645}\u{0650}\u{0646} \u{0641}\u{064E}\u{0646}\u{0627}\u{0646}\u{064A}\u{0646} \u{062A}\u{064F}\u{062A}\u{0627}\u{0628}\u{0650}\u{0639}\u{0647}\u{0645}",
            'type' => 'list',
            'personalized' => true,
            'order' => 7,
            'tracks' => $this->hydrateTracks($followedIds),
        ];

        // Popular in [Favorite Category] (#8)
        $popCat = $this->recommendation->getPopularInFavoriteCategory($user, 8);
        $sections[] = [
            'key' => 'popular_category',
            'label' => 'Popular in ' . $popCat['category'],
            'arabic_label' => "\u{0627}\u{0644}\u{0623}\u{0643}\u{062B}\u{0631} \u{0634}\u{0639}\u{0628}\u{064A}\u{0629}",
            'type' => 'list',
            'personalized' => true,
            'order' => 8,
            'tracks' => $this->hydrateTracks($popCat['track_ids']),
        ];

        return $sections;
    }

    /**
     * Hydrate track IDs into full track objects with user info and counts.
     */
    private function hydrateTracks(array $ids): array
    {
        if (empty($ids)) {
            return [];
        }

        $tracks = Track::whereIn('id', $ids)
            ->where('status', 'approved')
            ->with(['user.profile'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->get()
            ->keyBy('id');

        // Preserve order
        $result = [];
        $authUser = auth()->user();
        $likedIds = [];
        $repostedIds = [];

        if ($authUser) {
            $likedIds = $authUser->likedTracks()->whereIn('track_id', $ids)->pluck('track_id')->toArray();
            $repostedIds = $authUser->repostedTracks()->whereIn('track_id', $ids)->pluck('track_id')->toArray();
        }

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

    /**
     * Get rising artists with their profile info + top track.
     */
    private function getRisingArtists(int $limit): array
    {
        $artists = DB::table('artist_scores')
            ->join('users', 'artist_scores.user_id', '=', 'users.id')
            ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
            ->where('artist_scores.track_count', '>=', 2)
            ->where('artist_scores.rising_score', '>', 0)
            ->whereNull('users.deleted_at')
            ->whereNull('users.banned_at')
            ->orderByDesc('artist_scores.rising_score')
            ->limit($limit)
            ->get([
                'users.id',
                'users.name',
                'profiles.display_name',
                'profiles.avatar_path',
                'artist_scores.track_count',
                'artist_scores.total_plays_7d',
                'artist_scores.total_likes_7d',
                'artist_scores.rising_score',
            ]);

        if ($artists->isEmpty()) {
            // Fallback: users with most tracks
            $artists = DB::table('users')
                ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                ->join(DB::raw('(SELECT user_id, COUNT(*) as track_count FROM tracks WHERE status = "approved" GROUP BY user_id HAVING COUNT(*) >= 2) tc'), 'users.id', '=', 'tc.user_id')
                ->whereNull('users.deleted_at')
                ->whereNull('users.banned_at')
                ->where('users.is_admin', 0)
                ->orderByDesc('tc.track_count')
                ->limit($limit)
                ->get([
                    'users.id',
                    'users.name',
                    'profiles.display_name',
                    'profiles.avatar_path',
                    'tc.track_count',
                ]);
        }

        return $artists->map(function ($a) {
            $avatarUrl = null;
            if (!empty($a->avatar_path)) {
                $baseUrl = rtrim(env('APP_URL', 'http://localhost'), '/');
                $avatarUrl = $baseUrl . '/storage/' . $a->avatar_path;
            }
            return [
                'id' => $a->id,
                'name' => $a->display_name ?? $a->name,
                'avatar_url' => $avatarUrl,
                'track_count' => $a->track_count ?? 0,
                'total_plays_7d' => $a->total_plays_7d ?? 0,
                'total_likes_7d' => $a->total_likes_7d ?? 0,
            ];
        })->toArray();
    }
}
