<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Reconcile plan_prices to strategy-audit recommendations
     * (`docs/audits/2026-05-12-tier-strategy-audit.md` §3.1) pre-v1.0.0.
     *
     * Touches only Plus + Munshid (artist_pro) rows in bands t1/t2/t3.
     * Idempotent: re-running produces identical end state.
     *
     * Out of scope:
     *   - t4 rows (all plans)  — BACKEND TICKET #39 (Option A locked)
     *   - Artist (sunset) rows — closed to signups per TICKET #37,
     *                            existing subscribers grandfathered #38
     *
     * Stripe Price IDs in `up()` are real, live-mode IDs created
     * 2026-05-13 via the Stripe API (restricted key, single session).
     * Each carries metadata `reconciled_from` (old price ID),
     * `reconciled_on` (2026-05-13), and `audit_ref` linking back to
     * the audit doc. Munshid prices additionally carry
     * `stripe_product_pre_rename=artist_pro` to preserve the historical
     * Stripe product name "Nashidify Artist Pro" (renamed in the same
     * session to "Nashidify Munshid"). The 10 old `price_1TK*` IDs
     * remain active in Stripe pending a separate archival step.
     */
    public function up(): void
    {
        $targets = [
            // [plan_slug, region, interval, amount_cents, stripe_price_id]
            // Stripe Price IDs created live 2026-05-13 via restricted API key
            // (see docs/sprints/2026-05-sprint-c-backend-coordination.md §40).
            ['plus',       't2', 'monthly',  249, 'price_1TWaNxItw8IgGxgn9dalCksV'],
            ['plus',       't2', 'annual',  1999, 'price_1TWaNxItw8IgGxgnrFZcH4gB'],
            ['plus',       't3', 'monthly',   99, 'price_1TWaNyItw8IgGxgn9xmnPLeK'],
            ['plus',       't3', 'annual',   799, 'price_1TWaNzItw8IgGxgn7j8cMUGK'],
            ['artist_pro', 't1', 'monthly',  999, 'price_1TWaNzItw8IgGxgnFOTQhIJz'],
            ['artist_pro', 't1', 'annual',  7999, 'price_1TWaO0Itw8IgGxgnCUUDc1iT'],
            ['artist_pro', 't2', 'monthly',  499, 'price_1TWaO0Itw8IgGxgnaIYroxSo'],
            ['artist_pro', 't2', 'annual',  3999, 'price_1TWaO1Itw8IgGxgnXDdTDOQH'],
            ['artist_pro', 't3', 'monthly',  199, 'price_1TWaO2Itw8IgGxgniygPQi0g'],
            ['artist_pro', 't3', 'annual',  1599, 'price_1TWaO2Itw8IgGxgnKvrkNJnY'],
        ];

        $planIds = DB::table('plans')
            ->whereIn('slug', ['plus', 'artist_pro'])
            ->pluck('id', 'slug');

        $now = now();

        foreach ($targets as [$slug, $region, $interval, $amount, $stripeId]) {
            if (! isset($planIds[$slug])) {
                continue;
            }

            DB::table('plan_prices')
                ->updateOrInsert(
                    ['plan_id' => $planIds[$slug], 'region' => $region, 'interval' => $interval],
                    [
                        'amount_cents' => $amount,
                        'stripe_price_id' => $stripeId,
                        'currency' => 'usd',
                        'updated_at' => $now,
                        'created_at' => $now,
                    ],
                );
        }
    }

    /**
     * Reverse to pre-reconciliation amounts. The old Stripe Price IDs
     * (which match the pre-2026-05-13 production state) are restored.
     */
    public function down(): void
    {
        $rollback = [
            ['plus',       't2', 'monthly',   324, 'price_1TKx5cItw8IgGxgnvV4y5oTF'],
            ['plus',       't2', 'annual',   2599, 'price_1TKx5dItw8IgGxgnBLlsX098'],
            ['plus',       't3', 'monthly',   200, 'price_1TKx60Itw8IgGxgnIHhTouYG'],
            ['plus',       't3', 'annual',   1600, 'price_1TKx61Itw8IgGxgnEB0sHfws'],
            ['artist_pro', 't1', 'monthly',  2499, 'price_1TKwyyItw8IgGxgnebwLHR8Q'],
            ['artist_pro', 't1', 'annual',  20999, 'price_1TKwyzItw8IgGxgnyzHR1AKL'],
            ['artist_pro', 't2', 'monthly',  1624, 'price_1TKx5eItw8IgGxgnpCXTD7cl'],
            ['artist_pro', 't2', 'annual',  13649, 'price_1TKx5eItw8IgGxgnrHWXk21i'],
            ['artist_pro', 't3', 'monthly',  1000, 'price_1TKx62Itw8IgGxgnyS82vmJJ'],
            ['artist_pro', 't3', 'annual',   8400, 'price_1TKx62Itw8IgGxgnw2LT3hWR'],
        ];

        $planIds = DB::table('plans')
            ->whereIn('slug', ['plus', 'artist_pro'])
            ->pluck('id', 'slug');

        $now = now();

        foreach ($rollback as [$slug, $region, $interval, $amount, $stripeId]) {
            if (! isset($planIds[$slug])) {
                continue;
            }

            DB::table('plan_prices')
                ->where('plan_id', $planIds[$slug])
                ->where('region', $region)
                ->where('interval', $interval)
                ->update([
                    'amount_cents' => $amount,
                    'stripe_price_id' => $stripeId,
                    'updated_at' => $now,
                ]);
        }
    }
};
