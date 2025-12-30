<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Playlist;
use App\Models\Track;
use Illuminate\Http\Request;

class PlaylistController extends Controller
{
    public function index(Request $request)
    {
        $playlists = $request->user()
            ->playlists()
            ->withCount('tracks')
            ->latest()
            ->get();

        return response()->json($playlists);
    }

    public function show(Playlist $playlist)
    {
        if (!$playlist->is_public && $playlist->user_id !== auth()->id()) {
            abort(403);
        }

        $playlist->load(['tracks.user.profile', 'user']);
        $playlist->loadCount('tracks');

        return response()->json($playlist);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
        ]);

        $playlist = $request->user()->playlists()->create($validated);

        return response()->json([
            'message' => 'Playlist created successfully',
            'playlist' => $playlist,
        ], 201);
    }

    public function update(Request $request, Playlist $playlist)
    {
        if ($playlist->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
        ]);

        $playlist->update($validated);

        return response()->json([
            'message' => 'Playlist updated successfully',
            'playlist' => $playlist,
        ]);
    }

    public function destroy(Playlist $playlist)
    {
        if ($playlist->user_id !== auth()->id()) {
            abort(403);
        }

        $playlist->delete();

        return response()->json(['message' => 'Playlist deleted successfully']);
    }

    public function addTrack(Request $request, Playlist $playlist)
    {
        if ($playlist->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'track_id' => 'required|exists:tracks,id',
        ]);

        $track = Track::findOrFail($validated['track_id']);

        if ($track->status !== 'approved') {
            return response()->json(['message' => 'Track is not approved'], 400);
        }

        if ($playlist->tracks()->where('track_id', $track->id)->exists()) {
            return response()->json(['message' => 'Track already in playlist'], 400);
        }

        $position = $playlist->tracks()->max('position') + 1;
        $playlist->tracks()->attach($track->id, ['position' => $position]);

        return response()->json(['message' => 'Track added to playlist']);
    }

    public function removeTrack(Playlist $playlist, Track $track)
    {
        if ($playlist->user_id !== auth()->id()) {
            abort(403);
        }

        $playlist->tracks()->detach($track->id);

        return response()->json(['message' => 'Track removed from playlist']);
    }

    public function userPlaylists($id)
    {
        $playlists = Playlist::where('user_id', $id)
            ->where('is_public', true)
            ->withCount('tracks')
            ->latest()
            ->get();

        return response()->json($playlists);
    }
}

