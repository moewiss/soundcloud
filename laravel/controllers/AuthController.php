<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Create default profile
        Profile::create([
            'user_id' => $user->id,
            'display_name' => $user->name,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('profile'),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        // #region agent log
        @file_put_contents('d:\Desktop\soundcloud\.cursor\debug.log', json_encode(['location'=>'AuthController.php:47','message'=>'Login request received','data'=>['email'=>$request->input('email'),'passwordLength'=>strlen($request->input('password','')),'allInputKeys'=>array_keys($request->all()),'contentType'=>$request->header('Content-Type')],'timestamp'=>round(microtime(true)*1000),'sessionId'=>'debug-session','hypothesisId'=>'H3,H4']) . "\n", FILE_APPEND);
        // #endregion
        
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);
            
            // #region agent log
            @file_put_contents('d:\Desktop\soundcloud\.cursor\debug.log', json_encode(['location'=>'AuthController.php:51','message'=>'Validation passed','data'=>['email'=>$request->email],'timestamp'=>round(microtime(true)*1000),'sessionId'=>'debug-session','hypothesisId'=>'H1,H4']) . "\n", FILE_APPEND);
            // #endregion
        } catch (\Illuminate\Validation\ValidationException $e) {
            // #region agent log
            @file_put_contents('d:\Desktop\soundcloud\.cursor\debug.log', json_encode(['location'=>'AuthController.php:52','message'=>'Validation failed','data'=>['errors'=>$e->errors(),'status'=>$e->status],'timestamp'=>round(microtime(true)*1000),'sessionId'=>'debug-session','hypothesisId'=>'H1,H4']) . "\n", FILE_APPEND);
            // #endregion
            throw $e;
        }

        $user = User::where('email', $request->email)->first();
        
        // #region agent log
        @file_put_contents('d:\Desktop\soundcloud\.cursor\debug.log', json_encode(['location'=>'AuthController.php:56','message'=>'User lookup result','data'=>['userExists'=>!!$user,'email'=>$request->email],'timestamp'=>round(microtime(true)*1000),'sessionId'=>'debug-session','hypothesisId'=>'H5']) . "\n", FILE_APPEND);
        // #endregion

        if (!$user || !Hash::check($request->password, $user->password)) {
            // #region agent log
            @file_put_contents('d:\Desktop\soundcloud\.cursor\debug.log', json_encode(['location'=>'AuthController.php:59','message'=>'Auth failed','data'=>['userExists'=>!!$user,'passwordCheckFailed'=>$user ? !Hash::check($request->password, $user->password) : null],'timestamp'=>round(microtime(true)*1000),'sessionId'=>'debug-session','hypothesisId'=>'H5']) . "\n", FILE_APPEND);
            // #endregion
            
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('profile'),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('profile'),
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // For security, don't reveal if email exists
            return response()->json([
                'message' => 'If your email is registered, you will receive a password reset link.',
            ]);
        }

        // Delete any existing tokens for this user
        DB::table('password_resets')->where('email', $request->email)->delete();

        // Create new reset token
        $token = Str::random(60);
        DB::table('password_resets')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // In a real application, you would send an email here
        // For now, we'll return the token (ONLY for development/testing)
        return response()->json([
            'message' => 'Password reset link sent to your email.',
            'reset_token' => $token, // Remove this in production!
            'reset_url' => config('app.frontend_url') . '/reset-password?token=' . $token . '&email=' . $request->email,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        // Find the password reset record
        $resetRecord = DB::table('password_resets')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 400);
        }

        // Verify token
        if (!Hash::check($request->token, $resetRecord->token)) {
            return response()->json([
                'message' => 'Invalid reset token.',
            ], 400);
        }

        // Check if token is expired (24 hours)
        if (now()->diffInHours($resetRecord->created_at) > 24) {
            DB::table('password_resets')->where('email', $request->email)->delete();
            return response()->json([
                'message' => 'Reset token has expired. Please request a new one.',
            ], 400);
        }

        // Update user password
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'message' => 'User not found.',
            ], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Delete the used token
        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Password has been reset successfully. You can now login with your new password.',
        ]);
    }
}

