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

        // Include soft deleted users if requested
        if ($request->include_deleted) {
            $query->withTrashed();
        }

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
            } elseif ($request->filter === 'deleted') {
                $query->onlyTrashed();
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

        $user = User::withTrashed()->findOrFail($id);
        
        // Don't allow banning yourself
        if ($user->id === auth()->id()) {
            return response()->json(['error' => 'Cannot ban yourself'], 400);
        }

        // Toggle ban status using soft delete
        if ($user->trashed()) {
            $user->restore();
            $message = 'User unbanned successfully';
        } else {
            $user->delete();
            $message = 'User banned successfully';
        }

        // Reload user to get updated status
        $user = User::withTrashed()->find($id);

        return response()->json([
            'message' => $message,
            'banned' => $user->trashed()
        ]);
    }

    public function deleteUser($id)
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $user = User::withTrashed()->findOrFail($id);
        
        // Don't allow deleting yourself
        if ($user->id === auth()->id()) {
            return response()->json(['error' => 'Cannot delete yourself'], 400);
        }

        // Soft delete (can be restored)
        if (!$user->trashed()) {
            $user->delete();
        }

        return response()->json(['message' => 'User deleted successfully (can be restored)']);
    }

    public function restoreUser($id)
    {
        $authCheck = $this->checkAdmin();
        if ($authCheck) return $authCheck;

        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        return response()->json(['message' => 'User restored successfully']);
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
        
        // Generate a temporary token
        $token = Str::random(60);
        
        // Generate the reset link
        $resetLink = config('app.url') . "/reset-password?token={$token}&email=" . urlencode($user->email);

        return response()->json([
            'success' => true,
            'message' => 'Reset link generated successfully',
            'reset_link' => $resetLink,
            'link' => $resetLink  // Include both for compatibility
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

