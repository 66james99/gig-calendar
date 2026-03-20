package performers

import (
	"context"

	"github.com/66james99/gig-calendar/internal/database"
)

type StageRole struct {
	Pattern string `json:"pattern"`
}

func GetStageRoles(ctx context.Context, q *database.Queries) ([]StageRole, error) {
	dbRoles, err := q.ListStageRoles(ctx)
	if err != nil {
		return nil, err
	}

	var roles []StageRole
	for _, dbRole := range dbRoles {
		roles = append(roles, StageRole{Pattern: dbRole.Pattern})
	}

	return roles, nil
}
