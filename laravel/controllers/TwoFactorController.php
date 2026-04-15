<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    private function google2fa(): Google2FA
    {
        return new Google2FA();
    }

    // ─── Setup: generate secret & QR code ────────────────────────────────────

    public function setup(Request $request)
    {
        $user   = $request->user();
        $g2fa   = $this->google2fa();

        // Generate a fresh secret each time setup is called
        $secret = $g2fa->generateSecretKey();

        // Store temporarily in cache (10 min) until user confirms
        Cache::put('2fa_setup:' . $user->id, $secret, now()->addMinutes(10));

        $qrUrl = $g2fa->getQRCodeUrl(
            config('app.name', 'Nashidify'),
            $user->email,
            $secret
        );

        return response()->json([
            'secret' => $secret,
            'qr_url' => $qrUrl,
        ]);
    }

    // ─── Confirm: verify code and enable 2FA ─────────────────────────────────

    public function confirm(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);

        $user   = $request->user();
        $g2fa   = $this->google2fa();
        $secret = Cache::get('2fa_setup:' . $user->id);

        if (! $secret) {
            return response()->json(['message' => 'Setup session expired. Please start again.'], 400);
        }

        $valid = $g2fa->verifyKey($secret, $request->code);

        if (! $valid) {
            return response()->json(['message' => 'Invalid code. Please try again.'], 422);
        }

        // Generate recovery codes
        $recoveryCodes = collect(range(1, 8))->map(fn() => Str::upper(Str::random(4) . '-' . Str::random(4)))->all();

        $user->two_factor_secret         = Crypt::encryptString($secret);
        $user->two_factor_recovery_codes = Crypt::encryptString(json_encode($recoveryCodes));
        $user->two_factor_confirmed_at   = now();
        $user->save();

        Cache::forget('2fa_setup:' . $user->id);

        return response()->json([
            'message'        => '2FA enabled successfully.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    // ─── Disable 2FA ─────────────────────────────────────────────────────────

    public function disable(Request $request)
    {
        $user = $request->user();

        // Social-only users have no real password — they're already authenticated via OAuth token
        if (! $user->social_provider) {
            $request->validate(['password' => 'required|string']);
            if (! Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Incorrect password.'], 403);
            }
        }

        $user->two_factor_secret         = null;
        $user->two_factor_recovery_codes = null;
        $user->two_factor_confirmed_at   = null;
        $user->save();

        return response()->json(['message' => '2FA disabled successfully.']);
    }

    // ─── Get recovery codes ───────────────────────────────────────────────────

    public function recoveryCodes(Request $request)
    {
        $user = $request->user();

        if (! $user->social_provider) {
            $request->validate(['password' => 'required|string']);
            if (! Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Incorrect password.'], 403);
            }
        }

        if (! $user->two_factor_confirmed_at) {
            return response()->json(['message' => '2FA is not enabled.'], 400);
        }

        $codes = json_decode(Crypt::decryptString($user->two_factor_recovery_codes), true);

        return response()->json(['recovery_codes' => $codes]);
    }

    // ─── Verify during login (challenge) ─────────────────────────────────────

    public function challenge(Request $request)
    {
        $request->validate([
            'two_fa_token' => 'required|string',
            'code'         => 'required|string',
        ]);

        $cacheKey = '2fa_challenge:' . $request->two_fa_token;
        $userId   = Cache::get($cacheKey);

        if (! $userId) {
            return response()->json(['message' => 'Session expired. Please log in again.'], 401);
        }

        $user = \App\Models\User::find($userId);

        if (! $user || ! $user->two_factor_confirmed_at) {
            return response()->json(['message' => 'Invalid session.'], 401);
        }

        $secret = Crypt::decryptString($user->two_factor_secret);
        $g2fa   = $this->google2fa();
        $code   = $request->code;

        // Check TOTP code
        $valid = $g2fa->verifyKey($secret, $code);

        // Check recovery codes if TOTP fails
        if (! $valid) {
            $recoveryCodes = json_decode(Crypt::decryptString($user->two_factor_recovery_codes), true);
            $index = array_search($code, $recoveryCodes);

            if ($index !== false) {
                // Burn the used recovery code
                unset($recoveryCodes[$index]);
                $user->two_factor_recovery_codes = Crypt::encryptString(json_encode(array_values($recoveryCodes)));
                $user->save();
                $valid = true;
            }
        }

        if (! $valid) {
            return response()->json(['message' => 'Invalid code. Please try again.'], 422);
        }

        Cache::forget($cacheKey);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user'             => $user->load('profile'),
            'token'            => $token,
            'onboarding_state' => $user->onboarding_state ?? 'completed',
        ]);
    }
}
