<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\DeepSeekService;
use App\Services\RecommendationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ComputeUserRecommendations implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 2;
    public $timeout = 60;

    public function __construct(private int $userId) {}

    public function handle(DeepSeekService $deepSeek, RecommendationService $recommendation): void
    {
        $user = User::find($this->userId);
        if (!$user) return;

        try {
            // Build user taste profile
            $profile = $recommendation->buildUserProfile($user);

            // Need at least 3 liked tracks for meaningful AI recommendations
            if (count($profile['liked_tracks']) < 3) {
                Log::info("User {$this->userId} has < 3 likes, skipping AI recommendations");
                return;
            }

            // Get candidates
            $candidates = $recommendation->getAICandidates($user, 60);
            if (empty($candidates)) {
                Log::info("No candidates for user {$this->userId}");
                return;
            }

            // Call DeepSeek for "Recommended For You"
            $recs = $deepSeek->getRecommendations($profile, $candidates);

            if (!empty($recs)) {
                $recommendation->storeRecommendations($this->userId, 'recommended', $recs);
                Log::info("Stored " . count($recs) . " AI recommendations for user {$this->userId}");
            }

            // Call DeepSeek for "Because You Liked [X]"
            $becauseLiked = $recommendation->getBecauseYouLiked($user, 20);
            if ($becauseLiked['source_track'] && !empty($becauseLiked['track_ids'])) {
                $sourceTrack = $becauseLiked['source_track'];
                $blCandidates = \App\Models\Track::whereIn('id', $becauseLiked['track_ids'])
                    ->get(['id', 'title', 'category', 'tags', 'plays'])
                    ->map(fn($t) => [
                        'id' => $t->id,
                        'title' => $t->title,
                        'category' => $t->category,
                        'tags' => $t->tags ?? [],
                        'plays' => $t->plays ?? 0,
                    ])
                    ->toArray();

                $similarRecs = $deepSeek->getSimilarTracks(
                    [
                        'id' => $sourceTrack->id,
                        'title' => $sourceTrack->title,
                        'category' => $sourceTrack->category,
                        'tags' => $sourceTrack->tags ?? [],
                    ],
                    $blCandidates
                );

                if (!empty($similarRecs)) {
                    $recommendation->storeRecommendations(
                        $this->userId,
                        'because_liked',
                        $similarRecs,
                        $sourceTrack->id
                    );
                }
            }

            // Invalidate user home cache
            Cache::forget("home:user:{$this->userId}");

        } catch (\Exception $e) {
            Log::error("Failed to compute recommendations for user {$this->userId}: " . $e->getMessage());
        }
    }
}
