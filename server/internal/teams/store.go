package teams

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	Create(ctx context.Context, input CreateInput) (Team, error)
	CreateDepartment(ctx context.Context, input CreateDepartmentInput) (Department, error)
	Delete(ctx context.Context, id int64) error
	DeleteDepartment(ctx context.Context, id int64) error
	GetDepartmentByID(ctx context.Context, id int64) (Department, error)
	GetByID(ctx context.Context, id int64) (Team, error)
	ListDepartments(ctx context.Context, filter DepartmentListFilter) ([]Department, error)
	List(ctx context.Context, filter ListFilter) ([]Team, error)
	Update(ctx context.Context, id int64, input UpdateInput) (Team, error)
	UpdateDepartment(ctx context.Context, id int64, input UpdateDepartmentInput) (Department, error)
}

type store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) Store {
	return &store{pool: pool}
}

func (s *store) Create(ctx context.Context, input CreateInput) (Team, error) {
	const query = `
		INSERT INTO teams (name, department_id)
		VALUES ($1, $2)
		RETURNING team_id, name, department_id
	`

	var team Team
	err := scanTeam(s.pool.QueryRow(ctx, query, strings.TrimSpace(input.Name), input.DepartmentID), &team)
	if err == nil {
		return team, nil
	}
	return Team{}, mapPgError(err)
}

func (s *store) CreateDepartment(ctx context.Context, input CreateDepartmentInput) (Department, error) {
	const query = `
		INSERT INTO departments (name)
		VALUES ($1)
		RETURNING department_id, name
	`

	var department Department
	err := scanDepartment(s.pool.QueryRow(ctx, query, strings.TrimSpace(input.Name)), &department)
	if err == nil {
		return department, nil
	}
	return Department{}, mapPgError(err)
}

func (s *store) Delete(ctx context.Context, id int64) error {
	const query = `
		DELETE FROM teams
		WHERE team_id = $1
	`

	res, err := s.pool.Exec(ctx, query, id)
	if err != nil {
		return mapDeleteError(err)
	}
	if res.RowsAffected() == 0 {
		return ErrTeamNotFound
	}
	return nil
}

func (s *store) DeleteDepartment(ctx context.Context, id int64) error {
	const query = `
		DELETE FROM departments
		WHERE department_id = $1
	`

	res, err := s.pool.Exec(ctx, query, id)
	if err != nil {
		return mapDeleteError(err)
	}
	if res.RowsAffected() == 0 {
		return ErrDepartmentNotFound
	}
	return nil
}

func (s *store) GetDepartmentByID(ctx context.Context, id int64) (Department, error) {
	const query = `
		SELECT department_id, name
		FROM departments
		WHERE department_id = $1
	`

	var department Department
	err := scanDepartment(s.pool.QueryRow(ctx, query, id), &department)
	if err == nil {
		return department, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return Department{}, ErrDepartmentNotFound
	}
	return Department{}, err
}

func (s *store) GetByID(ctx context.Context, id int64) (Team, error) {
	const query = `
		SELECT team_id, name, department_id
		FROM teams
		WHERE team_id = $1
	`

	var team Team
	err := scanTeam(s.pool.QueryRow(ctx, query, id), &team)
	if err == nil {
		return team, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return Team{}, ErrTeamNotFound
	}
	return Team{}, err
}

func (s *store) ListDepartments(ctx context.Context, filter DepartmentListFilter) ([]Department, error) {
	const query = `
		SELECT department_id, name
		FROM departments
		ORDER BY name
		LIMIT $1
	`

	rows, err := s.pool.Query(ctx, query, filter.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Department, 0)
	for rows.Next() {
		var department Department
		if err := scanDepartment(rows, &department); err != nil {
			return nil, err
		}
		items = append(items, department)
	}

	return items, rows.Err()
}

func (s *store) List(ctx context.Context, filter ListFilter) ([]Team, error) {
	const query = `
		SELECT team_id, name, department_id
		FROM teams
		ORDER BY name
		LIMIT $1
	`

	rows, err := s.pool.Query(ctx, query, filter.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Team, 0)
	for rows.Next() {
		var team Team
		if err := scanTeam(rows, &team); err != nil {
			return nil, err
		}
		items = append(items, team)
	}

	return items, rows.Err()
}

func (s *store) Update(ctx context.Context, id int64, input UpdateInput) (Team, error) {
	const query = `
		UPDATE teams
		SET
			name = COALESCE($2::TEXT, name),
			department_id = COALESCE($3::INTEGER, department_id)
		WHERE team_id = $1
		RETURNING team_id, name, department_id
	`

	var name *string
	if input.Name != nil {
		trimmed := strings.TrimSpace(*input.Name)
		name = &trimmed
	}

	var team Team
	err := scanTeam(s.pool.QueryRow(ctx, query, id, name, input.DepartmentID), &team)
	if err == nil {
		return team, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return Team{}, ErrTeamNotFound
	}
	return Team{}, mapPgError(err)
}

func (s *store) UpdateDepartment(ctx context.Context, id int64, input UpdateDepartmentInput) (Department, error) {
	const query = `
		UPDATE departments
		SET name = $2
		WHERE department_id = $1
		RETURNING department_id, name
	`

	name := strings.TrimSpace(*input.Name)

	var department Department
	err := scanDepartment(s.pool.QueryRow(ctx, query, id, name), &department)
	if err == nil {
		return department, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return Department{}, ErrDepartmentNotFound
	}
	return Department{}, mapPgError(err)
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanDepartment(row rowScanner, department *Department) error {
	return row.Scan(&department.ID, &department.Name)
}

func scanTeam(row rowScanner, team *Team) error {
	return row.Scan(&team.ID, &team.Name, &team.DepartmentID)
}

func mapDeleteError(err error) error {
	if errors.Is(mapPgError(err), ErrForeignKeyViolation) {
		return ErrConflict
	}
	return err
}
