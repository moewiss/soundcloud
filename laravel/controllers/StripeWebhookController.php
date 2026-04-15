<?php

namespace App\Http\Controllers\Api;

use App\Models\Ad;
use App\Models\AdCampaign;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Http\Controllers\WebhookController;

class StripeWebhookController extends WebhookController
{
    /**
     * Handle invoice paid — subscription payment succeeded.
     */
    public function handleInvoicePaid(array $payload): void
    {
        $data = $payload['data']['object'] ?? [];
        $customerId = $data['customer'] ?? null;

        if ($customerId) {
            $user = User::where('stripe_id', $customerId)->first();
            if ($user) {
                DB::table('payments')->insert([
                    'user_id' => $user->id,
                    'stripe_payment_intent_id' => $data['payment_intent'] ?? null,
                    'stripe_invoice_id' => $data['id'] ?? null,
                    'type' => 'subscription',
                    'amount_cents' => $data['amount_paid'] ?? 0,
                    'currency' => $data['currency'] ?? 'usd',
                    'status' => 'succeeded',
                    'description' => 'Subscription payment',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                Log::info("Invoice paid for user {$user->id}: {$data['amount_paid']} {$data['currency']}");
            }
        }
    }

    /**
     * Handle subscription updated — plan changes, status changes.
     */
    public function handleCustomerSubscriptionUpdated(array $payload): void
    {
        parent::handleCustomerSubscriptionUpdated($payload);

        $data = $payload['data']['object'] ?? [];
        $customerId = $data['customer'] ?? null;
        $status = $data['status'] ?? null;

        if ($customerId) {
            $user = User::where('stripe_id', $customerId)->first();
            if ($user) {
                // Update plan_slug based on the Stripe price
                $priceId = $data['items']['data'][0]['price']['id'] ?? null;
                if ($priceId) {
                    // Check plan_prices table first (regional prices)
                    $planPrice = DB::table('plan_prices')
                        ->where('stripe_price_id', $priceId)
                        ->first();

                    if ($planPrice) {
                        $plan = DB::table('plans')->find($planPrice->plan_id);
                    } else {
                        // Fall back to base prices on plans table
                        $plan = DB::table('plans')
                            ->where('stripe_price_id_monthly', $priceId)
                            ->orWhere('stripe_price_id_annual', $priceId)
                            ->first();
                    }

                    if ($plan) {
                        $user->update(['plan_slug' => $plan->slug]);

                        // Sync verified badge based on plan
                        if ($user->profile) {
                            $user->profile->update([
                                'is_verified' => $plan->has_verified_badge,
                            ]);
                        }

                        // Sync artist portal access based on plan
                        $isArtistPlan = in_array($plan->slug, ['artist', 'artist_pro']);
                        if ($isArtistPlan && !$user->is_artist) {
                            $user->update([
                                'is_artist' => true,
                                'artist_verified_at' => now(),
                            ]);

                            if (!$user->artistProfile) {
                                \App\Models\ArtistProfile::create([
                                    'user_id' => $user->id,
                                    'artist_onboarding_state' => 'not_started',
                                ]);
                            }

                            Log::info("User {$user->id} granted artist access via {$plan->slug} subscription");
                        } elseif (!$isArtistPlan && $user->is_artist) {
                            // Downgraded from artist plan to non-artist plan
                            $user->update([
                                'is_artist' => false,
                                'artist_verified_at' => null,
                            ]);
                            Log::info("User {$user->id} artist access removed (downgraded to {$plan->slug})");
                        }

                        Log::info("User {$user->id} plan updated to {$plan->slug}");
                    } else {
                        Log::warning("Stripe webhook: could not resolve plan for price_id {$priceId}, user {$user->id}");
                    }
                }
            }
        }
    }

    /**
     * Handle subscription deleted — downgrade to free.
     */
    public function handleCustomerSubscriptionDeleted(array $payload): void
    {
        parent::handleCustomerSubscriptionDeleted($payload);

        $data = $payload['data']['object'] ?? [];
        $customerId = $data['customer'] ?? null;

        if ($customerId) {
            $user = User::where('stripe_id', $customerId)->first();
            if ($user) {
                $user->update([
                    'plan_slug' => 'free',
                    'is_artist' => false,
                    'artist_verified_at' => null,
                ]);

                // Remove verified badge on downgrade
                if ($user->profile) {
                    $user->profile->update(['is_verified' => false]);
                }

                Log::info("User {$user->id} subscription deleted, downgraded to free, artist access removed");
            }
        }
    }

    /**
     * Handle checkout session completed — activate track promotions after payment.
     */
    public function handleCheckoutSessionCompleted(array $payload): void
    {
        $data = $payload['data']['object'] ?? [];
        $metadata = $data['metadata'] ?? [];

        if (($metadata['type'] ?? '') !== 'track_promotion') {
            return;
        }

        $campaignId = $metadata['campaign_id'] ?? null;
        if (!$campaignId) {
            Log::warning('Checkout completed for track_promotion but no campaign_id in metadata');
            return;
        }

        $campaign = AdCampaign::find($campaignId);
        if (!$campaign || $campaign->status !== 'draft') {
            Log::warning("Checkout completed but campaign {$campaignId} not found or not in draft status");
            return;
        }

        // Activate the campaign and its ads now that payment is confirmed
        $campaign->update([
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays((int) ($metadata['duration_days'] ?? 7))->toDateString(),
        ]);
        $campaign->ads()->update(['status' => 'active']);

        // Record the payment
        $userId = $metadata['user_id'] ?? null;
        if ($userId) {
            DB::table('payments')->insert([
                'user_id' => $userId,
                'stripe_payment_intent_id' => $data['payment_intent'] ?? null,
                'stripe_invoice_id' => null,
                'type' => 'promotion',
                'amount_cents' => $data['amount_total'] ?? 0,
                'currency' => $data['currency'] ?? 'usd',
                'status' => 'succeeded',
                'description' => "Track promotion: campaign #{$campaignId}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Log::info("Track promotion campaign {$campaignId} activated after payment");
    }

    /**
     * Handle checkout session expired — clean up unpaid promotions.
     */
    public function handleCheckoutSessionExpired(array $payload): void
    {
        $data = $payload['data']['object'] ?? [];
        $metadata = $data['metadata'] ?? [];

        if (($metadata['type'] ?? '') !== 'track_promotion') {
            return;
        }

        $campaignId = $metadata['campaign_id'] ?? null;
        if (!$campaignId) {
            return;
        }

        $campaign = AdCampaign::find($campaignId);
        if ($campaign && $campaign->status === 'draft') {
            $campaign->ads()->delete();
            $campaign->delete();
            Log::info("Cleaned up unpaid promotion campaign {$campaignId} after checkout expiry");
        }
    }

    /**
     * Handle payment failed.
     */
    public function handleInvoicePaymentFailed(array $payload): void
    {
        $data = $payload['data']['object'] ?? [];
        $customerId = $data['customer'] ?? null;

        if ($customerId) {
            $user = User::where('stripe_id', $customerId)->first();
            if ($user) {
                DB::table('payments')->insert([
                    'user_id' => $user->id,
                    'stripe_payment_intent_id' => $data['payment_intent'] ?? null,
                    'stripe_invoice_id' => $data['id'] ?? null,
                    'type' => 'subscription',
                    'amount_cents' => $data['amount_due'] ?? 0,
                    'currency' => $data['currency'] ?? 'usd',
                    'status' => 'failed',
                    'description' => 'Payment failed',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                Log::warning("Payment failed for user {$user->id}");
            }
        }
    }
}
