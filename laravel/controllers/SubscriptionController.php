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
