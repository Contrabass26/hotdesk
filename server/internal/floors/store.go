package floors

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	GetByID(ctx context.Context, id int64) (Floor, error)
	List(ctx context.Context, filter ListFilter) ([]Floor, error)
	Delete(ctx context.Context, id int64) error
	Create(ctx context.Context, name string) (Floor, error)
}

type store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) Store {
	return &store{pool: pool}
}

func (s *store) GetByID(ctx context.Context, id int64) (Floor, error) {
	const query = `
		SELECT floor_id, name
		FROM floors
		WHERE floor_id = $1
	`

	var floor Floor
	err := scanFloor(s.pool.QueryRow(ctx, query, id), &floor)
	if err == nil {
		return floor, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return Floor{}, ErrNotFound
	}

	return floor, nil
}

func (s *store) List(ctx context.Context, filter ListFilter) ([]Floor, error) {
	const query = `
		SELECT floor_id, name
		FROM floors
		ORDER BY floor_id
		LIMIT $1
	`

	rows, err := s.pool.Query(ctx, query, filter.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Floor, 0)
	for rows.Next() {
		var floor Floor
		if err := scanFloor(rows, &floor); err != nil {
			return nil, err
		}
		items = append(items, floor)
	}

	return items, rows.Err()
}

func (s *store) Delete(ctx context.Context, id int64) error {
	// First delete all the desks on this floor
	const desksQuery = `
		DELETE FROM desks
		WHERE floor_id = $1
	`
	res, err := s.pool.Exec(ctx, desksQuery, id)
	if err != nil {
		return err
	}

	// Then delete the floor itself
	const floorQuery = `
		DELETE FROM floors 
		WHERE floor_id = $1
	`
	res, err = s.pool.Exec(ctx, floorQuery, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

func (s *store) Create(ctx context.Context, name string) (Floor, error) {
	const query = `
		INSERT INTO floors (name)
		VALUES ($1)
		RETURNING floor_id, name
	`

	var floor Floor
	err := scanFloor(s.pool.QueryRow(ctx, query, name), &floor)
	if err == nil {
		return floor, nil
	}

	return Floor{}, err
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanFloor(row rowScanner, floor *Floor) error {
	if err := row.Scan(&floor.ID, &floor.Name); err != nil {
		return err
	}
	return nil
}
