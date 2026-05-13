<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PlanFeatureService;
use App\Services\RegionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    public function __construct(private RegionService $regionService)
    {
    }

    /**
     * Get all available plans with region-adjusted pricing.
     */
    public function plans(Request $request)
    {
        $user = $request->user();
        $tier = $this->regionService->detectTier($request, $user);

        $plans = DB::table('plans')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        // Attach regional prices to each plan
        foreach ($plans as $plan) {
            $regionalPrices = DB::table('plan_prices')
                ->where('plan_id', $plan->id)
                ->where('region', $tier)
                ->get()
                ->keyBy('interval');

            if ($regionalPrices->has('monthly')) {
                $plan->display_price_monthly_cents = $regionalPrices['monthly']->amount_cents;
            } else {
                $plan->display_price_monthly_cents = $plan->price_monthly_cents;
            }

            if ($regionalPrices->has('annual')) {
                $plan->display_price_annual_cents = $regionalPrices['annual']->amount_cents;
            } else {
                $plan->display_price_annual_cents = $plan->price_annual_cents;
            }
        }

        return response()->json([
            'plans' => $plans,
            'pricing_tier' => $tier,
        ]);
    }

    /**
     * Get current user's subscription status and plan features.
     */
    public function status(Request $request, PlanFeatureService $planService)
    {
        $user = $request->user();
        $features = $planService->forUser($user)->toArray();

        $subscription = null;
        $cashierSub = $user->subscription('default');
        if ($cashierSub) {
            $subscription = [
                'status' => $cashierSub->stripe_status,
                'plan' => $user->plan_slug,
                'current_period_end' => $cashierSub->ends_at,
                'cancel_at_period_end' => $cashierSub->ends_at && !$cashierSub->onGracePeriod() ? false : ($cashierSub->ends_at ? true : false),
                'on_trial' => $cashierSub->onTrial(),
                'on_grace_period' => $cashierSub->onGracePeriod(),
            ];
        }

        return response()->json([
            'features' => $features,
            'subscription' => $subscription,
            'uploads_this_month' => $user->uploads_this_month,
        ]);
    }

    /**
     * Create a Stripe Checkout session for subscribing.
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'plan_slug' => 'required|string|exists:plans,slug',
            'billing_cycle' => 'required|in:monthly,annual',
        ]);

        $plan = DB::table('plans')->where('slug', $request->plan_slug)->first();
        if (!$plan || $plan->slug === 'free') {
            return response()->json(['message' => 'Invalid plan'], 422);
        }

        $user = $request->user();
        $tier = $this->regionService->detectTier($request, $user);

        // Look up regional price first, fall back to T1 base price
        $priceId = $this->resolveStripePriceId($plan, $tier, $request->billing_cycle);

        if (!$priceId) {
            return response()->json(['message' => 'Stripe price not configured for this plan. Please contact support.'], 422);
        }

        // Lock the user's pricing tier on first subscription (anti-arbitrage)
        if (!$user->pricing_tier) {
            $user->update(['pricing_tier' => $tier]);
        }

        $checkout = $user->newSubscription('default', $priceId)
            ->trialDays($plan->slug !== 'artist_pro' ? 7 : 0)
            ->checkout([
                'success_url' => env('FRONTEND_URL', 'http://localhost:5173') . '/pricing?subscription=success',
                'cancel_url' => env('FRONTEND_URL', 'http://localhost:5173') . '/pricing?cancelled=true',
                'allow_promotion_codes' => true,
            ]);

        return response()->json(['checkout_url' => $checkout->url]);
    }

    /**
     * Cancel subscription (at period end).
     */
    public function cancel(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription('default');

        if (!$subscription || !$subscription->active()) {
            return response()->json(['message' => 'No active subscription'], 422);
        }

        $subscription->cancel();

        return response()->json(['message' => 'Subscription will be cancelled at the end of the billing period']);
    }

    /**
     * Resume a cancelled subscription (if still on grace period).
     */
    public function resume(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription('default');

        if (!$subscription || !$subscription->onGracePeriod()) {
            return response()->json(['message' => 'No subscription to resume'], 422);
        }

        $subscription->resume();

        return response()->json(['message' => 'Subscription resumed']);
    }

    /**
     * Switch to a different plan.
     */
    public function changePlan(Request $request)
    {
        $request->validate([
            'plan_slug' => 'required|string|exists:plans,slug',
            'billing_cycle' => 'required|in:monthly,annual',
        ]);

        $plan = DB::table('plans')->where('slug', $request->plan_slug)->first();
        if (!$plan || $plan->slug === 'free') {
            // Downgrade to free = cancel
            $subscription = $request->user()->subscription('default');
            if ($subscription) $subscription->cancel();
            $request->user()->update(['plan_slug' => 'free']);
            return response()->json(['message' => 'Downgraded to free plan']);
        }

        $user = $request->user();
        $tier = $this->regionService->detectTier($request, $user);
        $priceId = $this->resolveStripePriceId($plan, $tier, $request->billing_cycle);

        if (!$priceId) {
            return response()->json(['message' => 'Stripe price not configured'], 422);
        }

        $subscription = $user->subscription('default');

        if ($subscription && $subscription->active()) {
            $subscription->swap($priceId);
            $user->update(['plan_slug' => $plan->slug]);
            return response()->json(['message' => 'Plan changed successfully']);
        }

        // No active subscription — create new checkout
        return $this->checkout($request);
    }

    /**
     * Get billing/payment history.
     */
    public function billingHistory(Request $request)
    {
        $payments = DB::table('payments')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json(['payments' => $payments]);
    }

    /**
     * Mobile PaymentSheet — Step 1.
     *
     * Returns the customer_id + ephemeral_key + setup_intent client_secret
     * that @stripe/stripe-react-native's initPaymentSheet expects. Mobile
     * collects the card via the native sheet, then calls
     * mobileConfirmSubscription() to actually create the Subscription.
     *
     * Companion to /subscription/checkout (which returns a Stripe-hosted
     * Checkout URL for web). Mobile cannot use the web flow because RN has
     * no clean browser handoff for the redirect.
     */
    public function mobileCheckout(Request $request)
    {
        $request->validate([
            'plan_slug' => 'required|string|exists:plans,slug',
            'billing_cycle' => 'required|in:monthly,annual',
        ]);

        $plan = DB::table('plans')->where('slug', $request->plan_slug)->first();
        if (!$plan || $plan->slug === 'free') {
            return response()->json(['message' => 'Invalid plan'], 422);
        }
        if ($plan->slug === 'artist') {
            // Paid Artist tier is sunset (Sprint C.5) — closed to new signups.
            // Companion to client-side hard-block in PricingScreen.handlePlanAction.
            return response()->json(['message' => 'Artist tier is closed to new signups. Munshid is the recommended creator tier.'], 410);
        }

        $user = $request->user();

        // Route already-subscribed users to change-plan instead of double-charging.
        if ($user->subscribed('default')) {
            return response()->json(['message' => 'Already subscribed. Use change-plan to switch tiers.'], 409);
        }

        $tier = $this->regionService->detectTier($request, $user);
        $priceId = $this->resolveStripePriceId($plan, $tier, $request->billing_cycle);
        if (!$priceId) {
            return response()->json(['message' => 'Stripe price not configured for this plan. Please contact support.'], 422);
        }

        // Lock pricing tier on first checkout (anti-arbitrage); mirrors the
        // web checkout() method's behaviour.
        if (!$user->pricing_tier) {
            $user->update(['pricing_tier' => $tier]);
        }

        // Ensure Stripe Customer exists for this user.
        if (!$user->stripe_id) {
            $user->createAsStripeCustomer();
        }

        $stripe = new \Stripe\StripeClient(config('cashier.secret'));

        // EphemeralKey lets the mobile SDK fetch the customer's saved methods.
        // Stripe API version matches the pattern already established in
        // WalletController::mobileTopUp (proven compatible with the bundled
        // @stripe/stripe-react-native version).
        $ephemeralKey = $stripe->ephemeralKeys->create(
            ['customer' => $user->stripe_id],
            ['stripe_version' => '2023-10-16']
        );

        // SetupIntent — collect payment method now, charge later on confirm.
        // Metadata is recoverable if the confirm call drops paymentMethodId
        // (mobile's retrieveSetupIntent can fail; see PricingScreen.tsx:332).
        $setupIntent = $stripe->setupIntents->create([
            'customer' => $user->stripe_id,
            'payment_method_types' => ['card'],
            'usage' => 'off_session',
            'metadata' => [
                'nashidify_plan_slug' => $plan->slug,
                'nashidify_billing_cycle' => $request->billing_cycle,
                'nashidify_price_id' => $priceId,
            ],
        ]);

        return response()->json([
            'customer_id' => $user->stripe_id,
            'ephemeral_key' => $ephemeralKey->secret,
            'setup_intent' => $setupIntent->client_secret,
            'publishable_key' => config('cashier.key'),
        ]);
    }

    /**
     * Mobile PaymentSheet — Step 2.
     *
     * Receives payment_method_id from the confirmed SetupIntent and creates
     * the actual Subscription. The Stripe webhook (StripeWebhookController)
     * handles user.plan_slug + is_artist sync downstream — this method just
     * triggers the customer.subscription.created event by creating the sub.
     *
     * Defensive: if payment_method_id is missing (mobile's retrieveSetupIntent
     * can fail per PricingScreen.tsx:329-336), falls back to the customer's
     * most-recent payment method (which the SetupIntent confirmation just
     * attached).
     */
    public function mobileConfirmSubscription(Request $request)
    {
        $request->validate([
            'plan_slug' => 'required|string|exists:plans,slug',
            'billing_cycle' => 'required|in:monthly,annual',
            'payment_method_id' => 'nullable|string',
        ]);

        $plan = DB::table('plans')->where('slug', $request->plan_slug)->first();
        if (!$plan || $plan->slug === 'free') {
            return response()->json(['message' => 'Invalid plan'], 422);
        }
        if ($plan->slug === 'artist') {
            return response()->json(['message' => 'Artist tier is closed to new signups.'], 410);
        }

        $user = $request->user();
        if ($user->subscribed('default')) {
            return response()->json(['message' => 'Already subscribed.'], 409);
        }

        // Use the tier locked at mobileCheckout; fall back to live detection
        // if somehow missing (shouldn't happen unless mobileCheckout was skipped).
        $tier = $user->pricing_tier ?: $this->regionService->detectTier($request, $user);
        $priceId = $this->resolveStripePriceId($plan, $tier, $request->billing_cycle);
        if (!$priceId) {
            return response()->json(['message' => 'Stripe price not configured for this plan.'], 422);
        }

        // Resolve payment method: prefer client-provided, fall back to most
        // recent card attached to this Customer (SetupIntent confirmation
        // would have attached one).
        $paymentMethodId = $request->payment_method_id ?: null;
        if (!$paymentMethodId) {
            $stripe = new \Stripe\StripeClient(config('cashier.secret'));
            $list = $stripe->paymentMethods->all([
                'customer' => $user->stripe_id,
                'type' => 'card',
                'limit' => 1,
            ]);
            if (empty($list->data)) {
                return response()->json(['message' => 'No payment method on file. Please complete payment setup.'], 422);
            }
            $paymentMethodId = $list->data[0]->id;
        }

        try {
            $user->updateDefaultPaymentMethod($paymentMethodId);

            $builder = $user->newSubscription('default', $priceId);

            // Trial parity with web /subscription/checkout: Plus gets 7-day
            // trial, artist_pro does not. Explicit override of the Stripe
            // Price's trial_period_days so web/mobile behave identically.
            if ($plan->slug !== 'artist_pro') {
                $builder->trialDays(7);
            }

            $subscription = $builder->add();
        } catch (\Stripe\Exception\CardException $e) {
            return response()->json(['message' => $e->getMessage()], 402);
        } catch (\Exception $e) {
            \Log::error('Mobile subscription creation failed', [
                'user_id' => $user->id,
                'plan_slug' => $plan->slug,
                'billing_cycle' => $request->billing_cycle,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Subscription creation failed. Please contact support.'], 500);
        }

        return response()->json([
            'success' => true,
            'subscription_id' => $subscription->stripe_id,
            'plan_slug' => $plan->slug,
        ]);
    }

    /**
     * List the user's saved payment methods (Billing tab on mobile).
     */
    public function paymentMethods(Request $request)
    {
        $user = $request->user();
        if (!$user->stripe_id) {
            return response()->json(['data' => []]);
        }

        $defaultId = optional($user->defaultPaymentMethod())->id;

        $methods = $user->paymentMethods()->map(function ($pm) use ($defaultId) {
            return [
                'id' => $pm->id,
                'brand' => $pm->card->brand,
                'last4' => $pm->card->last4,
                'exp_month' => $pm->card->exp_month,
                'exp_year' => $pm->card->exp_year,
                'is_default' => $pm->id === $defaultId,
            ];
        })->values();

        return response()->json(['data' => $methods]);
    }

    /**
     * Set a payment method as default (Billing tab on mobile).
     */
    public function setDefaultPaymentMethod(Request $request)
    {
        $request->validate(['payment_method_id' => 'required|string']);

        $user = $request->user();
        if (!$user->stripe_id) {
            return response()->json(['message' => 'No Stripe customer'], 422);
        }

        $user->updateDefaultPaymentMethod($request->payment_method_id);

        return response()->json(['success' => true]);
    }

    /**
     * Remove a saved payment method (Billing tab on mobile).
     * Security: findPaymentMethod scopes to the current user's Customer.
     */
    public function removePaymentMethod(Request $request, $paymentMethodId)
    {
        $user = $request->user();
        if (!$user->stripe_id) {
            return response()->json(['message' => 'No Stripe customer'], 404);
        }

        $pm = $user->findPaymentMethod($paymentMethodId);
        if (!$pm) {
            return response()->json(['message' => 'Payment method not found'], 404);
        }

        $pm->delete();

        return response()->json(['success' => true]);
    }

    /**
     * List the user's Stripe invoices (Billing tab on mobile).
     */
    public function invoices(Request $request)
    {
        $user = $request->user();
        if (!$user->stripe_id) {
            return response()->json(['data' => []]);
        }

        $invoices = $user->invoices()->map(function ($inv) {
            return [
                'id' => $inv->id,
                'amount_paid' => $inv->amount_paid,
                'currency' => $inv->currency,
                'status' => $inv->status,
                'created' => $inv->created,
                'invoice_pdf' => $inv->invoice_pdf,
                'period_start' => $inv->period_start,
                'period_end' => $inv->period_end,
            ];
        })->values();

        return response()->json(['data' => $invoices]);
    }

    /**
     * Resolve the correct Stripe Price ID for a plan, tier, and billing cycle.
     */
    private function resolveStripePriceId($plan, string $tier, string $billingCycle): ?string
    {
        // Try plan_prices table first (regional pricing)
        $interval = $billingCycle === 'annual' ? 'annual' : 'monthly';
        $regionalPrice = DB::table('plan_prices')
            ->where('plan_id', $plan->id)
            ->where('region', $tier)
            ->where('interval', $interval)
            ->value('stripe_price_id');

        if ($regionalPrice) {
            return $regionalPrice;
        }

        // Fall back to base price on plans table (T1)
        return $billingCycle === 'annual'
            ? $plan->stripe_price_id_annual
            : $plan->stripe_price_id_monthly;
    }
}
