<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Track;
use App\Services\PlanFeatureService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DownloadController extends Controller
{
    /**
     * List user's downloaded (saved offline) tracks.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $trackIds = DB::table('user_downloads')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->pluck('track_id');

        $downloadDates = DB::table('user_downloads')
            ->where('user_id', $user->id)
            ->pluck('created_at', 'track_id');

        $tracks = Track::whereIn('id', $trackIds)
            ->with(['user.profile'])
            ->get()
            ->sortBy(function ($track) use ($trackIds) {
                return array_search($track->id, $trackIds->toArray());
            })
            ->values()
            ->map(function ($track) use ($downloadDates) {
                return [
                    'id' => $track->id,
                    'title' => $track->title,
                    'audio_url' => $track->audio_url,
                    'cover_url' => $track->cover_url,
                    'duration_seconds' => $track->duration_seconds,
                    'plays' => $track->plays,
                    'category' => $track->category,
                    'status' => $track->status,
                    'downloaded_at' => $downloadDates[$track->id] ?? null,
                    'user' => $track->user ? [
                        'id' => $track->user->id,
                        'name' => $track->user->profile?->display_name ?: $track->user->name,
                        'avatar_url' => $track->user->profile?->avatar_url ?? null,
                    ] : null,
                ];
            });

        $planService = app(PlanFeatureService::class)->forUser($user);

        return response()->json([
            'downloads' => $tracks,
            'downloads_remaining' => $planService->downloadsRemaining(),
            'download_limit' => $planService->downloadLimit(),
            'can_download' => $planService->canDownload(),
        ]);
    }

    /**
     * Save a track for offline listening (add to downloads).
     */
    public function store(Request $request, Track $track)
    {
        $user = $request->user();
        $planService = app(PlanFeatureService::class)->forUser($user);

        // Check if plan allows downloads
        if (!$planService->canDownload()) {
            $limit = $planService->downloadLimit();
            if ($limit === 0 || ($limit === null && !$planService->isPremium())) {
                return response()->json([
                    'message' => 'Offline downloads are not available on your plan. Upgrade to save tracks for offline listening.',
                    'plan' => $planService->planSlug(),
                ], 403);
            }

            return response()->json([
                'message' => 'Download limit reached for this month. Upgrade for more downloads.',
                'downloads_remaining' => 0,
                'plan' => $planService->planSlug(),
            ], 403);
        }

        // Only allow downloading approved tracks
        if ($track->status !== 'approved' && $track->user_id !== $user->id && !$user->is_admin) {
            return response()->json(['message' => 'Track not available for download'], 404);
        }

        if (!$track->audio_url && !$track->audio_path) {
            return response()->json(['message' => 'No audio file available'], 404);
        }

        // Check if already downloaded
        $exists = DB::table('user_downloads')
            ->where('user_id', $user->id)
            ->where('track_id', $track->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Track already in your downloads',
                'already_downloaded' => true,
            ]);
        }

        // Increment download counter and save record
        $user->increment('downloads_this_month');
        DB::table('user_downloads')->insert([
            'user_id' => $user->id,
            'track_id' => $track->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Return the audio URL for the frontend to cache in IndexedDB
        $audioUrl = $track->audio_url;

        return response()->json([
            'message' => 'Track saved for offline listening',
            'audio_url' => $audioUrl,
            'downloads_remaining' => $planService->downloadsRemaining(),
        ]);
    }

    /**
     * Remove a track from downloads (un-cache).
     */
    public function destroy(Request $request, Track $track)
    {
        $user = $request->user();

        $deleted = DB::table('user_downloads')
            ->where('user_id', $user->id)
            ->where('track_id', $track->id)
            ->delete();

        return response()->json([
            'message' => $deleted ? 'Track removed from downloads' : 'Track was not in your downloads',
        ]);
    }

    /**
     * Check download status for specific tracks (batch).
     */
    public function status(Request $request)
    {
        $request->validate([
            'track_ids' => 'required|array',
            'track_ids.*' => 'integer',
        ]);

        $user = $request->user();
        $downloadedIds = DB::table('user_downloads')
            ->where('user_id', $user->id)
            ->whereIn('track_id', $request->track_ids)
            ->pluck('track_id')
            ->toArray();

        $planService = app(PlanFeatureService::class)->forUser($user);

        return response()->json([
            'downloaded_track_ids' => $downloadedIds,
            'can_download' => $planService->canDownload(),
            'downloads_remaining' => $planService->downloadsRemaining(),
        ]);
    }
}
