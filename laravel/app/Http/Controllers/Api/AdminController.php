<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Track;
use App\Models\Comment;
use Illuminate\Http\Request;

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
}

