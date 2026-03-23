-- name: GetPatternConsts :many
SELECT pattern FROM stage_role
ORDER BY pattern;

-- name: LastModifiedPatternConsts :one
SELECT last_modified FROM dbcollections_meta 
WHERE table_name = 'stage_role'
LIMIT 1;