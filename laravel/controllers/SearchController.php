<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Track;
use App\Models\User;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        $filter = $request->input('filter', 'everything');

        $results = [];

        // If filter is "people" and no query, show all users
        if ($filter === 'people' && empty($query)) {
            $results['users'] = User::with('profile')
                ->withCount('tracks')
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();
            $results['tracks'] = [];
            $results['playlists'] = [];
            return response()->json($results);
        }

        // If filter is "playlists" and no query, show all playlists
        if ($filter === 'playlists' && empty($query)) {
            $results['playlists'] = \App\Models\Playlist::with(['user.profile'])
                ->withCount('tracks')
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();
            $results['tracks'] = [];
            $results['users'] = [];
            return response()->json($results);
        }

        if (empty($query)) {
            return response()->json([
                'tracks' => [],
                'users' => [],
                'playlists' => [],
            ]);
        }

        // Fuzzy search with LIKE and wildcards for typo tolerance
        if ($filter === 'everything' || $filter === 'tracks') {
            // Split query into words for better fuzzy matching
            $words = explode(' ', $query);
            $results['tracks'] = Track::approved()
                ->where(function ($q) use ($query, $words) {
                    $q->where('title', 'like', "%{$query}%")
                        ->orWhere('description', 'like', "%{$query}%");
                    // Also search for individual words (fuzzy)
                    foreach ($words as $word) {
                        if (strlen($word) > 2) {
                            $q->orWhere('title', 'like', "%{$word}%");
                        }
                    }
                })
                ->with(['user.profile'])
                ->withCount(['likes', 'comments'])
                ->limit(20)
                ->get();
        }

        if ($filter === 'everything' || $filter === 'people' || $filter === 'users') {
            $words = explode(' ', $query);
            $results['users'] = User::where(function ($q) use ($query, $words) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
                // Fuzzy match on individual words
                foreach ($words as $word) {
                    if (strlen($word) > 2) {
                        $q->orWhere('name', 'like', "%{$word}%");
                    }
                }
            })
            ->with('profile')
            ->withCount('tracks')
            ->limit(20)
            ->get();
        }

        if ($filter === 'everything' || $filter === 'playlists') {
            $results['playlists'] = \App\Models\Playlist::where('title', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%")
                ->with(['user.profile'])
                ->withCount('tracks')
                ->limit(20)
                ->get();
        }

        return response()->json($results);
    }
}

