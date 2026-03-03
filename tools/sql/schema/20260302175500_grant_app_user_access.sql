-- +goose Up
-- Grants the necessary privileges to the existing 'gc-app' role.
-- This migration assumes the 'gc-app' role has already been created.
-- The role is granted INSERT permissions on all current and future tables.

-- Allow the new user to connect to the current database.
-- +goose StatementBegin
DO
$do$
BEGIN
   EXECUTE format('GRANT CONNECT ON DATABASE %I TO "gc-app"', current_database());
END
$do$;
-- +goose StatementEnd

-- Grant usage on the public schema, which allows the user to "see" the tables.
GRANT USAGE ON SCHEMA public TO "gc-app";

-- Grant INSERT permission on all existing tables in the public schema.
GRANT INSERT ON ALL TABLES IN SCHEMA public TO "gc-app";

-- For any tables created in the future by other migrations, automatically grant INSERT.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT ON TABLES TO "gc-app";

-- +goose Down
-- Revoke all privileges from the 'gc-app' role. This does not drop the role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE INSERT ON TABLES FROM "gc-app";
REVOKE INSERT ON ALL TABLES IN SCHEMA public FROM "gc-app";
REVOKE USAGE ON SCHEMA public FROM "gc-app";
-- +goose StatementBegin
DO
$do$
BEGIN
   EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM "gc-app"', current_database());
END
$do$;
-- +goose StatementEnd
