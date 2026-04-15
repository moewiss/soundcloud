<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    // Supported providers and their Socialite driver names
    private array $providers = [
        'google'   => 'google',
        'facebook' => 'facebook',
        'twitter'  => 'twitter-oauth-2',
        'apple'    => 'apple',
    ];

    /**
     * Redirect the user to the provider's OAuth page.
     */
    public function redirect(string $provider)
    {
        if (! array_key_exists($provider, $this->providers)) {
            abort(404, 'Unsupported provider');
        }

        $driver = $this->providers[$provider];

        $socialite = Socialite::driver($driver)->stateless();

        // Facebook requires scopes to be set explicitly
        if ($provider === 'facebook') {
            $socialite = $socialite->scopes(['public_profile', 'email']);
        }

        return $socialite->redirect();
    }

    /**
     * Handle the callback from the provider.
     */
    public function callback(string $provider)
    {
        if (! array_key_exists($provider, $this->providers)) {
            abort(404, 'Unsupported provider');
        }

        $frontendUrl = env('FRONTEND_URL', env('APP_URL', 'https://nashidify.com'));

        try {
            $driver      = $this->providers[$provider];
            $socialUser  = Socialite::driver($driver)->stateless()->user();
        } catch (\Exception $e) {
            \Log::error("Social auth error [{$provider}]: " . $e->getMessage());
            return redirect($frontendUrl . '/login?error=social_auth_failed');
        }

        $email = $socialUser->getEmail();
        $name  = $socialUser->getName() ?? $socialUser->getNickname() ?? 'User';

        // If the provider didn't return an email, generate a placeholder
        if (! $email) {
            $email = $provider . '_' . $socialUser->getId() . '@social.nashidify.local';
        }

        // Find or create user
        $user = User::where('social_provider', $provider)
                    ->where('social_id', $socialUser->getId())
                    ->first();

        if (! $user) {
            // Check if there's already an account with that email
            $user = User::where('email', $email)->first();

            if ($user) {
                // Link the social account to the existing user
                $user->social_provider = $provider;
                $user->social_id       = $socialUser->getId();
                $user->social_avatar   = $socialUser->getAvatar();
                if (! $user->email_verified_at) {
                    $user->email_verified_at = now();
                }
                $user->save();
            } else {
                // Create a brand-new user
                $user = User::create([
                    'name'              => $name,
                    'email'             => $email,
                    'password'          => Hash::make(Str::random(32)),
                    'email_verified_at' => now(),
                    'social_provider'   => $provider,
                    'social_id'         => $socialUser->getId(),
                    'social_avatar'     => $socialUser->getAvatar(),
                    'onboarding_state'  => 'not_started',
                    'onboarding_step'   => 0,
                ]);

                Profile::create([
                    'user_id'      => $user->id,
                    'display_name' => $name,
                    'avatar'       => $socialUser->getAvatar(),
                ]);
            }
        } else {
            // Refresh avatar
            $user->social_avatar = $socialUser->getAvatar();
            $user->save();
        }

        if ($user->banned_at) {
            return redirect($frontendUrl . '/login?error=account_banned');
        }

        // 2FA challenge — redirect to frontend with temp token instead of real token
        if ($user->two_factor_confirmed_at) {
            $twoFaToken = \Illuminate\Support\Str::random(40);
            \Illuminate\Support\Facades\Cache::put('2fa_challenge:' . $twoFaToken, $user->id, now()->addMinutes(5));
            return redirect($frontendUrl . '/?two_fa_token=' . urlencode($twoFaToken));
        }

        $token = $user->createToken('social-token')->plainTextToken;

        $onboardingState = $user->onboarding_state ?? 'not_started';

        if (in_array($onboardingState, ['not_started', 'in_progress'])) {
            return redirect($frontendUrl . '/onboarding?token=' . urlencode($token) . '&onboarding=' . $onboardingState);
        }

        // Force 2FA setup for admins and verified artists
        $mustSetup2fa = ($user->is_admin || $user->artist_verified_at || $user->plan_slug === 'artist_pro') && !$user->two_factor_confirmed_at;
        if ($mustSetup2fa) {
            return redirect($frontendUrl . '/?token=' . urlencode($token) . '&require_2fa_setup=1');
        }

        return redirect($frontendUrl . '/?token=' . urlencode($token));
    }
}
