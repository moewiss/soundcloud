<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function index(Request $request)
    {
        // Get user's listening history
        $history = $request->user()
            ->history()
            ->with(['track.user.profile'])
            ->latest()
            ->limit(50)
            ->get();

        return response()->json($history);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'track_id' => 'required|exists:tracks,id',
        ]);

        // Add to history (or update if exists)
        $request->user()->history()->updateOrCreate(
            ['track_id' => $validated['track_id']],
            ['updated_at' => now()]
        );

        return response()->json(['message' => 'Added to history']);
    }

    public function clear(Request $request)
    {
        $request->user()->history()->delete();

        return response()->json(['message' => 'History cleared']);
    }
}

