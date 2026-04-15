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
        if (!$playlist->is_public && (!auth()->check() || $playlist->user_id !== auth()->id())) {
            abort(403);
        }

        // Resolve auth from bearer token on public route
        if (!auth()->check() && request()->bearerToken()) {
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken(request()->bearerToken());
            if ($token) auth()->setUser($token->tokenable);
        }

        $playlist->load(['tracks.user.profile', 'user.profile']);
        $playlist->loadCount(['tracks', 'likedByUsers as likes_count', 'repostedByUsers as reposts_count']);

        $data = $playlist->toArray();
        $data['likes_count'] = $playlist->likes_count ?? 0;
        $data['reposts_count'] = $playlist->reposts_count ?? 0;
        $data['is_liked'] = auth()->check() ? auth()->user()->hasLikedPlaylist($playlist) : false;
        $data['is_reposted'] = auth()->check() ? auth()->user()->hasRepostedPlaylist($playlist) : false;

        return response()->json($data);
    }

    public function toggleLike(Playlist $playlist)
    {
        $user = auth()->user();
        $exists = $user->likedPlaylists()->where('playlist_id', $playlist->id)->exists();

        if ($exists) {
            $user->likedPlaylists()->detach($playlist->id);
        } else {
            $user->likedPlaylists()->attach($playlist->id);
        }

        return response()->json([
            'is_liked' => !$exists,
            'likes_count' => $playlist->likedByUsers()->count(),
        ]);
    }

    public function toggleRepost(Playlist $playlist)
    {
        $user = auth()->user();
        $exists = $user->repostedPlaylists()->where('playlist_id', $playlist->id)->exists();

        if ($exists) {
            $user->repostedPlaylists()->detach($playlist->id);
        } else {
            $user->repostedPlaylists()->attach($playlist->id);
        }

        return response()->json([
            'is_reposted' => !$exists,
            'reposts_count' => $playlist->repostedByUsers()->count(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $planService = app(\App\Services\PlanFeatureService::class)->forUser($user);
        $limit = $planService->playlistLimit();

        if ($limit !== null) {
            $currentCount = $user->playlists()->count();
            if ($currentCount >= $limit) {
                return response()->json([
                    'message' => "Playlist limit reached ({$limit}). Upgrade your plan for unlimited playlists.",
                    'limit' => $limit,
                ], 403);
            }
        }

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

        $planService = app(\App\Services\PlanFeatureService::class)->forUser($request->user());
        $trackLimit = $planService->playlistTrackLimit();
        if ($trackLimit !== null && $playlist->tracks()->count() >= $trackLimit) {
            return response()->json([
                'message' => "Track limit per playlist reached ({$trackLimit}). Upgrade for unlimited.",
                'limit' => $trackLimit,
            ], 403);
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

    public function reorderTracks(Request $request, Playlist $playlist)
    {
        if ($playlist->user_id !== auth()->id()) {
            abort(403);
        }

        $request->validate([
            'track_ids' => 'required|array',
            'track_ids.*' => 'integer',
        ]);

        foreach ($request->track_ids as $position => $trackId) {
            $playlist->tracks()->updateExistingPivot($trackId, ['position' => $position]);
        }

        return response()->json(['message' => 'Tracks reordered']);
    }

    public function userPlaylists($id)
    {
        $playlists = Playlist::where('user_id', $id)
            ->where('is_public', true)
            ->withCount(['tracks', 'likedByUsers as likes_count', 'repostedByUsers as reposts_count'])
            ->with(['tracks' => function ($q) {
                $q->orderBy('playlist_track.position');
            }])
            ->latest()
            ->get()
            ->map(function ($pl) {
                $data = $pl->toArray();
                // Build preview covers from first 4 tracks
                $data['preview_covers'] = collect($pl->tracks)
                    ->take(4)
                    ->map(fn($t) => $t->cover_url)
                    ->filter()
                    ->values()
                    ->toArray();
                unset($data['tracks']);
                return $data;
            });

        return response()->json($playlists);
    }
}

