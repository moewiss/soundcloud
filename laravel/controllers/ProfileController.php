<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'display_name' => 'sometimes|string|max:120',
            'bio' => 'sometimes|string|max:1000',
            'avatar' => 'sometimes|image|max:5120', // 5MB
            'header' => 'sometimes|image|max:5120', // 5MB
            'is_private' => 'sometimes|boolean',
        ]);

        $user = $request->user();
        $profile = $user->profile;

        // Update user-level fields
        if (isset($validated['is_private'])) {
            $user->is_private = $validated['is_private'];
            $user->save();
        }

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
                'name' => $profile->display_name ?? $user->name,  // Use display_name if set
                'email' => $user->email,
                'bio' => $profile->bio,
                'avatar_url' => $profile->avatar_url,
                'header_url' => $profile->header_url,
            ],
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function getNotificationPreferences(Request $request)
    {
        $prefs = \DB::table('notification_preferences')
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$prefs) {
            return response()->json([
                'email_likes' => true,
                'email_comments' => true,
                'email_follows' => true,
                'email_reposts' => false,
                'push_likes' => true,
                'push_comments' => true,
                'push_follows' => true,
            ]);
        }

        return response()->json([
            'email_likes' => (bool) $prefs->email_likes,
            'email_comments' => (bool) $prefs->email_comments,
            'email_follows' => (bool) $prefs->email_follows,
            'email_reposts' => (bool) $prefs->email_reposts,
            'push_likes' => (bool) $prefs->push_likes,
            'push_comments' => (bool) $prefs->push_comments,
            'push_follows' => (bool) $prefs->push_follows,
        ]);
    }

    public function updateNotificationPreferences(Request $request)
    {
        $validated = $request->validate([
            'email_likes' => 'sometimes|boolean',
            'email_comments' => 'sometimes|boolean',
            'email_follows' => 'sometimes|boolean',
            'email_reposts' => 'sometimes|boolean',
            'push_likes' => 'sometimes|boolean',
            'push_comments' => 'sometimes|boolean',
            'push_follows' => 'sometimes|boolean',
        ]);

        \DB::table('notification_preferences')->updateOrInsert(
            ['user_id' => $request->user()->id],
            array_merge($validated, ['updated_at' => now()])
        );

        return response()->json(['message' => 'Notification preferences saved.']);
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
            'display_name' => $user->profile->display_name ?? $user->name,
            'bio' => $user->profile->bio ?? null,
            'avatar_url' => $user->profile->avatar_url ?? null,
            'header_url' => $user->profile->header_url ?? null,
            'is_verified' => $user->profile->is_verified ?? false,
            'is_founder' => $user->profile->is_founder ?? false,
            'is_artist' => (bool) $user->is_artist,
            'artist_verified_at' => $user->artist_verified_at,
            'is_private' => (bool) $user->is_private,
            'plan_slug' => $user->plan_slug ?? 'free',
            'social_links' => $user->profile->social_links ?? [],
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
        $users = \App\Models\User::public()
            ->with('profile')
            ->withCount(['tracks' => function ($query) {
                $query->approved();
            }])
            ->get();
        
        return response()->json($users);
    }
}

