-- name: CreateFestival :one
INSERT INTO festival (
    name,
    promoter_id,
    start_date,
    end_date,
    description
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;

-- name: GetFestival :one
SELECT * FROM festival
WHERE id = $1 LIMIT 1;

-- name: ListFestivals :many
SELECT * FROM festival
ORDER BY start_date DESC;

-- name: UpdateFestival :one
UPDATE festival
SET
    name = $2,
    promoter_id = $3,
    start_date = $4,
    end_date = $5,
    description = $6
WHERE id = $1
RETURNING *;

-- name: DeleteFestival :exec
DELETE FROM festival
WHERE id = $1;

-- name: CreateFestivalAlias :one
INSERT INTO festival_alias (
    festival_id,
    alias
) VALUES (
    $1, $2
)
RETURNING *;

-- name: GetFestivalAlias :one
SELECT * FROM festival_alias
WHERE id = $1 LIMIT 1;

-- name: ListFestivalAliases :many
SELECT * FROM festival_alias
ORDER BY alias;

-- name: UpdateFestivalAlias :one
UPDATE festival_alias
SET
    festival_id = $2,
    alias = $3
WHERE id = $1
RETURNING *;

-- name: DeleteFestivalAlias :exec
DELETE FROM festival_alias
WHERE id = $1;