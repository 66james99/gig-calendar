-- +goose Up
-- Add foreign key constraint to event table referencing event_type.
ALTER TABLE event ADD CONSTRAINT event_event_type_fkey FOREIGN KEY (event_type) REFERENCES event_type(id) ON DELETE RESTRICT;

-- +goose Down
-- Remove foreign key constraint from event table.
ALTER TABLE event DROP CONSTRAINT event_event_type_id_fkey;