<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\TranscodeTrack;
use App\Jobs\ImportYoutubeTrack;
use App\Jobs\RecordPlayEvent;
use App\Models\Track;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TrackController extends Controller
{
    public function feed(Request $request)
    {
        $user = $request->user();
        $followingIds = $user->following()->pluck('users.id')->toArray();

        if (empty($followingIds)) {
            return response()->json(['data' => []]);
        }

        $query = Track::approved()
            ->whereIn('user_id', $followingIds)
            ->with(['user.profile'])
            ->withCount(['likes', 'comments', 'reposts']);

        $tracks = $query->latest()->paginate(30);

        $likedTrackIds = $user->likedTracks()->pluck('track_id')->toArray();
        $repostedTrackIds = $user->repostedTracks()->pluck('track_id')->toArray();

        $tracks->getCollection()->transform(function ($track) use ($likedTrackIds, $repostedTrackIds) {
            $track->is_liked = in_array($track->id, $likedTrackIds);
            $track->is_reposted = in_array($track->id, $repostedTrackIds);
            return $track;
        });

        return response()->json($tracks);
    }

    public function index(Request $request)
    {
        $query = Track::approved()
            ->with(['user.profile'])
            ->withCount(['likes', 'comments', 'reposts']);

        // Filter by user_id if provided
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by category if provided
        if ($request->has('category') && $request->category) {
            $query->where('category', $request->category);
        }

        // Sort order
        if ($request->input('sort') === 'popular') {
            $query->orderByDesc('plays');
        } else {
            $query->latest();
        }

        // Larger page size for user profile
        $perPage = $request->has('user_id') ? 50 : 20;
        $tracks = $query->paginate($perPage);

        // Resolve user from Bearer token on public route
        $this->resolveAuth();

        // Get all liked and reposted track IDs for current user in ONE query
        $likedTrackIds = [];
        $repostedTrackIds = [];
        if (auth()->check()) {
            $likedTrackIds = auth()->user()->likedTracks()->pluck('track_id')->toArray();
            $repostedTrackIds = auth()->user()->repostedTracks()->pluck('track_id')->toArray();
        }

        // Add is_liked, is_reposted and ensure audio_url is present
        $tracks->getCollection()->transform(function ($track) use ($likedTrackIds, $repostedTrackIds) {
            $track->is_liked = in_array($track->id, $likedTrackIds);
            $track->is_reposted = in_array($track->id, $repostedTrackIds);
            $track->likes_count = $track->likes_count ?? 0;
            $track->comments_count = $track->comments_count ?? 0;
            $track->reposts_count = $track->reposts_count ?? 0;
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
        // Resolve user from Bearer token on public route
        $this->resolveAuth();

        $authUser = auth()->user();

        // Only allow viewing approved tracks, unless user is admin or track owner
        if ($track->status !== 'approved') {
            if (!$authUser || ($authUser->id !== $track->user_id && !$authUser->is_admin)) {
                abort(404);
            }
        }

        $track->load(['user.profile']);
        $track->loadCount(['likes', 'comments', 'reposts']);
        $track->incrementPlays();
        if ($authUser) {
            RecordPlayEvent::dispatch($track->id, $authUser->id, request()->header('X-Listen-Source', 'direct'));
        }

        // Build user data with is_following + followers_count + avatar
        $userData = $track->user ? $track->user->toArray() : null;
        if ($userData && $track->user) {
            $userData['followers_count'] = $track->user->followers()->count();
            $userData['is_following'] = $authUser ? $authUser->isFollowing($track->user) : false;
            $userData['avatar_url'] = $track->user->profile->avatar_url ?? null;
            $userData['bio'] = $track->user->profile->bio ?? null;
            $userData['is_artist'] = (bool) $track->user->is_artist;
        }

        $response = [
            'id' => $track->id,
            'title' => $track->title,
            'description' => $track->description,
            'lyrics' => $track->lyrics,
            'audio_url' => $track->audio_url,
            'cover_url' => $track->cover_url,
            'duration' => $track->duration,
            'duration_seconds' => $track->duration_seconds,
            'plays_count' => $track->plays,
            'likes_count' => $track->likes_count ?? 0,
            'comments_count' => $track->comments_count ?? 0,
            'reposts_count' => $track->reposts_count ?? 0,
            'is_liked' => $authUser ? $authUser->hasLiked($track) : false,
            'is_reposted' => $authUser ? $authUser->hasReposted($track) : false,
            'created_at' => $track->created_at,
            'updated_at' => $track->updated_at,
            'user' => $userData,
            'tags' => $track->tags,
            'waveform' => $track->waveform,
            'category' => $track->category ?? null,
        ];

        return response()->json($response);
    }

    /**
     * Resolve user from Bearer token on public routes.
     */
    private function resolveAuth(): void
    {
        if (!auth()->check() && request()->bearerToken()) {
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken(request()->bearerToken());
            if ($token) auth()->setUser($token->tokenable);
        }
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $planService = app(\App\Services\PlanFeatureService::class)->forUser($user);

        // Check upload limit (admins bypass)
        if (!$user->is_admin && !$planService->canUpload()) {
            $remaining = $planService->uploadsRemaining();
            return response()->json([
                'message' => 'Upload limit reached for your plan. Upgrade to upload more tracks.',
                'uploads_remaining' => $remaining,
                'plan' => $planService->planSlug(),
            ], 403);
        }

        // Dynamic file size limit based on plan
        $maxSizeMb = $planService->maxFileSizeMb();
        $maxSizeKb = $maxSizeMb * 1024;

        $validated = $request->validate([
            'title' => 'required|string|max:180',
            'description' => 'nullable|string|max:5000',
            'lyrics' => 'nullable|string|max:20000',
            'file' => "required|file|mimes:mp3,wav,flac,ogg,m4a,mpeg,mpga,aac,wma,aiff,aif,ape,opus,webm,3gp,amr|max:{$maxSizeKb}",
            'cover' => 'nullable|image|max:5120', // 5MB
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'category' => 'nullable|string|max:100',
        ]);

        // Upload source file
        $sourcePath = $request->file('file')->store('uploads/source', 's3');

        // Upload cover if provided
        $coverPath = null;
        if ($request->hasFile('cover')) {
            $coverPath = $request->file('cover')->store('covers', 's3');
        }

        // Determine approval status based on plan + admin
        $status = 'pending';
        if ($user->is_admin || $planService->hasAutoApproval()) {
            $status = 'approved';
        }
        
        $track = Track::create([
            'user_id' => auth()->id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'lyrics' => $validated['lyrics'] ?? null,
            'source_path' => $sourcePath,
            'cover_path' => $coverPath,
            'tags' => $validated['tags'] ?? null,
            'category' => $validated['category'] ?? null,
            'status' => $status,
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

        // Increment upload counter
        $user->increment('uploads_this_month');

        $message = $status === 'approved'
            ? 'Track uploaded and approved successfully'
            : 'Track uploaded successfully. It will be reviewed by an admin before being published.';

        return response()->json([
            'message' => $message,
            'track' => $track->fresh(),
            'status' => $status,
            'uploads_remaining' => $planService->uploadsRemaining(),
        ], 201);
    }

    public function update(Request $request, Track $track)
    {
        if ($track->user_id !== auth()->id() && !auth()->user()->is_admin) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:180',
            'description' => 'nullable|string|max:5000',
            'lyrics' => 'nullable|string|max:20000',
            'cover' => 'nullable|image|max:5120',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'category' => 'nullable|string|max:100',
        ]);

        if ($request->hasFile('cover')) {
            if ($track->cover_path) {
                Storage::disk('s3')->delete($track->cover_path);
            }
            $validated['cover_path'] = $request->file('cover')->store('covers', 's3');
            unset($validated['cover']);
        }

        $track->update($validated);

        return response()->json([
            'message' => 'Track updated successfully',
            'track' => $track->fresh(),
        ]);
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

    public function importFromYoutube(Request $request)
    {
        $request->validate([
            'url'      => 'required|url',
            'title'    => 'required|string|max:180',
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:5000',
            'tags'     => 'nullable|array',
        ]);

        // Basic YouTube URL check
        if (!preg_match('/youtube\.com|youtu\.be/', $request->url)) {
            return response()->json(['message' => 'Only YouTube links are supported'], 422);
        }

        $user = auth()->user();
        $planService = app(\App\Services\PlanFeatureService::class)->forUser($user);

        // Check upload limit (admins bypass)
        if (!$user->is_admin && !$planService->canUpload()) {
            return response()->json([
                'message' => 'Upload limit reached for your plan. Upgrade to upload more tracks.',
                'uploads_remaining' => $planService->uploadsRemaining(),
                'plan' => $planService->planSlug(),
            ], 403);
        }

        $status = ($user->is_admin || $planService->hasAutoApproval()) ? 'approved' : 'pending';

        $track = Track::create([
            'user_id'     => auth()->id(),
            'title'       => $request->title,
            'description' => $request->description ?? null,
            'category'    => $request->category ?? null,
            'tags'        => $request->tags ?? null,
            'youtube_url' => $request->url,
            'status'      => 'processing',
            'audio_path'  => null,
            'source_path' => null,
        ]);

        // Increment upload counter
        $user->increment('uploads_this_month');

        ImportYoutubeTrack::dispatch($track->id);

        return response()->json([
            'message' => 'Import started. Your track will appear once it\'s ready.',
            'track'   => $track,
            'uploads_remaining' => $planService->uploadsRemaining(),
        ], 201);
    }
}

