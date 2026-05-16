# Munshid Tier-Collapse — Cutover Runbook (GATED)

**What this is:** the exact, ordered steps to flip `artist_pro` → `munshid`
and remove the legacy free `artist` tier across the **live** backend.
Everything here is gated on your go — nothing has been deployed.

## The key insight (why this is low-risk)
The collapse **renames the existing `artist_pro` plan row in place**
(`munshid/collapse.sql`). Its `plans.id` is unchanged, so:
- `plan_prices` (regional **Stripe price IDs**) stay attached — untouched.
- Every Cashier subscription is keyed by **Stripe price**, not our slug —
  existing paying subscribers keep working with **zero** Stripe action.
- App Store / Play IAP **product IDs are unchanged** — only display text
  is cosmetic.

So there is **no risky billing migration** — provided the precondition
holds (no real paying creators yet; munshids not invited). Verify it.

---

## STEP 0 — Precondition (you run; STOP if surprising)
DB creds aren't available to the assistant. Run (read-only):
```sql
SELECT plan_slug, COUNT(*) AS users,
       SUM(stripe_subscription_id IS NOT NULL AND stripe_subscription_id<>'') AS stripe_subs
  FROM users GROUP BY plan_slug;
SELECT slug,name FROM plans ORDER BY id;
```
Expected: `artist_pro` stripe_subs ≈ 0 (only your test account, if any),
`artist` users are the fake seed buckets. **If there are real paying
`artist_pro` subscribers you didn't expect, stop and tell me** — the
rename is still safe for them (price-keyed), but we should confirm comms.

## STEP 1 — Backup
Full DB dump (your standard backup of `sc_db`) before touching data.

## STEP 2 — Backend code cutover (assistant applies on your go; atomic)
Swap the hardcoded slug checks to the inert helper already in place
(`app/app/Support/Tier.php`). Apply ALL together, then deploy in the same
window. Exact set (from audit):

| File | Change |
|---|---|
| `Services/PlanFeatureService.php:181` | `in_array($this->planSlug(),['artist','artist_pro'])` → `\App\Support\Tier::isCreator($this->planSlug())` |
| `Http/Controllers/Api/StripeWebhookController.php:87` | `in_array($plan->slug,['artist','artist_pro'])` → `\App\Support\Tier::isCreator($plan->slug)` |
| `Http/Controllers/Api/AdminExtendedController.php:392` | `in_array($request->plan_slug,['artist','artist_pro'])` → `Tier::isCreator($request->plan_slug)` |
| `Http/Controllers/Api/AuthController.php:170` | `$user->plan_slug === 'artist_pro'` → `\App\Support\Tier::isMunshid($user->plan_slug)` |
| `Http/Controllers/Api/SocialAuthController.php:134` | same as Auth:170 |
| `Http/Controllers/Api/WalletController.php:28,172` | `in_array($user->plan_slug,['artist','artist_pro'])` → `Tier::isCreator($user->plan_slug)` |
| `Http/Controllers/Api/ArtistPortalController.php:40,222,279` | `$planService->planSlug() === 'artist_pro'` → `Tier::isMunshid($planService->planSlug())` |
| `Http/Controllers/Api/TrackPromotionController.php:64,119` | `in_array($planService->planSlug(),['artist','artist_pro'])` → `Tier::isCreator(...)` |
| `Http/Controllers/Api/TrackPromotionController.php:67,182` | `$user->plan_slug === 'artist_pro'` → `Tier::isMunshid($user->plan_slug)` |
| `Http/Controllers/Api/SubscriptionController.php:116` | `->trialDays($plan->slug !== 'artist_pro' ? 7 : 0)` → `->trialDays(\App\Support\Tier::isMunshid($plan->slug) ? 0 : 7)` |
| `Http/Controllers/Api/SubscriptionController.php:366` | `$plan->slug !== 'artist_pro'` → `!\App\Support\Tier::isMunshid($plan->slug)` |
| `Http/Controllers/Api/SubscriptionController.php:236,324` | **Review individually** — these are legacy-`artist`-only branches that become dead after collapse; remove or repoint to munshid logic. |

`use App\Support\Tier;` added per file. All `php -l` validated. This set
is **behaviour-identical until STEP 3 runs** (nothing is `munshid` yet).

## STEP 3 — Data migration
`mysql sc_db < munshid/collapse.sql` (idempotent; transaction-wrapped;
review inside the txn before COMMIT — see the file).

## STEP 4 — Deploy
`docker restart sc_app` (clears OPcache so STEP 2 code goes live with
STEP 3 data atomically). Then smoke test (STEP 6).

## STEP 5 — Stripe & Store (VERIFIED 2026-05-16 — mostly already done)
Audited live. Findings:
- **Stripe: ALREADY DONE — no action required.** The live Munshid
  checkout (all regional tiers t1–t4 via `plan_prices`) points to product
  `prod_UJZnJN9PYmP0e1` = **"Nashidify Munshid"**; active prices are
  nicknamed "Munshid t1/t2/t3 …"; backend `plans.name` = "Munshid".
  Invoices/dashboard already read "Nashidify Munshid". 0 active/trialing
  Stripe subscriptions, 0 in local `subscriptions`, 1 (non-paying)
  munshid user. The earlier "rename Artist Pro product" was completed in
  the v1.0.0 pricing reconciliation.
  - *Optional, zero-risk:* add nicknames to the 2 t4 Munshid prices
    (`price_1TKx6OItw8IgGxgnWd4zRKkb` annual, `…ndigQIhk6` monthly) which
    show "(none)" — dashboard-only cosmetic.
  - *Do NOT archive* the stale old "Nashidify Artist"/"Artist Pro"/
    duplicate "Plus" products. Cosmetic clutter only; archiving has
    non-zero price/product-dependency risk for zero user benefit. RUNBOOK
    rule stands: no archiving.
- **App Store / Play IAP: N/A — nothing to rename.** The app subscribes
  via **Stripe** (`@stripe/stripe-react-native` Payment Sheet); there is
  **no IAP library** (no `react-native-iap`/StoreKit/Play Billing) and
  therefore **no App Store/Play subscription product** exists to rename.
- **The only real store-side item (yours):** the App Store Connect / Play
  Console **store listing copy** (app description, promo text,
  screenshots, "What's New") — if any of it says "Artist", update it to
  "Munshid". Not visible from the repo; check both consoles' listing
  text. No app binary/build change needed.
- **Heads-up (separate, pre-existing):** Apple guideline 3.1.1 generally
  requires IAP for digital subscriptions; Stripe-based subscriptions in
  the iOS app are a known review/removal risk. Not caused by the Munshid
  rename and out of scope here, but relevant before scaling paid signups.

## STEP 6 — Smoke test (post-deploy)
- A `munshid` user: portal loads, isPro true, promotions/wallet/2FA gates pass.
- A `free` user (incl. ex-`artist`): basic creator ability intact, no portal-pro.
- New checkout → Stripe → webhook sets `plan_slug='munshid'`.
- `GET /api/subscription/status` → `plan: munshid`, `can_promote` correct.

## ROLLBACK
- Pre-COMMIT: `ROLLBACK;`.
- Post-deploy: restore STEP 1 backup; revert STEP 2 (git/diff of `app/`
  is not tracked — assistant keeps the reverse patch); `docker restart sc_app`.

---
*Generated by the Munshid program. `Tier.php` is live but inert until
STEP 2+3. Web identity (Pricing/portal) already shipped on branch
`feat/munshid-web`.*
