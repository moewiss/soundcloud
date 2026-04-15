<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SearchPageService;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Browse state — categories, moods, trending searches, charts, for-you.
     */
    public function browse(Request $request, SearchPageService $service)
    {
        return response()->json($service->getBrowseData($request->user()));
    }

    /**
     * Enhanced search with relevance scoring and server-side filters.
     */
    public function search(Request $request, SearchPageService $service)
    {
        $query = $request->input('q', '');
        $filters = [
            'filter' => $request->input('filter', 'everything'),
            'duration' => $request->input('duration'),
            'category' => $request->input('category'),
            'sort' => $request->input('sort', 'relevant'),
        ];

        // Handle empty query cases for people/playlists browsing
        if (empty($query)) {
            if ($filters['filter'] === 'people') {
                $users = \App\Models\User::with('profile')
                    ->withCount('tracks')
                    ->whereNull('deleted_at')
                    ->whereNull('banned_at')
                    ->orderByDesc('created_at')
                    ->limit(50)
                    ->get();
                return response()->json(['tracks' => [], 'users' => $users, 'playlists' => []]);
            }
            if ($filters['filter'] === 'playlists') {
                $playlists = \App\Models\Playlist::with(['user.profile'])
                    ->withCount('tracks')
                    ->orderByDesc('created_at')
                    ->limit(50)
                    ->get();
                return response()->json(['tracks' => [], 'users' => [], 'playlists' => $playlists]);
            }
            return response()->json(['tracks' => [], 'users' => [], 'playlists' => []]);
        }

        return response()->json($service->search($query, $filters, $request->user()));
    }

    /**
     * AI-powered search (called asynchronously by frontend).
     */
    public function aiSearch(Request $request, SearchPageService $service)
    {
        $query = $request->input('q', '');
        if (strlen($query) < 3) {
            return response()->json(['intent' => null, 'tracks' => [], 'suggestion' => null]);
        }

        return response()->json($service->getAISearchResults($query));
    }

    /**
     * Autocomplete suggestions.
     */
    public function suggestions(Request $request, SearchPageService $service)
    {
        $prefix = $request->input('q', '');
        return response()->json(['suggestions' => $service->getSuggestions($prefix)]);
    }

    /**
     * Clear all search history.
     */
    public function clearHistory(Request $request, SearchPageService $service)
    {
        $service->clearSearchHistory($request->user()->id);
        return response()->json(['ok' => true]);
    }

    /**
     * Remove a single search history item.
     */
    public function removeHistoryItem(Request $request, SearchPageService $service, $id)
    {
        $service->removeSearchHistoryItem($request->user()->id, $id);
        return response()->json(['ok' => true]);
    }
}
