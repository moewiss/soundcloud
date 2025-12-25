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

        if (isset($validated['display_name'])) {
            $profile->display_name = $validated['display_name'];
        }

        if (isset($validated['bio'])) {
            $profile->bio = $validated['bio'];
        }

        $profile->save();

        return response()->json([
            'profile' => $profile,
        ]);
    }

    public function show($userId)
    {
        $user = \App\Models\User::with('profile')->findOrFail($userId);
        
        return response()->json([
            'user' => $user,
            'tracks_count' => $user->tracks()->approved()->count(),
        ]);
    }
}

