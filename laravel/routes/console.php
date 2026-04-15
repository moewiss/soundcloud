<?php

use App\Jobs\ComputeTrackScores;
use App\Jobs\ComputeArtistScores;
use App\Jobs\ComputePopularSearches;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Recompute track trending/viral/popularity scores every 10 minutes
Schedule::job(new ComputeTrackScores)->everyTenMinutes();

// Recompute rising artist scores every hour
Schedule::job(new ComputeArtistScores)->hourly();

// Aggregate popular searches daily
Schedule::job(new ComputePopularSearches)->daily();

// Reset monthly upload and download counters on the 1st of each month
Schedule::call(function () {
    \DB::table('users')->update([
        'uploads_this_month' => 0,
        'downloads_this_month' => 0,
        'uploads_month_reset_at' => now(),
    ]);
})->monthly();

// Clean up old play events (older than 90 days) weekly
Schedule::call(function () {
    \DB::table('play_events')->where('played_at', '<', now()->subDays(90))->delete();
})->weekly();

// Publish scheduled tracks that are due
Schedule::call(function () {
    $due = \App\Models\Track::where('status', 'scheduled')
        ->where('scheduled_at', '<=', now())
        ->get();

    foreach ($due as $track) {
        $user = $track->user;
        $planService = app(\App\Services\PlanFeatureService::class)->forUser($user);
        $status = ($user->is_admin || $planService->hasAutoApproval()) ? 'approved' : 'pending';
        $track->update(['status' => $status, 'scheduled_at' => null]);
        \Illuminate\Support\Facades\Log::info("Scheduled track {$track->id} published with status {$status}");
    }
})->everyMinute();
