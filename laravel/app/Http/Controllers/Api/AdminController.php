<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Track;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    private function checkAdmin()
    {
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        return null;
    }

    public function getStats()
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $stats = [
            'total_users' => User::count(),
            'total_tracks' => Track::count(),
            'pending_tracks' => Track::where('status', 'pending')->count(),
            'total_plays' => Track::sum('plays') ?? 0,
        ];

        return response()->json($stats);
    }

    public function getActivity()
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        // Get recent tracks
        $recentTracks = Track::with('user')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($track) {
                return [
                    'type' => 'track_upload',
                    'user' => [
                        'name' => $track->user->name ?? 'Unknown',
                    ],
                    'track' => [
                        'title' => $track->title,
                    ],
                    'created_at' => $track->created_at->toIso8601String(),
                ];
            });

        // Get recent users
        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($user) {
                return [
                    'type' => 'user_registration',
                    'user' => [
                        'name' => $user->name,
                    ],
                    'created_at' => $user->created_at->toIso8601String(),
                ];
            });

        $activity = $recentTracks->concat($recentUsers)
            ->sortByDesc('created_at')
            ->take(10)
            ->values();

        return response()->json($activity);
    }

    public function getUsers(Request $request)
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $query = User::with('profile');

        // Search
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter
        if ($request->filter && $request->filter !== 'all') {
            if ($request->filter === 'admin') {
                $query->where('is_admin', true);
            } elseif ($request->filter === 'banned') {
                $query->where('is_banned', true);
            }
        }

        $users = $query->withCount(['tracks', 'likedTracks', 'followers', 'following'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($users);
    }

    public function getComments(Request $request)
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $query = Comment::with(['user', 'track']);

        // Search
        if ($request->search) {
            $query->where('content', 'like', "%{$request->search}%");
        }

        $comments = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($comments);
    }

    public function banUser($id)
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $user = User::findOrFail($id);
        
        // Don't allow banning yourself
        if ($user->id === auth()->id()) {
            return response()->json(['error' => 'Cannot ban yourself'], 400);
        }

        $user->is_banned = !$user->is_banned;
        $user->save();

        return response()->json([
            'message' => $user->is_banned ? 'User banned successfully' : 'User unbanned successfully',
            'user' => $user
        ]);
    }

    public function deleteUser($id)
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $user = User::findOrFail($id);
        
        // Don't allow deleting yourself
        if ($user->id === auth()->id()) {
            return response()->json(['error' => 'Cannot delete yourself'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function updateUser($id, Request $request)
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $user = User::findOrFail($id);
        
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'is_admin' => 'sometimes|boolean',
        ]);

        $user->update($request->only(['name', 'email', 'is_admin']));

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    public function resetUserPassword($id, Request $request)
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $user = User::findOrFail($id);
        
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password reset successfully']);
    }

    public function generateResetLink($id)
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $user = User::findOrFail($id);
        
        // Generate a temporary token (you can implement proper password reset tokens)
        $token = Str::random(60);
        
        // In a real app, you'd save this token to password_resets table
        // For now, just return a link
        $resetLink = url("/reset-password?token={$token}&email={$user->email}");

        return response()->json([
            'message' => 'Reset link generated',
            'link' => $resetLink
        ]);
    }

    public function deleteComment($id)
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $comment = Comment::findOrFail($id);
        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }
}

