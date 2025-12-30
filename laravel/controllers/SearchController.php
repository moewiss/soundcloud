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

        if (empty($query)) {
            return response()->json([
                'tracks' => [],
                'users' => [],
                'playlists' => [],
            ]);
        }

        $results = [];

        if ($filter === 'everything' || $filter === 'tracks') {
            $results['tracks'] = Track::approved()
                ->where(function ($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                        ->orWhere('description', 'like', "%{$query}%")
                        ->orWhereJsonContains('tags', $query);
                })
                ->with(['user.profile'])
                ->limit(20)
                ->get();
        }

        if ($filter === 'everything' || $filter === 'users') {
            $results['users'] = User::where('name', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%")
                ->with('profile')
                ->limit(20)
                ->get();
        }

        if ($filter === 'everything' || $filter === 'playlists') {
            $results['playlists'] = [];
        }

        return response()->json($results);
    }
}

