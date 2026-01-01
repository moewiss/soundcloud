<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'display_name' => 'sometimes|string|max:120',
            'bio' => 'sometimes|string|max:1000',
            'avatar' => 'sometimes|image|max:5120', // 5MB
            'header' => 'sometimes|image|max:5120', // 5MB
        ]);

        $profile = $request->user()->profile;

        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($profile->avatar_path) {
                Storage::disk('s3')->delete($profile->avatar_path);
            }

            $path = $request->file('avatar')->store('avatars', 's3');
            $profile->avatar_path = $path;
        }

        if ($request->hasFile('header')) {
            // Delete old header if exists
            if ($profile->header_path) {
                Storage::disk('s3')->delete($profile->header_path);
            }

            $path = $request->file('header')->store('headers', 's3');
            $profile->header_path = $path;
        }

        if (isset($validated['display_name'])) {
            $profile->display_name = $validated['display_name'];
        }

        if (isset($validated['bio'])) {
            $profile->bio = $validated['bio'];
        }

        $profile->save();

        // Return full user data with updated profile
        $user = $request->user()->load('profile');
        
        return response()->json([
            'profile' => $profile,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'bio' => $profile->bio,
                'avatar_url' => $profile->avatar_url,
                'header_url' => $profile->header_url,
            ],
        ]);
    }

    public function deleteAvatar(Request $request)
    {
        $profile = $request->user()->profile;

        if ($profile->avatar_path) {
            Storage::disk('s3')->delete($profile->avatar_path);
            $profile->avatar_path = null;
            $profile->save();
        }

        return response()->json([
            'message' => 'Avatar deleted successfully',
            'avatar_url' => null,
        ]);
    }

    public function show($userId)
    {
        $user = \App\Models\User::with('profile')->findOrFail($userId);
        
        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'bio' => $user->profile->bio ?? null,
            'avatar_url' => $user->profile->avatar_url ?? null,
            'header_url' => $user->profile->header_url ?? null,
            'created_at' => $user->created_at,
            'tracks_count' => $user->tracks()->approved()->count(),
            'followers_count' => $user->followers()->count(),
            'following_count' => $user->following()->count(),
            'likes_count' => $user->likedTracks()->count(),
            'reposts_count' => $user->repostedTracks()->count(),
        ];

        // Check if current user is following this user
        if (auth()->check()) {
            $data['is_following'] = auth()->user()->isFollowing($user);
        }
        
        return response()->json($data);
    }

    public function index()
    {
        $users = \App\Models\User::with('profile')
            ->withCount(['tracks' => function ($query) {
                $query->approved();
            }])
            ->get();
        
        return response()->json($users);
    }
}

