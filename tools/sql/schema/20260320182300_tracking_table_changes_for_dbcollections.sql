-- +goose Up
-- Create metadata table for tracking last-modified timestamps
CREATE TABLE IF NOT EXISTS dbcollections_meta (
    table_name    text PRIMARY KEY,
    last_modified timestamptz NOT NULL DEFAULT now()
);

-- Seed initial tracked tables
INSERT INTO dbcollections_meta (table_name)
VALUES
    ('stage_role'),
    ('event_type')
ON CONFLICT (table_name) DO NOTHING;

-- Create generic trigger function
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION dbcollections_touch()
RETURNS trigger AS $$
BEGIN
    UPDATE dbcollections_meta
       SET last_modified = now()
     WHERE table_name = TG_TABLE_NAME;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd


-- Attach triggers to tracked tables

CREATE TRIGGER stage_role_modified
AFTER INSERT OR UPDATE OR DELETE ON stage_role
FOR EACH STATEMENT
EXECUTE FUNCTION dbcollections_touch();

CREATE TRIGGER event_types_modified
AFTER INSERT OR UPDATE OR DELETE ON event_type
FOR EACH STATEMENT
EXECUTE FUNCTION dbcollections_touch();

GRANT SELECT, UPDATE ON dbcollections_meta TO "gc-app";
GRANT EXECUTE ON FUNCTION dbcollections_touch() TO "gc-app";
GRANT USAGE ON SCHEMA public TO "gc-app";

-- +goose Down
-- Drop triggers
DROP TRIGGER IF EXISTS stage_role_modified ON stage_role;
DROP TRIGGER IF EXISTS event_types_modified ON event_type;
DROP TRIGGER IF EXISTS performer_aliases_modified ON performer_alias;
DROP TRIGGER IF EXISTS venue_aliases_modified ON venue_alias;

-- Drop trigger function
DROP FUNCTION IF EXISTS dbcollections_touch();

-- Drop metadata table
DROP TABLE IF EXISTS dbcollections_meta;