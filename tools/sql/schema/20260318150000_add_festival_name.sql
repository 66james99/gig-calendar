-- +goose Up
-- Rename the existing table to back it up.
ALTER TABLE festival RENAME TO festival_old;

-- Create the new table with the desired column order and the new 'name' column.
CREATE TABLE festival (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    promoter_id INTEGER NOT NULL REFERENCES promoter(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT
);

-- Copy data from the old table to the new one.
-- We populate 'name' with the description if available, or a fallback string.
INSERT INTO festival (id, uuid, promoter_id, start_date, end_date, description, name)
SELECT 
    id, 
    uuid, 
    promoter_id, 
    start_date, 
    end_date, 
    description, 
    COALESCE(description, 'Festival ' || id)
FROM festival_old;

-- Reset the sequence for the new table.
SELECT setval('festival_id_seq', COALESCE((SELECT MAX(id) FROM festival), 1), false);

-- Drop the old table. CASCADE is required to drop the foreign keys from dependent tables.
DROP TABLE festival_old CASCADE;

-- Re-establish the Foreign Keys on dependent tables.
ALTER TABLE festival_venue
    ADD CONSTRAINT festival_venue_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE;

ALTER TABLE festival_promoter
    ADD CONSTRAINT festival_promoter_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE;

ALTER TABLE festival_alias
    ADD CONSTRAINT festival_alias_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE;

-- Grant permissions.
GRANT SELECT, INSERT, UPDATE, DELETE ON festival TO "gc-app";

-- +goose Down
-- Revert the changes: Remove 'name' and restore original column order.
ALTER TABLE festival RENAME TO festival_new;

CREATE TABLE festival (
    promoter_id INTEGER NOT NULL REFERENCES promoter(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE
);

INSERT INTO festival (id, uuid, promoter_id, start_date, end_date, description)
SELECT id, uuid, promoter_id, start_date, end_date, description
FROM festival_new;

SELECT setval('festival_id_seq', COALESCE((SELECT MAX(id) FROM festival), 1), false);

DROP TABLE festival_new CASCADE;

ALTER TABLE festival_venue
    ADD CONSTRAINT festival_venue_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE;
ALTER TABLE festival_promoter
    ADD CONSTRAINT festival_promoter_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE;
ALTER TABLE festival_alias
    ADD CONSTRAINT festival_alias_festival_id_fkey
    FOREIGN KEY (festival_id) REFERENCES festival(id) ON DELETE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE ON festival TO "gc-app";