<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Profile;
use App\Mail\VerifyEmailMail;
use App\Mail\ResetPasswordMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function verifyRecaptcha(?string $token): bool
    {
        $secret = env('RECAPTCHA_SECRET');

        // If secret not configured or token not provided (e.g. ad blocker blocked script),
        // allow through — rate limiting is the fallback protection
        if (!$secret || !$token) return true;

        try {
            $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret'   => $secret,
                'response' => $token,
            ]);
            $data = $response->json();
            return ($data['success'] ?? false) && ($data['score'] ?? 0) >= 0.5;
        } catch (\Exception $e) {
            // If Google's API is unreachable, allow through
            \Log::warning('reCAPTCHA verification failed: ' . $e->getMessage());
            return true;
        }
    }
    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Generate a 6-digit OTP code, store its hash + expiry on the user,
     * and return the raw code to send by email.
     */
    private function generateVerificationCode(User $user): string
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->email_verification_code        = Hash::make($code);
        $user->email_verification_expires_at  = now()->addMinutes(15);
        $user->save();

        return $code;
    }

    /**
     * Generate a 6-digit OTP code for password reset, store its hash + expiry
     * in the password_resets table, and return the raw code.
     */
    private function generateResetCode(string $email): string
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('password_resets')->where('email', $email)->delete();
        DB::table('password_resets')->insert([
            'email'      => $email,
            'code'       => Hash::make($code),
            'expires_at' => now()->addMinutes(15),
        ]);

        return $code;
    }

    // ─── Registration ─────────────────────────────────────────────────────────

    public function register(Request $request)
    {
        if (!$this->verifyRecaptcha($request->input('recaptcha_token'))) {
            return response()->json(['message' => 'reCAPTCHA verification failed. Please try again.'], 422);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'onboarding_state' => 'not_started',
            'onboarding_step' => 0,
        ]);

        Profile::create([
            'user_id'      => $user->id,
            'display_name' => $user->name,
        ]);

        $code = $this->generateVerificationCode($user);

        try {
            Mail::to($user->email)->send(new VerifyEmailMail($code, $user->name));
        } catch (\Exception $e) {
            \Log::error('Failed to send verification email: ' . $e->getMessage());
        }

        // Do NOT issue a token — user must verify first
        return response()->json([
            'message' => 'Account created! Please check your email for the 6-digit verification code.',
            'email'   => $user->email,
        ], 201);
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    public function login(Request $request)
    {
        if (!$this->verifyRecaptcha($request->input('recaptcha_token'))) {
            return response()->json(['message' => 'reCAPTCHA verification failed. Please try again.'], 422);
        }

        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->banned_at) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended.'],
            ]);
        }

        // Block unverified users
        if (! $user->email_verified_at) {
            return response()->json([
                'message'               => 'Your email address is not verified.',
                'requires_verification' => true,
                'email'                 => $user->email,
            ], 403);
        }

        // 2FA challenge
        if ($user->two_factor_confirmed_at) {
            $twoFaToken = Str::random(40);
            Cache::put('2fa_challenge:' . $twoFaToken, $user->id, now()->addMinutes(5));

            return response()->json([
                'requires_2fa'  => true,
                'two_fa_token'  => $twoFaToken,
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        $mustSetup2fa = ($user->is_admin || $user->artist_verified_at || $user->plan_slug === 'artist_pro') && !$user->two_factor_confirmed_at;

        return response()->json([
            'user'              => $user->load('profile'),
            'token'             => $token,
            'onboarding_state'  => $user->onboarding_state ?? 'completed',
            'requires_2fa_setup' => $mustSetup2fa,
        ]);
    }

    // ─── Guest ────────────────────────────────────────────────────────────────

    public function guestLogin()
    {
        $guestName = 'Guest_' . Str::random(6);

        $user = User::create([
            'name'              => $guestName,
            'email'             => $guestName . '@guest.local',
            'password'          => Hash::make(Str::random(32)),
            'email_verified_at' => now(),
            'onboarding_state'  => 'skipped',
        ]);

        Profile::create([
            'user_id'      => $user->id,
            'display_name' => $guestName,
        ]);

        $token = $user->createToken('guest-token')->plainTextToken;

        return response()->json([
            'user'             => $user->load('profile'),
            'token'            => $token,
            'onboarding_state' => $user->onboarding_state ?? 'skipped',
        ]);
    }

    // ─── Email Verification ───────────────────────────────────────────────────

    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        // Rate-limit: max 5 wrong attempts per 15 minutes
        $rlKey = 'verify-email:' . $request->email;
        if (RateLimiter::tooManyAttempts($rlKey, 5)) {
            $seconds = RateLimiter::availableIn($rlKey);
            return response()->json([
                'message' => "Too many attempts. Please wait {$seconds} seconds before trying again.",
            ], 429);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            RateLimiter::hit($rlKey, 900);
            return response()->json(['message' => 'Invalid verification code.'], 400);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email is already verified. Please log in.']);
        }

        // Check expiry
        if (! $user->email_verification_expires_at || now()->gt($user->email_verification_expires_at)) {
            return response()->json([
                'message' => 'Verification code has expired. Please request a new one.',
                'expired' => true,
            ], 400);
        }

        // Check code
        if (! $user->email_verification_code || ! Hash::check($request->code, $user->email_verification_code)) {
            RateLimiter::hit($rlKey, 900);
            return response()->json(['message' => 'Invalid verification code.'], 400);
        }

        // Mark verified, clear code
        $user->email_verified_at             = now();
        $user->email_verification_code       = null;
        $user->email_verification_expires_at = null;
        $user->save();

        RateLimiter::clear($rlKey);

        // Issue auth token so user is logged in immediately
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully! Welcome aboard.',
            'user'    => $user->load('profile'),
            'token'   => $token,
            'onboarding_state' => $user->onboarding_state ?? 'not_started',
        ]);
    }

    // ─── Resend Verification ──────────────────────────────────────────────────

    public function resendVerification(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Rate-limit resend: max 3 per 10 minutes
        $rlKey = 'resend-verification:' . $request->email;
        if (RateLimiter::tooManyAttempts($rlKey, 3)) {
            $seconds = RateLimiter::availableIn($rlKey);
            return response()->json([
                'message' => "Too many resend requests. Please wait {$seconds} seconds.",
            ], 429);
        }
        RateLimiter::hit($rlKey, 600);

        $user = User::where('email', $request->email)->first();

        // Always return 200 to avoid leaking user existence
        if (! $user || $user->email_verified_at) {
            return response()->json([
                'message' => 'If this email is registered and unverified, a new code has been sent.',
            ]);
        }

        $code = $this->generateVerificationCode($user);

        try {
            Mail::to($user->email)->send(new VerifyEmailMail($code, $user->name));
        } catch (\Exception $e) {
            \Log::error('Failed to resend verification email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'A new verification code has been sent to your email.',
        ]);
    }

    // ─── Forgot Password ─────────────────────────────────────────────────────

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Rate-limit: max 3 per 10 minutes per email
        $rlKey = 'forgot-password:' . $request->email;
        if (RateLimiter::tooManyAttempts($rlKey, 3)) {
            $seconds = RateLimiter::availableIn($rlKey);
            return response()->json([
                'message' => "Too many requests. Please wait {$seconds} seconds before trying again.",
            ], 429);
        }
        RateLimiter::hit($rlKey, 600);

        $user = User::where('email', $request->email)->first();

        // Always return success to avoid leaking whether email exists
        if (! $user) {
            return response()->json([
                'message' => 'If your email is registered, you will receive a reset code shortly.',
            ]);
        }

        $code = $this->generateResetCode($request->email);

        try {
            Mail::to($user->email)->send(new ResetPasswordMail($code, $user->name));
        } catch (\Exception $e) {
            \Log::error('Failed to send password reset email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'If your email is registered, you will receive a reset code shortly.',
        ]);
    }

    // ─── Reset Password ───────────────────────────────────────────────────────

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'code'     => 'required|string|size:6',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        // Rate-limit: max 5 wrong attempts per 15 minutes
        $rlKey = 'reset-password:' . $request->email;
        if (RateLimiter::tooManyAttempts($rlKey, 5)) {
            $seconds = RateLimiter::availableIn($rlKey);
            return response()->json([
                'message' => "Too many attempts. Please wait {$seconds} seconds before trying again.",
            ], 429);
        }

        $record = DB::table('password_resets')
            ->where('email', $request->email)
            ->first();

        if (! $record) {
            RateLimiter::hit($rlKey, 900);
            return response()->json(['message' => 'Invalid or expired reset code.'], 400);
        }

        // Check expiry
        if (now()->gt($record->expires_at)) {
            DB::table('password_resets')->where('email', $request->email)->delete();
            return response()->json([
                'message' => 'Reset code has expired. Please request a new one.',
                'expired' => true,
            ], 400);
        }

        // Check code
        if (! Hash::check($request->code, $record->code)) {
            RateLimiter::hit($rlKey, 900);
            return response()->json(['message' => 'Invalid reset code.'], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Update password, revoke all tokens, clean up
        $user->password = Hash::make($request->password);
        $user->save();

        $user->tokens()->delete();
        DB::table('password_resets')->where('email', $request->email)->delete();
        RateLimiter::clear($rlKey);

        return response()->json([
            'message' => 'Password reset successfully. You can now log in with your new password.',
        ]);
    }

    // ─── Misc ─────────────────────────────────────────────────────────────────

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('profile');
        $planService = app(\App\Services\PlanFeatureService::class)->forUser($user);

        return response()->json([
            'user' => $user,
            'plan_features' => $planService->toArray(),
            'onboarding_state' => $user->onboarding_state ?? 'not_started',
        ]);
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        $isSocialOnly = $user->social_provider && !$request->has('password');

        if (!$isSocialOnly) {
            $request->validate(['password' => 'required|string']);
            if (!Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Incorrect password'], 403);
            }
        }

        // Revoke all tokens
        $user->tokens()->delete();

        // Soft delete the user
        $user->delete();

        return response()->json(['message' => 'Account deleted successfully']);
    }
}
