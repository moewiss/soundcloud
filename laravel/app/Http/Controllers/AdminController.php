<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Track;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    private function checkAdmin()
    {
        // #region agent log
        $user = auth()->user(); file_put_contents('d:\\Desktop\\soundcloud\\.cursor\\debug.log', json_encode(['location'=>'AdminController.php:18','message'=>'checkAdmin called','data'=>['has_user'=>!is_null($user),'is_admin'=>$user?$user->is_admin:null],'timestamp'=>microtime(true)*1000,'sessionId'=>'debug-session','hypothesisId'=>'D-E']) . "\n", FILE_APPEND);
        // #endregion
        if (!auth()->user() || !auth()->user()->is_admin) {
            abort(403, 'Unauthorized action.');
        }
        // #region agent log
        file_put_contents('d:\\Desktop\\soundcloud\\.cursor\\debug.log', json_encode(['location'=>'AdminController.php:21','message'=>'checkAdmin passed','data'=>['user_id'=>auth()->id()],'timestamp'=>microtime(true)*1000,'sessionId'=>'debug-session','hypothesisId'=>'D-E']) . "\n", FILE_APPEND);
        // #endregion
    }

    public function getStats()
    {
        // #region agent log
        file_put_contents('d:\\Desktop\\soundcloud\\.cursor\\debug.log', json_encode(['location'=>'AdminController.php:26','message'=>'getStats called','data'=>[],'timestamp'=>microtime(true)*1000,'sessionId'=>'debug-session','hypothesisId'=>'A']) . "\n", FILE_APPEND);
        // #endregion
        try {
            $this->checkAdmin();
            // #region agent log
            file_put_contents('d:\\Desktop\\soundcloud\\.cursor\\debug.log', json_encode(['location'=>'AdminController.php:32','message'=>'About to query total_users','data'=>[],'timestamp'=>microtime(true)*1000,'sessionId'=>'debug-session','hypothesisId'=>'B']) . "\n", FILE_APPEND);
            // #endregion
            $total_users = User::count();
            // #region agent log
            file_put_contents('d:\\Desktop\\soundcloud\\.cursor\\debug.log', json_encode(['location'=>'AdminController.php:36','message'=>'total_users result','data'=>['count'=>$total_users],'timestamp'=>microtime(true)*1000,'sessionId'=>'debug-session','hypothesisId'=>'B']) . "\n", FILE_APPEND);
            // #endregion
            $total_tracks = Track::count();
            // #region agent log
            file_put_contents('d:\\Desktop\\soundcloud\\.cursor\\debug.log', json_encode(['location'=>'AdminController.php:40','message'=>'total_tracks result','data'=>['count'=>$total_tracks],'timestamp'=>microtime(true)*1000,'sessionId'=>'debug-session','hypothesisId'=>'B']) . "\n", FILE_APPEND);
            // #endregion
            $pending_tracks = Track::where('status', 'pending')->count();
            // #region agent log
            file_put_contents('d:\\Desktop\\soundcloud\\.cursor\\debug.log', json_encode(['location'=>'AdminController.php:44','message'=>'pending_tracks result','data'=>['count'=>$pending_tracks],'timestamp'=>microtime(true)*1000,'sessionId'=>'debug-session','hypothesisId'=>'B']) . "\n", FILE_APPEND);
            // #endregion
            $total_plays = Track::sum('play_count');
            // #region agent log
            file_put_contents('d:\\Desktop\\soundcloud\\.cursor\\debug.log', json_encode(['location'=>'AdminController.php:48','message'=>'total_plays result','data'=>['sum'=>$total_plays],'timestamp'=>microtime(true)*1000,'sessionId'=>'debug-session','hypothesisId'=>'B']) . "\n", FILE_APPEND);
            // #endregion
            $stats = [
                'total_users' => $total_users,
                'total_tracks' => $total_tracks,
                'pending_tracks' => $pending_tracks,
                'total_plays' => $total_plays,
            ];
            // #region agent log
            file_put_contents('d:\\Desktop\\soundcloud\\.cursor\\debug.log', json_encode(['location'=>'AdminController.php:57','message'=>'getStats success','data'=>$stats,'timestamp'=>microtime(true)*1000,'sessionId'=>'debug-session','hypothesisId'=>'A-B']) . "\n", FILE_APPEND);
            // #endregion
            return response()->json($stats);
        } catch (\Exception $e) {
            // #region agent log
            file_put_contents('d:\\Desktop\\soundcloud\\.cursor\\debug.log', json_encode(['location'=>'AdminController.php:62','message'=>'getStats exception','data'=>['error'=>$e->getMessage(),'file'=>$e->getFile(),'line'=>$e->getLine()],'timestamp'=>microtime(true)*1000,'sessionId'=>'debug-session','hypothesisId'=>'A-B-C-D-E']) . "\n", FILE_APPEND);
            // #endregion
            throw $e;
        }
    }

    public function getActivity()
    {
        $this->checkAdmin();
        $recentTracks = Track::with('user')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($track) {
                return [
                    'type' => 'track',
                    'user' => $track->user->name,
                    'title' => $track->title,
                    'created_at' => $track->created_at->toIso8601String(),
                ];
            });

        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($user) {
                return [
                    'type' => 'user',
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at->toIso8601String(),
                ];
            });

        $activity = $recentTracks->concat($recentUsers)
            ->sortByDesc('created_at')
            ->take(10)
            ->values();

        return response()->json($activity);
    }

    public function getUsers()
    {
        $this->checkAdmin();
        $users = User::withCount(['tracks', 'likedTracks', 'followers', 'following'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_admin' => $user->is_admin,
                    'is_banned' => !is_null($user->banned_at),
                    'tracks_count' => $user->tracks_count,
                    'liked_tracks_count' => $user->liked_tracks_count,
                    'followers_count' => $user->followers_count,
                    'following_count' => $user->following_count,
                    'created_at' => $user->created_at->toIso8601String(),
                ];
            });

        return response()->json($users);
    }

    public function updateUser(Request $request, $id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'is_admin' => 'sometimes|boolean',
        ]);

        if ($request->has('name')) {
            $user->name = $request->name;
        }

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->has('is_admin')) {
            $user->is_admin = $request->is_admin;
        }

        $user->save();

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user,
        ]);
    }

    public function deleteUser($id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete yourself'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function banUser($id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot ban yourself'], 400);
        }

        if ($user->banned_at) {
            $user->banned_at = null;
            $message = 'User unbanned successfully';
        } else {
            $user->banned_at = now();
            $message = 'User banned successfully';
        }

        $user->save();

        return response()->json([
            'message' => $message,
            'is_banned' => !is_null($user->banned_at),
        ]);
    }

    public function resetUserPassword(Request $request, $id)
    {
        $this->checkAdmin();
        $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user = User::findOrFail($id);
        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password reset successfully']);
    }

    public function generateResetLink($id)
    {
        $this->checkAdmin();
        $user = User::findOrFail($id);

        // Generate a password reset token
        $token = Str::random(64);

        DB::table('password_resets')->updateOrInsert(
            ['email' => $user->email],
            [
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $resetUrl = env('APP_FRONTEND_URL', 'http://localhost:3000') . '/reset-password?token=' . $token . '&email=' . $user->email;

        return response()->json([
            'message' => 'Reset link generated successfully',
            'reset_url' => $resetUrl,
        ]);
    }

    public function getComments()
    {
        $this->checkAdmin();
        $comments = Comment::with(['user', 'track'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'user' => [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name,
                    ],
                    'track' => [
                        'id' => $comment->track->id,
                        'title' => $comment->track->title,
                    ],
                    'created_at' => $comment->created_at->toIso8601String(),
                ];
            });

        return response()->json($comments);
    }

    public function deleteComment($id)
    {
        $this->checkAdmin();
        $comment = Comment::findOrFail($id);
        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }
}

