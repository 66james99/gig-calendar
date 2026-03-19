-- name: CreateEventType :one
INSERT INTO event_type (name)
VALUES ($1)
RETURNING id, name;

-- name: GetEventType :one
SELECT id, name
FROM event_type
WHERE id = $1;

-- name: ListEventTypes :many
SELECT id, name
FROM event_type
ORDER BY name;

-- name: UpdateEventType :one
UPDATE event_type
SET name = $2
WHERE id = $1
RETURNING id, name;

-- name: DeleteEventType :exec
DELETE FROM event_type
WHERE id = $1;