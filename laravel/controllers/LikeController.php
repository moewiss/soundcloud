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

    public function index(Request $request)
    {
        $likedTracks = $request->user()
            ->likedTracks()
            ->with(['user.profile'])
            ->latest('likes.created_at')
            ->paginate(20);

        return response()->json($likedTracks);
    }
}

