package recommender

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	ListTeams(ctx context.Context) ([]Team, error)
}

type store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) Store {
	return &store{pool: pool}
}

func (s *store) ListTeams(ctx context.Context) ([]Team, error) {
	const query = `
		SELECT team_id, name, department_id
		FROM teams
		ORDER BY team_id
	`

	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Team, 0)
	for rows.Next() {
		var team Team
		if err := rows.Scan(&team.ID, &team.Name, &team.DepartmentID); err != nil {
			return nil, err
		}
		items = append(items, team)
	}

	return items, rows.Err()
}
