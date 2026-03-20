-- name: ListStageRoles :many
SELECT id, uuid, created, updated, pattern FROM stage_role
ORDER BY pattern;

-- name: CreateStageRole :one
INSERT INTO stage_role (pattern)
VALUES ($1)
RETURNING id, uuid, created, updated, pattern;

-- name: GetStageRole :one
SELECT id, uuid, created, updated, pattern FROM stage_role
WHERE id = $1;

-- name: UpdateStageRole :one
UPDATE stage_role
SET pattern = $1, updated = NOW()
WHERE id = $2
RETURNING id, uuid, created, updated, pattern;

-- name: DeleteStageRole :exec
DELETE FROM stage_role
WHERE id = $1;