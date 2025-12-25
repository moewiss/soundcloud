<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\TranscodeTrack;
use App\Models\Track;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TrackController extends Controller
{
    public function index(Request $request)
    {
        $tracks = Track::approved()
            ->with(['user.profile'])
            ->latest()
            ->paginate(20);

        return response()->json($tracks);
    }

    public function show(Track $track)
    {
        if ($track->status !== 'approved') {
            abort(404);
        }

        $track->load(['user.profile']);
        $track->incrementPlays();

        return response()->json([
            'track' => $track,
            'is_liked' => auth()->check() ? auth()->user()->hasLiked($track) : false,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:180',
            'description' => 'nullable|string|max:5000',
            'file' => 'required|file|mimes:mp3,wav,flac,ogg,m4a|max:204800', // 200MB
            'cover' => 'nullable|image|max:5120', // 5MB
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        // Upload source file
        $sourcePath = $request->file('file')->store('uploads/source', 's3');

        // Upload cover if provided
        $coverPath = null;
        if ($request->hasFile('cover')) {
            $coverPath = $request->file('cover')->store('covers', 's3');
        }

        $track = Track::create([
            'user_id' => auth()->id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'source_path' => $sourcePath,
            'cover_path' => $coverPath,
            'tags' => $validated['tags'] ?? null,
            'status' => 'pending',
        ]);

        // Dispatch transcoding job
        TranscodeTrack::dispatch($track->id);

        return response()->json([
            'message' => 'Track uploaded successfully and is being processed',
            'track' => $track,
        ], 201);
    }

    public function mine(Request $request)
    {
        $tracks = $request->user()
            ->tracks()
            ->latest()
            ->paginate(20);

        return response()->json($tracks);
    }

    public function destroy(Track $track)
    {
        if ($track->user_id !== auth()->id() && !auth()->user()->is_admin) {
            abort(403);
        }

        // Delete files from storage
        if ($track->source_path) {
            Storage::disk('s3')->delete($track->source_path);
        }
        if ($track->audio_path) {
            Storage::disk('s3')->delete($track->audio_path);
        }
        if ($track->cover_path) {
            Storage::disk('s3')->delete($track->cover_path);
        }

        $track->delete();

        return response()->json(['message' => 'Track deleted successfully']);
    }
}

