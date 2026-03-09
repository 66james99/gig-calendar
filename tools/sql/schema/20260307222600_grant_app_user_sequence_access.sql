-- +goose Up
-- Grant usage on all existing and future sequences to the app user.
-- This is necessary for tables with SERIAL primary keys, as inserting
-- requires getting the next value from the associated sequence.

-- Grant usage and select on all existing sequences in the public schema.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "gc-app";

-- For any sequences created in the future, automatically grant usage and select.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "gc-app";

-- +goose Down
-- Revoke sequence privileges from the 'gc-app' role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE USAGE, SELECT ON SEQUENCES FROM "gc-app";
REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public FROM "gc-app";