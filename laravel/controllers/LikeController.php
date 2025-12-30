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

        // Add is_liked (always true for liked tracks) and other data
        $likedTracks->getCollection()->transform(function ($track) {
            $track->is_liked = true;
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

