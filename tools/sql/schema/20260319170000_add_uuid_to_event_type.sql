-- +goose Up
-- Recreate event_type table to position uuid column after id.
-- Note: We use CASCADE to drop dependent constraints (like foreign keys).
DROP TABLE IF EXISTS event_type CASCADE;

CREATE TABLE event_type (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name TEXT NOT NULL,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
-- Revert to original schema (remove uuid column).
DROP TABLE IF EXISTS event_type CASCADE;

CREATE TABLE event_type (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
