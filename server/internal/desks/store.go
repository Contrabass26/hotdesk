package desks

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	GetByID(ctx context.Context, id int64) (Desk, error)
	List(ctx context.Context, filter ListFilter) ([]Desk, error)
	ListAvailability(ctx context.Context, filter AvailabilityFilter) ([]DeskAvailability, error)
}

type store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) Store {
	return &store{pool: pool}
}

func (s *store) GetByID(ctx context.Context, id int64) (Desk, error) {
	const query = `
		SELECT desk_id, floor_id, label, x_coord, y_coord, is_enabled
		FROM desks
		WHERE desk_id = $1
	`

	var desk Desk
	err := scanDesk(s.pool.QueryRow(ctx, query, id), &desk)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Desk{}, ErrNotFound
		}
		return Desk{}, err
	}

	return desk, nil
}

func (s *store) List(ctx context.Context, filter ListFilter) ([]Desk, error) {
	const query = `
		SELECT desk_id, floor_id, label, x_coord, y_coord, is_enabled
		FROM desks
		WHERE ($1::BIGINT IS NULL OR floor_id = $1)
		  AND ($2::BOOLEAN IS NULL OR is_enabled = $2)
		ORDER BY floor_id, label
		LIMIT $3
	`

	rows, err := s.pool.Query(ctx, query, filter.FloorID, filter.IsEnabled, filter.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Desk, 0)
	for rows.Next() {
		var desk Desk
		if err := scanDesk(rows, &desk); err != nil {
			return nil, err
		}
		items = append(items, desk)
	}

	return items, rows.Err()
}

func (s *store) ListAvailability(ctx context.Context, filter AvailabilityFilter) ([]DeskAvailability, error) {
	const query = `
		SELECT
			d.desk_id,
			d.floor_id,
			d.label,
			d.is_enabled,
			(
				d.is_enabled
				AND NOT EXISTS (
					SELECT 1
					FROM bookings b
					WHERE b.desk_id = d.desk_id
					  AND b.status = 'confirmed'
					  AND tsrange(b.start_time, b.end_time) && tsrange($1, $2)
				)
			) AS is_available
		FROM desks d
		WHERE ($3::BIGINT IS NULL OR d.floor_id = $3)
		ORDER BY d.floor_id, d.label
	`

	rows, err := s.pool.Query(ctx, query, filter.StartTime, filter.EndTime, filter.FloorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DeskAvailability, 0)
	for rows.Next() {
		var item DeskAvailability
		if err := scanDeskAvailability(rows, &item); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanDesk(row rowScanner, d *Desk) error {
	return row.Scan(&d.ID, &d.FloorID, &d.Label, &d.XCoord, &d.YCoord, &d.IsEnabled)
}

func scanDeskAvailability(row rowScanner, d *DeskAvailability) error {
	return row.Scan(&d.DeskID, &d.FloorID, &d.Label, &d.IsEnabled, &d.IsAvailable)
}
