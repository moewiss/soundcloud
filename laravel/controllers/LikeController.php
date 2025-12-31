<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Track;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function store(Track $track)
    {
        if ($track->status !== 'approved') {
            abort(404);
        }

        $user = auth()->user();

        if (!$user->hasLiked($track)) {
            $user->likedTracks()->attach($track->id);
        }

        return response()->json([
            'message' => 'Track liked successfully',
            'likes_count' => $track->likes()->count(),
        ]);
    }

    public function destroy(Track $track)
    {
        $user = auth()->user();

        if ($user->hasLiked($track)) {
            $user->likedTracks()->detach($track->id);
        }

        return response()->json([
            'message' => 'Track unliked successfully',
            'likes_count' => $track->likes()->count(),
        ]);
    }

    public function toggle(Track $track)
    {
        if ($track->status !== 'approved') {
            abort(404);
        }

        $user = auth()->user();
        $isLiked = $user->hasLiked($track);

        if ($isLiked) {
            $user->likedTracks()->detach($track->id);
            $message = 'Track unliked successfully';
            $newState = false;
        } else {
            $user->likedTracks()->attach($track->id);
            $message = 'Track liked successfully';
            $newState = true;

            // Create notification for track owner (if not liking own track)
            if ($track->user_id !== $user->id) {
                \App\Models\Notification::create([
                    'user_id' => $track->user_id,
                    'actor_id' => $user->id,
                    'type' => 'like',
                    'track_id' => $track->id,
                    'message' => $user->name . ' liked your track "' . $track->title . '"',
                ]);
            }
        }

        // Refresh the count
        $track->loadCount('likes');

        return response()->json([
            'message' => $message,
            'likes_count' => $track->likes_count ?? 0,
            'is_liked' => $newState,
        ]);
    }

    public function index(Request $request)
    {
        $likedTracks = $request->user()
            ->likedTracks()
            ->with(['user.profile'])
            ->withCount(['likes', 'comments'])
            ->latest('likes.created_at')
            ->paginate(20);

        // Get all liked track IDs for current user (for is_liked status)
        $likedTrackIds = $request->user()
            ->likedTracks()
            ->pluck('track_id')
            ->toArray();

        // Add is_liked (always true for liked tracks) and other data
        $likedTracks->getCollection()->transform(function ($track) use ($likedTrackIds) {
            $track->is_liked = in_array($track->id, $likedTrackIds);
            $track->likes_count = $track->likes_count ?? 0;
            $track->comments_count = $track->comments_count ?? 0;
            $track->plays_count = $track->plays ?? 0;
            $track->audio_url = $track->audio_url;
            $track->cover_url = $track->cover_url;
            return $track;
        });

        return response()->json($likedTracks);
    }

    public function userLikes($userId)
    {
        $user = \App\Models\User::findOrFail($userId);
        
        $likedTracks = $user->likedTracks()
            ->where('status', 'approved')
            ->with(['user.profile'])
            ->withCount(['likes', 'comments'])
            ->latest('likes.created_at')
            ->paginate(20);

        // Get all liked track IDs for current user (if authenticated)
        $likedTrackIds = [];
        if (auth()->check()) {
            $likedTrackIds = auth()->user()
                ->likedTracks()
                ->pluck('track_id')
                ->toArray();
        }

        // Add is_liked status relative to current user (not the profile user)
        $likedTracks->getCollection()->transform(function ($track) use ($likedTrackIds) {
            $track->is_liked = in_array($track->id, $likedTrackIds);
            $track->likes_count = $track->likes_count ?? 0;
            $track->comments_count = $track->comments_count ?? 0;
            $track->plays_count = $track->plays ?? 0;
            $track->audio_url = $track->audio_url;
            $track->cover_url = $track->cover_url;
            return $track;
        });

        return response()->json($likedTracks);
    }
}

