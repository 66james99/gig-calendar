-- name: CreateEventType :one
INSERT INTO event_type (name)
VALUES ($1)
RETURNING id, uuid, name;

-- name: GetEventType :one
SELECT id, uuid, name
FROM event_type
WHERE id = $1;

-- name: ListEventTypes :many
SELECT id, uuid, name
FROM event_type
ORDER BY name;

-- name: UpdateEventType :one
UPDATE event_type
SET name = $2
WHERE id = $1
RETURNING id, uuid, name;

-- name: DeleteEventType :exec
DELETE FROM event_type
WHERE id = $1;