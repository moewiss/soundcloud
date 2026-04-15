<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class RecordPlayEvent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private int $trackId,
        private ?int $userId,
        private string $source = 'direct'
    ) {}

    public function handle(): void
    {
        DB::table('play_events')->insert([
            'track_id' => $this->trackId,
            'user_id' => $this->userId,
            'played_at' => now(),
            'duration_listened' => 0,
            'source' => $this->source,
        ]);
    }
}
