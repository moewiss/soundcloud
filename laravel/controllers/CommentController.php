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
        // Get only parent comments (no parent_id) with their replies
        $comments = $track->comments()
            ->whereNull('parent_id')
            ->with(['user', 'replies.user'])
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
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = $track->comments()->create([
            'user_id' => auth()->id(),
            'body' => $validated['body'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        $comment->load('user');

        // Create notification for track owner or parent comment owner
        $user = auth()->user();
        if ($validated['parent_id']) {
            // Reply to comment - notify parent comment owner
            $parentComment = Comment::find($validated['parent_id']);
            if ($parentComment && $parentComment->user_id !== $user->id) {
                \App\Models\Notification::create([
                    'user_id' => $parentComment->user_id,
                    'actor_id' => $user->id,
                    'type' => 'comment_reply',
                    'track_id' => $track->id,
                    'comment_id' => $comment->id,
                    'message' => $user->name . ' replied to your comment',
                ]);
            }
        } else {
            // New comment - notify track owner
            if ($track->user_id !== $user->id) {
                \App\Models\Notification::create([
                    'user_id' => $track->user_id,
                    'actor_id' => $user->id,
                    'type' => 'comment',
                    'track_id' => $track->id,
                    'comment_id' => $comment->id,
                    'message' => $user->name . ' commented on your track "' . $track->title . '"',
                ]);
            }
        }

        return response()->json([
            'message' => 'Comment added successfully',
            'comment' => $comment,
        ], 201);
    }

    public function update(Request $request, Track $track, Comment $comment)
    {
        // Admin can edit any comment, users can only edit their own
        if ($comment->user_id !== auth()->id() && !auth()->user()->is_admin) {
            abort(403, 'You can only edit your own comments');
        }

        $validated = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $comment->update([
            'body' => $validated['body'],
        ]);

        $comment->load('user');

        return response()->json([
            'message' => 'Comment updated successfully',
            'comment' => $comment,
        ]);
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

