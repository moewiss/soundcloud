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

class ComputePopularSearches implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        try {
            // Aggregate searches from last 7 days
            $popular = DB::table('search_history')
                ->where('searched_at', '>=', now()->subDays(7))
                ->select('query', DB::raw('COUNT(*) as cnt'))
                ->groupBy('query')
                ->having('cnt', '>=', 2)
                ->orderByDesc('cnt')
                ->limit(50)
                ->get();

            foreach ($popular as $p) {
                DB::table('popular_searches')->updateOrInsert(
                    ['query' => $p->query],
                    ['search_count' => $p->cnt, 'last_searched_at' => now()]
                );
            }

            // Clean up old entries with low counts
            DB::table('popular_searches')
                ->where('last_searched_at', '<', now()->subDays(14))
                ->where('search_count', '<', 3)
                ->delete();

            Cache::forget('search:browse:global');
            Cache::forget('search:trending');

            Log::info('Popular searches computed: ' . $popular->count() . ' entries');
        } catch (\Exception $e) {
            Log::error('Failed to compute popular searches: ' . $e->getMessage());
        }
    }
}
