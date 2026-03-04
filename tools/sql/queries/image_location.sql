-- name: CreateImageLocation :one
INSERT INTO image_location (
    root,
    pattern,
    date_from_exif,
    include_parent,
    ignore_dirs,
    active
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetImageLocation :one
SELECT * FROM image_location
WHERE id = $1 LIMIT 1;

-- name: ListImageLocations :many
SELECT * FROM image_location
ORDER BY root;

-- name: UpdateImageLocation :one
UPDATE image_location
SET
    root = $2,
    pattern = $3,
    date_from_exif = $4,
    include_parent = $5,
    ignore_dirs = $6,
    active = $7,
    updated = now()
WHERE id = $1
RETURNING *;

-- name: DeleteImageLocation :exec
DELETE FROM image_location
WHERE id = $1;
