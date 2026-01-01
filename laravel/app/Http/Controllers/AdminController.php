<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Track;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    private function checkAdmin()
    {
        if (!auth()->user() || !auth()->user()->is_admin) {
            abort(403, 'Unauthorized action.');
        }
    }

    public function getStats()
    {
        $this->checkAdmin();
        $stats = [
            'total_users' => User::count(),
            'total_tracks' => Track::count(),
            'pending_tracks' => Track::where('approved', false)->count(),
            'total_plays' => Track::sum('play_count'),
        ];

        return response()->json($stats);
    }

    public function getActivity()
    {
        $this->checkAdmin();
        $recentTracks = Track::with('user')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($track) {
                return [
                    'type' => 'track',
                    'user' => $track->user->name,
                    'title' => $track->title,
                    'created_at' => $track->created_at->toIso8601String(),
                ];
            });

        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($user) {
                return [
                    'type' => 'user',
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at->toIso8601String(),
                ];
            });

        $activity = $recentTracks->concat($recentUsers)
            ->sortByDesc('created_at')
            ->take(10)
            ->values();

        return response()->json($activity);
    }

    public function getUsers()
    {
        $this->checkAdmin();
        $users = User::withCount(['tracks', 'likes', 'followers', 'following'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_admin' => $user->is_admin,
                    'is_banned' => !is_null($user->banned_at),
                    'tracks_count' => $user->tracks_count,
                    'likes_count' => $user->likes_count,
                    'followers_count' => $user->followers_count,
                    'following_count' => $user->following_count,
                    'created_at' => $user->created_at->toIso8601String(),
                ];
            });

        return response()->json($users);
    }

    public function updateUser(Request $request, $id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'is_admin' => 'sometimes|boolean',
        ]);

        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->has('is_admin')) {
            $user->is_admin = $request->is_admin;
        }

        $user->save();

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user,
        ]);
    }

    public function deleteUser($id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete yourself'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function toggleBanUser($id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot ban yourself'], 400);
        }

        if ($user->banned_at) {
            $user->banned_at = null;
            $message = 'User unbanned successfully';
        } else {
            $user->banned_at = now();
            $message = 'User banned successfully';
        }

        $user->save();

        return response()->json([
            'message' => $message,
            'is_banned' => !is_null($user->banned_at),
        ]);
    }

    public function resetUserPassword(Request $request, $id)
    {
        $this->checkAdmin();
        $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user = User::findOrFail($id);
        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password reset successfully']);
    }

    public function generateUserResetLink($id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);

        // Generate a password reset token
        $token = Str::random(64);

        DB::table('password_resets')->updateOrInsert(
            ['email' => $user->email],
            [
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $resetUrl = env('APP_FRONTEND_URL', 'http://localhost:3000') . '/reset-password?token=' . $token . '&email=' . $user->email;

        return response()->json([
            'message' => 'Reset link generated successfully',
            'reset_url' => $resetUrl,
        ]);
    }

    public function getComments()
    {
        $this->checkAdmin();
        $comments = Comment::with(['user', 'track'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'user' => [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name,
                    ],
                    'track' => [
                        'id' => $comment->track->id,
                        'title' => $comment->track->title,
                    ],
                    'created_at' => $comment->created_at->toIso8601String(),
                ];
            });

        return response()->json($comments);
    }

    public function deleteComment($id)
    {
        $this->checkAdmin();
        $comment = Comment::findOrFail($id);
        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }
}

