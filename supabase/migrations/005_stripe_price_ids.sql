-- JEDEVIENSPATRON — Migration 005 : stripe_price_id pour chaque pack
-- Créé le 2026-03-22 — IDs collectés depuis le dashboard Stripe de Pierre Médan
-- Ordre : du moins cher au plus cher (correspondance confirmée par Pierre)

-- ─── PACKS INDIVIDUELS ───────────────────────────────────────────────
UPDATE packs SET stripe_price_id = 'price_1TDnDyH4Fo7tnyRinRFczDVK' WHERE id = 'individuel-5';   -- 4,99 €
UPDATE packs SET stripe_price_id = 'price_1TDnEeH4Fo7tnyRiGw4p1yOM' WHERE id = 'individuel-10';  -- 8,99 €
UPDATE packs SET stripe_price_id = 'price_1TDnFHH4Fo7tnyRibatDoZmw' WHERE id = 'individuel-20';  -- 14,99 €

-- ─── PACKS ORGANISMES ────────────────────────────────────────────────
UPDATE packs SET stripe_price_id = 'price_1TDnFvH4Fo7tnyRildBX1uG2' WHERE id = 'org-80';    -- 120,00 €
UPDATE packs SET stripe_price_id = 'price_1TDnGZH4Fo7tnyRiA8f3atBE' WHERE id = 'org-150';   -- 195,00 €
UPDATE packs SET stripe_price_id = 'price_1TDnH7H4Fo7tnyRi6XiWyvGm' WHERE id = 'org-300';   -- 330,00 €
UPDATE packs SET stripe_price_id = 'price_1TDnHgH4Fo7tnyRi58mBwb58' WHERE id = 'org-1000';  -- 900,00 €

-- Vérification post-migration :
-- SELECT id, stripe_price_id, prix_cents FROM packs ORDER BY prix_cents;
