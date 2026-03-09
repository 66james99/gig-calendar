-- +goose Up
-- Grants full CRUD (SELECT, INSERT, UPDATE, DELETE) privileges to the 'gc-app' role.
-- This migration expands on the initial INSERT-only grant to support all webserver operations.

-- Grant SELECT, UPDATE, and DELETE on all existing tables in the public schema.
-- INSERT was granted in a previous migration, and GRANTs are cumulative.
GRANT SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "gc-app";

-- Alter default privileges for future tables to grant full CRUD.
-- This replaces the previous INSERT-only default privilege setting.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "gc-app";

-- +goose Down
-- Revert the privileges back to the state before this migration (INSERT-only).

-- Revert default privileges for future tables back to just INSERT.
-- We do this by revoking the privileges we added in the 'Up' migration,
-- which leaves the original 'INSERT' privilege.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT, UPDATE, DELETE ON TABLES FROM "gc-app";

-- Revoke SELECT, UPDATE, DELETE from all existing tables, leaving the original INSERT.
REVOKE SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM "gc-app";