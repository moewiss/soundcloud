<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Track;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AdminController extends Controller
{
    private function checkAdmin()
    {
        if (!auth()->user() || !auth()->user()->is_admin) {
            abort(403, 'Unauthorized. Admin access required.');
        }
    }
    
    // User Management
    public function getUsers(Request $request)
    {
        $this->checkAdmin();
        $query = User::with(['profile', 'tracks']);
        
        // Search
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        // Filter
        if ($request->filter === 'banned') {
            $query->whereNotNull('banned_at');
        } elseif ($request->filter === 'active') {
            $query->whereNull('banned_at');
        } elseif ($request->filter === 'admin') {
            $query->where('is_admin', true);
        }
        
        $users = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);
        
        // Add computed fields
        $users->getCollection()->transform(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => $user->is_admin,
                'is_banned' => !is_null($user->banned_at),
                'banned_at' => $user->banned_at,
                'created_at' => $user->created_at,
                'tracks_count' => $user->tracks()->count(),
                'avatar_url' => $user->profile->avatar_url ?? null,
                'display_name' => $user->profile->display_name ?? $user->name,
            ];
        });
        
        return response()->json($users);
    }
    
    public function updateUser(Request $request, $id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'is_admin' => 'sometimes|boolean',
        ]);
        
        $user->update($validated);
        
        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load('profile')
        ]);
    }
    
    public function deleteUser($id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);
        
        // Prevent admin from deleting themselves
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot delete your own account'
            ], 403);
        }
        
        // Delete user's tracks
        foreach ($user->tracks as $track) {
            if ($track->audio_path) {
                \Storage::disk('s3')->delete($track->audio_path);
            }
            if ($track->cover_path) {
                \Storage::disk('s3')->delete($track->cover_path);
            }
            $track->delete();
        }
        
        $user->delete();
        
        return response()->json(['message' => 'User deleted successfully']);
    }
    
    public function banUser($id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);
        
        // Prevent admin from banning themselves
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot ban yourself'
            ], 403);
        }
        
        // Toggle ban status
        if ($user->banned_at) {
            $user->banned_at = null;
            $message = 'User unbanned successfully';
        } else {
            $user->banned_at = now();
            // Revoke all tokens
            $user->tokens()->delete();
            $message = 'User banned successfully';
        }
        
        $user->save();
        
        return response()->json([
            'message' => $message,
            'is_banned' => !is_null($user->banned_at)
        ]);
    }
    
    public function restoreUser($id)
    {
        $this->checkAdmin();
        $user = User::withTrashed()->findOrFail($id);
        
        // Prevent admin from restoring themselves
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot restore your own account'
            ], 403);
        }
        
        // Handle soft-deleted users
        if ($user->trashed()) {
            $user->restore();
            return response()->json([
                'message' => 'User restored successfully',
                'user' => $user->load('profile')
            ]);
        }
        
        // Handle banned users
        if ($user->banned_at) {
            $user->banned_at = null;
            $user->save();
            return response()->json([
                'message' => 'User unbanned successfully',
                'user' => $user->load('profile')
            ]);
        }
        
        return response()->json([
            'message' => 'User is already active'
        ], 400);
    }
    
    public function promoteToAdmin(Request $request)
    {
        $this->checkAdmin();
        
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email'
        ]);
        
        $user = User::where('email', $validated['email'])->first();
        
        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }
        
        if ($user->is_admin) {
            return response()->json([
                'message' => 'User is already an admin'
            ], 400);
        }
        
        $user->is_admin = true;
        $user->save();
        
        return response()->json([
            'message' => 'User promoted to admin successfully',
            'user' => $user->load('profile')
        ]);
    }
    
    public function resetUserPassword(Request $request, $id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);
        
        $user->password = Hash::make($validated['password']);
        $user->save();
        
        // Revoke all user's tokens
        $user->tokens()->delete();
        
        return response()->json(['message' => 'Password reset successfully']);
    }
    
    public function generateResetLink($id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);
        
        // Delete any existing tokens for this user
        DB::table('password_resets')->where('email', $user->email)->delete();
        
        // Create new reset token
        $token = Str::random(60);
        DB::table('password_resets')->insert([
            'email' => $user->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);
        
        $frontendUrl = env('FRONTEND_URL', 'http://185.250.36.33:5173');
        $resetUrl = $frontendUrl . '/reset-password?token=' . $token . '&email=' . $user->email;
        
        return response()->json([
            'message' => 'Reset link generated successfully',
            'reset_url' => $resetUrl,
            'expires_in' => '24 hours'
        ]);
    }
    
    // Statistics
    public function getStats()
    {
        $this->checkAdmin();
        $totalUsers = User::count();
        $totalTracks = Track::count();
        $pendingTracks = Track::where('status', 'pending')->count();
        $totalPlays = Track::sum('plays');
        $totalLikes = DB::table('likes')->count();
        
        // Users registered in last 30 days
        $usersLast30Days = User::where('created_at', '>=', now()->subDays(30))->count();
        $usersGrowth = $totalUsers > 0 ? round(($usersLast30Days / $totalUsers) * 100, 1) : 0;
        
        // Tracks uploaded in last 30 days
        $tracksLast30Days = Track::where('created_at', '>=', now()->subDays(30))->count();
        $tracksGrowth = $totalTracks > 0 ? round(($tracksLast30Days / $totalTracks) * 100, 1) : 0;
        
        return response()->json([
            'total_users' => $totalUsers,
            'total_tracks' => $totalTracks,
            'pending_tracks' => $pendingTracks,
            'total_plays' => $totalPlays,
            'total_likes' => $totalLikes,
            'users_growth' => $usersGrowth,
            'tracks_growth' => $tracksGrowth,
        ]);
    }
    
    public function getActivity()
    {
        $this->checkAdmin();
        // Get recent users (last 10)
        $recentUsers = User::with('profile')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($user) {
                return [
                    'type' => 'user_registration',
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->profile->display_name ?? $user->name,
                        'avatar_url' => $user->profile->avatar_url,
                    ],
                    'created_at' => $user->created_at,
                ];
            });
        
        // Get recent tracks (last 10)
        $recentTracks = Track::with('user.profile')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function($track) {
                return [
                    'type' => 'track_upload',
                    'track' => [
                        'id' => $track->id,
                        'title' => $track->title,
                        'status' => $track->status,
                    ],
                    'user' => [
                        'id' => $track->user->id,
                        'name' => $track->user->profile->display_name ?? $track->user->name,
                    ],
                    'created_at' => $track->created_at,
                ];
            });
        
        // Merge and sort by date
        $activity = $recentUsers->concat($recentTracks)
            ->sortByDesc('created_at')
            ->take(20)
            ->values();
        
        return response()->json($activity);
    }
    
    // Content Moderation
    public function getComments(Request $request)
    {
        $this->checkAdmin();
        $query = Comment::with(['user.profile', 'track']);
        
        // Search
        if ($request->search) {
            $query->where('body', 'like', "%{$request->search}%");
        }
        
        $comments = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);
        
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

