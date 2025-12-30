<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Track;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Track $track)
    {
        $comments = $track->comments()
            ->with('user')
            ->latest()
            ->get();

        return response()->json($comments);
    }

    public function store(Request $request, Track $track)
    {
        if ($track->status !== 'approved') {
            abort(404);
        }

        $validated = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $comment = $track->comments()->create([
            'user_id' => auth()->id(),
            'body' => $validated['body'],
        ]);

        $comment->load('user');

        return response()->json([
            'message' => 'Comment added successfully',
            'comment' => $comment,
        ], 201);
    }

    public function destroy(Track $track, Comment $comment)
    {
        if ($comment->user_id !== auth()->id() && !auth()->user()->is_admin) {
            abort(403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }
}

