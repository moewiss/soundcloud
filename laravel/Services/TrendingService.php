<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class TrendingService
{
    /**
     * Recompute all track scores (trending, viral, popularity).
     * Called by ComputeTrackScores scheduled job.
     */
    public function computeAllScores(): void
    {
        $now = now();
        $sevenDaysAgo = $now->copy()->subDays(7);

        // Get 7-day engagement counts per track
        $plays7d = DB::table('play_events')
            ->where('played_at', '>=', $sevenDaysAgo)
            ->select('track_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('track_id')
            ->pluck('cnt', 'track_id');

        $likes7d = DB::table('likes')
            ->where('created_at', '>=', $sevenDaysAgo)
            ->select('track_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('track_id')
            ->pluck('cnt', 'track_id');

        $reposts7d = DB::table('reposts')
            ->where('created_at', '>=', $sevenDaysAgo)
            ->select('track_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('track_id')
            ->pluck('cnt', 'track_id');

        $comments7d = DB::table('comments')
            ->where('created_at', '>=', $sevenDaysAgo)
            ->select('track_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('track_id')
            ->pluck('cnt', 'track_id');

        // Get all approved tracks
        $tracks = DB::table('tracks')
            ->where('status', 'approved')
            ->select('id', 'plays', 'created_at')
            ->get();

        // Pre-fetch all-time like counts per track
        $allTimeLikeCounts = DB::table('likes')
            ->select('track_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('track_id')
            ->pluck('cnt', 'track_id');

        $rows = [];
        foreach ($tracks as $track) {
            $p = $plays7d[$track->id] ?? 0;
            $l = $likes7d[$track->id] ?? 0;
            $r = $reposts7d[$track->id] ?? 0;
            $c = $comments7d[$track->id] ?? 0;

            $ageDays = $now->diffInDays($track->created_at);

            // Trending: weighted engagement * recency boost
            $recencyBoost = 1.0 + 0.5 * max(0, 7 - $ageDays) / 7.0;
            $trending = ($p * 1.0 + $l * 3.0 + $r * 4.0 + $c * 2.0) * $recencyBoost;

            // Viral: all-time likes with like-to-play ratio, minimum 3 likes
            $allTimeLikes = $allTimeLikeCounts[$track->id] ?? 0;
            $viral = 0;
            if ($allTimeLikes >= 3) {
                $totalPlays = max($track->plays ?? 1, 1);
                $viral = ($allTimeLikes / $totalPlays) * log(1 + $allTimeLikes, 2) * $recencyBoost;
                // Boost if also has recent engagement
                if ($l > 0) {
                    $viral *= (1 + $l * 0.3);
                }
            }

            // Popularity: all-time plays + weighted recent engagement
            $popularity = ($track->plays ?? 0) * 0.5 + $trending * 0.5;

            $rows[] = [
                'track_id' => $track->id,
                'trending_score' => round($trending, 4),
                'viral_score' => round($viral, 4),
                'popularity_score' => round($popularity, 4),
                'computed_at' => $now,
            ];
        }

        // Upsert in chunks
        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('track_scores')->upsert(
                $chunk,
                ['track_id'],
                ['trending_score', 'viral_score', 'popularity_score', 'computed_at']
            );
        }

        // Clean up scores for deleted/rejected tracks
        DB::table('track_scores')
            ->whereNotIn('track_id', $tracks->pluck('id'))
            ->delete();
    }

    /**
     * Get trending tracks (pre-computed).
     */
    public function getTrending(int $limit = 12): array
    {
        return DB::table('track_scores')
            ->join('tracks', 'track_scores.track_id', '=', 'tracks.id')
            ->where('tracks.status', 'approved')
            ->where('track_scores.trending_score', '>', 0)
            ->orderByDesc('track_scores.trending_score')
            ->limit($limit)
            ->pluck('tracks.id')
            ->toArray();
    }

    /**
     * Get viral tracks (pre-computed).
     */
    public function getViral(int $limit = 10): array
    {
        return DB::table('track_scores')
            ->join('tracks', 'track_scores.track_id', '=', 'tracks.id')
            ->where('tracks.status', 'approved')
            ->where('track_scores.viral_score', '>', 0)
            ->orderByDesc('track_scores.viral_score')
            ->limit($limit)
            ->pluck('tracks.id')
            ->toArray();
    }

    /**
     * Get most played tracks (all-time).
     */
    public function getMostPlayed(int $limit = 8): array
    {
        return DB::table('tracks')
            ->where('status', 'approved')
            ->where('plays', '>', 0)
            ->orderByDesc('plays')
            ->limit($limit)
            ->pluck('id')
            ->toArray();
    }

    /**
     * Get top tracks in a specific category.
     */
    public function getTopInCategory(string $category, int $limit = 8): array
    {
        $ids = DB::table('track_scores')
            ->join('tracks', 'track_scores.track_id', '=', 'tracks.id')
            ->where('tracks.status', 'approved')
            ->where('tracks.category', $category)
            ->orderByDesc('track_scores.popularity_score')
            ->limit($limit)
            ->pluck('tracks.id')
            ->toArray();

        // Fallback to latest if no scores yet
        if (empty($ids)) {
            $ids = DB::table('tracks')
                ->where('status', 'approved')
                ->where('category', $category)
                ->orderByDesc('created_at')
                ->limit($limit)
                ->pluck('id')
                ->toArray();
        }

        return $ids;
    }
}
