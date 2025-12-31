<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Track;
use Illuminate\Http\Request;

class RepostController extends Controller
{
    public function toggle(Track $track)
    {
        if ($track->status !== 'approved') {
            abort(404);
        }

        $user = auth()->user();
        $isReposted = $user->repostedTracks()->where('track_id', $track->id)->exists();

        if ($isReposted) {
            $user->repostedTracks()->detach($track->id);
            $message = 'Track unreposted successfully';
            $newState = false;
        } else {
            $user->repostedTracks()->attach($track->id);
            $message = 'Track reposted successfully';
            $newState = true;

            // Create notification for track owner (if not reposting own track)
            if ($track->user_id !== $user->id) {
                \App\Models\Notification::create([
                    'user_id' => $track->user_id,
                    'actor_id' => $user->id,
                    'type' => 'repost',
                    'track_id' => $track->id,
                    'message' => $user->name . ' reposted your track "' . $track->title . '"',
                ]);
            }
        }

        // Refresh the count
        $track->loadCount('reposts');

        return response()->json([
            'message' => $message,
            'reposts_count' => $track->reposts_count ?? 0,
            'is_reposted' => $newState,
        ]);
    }

    public function index(Request $request)
    {
        $repostedTracks = $request->user()
            ->repostedTracks()
            ->with(['user.profile'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest('reposts.created_at')
            ->paginate(20);

        // Get all liked and reposted track IDs for current user
        $likedTrackIds = $request->user()
            ->likedTracks()
            ->pluck('track_id')
            ->toArray();
        
        $repostedTrackIds = $request->user()
            ->repostedTracks()
            ->pluck('track_id')
            ->toArray();

        // Add is_liked and is_reposted status
        $repostedTracks->getCollection()->transform(function ($track) use ($likedTrackIds, $repostedTrackIds) {
            $track->is_liked = in_array($track->id, $likedTrackIds);
            $track->is_reposted = in_array($track->id, $repostedTrackIds);
            $track->likes_count = $track->likes_count ?? 0;
            $track->comments_count = $track->comments_count ?? 0;
            $track->reposts_count = $track->reposts_count ?? 0;
            $track->plays_count = $track->plays ?? 0;
            $track->audio_url = $track->audio_url;
            $track->cover_url = $track->cover_url;
            return $track;
        });

        return response()->json($repostedTracks);
    }

    public function userReposts($userId)
    {
        $user = \App\Models\User::findOrFail($userId);
        
        $repostedTracks = $user->repostedTracks()
            ->where('status', 'approved')
            ->with(['user.profile'])
            ->withCount(['likes', 'comments', 'reposts'])
            ->latest('reposts.created_at')
            ->paginate(20);

        // Get all liked and reposted track IDs for current user (if authenticated)
        $likedTrackIds = [];
        $repostedTrackIds = [];
        if (auth()->check()) {
            $likedTrackIds = auth()->user()
                ->likedTracks()
                ->pluck('track_id')
                ->toArray();
            
            $repostedTrackIds = auth()->user()
                ->repostedTracks()
                ->pluck('track_id')
                ->toArray();
        }

        // Add is_liked and is_reposted status relative to current user
        $repostedTracks->getCollection()->transform(function ($track) use ($likedTrackIds, $repostedTrackIds) {
            $track->is_liked = in_array($track->id, $likedTrackIds);
            $track->is_reposted = in_array($track->id, $repostedTrackIds);
            $track->likes_count = $track->likes_count ?? 0;
            $track->comments_count = $track->comments_count ?? 0;
            $track->reposts_count = $track->reposts_count ?? 0;
            $track->plays_count = $track->plays ?? 0;
            $track->audio_url = $track->audio_url;
            $track->cover_url = $track->cover_url;
            return $track;
        });

        return response()->json($repostedTracks);
    }
}

