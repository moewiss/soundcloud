<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanPricesSeeder extends Seeder
{
    public function run(): void
    {
        $plans = DB::table('plans')->whereIn('slug', ['plus', 'artist', 'artist_pro'])->get()->keyBy('slug');

        // Prices reconciled to strategy audit recommendations
        // (`docs/audits/2026-05-12-tier-strategy-audit.md` §3.1) on 2026-05-13
        // pre-v1.0.0 launch. Plus t1 / t1 annual already matched the audit;
        // all other Plus + Munshid (artist_pro) t1/t2/t3 rows reduced to
        // audit values. Artist (sunset tier) rows unchanged — those plans
        // are closed to new signups (Phase C.5) and existing subscribers
        // are grandfathered per BACKEND TICKET #38. t4 rows untouched —
        // BACKEND TICKET #39 (Option A locked) remaps t4 → t3 mobile-facing
        // and may revise these separately.
        //
        // Stripe Price IDs for the 10 reconciled rows were created live
        // 2026-05-13 via the Stripe API (restricted key, single session).
        // Each new price carries metadata: reconciled_from (old price ID),
        // reconciled_on (2026-05-13), audit_ref (audit doc path). Munshid
        // prices also carry stripe_product_pre_rename=artist_pro since the
        // Stripe product was renamed in the same session from "Nashidify
        // Artist Pro" → "Nashidify Munshid". The 10 superseded `price_1TK*`
        // IDs remain ACTIVE in Stripe; archival is a separate explicit step
        // after a smoke-test verification window.
        $prices = [
            // Plus
            ['plan' => 'plus', 'region' => 't1', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TKwpuItw8IgGxgnKMdycgoh',     'amount_cents' => 499],
            ['plan' => 'plus', 'region' => 't1', 'interval' => 'annual',  'stripe_price_id' => 'price_1TKwyxItw8IgGxgnPTwFvKUD',     'amount_cents' => 3999],
            ['plan' => 'plus', 'region' => 't2', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TWaNxItw8IgGxgn9dalCksV',     'amount_cents' => 249],
            ['plan' => 'plus', 'region' => 't2', 'interval' => 'annual',  'stripe_price_id' => 'price_1TWaNxItw8IgGxgnrFZcH4gB',     'amount_cents' => 1999],
            ['plan' => 'plus', 'region' => 't3', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TWaNyItw8IgGxgn9xmnPLeK',     'amount_cents' => 99],
            ['plan' => 'plus', 'region' => 't3', 'interval' => 'annual',  'stripe_price_id' => 'price_1TWaNzItw8IgGxgn7j8cMUGK',     'amount_cents' => 799],
            ['plan' => 'plus', 'region' => 't4', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TKx6MItw8IgGxgnPpeHo1A1',     'amount_cents' => 110],
            ['plan' => 'plus', 'region' => 't4', 'interval' => 'annual',  'stripe_price_id' => 'price_1TKx6NItw8IgGxgnNtMorWGq',     'amount_cents' => 880],

            // Artist (sunset tier — unchanged; existing subscribers grandfathered per TICKET #38, signups blocked per TICKET #37)
            ['plan' => 'artist', 'region' => 't1', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TKwyxItw8IgGxgnxer8cd3c',   'amount_cents' => 1499],
            ['plan' => 'artist', 'region' => 't1', 'interval' => 'annual',  'stripe_price_id' => 'price_1TKwyyItw8IgGxgnerG9OvFA',   'amount_cents' => 12499],
            ['plan' => 'artist', 'region' => 't2', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TKx5dItw8IgGxgnCXANnCY6',   'amount_cents' => 974],
            ['plan' => 'artist', 'region' => 't2', 'interval' => 'annual',  'stripe_price_id' => 'price_1TKx5dItw8IgGxgndP8nAo9t',   'amount_cents' => 8124],
            ['plan' => 'artist', 'region' => 't3', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TKx61Itw8IgGxgndkP8xFNL',   'amount_cents' => 600],
            ['plan' => 'artist', 'region' => 't3', 'interval' => 'annual',  'stripe_price_id' => 'price_1TKx61Itw8IgGxgnmFXxxqTZ',   'amount_cents' => 5000],
            ['plan' => 'artist', 'region' => 't4', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TKx6NItw8IgGxgnFx0MpxG7',   'amount_cents' => 330],
            ['plan' => 'artist', 'region' => 't4', 'interval' => 'annual',  'stripe_price_id' => 'price_1TKx6NItw8IgGxgnsBZbKhz5',   'amount_cents' => 2750],

            // Artist Pro (display: Munshid)
            ['plan' => 'artist_pro', 'region' => 't1', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TWaNzItw8IgGxgnFOTQhIJz',     'amount_cents' => 999],
            ['plan' => 'artist_pro', 'region' => 't1', 'interval' => 'annual',  'stripe_price_id' => 'price_1TWaO0Itw8IgGxgnCUUDc1iT',     'amount_cents' => 7999],
            ['plan' => 'artist_pro', 'region' => 't2', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TWaO0Itw8IgGxgnaIYroxSo',     'amount_cents' => 499],
            ['plan' => 'artist_pro', 'region' => 't2', 'interval' => 'annual',  'stripe_price_id' => 'price_1TWaO1Itw8IgGxgnXDdTDOQH',     'amount_cents' => 3999],
            ['plan' => 'artist_pro', 'region' => 't3', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TWaO2Itw8IgGxgniygPQi0g',     'amount_cents' => 199],
            ['plan' => 'artist_pro', 'region' => 't3', 'interval' => 'annual',  'stripe_price_id' => 'price_1TWaO2Itw8IgGxgnKvrkNJnY',     'amount_cents' => 1599],
            ['plan' => 'artist_pro', 'region' => 't4', 'interval' => 'monthly', 'stripe_price_id' => 'price_1TKx6OItw8IgGxgndigQIhk6',     'amount_cents' => 550],
            ['plan' => 'artist_pro', 'region' => 't4', 'interval' => 'annual',  'stripe_price_id' => 'price_1TKx6OItw8IgGxgnWd4zRKkb',     'amount_cents' => 4620],
        ];

        foreach ($prices as $price) {
            $planId = $plans[$price['plan']]->id;
            DB::table('plan_prices')->updateOrInsert(
                ['plan_id' => $planId, 'region' => $price['region'], 'interval' => $price['interval']],
                [
                    'stripe_price_id' => $price['stripe_price_id'],
                    'amount_cents' => $price['amount_cents'],
                    'currency' => 'usd',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
