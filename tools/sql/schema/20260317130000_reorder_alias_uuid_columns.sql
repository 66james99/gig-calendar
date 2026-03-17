-- +goose Up
-- This migration reorders the columns in the alias tables to place the 'uuid'
-- column immediately after the 'id' column for consistency and readability.
-- Since PostgreSQL does not support direct column reordering, this is achieved by
-- renaming the existing table, creating a new table with the desired column order,
-- copying the data, and then dropping the old table.

-- +goose StatementBegin

-- Reorder columns for promoter_alias
ALTER TABLE public.promoter_alias RENAME TO promoter_alias_old;
CREATE TABLE public.promoter_alias (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    promoter INTEGER NOT NULL REFERENCES promoter(id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.promoter_alias (id, uuid, promoter, alias, created, updated)
SELECT id, uuid, promoter, alias, created, updated FROM public.promoter_alias_old;
SELECT setval('public.promoter_alias_id_seq', COALESCE((SELECT MAX(id) FROM public.promoter_alias), 1), false);
DROP TABLE public.promoter_alias_old;

-- Reorder columns for performer_alias
ALTER TABLE public.performer_alias RENAME TO performer_alias_old;
CREATE TABLE public.performer_alias (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    performer INTEGER NOT NULL REFERENCES performer(id) ON DELETE NO ACTION,
    alias TEXT NOT NULL UNIQUE,
    created TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);
INSERT INTO public.performer_alias (id, uuid, performer, alias, created, updated)
SELECT id, uuid, performer, alias, created, updated FROM public.performer_alias_old;
SELECT setval('public.performer_alias_id_seq', COALESCE((SELECT MAX(id) FROM public.performer_alias), 1), false);
DROP TABLE public.performer_alias_old;

-- Reorder columns for venue_alias
ALTER TABLE public.venue_alias RENAME TO venue_alias_old;
CREATE TABLE public.venue_alias (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    venue INTEGER NOT NULL REFERENCES venue(id) ON DELETE NO ACTION,
    alias TEXT NOT NULL UNIQUE,
    created TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
    updated TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);
INSERT INTO public.venue_alias (id, uuid, venue, alias, created, updated)
SELECT id, uuid, venue, alias, created, updated FROM public.venue_alias_old;
SELECT setval('public.venue_alias_id_seq', COALESCE((SELECT MAX(id) FROM public.venue_alias), 1), false);
DROP TABLE public.venue_alias_old;

-- Reorder columns for festival_alias
ALTER TABLE public.festival_alias RENAME TO festival_alias_old;
CREATE TABLE public.festival_alias (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    festival_id INTEGER NOT NULL REFERENCES festival(promoter_id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.festival_alias (id, uuid, festival_id, alias, created, updated)
SELECT id, uuid, festival_id, alias, created, updated FROM public.festival_alias_old;
SELECT setval('public.festival_alias_id_seq', COALESCE((SELECT MAX(id) FROM public.festival_alias), 1), false);
DROP TABLE public.festival_alias_old;

-- Re-grant permissions on the newly created tables
GRANT SELECT, INSERT, UPDATE, DELETE ON promoter_alias, performer_alias, venue_alias, festival_alias TO "gc-app";

-- +goose StatementEnd

-- +goose Down
-- This section is intentionally left blank.
-- Reverting this migration involves another complex table recreation for each table
-- to move the UUID column back to its original position.
-- Given that this is a non-functional, cosmetic change, a manual rollback
-- is recommended if ever necessary, rather than maintaining a complex down migration.