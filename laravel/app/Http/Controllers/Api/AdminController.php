<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Track;
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
                    'type' => 'track',
                    'user' => $track->user->name ?? 'Unknown',
                    'title' => $track->title,
                    'created_at' => $track->created_at->toIso8601String(),
                ];
            });

        // Get recent users
        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(5)
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
}

