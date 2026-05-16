-- munshid/collapse.sql — Artist→Munshid tier collapse (DATA migration)
-- ============================================================================
-- DO NOT RUN BLINDLY. This is gated. Follow munshid/RUNBOOK.md:
--   1. Take a DB backup.
--   2. Run the PRECONDITION query below and READ the result.
--   3. Only proceed if the artist_pro paying-subscriber count is what you
--      expect (≈ test/fake only — munshids not invited yet).
--   4. Apply the backend code-cutover set + restart sc_app in the SAME
--      window (see RUNBOOK "Backend code cutover").
--
-- KEY DESIGN: this RENAMES the existing artist_pro plan row in place. Its
-- id is unchanged, so plan_prices (regional Stripe price IDs) and every
-- Cashier subscription (keyed by Stripe price, not our slug) keep working
-- untouched. No Stripe product/price recreation is required for function.
-- Idempotent: safe to re-run.
-- ============================================================================

-- ── PRECONDITION (run alone first; do not proceed if surprising) ────────────
-- SELECT plan_slug, COUNT(*) AS users,
--        SUM(stripe_subscription_id IS NOT NULL AND stripe_subscription_id<>'') AS stripe_subs
--   FROM users GROUP BY plan_slug;
-- SELECT slug,name FROM plans ORDER BY id;

START TRANSACTION;

-- 1) Rename the paid creator tier in place: artist_pro → munshid.
UPDATE plans
   SET slug = 'munshid',
       name = 'Munshid'
 WHERE slug = 'artist_pro';

-- 2) Move users on the paid tier to the renamed slug.
UPDATE users
   SET plan_slug = 'munshid'
 WHERE plan_slug = 'artist_pro';

-- 3) Legacy free `artist` tier is removed. "Munshid is the paid upgrade" +
--    a free basic creator ability stays → fold legacy artist users to free.
UPDATE users
   SET plan_slug = 'free'
 WHERE plan_slug = 'artist';

-- 4) Drop the legacy `artist` plan + its regional prices (no users left on it
--    after step 3; its Stripe prices were the old free-creator tier).
DELETE FROM plan_prices
 WHERE plan_id IN (SELECT id FROM plans WHERE slug = 'artist');
DELETE FROM plans
 WHERE slug = 'artist';

-- Review the result inside the transaction before committing:
--   SELECT slug,name FROM plans ORDER BY id;
--   SELECT plan_slug, COUNT(*) FROM users GROUP BY plan_slug;
COMMIT;

-- ── ROLLBACK (if not yet committed: ROLLBACK;  — after commit, restore the
--    pre-migration backup. The slug rename is reversible by re-inserting the
--    `artist` plan row + reverting plan_slug values from the backup.) ────────
