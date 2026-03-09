-- +goose Up
-- This migration enables the 'pgcrypto' extension, which provides
-- cryptographic functions, including gen_random_uuid() used for
-- generating unique identifiers for new records.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- +goose Down
-- Note: This will fail if gen_random_uuid() is used as a default in any existing table.
DROP EXTENSION IF EXISTS "pgcrypto";