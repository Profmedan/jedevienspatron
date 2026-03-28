-- JEDEVIENSPATRON — Migration 004 : mise à jour pricing packs
-- Validé par Pierre Médan le 2026-03-21
-- Logique : individuel plus cher/session (petit volume), organisme moins cher/session (volume)

-- ─── PACKS INDIVIDUELS ───────────────────────────────────────────────
-- individuel-5  : 4,99 € (0,998 €/session) — prix d'appel
-- individuel-10 : 8,99 € (0,899 €/session) — -10% volume
-- individuel-20 : 14,99 € (0,750 €/session) — -25% volume

UPDATE packs SET prix_cents = 499,  duree_jours = 30  WHERE id = 'individuel-5';
UPDATE packs SET prix_cents = 899,  duree_jours = 60  WHERE id = 'individuel-10';
UPDATE packs SET prix_cents = 1499, duree_jours = 90  WHERE id = 'individuel-20';

-- ─── PACKS ORGANISMES ────────────────────────────────────────────────
-- org-80   : 120 € (1,50 €/session) — pack classe
-- org-150  : 195 € (1,30 €/session) — pack école
-- org-300  : 330 € (1,10 €/session) — pack formation
-- org-1000 : 900 € (0,90 €/session) — pack institution

UPDATE packs SET prix_cents = 12000, duree_jours = 365 WHERE id = 'org-80';
UPDATE packs SET prix_cents = 19500, duree_jours = 365 WHERE id = 'org-150';
UPDATE packs SET prix_cents = 33000, duree_jours = 365 WHERE id = 'org-300';
UPDATE packs SET prix_cents = 90000, duree_jours = 365 WHERE id = 'org-1000';
