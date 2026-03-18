-- +goose Up
-- Drop the old Primary Key constraint and cascade to remove dependent foreign keys.
-- This ensures we remove dependencies (festival_venue, festival_promoter, festival_alias)
-- regardless of their specific constraint names.
ALTER TABLE festival DROP CONSTRAINT festival_pkey CASCADE;

-- Modify festival table structure.
-- Remove the website column.
ALTER TABLE festival DROP COLUMN website;
-- Add the new serial ID column and set it as Primary Key.
ALTER TABLE festival ADD COLUMN id SERIAL PRIMARY KEY;
-- Add the UUID column with a default value.
ALTER TABLE festival ADD COLUMN uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;

-- Update referencing tables to point to the new festival.id instead of promoter_id.
-- Since festival.promoter_id was the old PK, the foreign keys currently hold that value.

-- Update festival_venue
UPDATE festival_venue fv
SET festival_id = f.id
FROM festival f
WHERE fv.festival_id = f.promoter_id;

ALTER TABLE festival_venue
    ADD CONSTRAINT festival_venue_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE;

-- Update festival_promoter
UPDATE festival_promoter fp
SET festival_id = f.id
FROM festival f
WHERE fp.festival_id = f.promoter_id;

ALTER TABLE festival_promoter
    ADD CONSTRAINT festival_promoter_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE;

-- Update festival_alias
UPDATE festival_alias fa
SET festival_id = f.id
FROM festival f
WHERE fa.festival_id = f.promoter_id;

ALTER TABLE festival_alias
    ADD CONSTRAINT festival_alias_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE;

-- +goose Down
-- Drop the new Foreign Key constraints.
ALTER TABLE festival_venue DROP CONSTRAINT IF EXISTS festival_venue_festival_id_fkey;
ALTER TABLE festival_promoter DROP CONSTRAINT IF EXISTS festival_promoter_festival_id_fkey;
ALTER TABLE festival_alias DROP CONSTRAINT IF EXISTS festival_alias_festival_id_fkey;

-- Restore the old foreign key values (promoter_id).
UPDATE festival_venue fv
SET festival_id = f.promoter_id
FROM festival f
WHERE fv.festival_id = f.id;

UPDATE festival_promoter fp
SET festival_id = f.promoter_id
FROM festival f
WHERE fp.festival_id = f.id;

UPDATE festival_alias fa
SET festival_id = f.promoter_id
FROM festival f
WHERE fa.festival_id = f.id;

-- Revert festival table structure.
ALTER TABLE festival DROP CONSTRAINT festival_pkey;
ALTER TABLE festival DROP COLUMN uuid;
ALTER TABLE festival DROP COLUMN id;
ALTER TABLE festival ADD COLUMN website text;
ALTER TABLE festival ADD PRIMARY KEY (promoter_id);

-- Restore Foreign Keys referencing promoter_id.
ALTER TABLE festival_venue
    ADD CONSTRAINT festival_venue_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(promoter_id) ON DELETE CASCADE;
ALTER TABLE festival_promoter
    ADD CONSTRAINT festival_promoter_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(promoter_id) ON DELETE CASCADE;
ALTER TABLE festival_alias
    ADD CONSTRAINT festival_alias_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(promoter_id) ON DELETE CASCADE;