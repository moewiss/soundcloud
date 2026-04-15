<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ComputeArtistScores implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        try {
            $now = now();
            $sevenDaysAgo = $now->copy()->subDays(7);

            // Get artists with approved tracks
            $artists = DB::table('tracks')
                ->where('status', 'approved')
                ->select('user_id', DB::raw('COUNT(*) as track_count'))
                ->groupBy('user_id')
                ->having('track_count', '>=', 2)
                ->get();

            $trackIds = DB::table('tracks')
                ->where('status', 'approved')
                ->select('id', 'user_id')
                ->get()
                ->groupBy('user_id');

            $rows = [];
            foreach ($artists as $artist) {
                $artistTrackIds = ($trackIds[$artist->user_id] ?? collect())->pluck('id')->toArray();

                // 7-day plays on this artist's tracks
                $plays7d = DB::table('play_events')
                    ->whereIn('track_id', $artistTrackIds)
                    ->where('played_at', '>=', $sevenDaysAgo)
                    ->count();

                // 7-day likes on this artist's tracks
                $likes7d = DB::table('likes')
                    ->whereIn('track_id', $artistTrackIds)
                    ->where('created_at', '>=', $sevenDaysAgo)
                    ->count();

                // Follower growth in 7 days
                $followerGrowth = DB::table('follows')
                    ->where('following_id', $artist->user_id)
                    ->where('created_at', '>=', $sevenDaysAgo)
                    ->count();

                // Account age
                $accountAge = DB::table('users')
                    ->where('id', $artist->user_id)
                    ->value('created_at');
                $ageDays = $accountAge ? max($now->diffInDays($accountAge), 7) : 30;

                $risingScore = ($plays7d * 1.0 + $likes7d * 3.0 + $followerGrowth * 5.0) / $ageDays;

                $rows[] = [
                    'user_id' => $artist->user_id,
                    'total_plays_7d' => $plays7d,
                    'total_likes_7d' => $likes7d,
                    'follower_growth_7d' => $followerGrowth,
                    'track_count' => $artist->track_count,
                    'rising_score' => round($risingScore, 4),
                    'computed_at' => $now,
                ];
            }

            // Upsert
            foreach (array_chunk($rows, 50) as $chunk) {
                DB::table('artist_scores')->upsert(
                    $chunk,
                    ['user_id'],
                    ['total_plays_7d', 'total_likes_7d', 'follower_growth_7d', 'track_count', 'rising_score', 'computed_at']
                );
            }

            // Clean up artists no longer qualifying
            $validUserIds = collect($rows)->pluck('user_id');
            DB::table('artist_scores')
                ->whereNotIn('user_id', $validUserIds)
                ->delete();

            Cache::forget('home:global');
            Log::info('Artist scores computed for ' . count($rows) . ' artists');
        } catch (\Exception $e) {
            Log::error('Failed to compute artist scores: ' . $e->getMessage());
        }
    }
}
