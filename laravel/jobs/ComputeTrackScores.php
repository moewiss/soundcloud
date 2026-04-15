<?php

namespace App\Jobs;

use App\Services\TrendingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ComputeTrackScores implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(TrendingService $trending): void
    {
        try {
            $trending->computeAllScores();

            // Invalidate global home cache so next request gets fresh data
            Cache::forget('home:global');

            Log::info('Track scores computed successfully');
        } catch (\Exception $e) {
            Log::error('Failed to compute track scores: ' . $e->getMessage());
        }
    }
}
