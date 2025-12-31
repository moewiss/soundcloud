<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    public function toggle($id)
    {
        $userToFollow = User::findOrFail($id);
        $currentUser = auth()->user();

        if ($currentUser->id === $userToFollow->id) {
            return response()->json(['message' => 'You cannot follow yourself'], 400);
        }

        $isFollowing = $currentUser->following()->where('following_id', $userToFollow->id)->exists();

        if ($isFollowing) {
            $currentUser->following()->detach($userToFollow->id);
            $message = 'Unfollowed successfully';
        } else {
            $currentUser->following()->attach($userToFollow->id);
            $message = 'Following successfully';

            // Create notification for the followed user
            \App\Models\Notification::create([
                'user_id' => $userToFollow->id,
                'actor_id' => $currentUser->id,
                'type' => 'follow',
                'message' => $currentUser->name . ' started following you',
            ]);
        }

        return response()->json([
            'message' => $message,
            'is_following' => !$isFollowing,
            'followers_count' => $userToFollow->followers()->count(),
        ]);
    }

    public function unfollow($id)
    {
        $userToUnfollow = User::findOrFail($id);
        $currentUser = auth()->user();

        $currentUser->following()->detach($userToUnfollow->id);

        return response()->json([
            'message' => 'Unfollowed successfully',
            'is_following' => false,
            'followers_count' => $userToUnfollow->followers()->count(),
        ]);
    }

    public function followers($id)
    {
        $user = User::findOrFail($id);
        $followers = $user->followers()
            ->select('users.id', 'users.name', 'users.email', 'users.created_at')
            ->with('profile')
            ->get();

        return response()->json($followers);
    }

    public function following($id)
    {
        $user = User::findOrFail($id);
        $following = $user->following()
            ->select('users.id', 'users.name', 'users.email', 'users.created_at')
            ->with('profile')
            ->get();

        return response()->json($following);
    }

    public function myFollowing(Request $request)
    {
        $following = $request->user()
            ->following()
            ->select('users.id', 'users.name', 'users.email', 'users.created_at')
            ->with('profile')
            ->get();

        return response()->json($following);
    }
}

