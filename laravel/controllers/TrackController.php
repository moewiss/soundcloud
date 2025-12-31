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
        $query = Track::approved()
            ->with(['user.profile'])
            ->withCount(['likes', 'comments']);

        // Filter by user_id if provided
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $tracks = $query->latest()->paginate(20);

        // Get all liked track IDs for current user (if authenticated) in ONE query
        $likedTrackIds = [];
        if (auth()->check()) {
            $likedTrackIds = auth()->user()
                ->likedTracks()
                ->pluck('track_id')
                ->toArray();
        }

        // Add is_liked and ensure audio_url is present
        $tracks->getCollection()->transform(function ($track) use ($likedTrackIds) {
            $track->is_liked = in_array($track->id, $likedTrackIds);
            $track->likes_count = $track->likes_count ?? 0;
            $track->comments_count = $track->comments_count ?? 0;
            $track->plays_count = $track->plays ?? 0;
            // Ensure audio_url is included
            $track->audio_url = $track->audio_url;
            $track->cover_url = $track->cover_url;
            return $track;
        });

        return response()->json($tracks);
    }

    public function show(Track $track)
    {
        if ($track->status !== 'approved') {
            abort(404);
        }

        $track->load(['user.profile']);
        $track->loadCount(['likes', 'comments']);
        $track->incrementPlays();

        // Build response with all necessary data
        $response = [
            'id' => $track->id,
            'title' => $track->title,
            'description' => $track->description,
            'audio_url' => $track->audio_url,
            'cover_url' => $track->cover_url,
            'duration' => $track->duration,
            'duration_seconds' => $track->duration_seconds,
            'plays_count' => $track->plays,
            'likes_count' => $track->likes_count ?? 0,
            'comments_count' => $track->comments_count ?? 0,
            'is_liked' => auth()->check() ? auth()->user()->hasLiked($track) : false,
            'created_at' => $track->created_at,
            'updated_at' => $track->updated_at,
            'user' => $track->user,
            'tags' => $track->tags,
            'category' => $track->category ?? null,
        ];

        return response()->json($response);
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
            'status' => 'approved', // Auto-approve tracks
        ]);

        // Try to get duration from uploaded file
        try {
            $tempFile = $request->file('file')->getRealPath();
            if (function_exists('shell_exec') && file_exists($tempFile)) {
                $durationCmd = sprintf(
                    'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 %s 2>&1',
                    escapeshellarg($tempFile)
                );
                $duration = trim(shell_exec($durationCmd) ?? '');
                if ($duration && is_numeric($duration)) {
                    $track->update(['duration_seconds' => (int) round((float) $duration)]);
                }
            }
        } catch (\Exception $e) {
            // If duration extraction fails, continue without it
            \Log::warning("Could not extract duration for track {$track->id}: " . $e->getMessage());
        }

        // Set audio_path to source_path so it's playable immediately
        $track->update(['audio_path' => $sourcePath]);

        // Dispatch transcoding job (optional - for optimization)
        try {
            TranscodeTrack::dispatch($track->id);
        } catch (\Exception $e) {
            \Log::warning("Could not dispatch transcode job: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Track uploaded successfully',
            'track' => $track->fresh(),
        ], 201);
    }

    public function mine(Request $request)
    {
        $tracks = $request->user()
            ->tracks()
            ->withCount(['likes', 'comments'])
            ->latest()
            ->paginate(20);

        // Add is_liked for authenticated users
        $tracks->getCollection()->transform(function ($track) use ($request) {
            $track->is_liked = $request->user()->hasLiked($track);
            $track->likes_count = $track->likes_count ?? 0;
            $track->comments_count = $track->comments_count ?? 0;
            $track->plays_count = $track->plays ?? 0;
            return $track;
        });

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

