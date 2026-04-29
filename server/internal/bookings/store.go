package bookings

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	Create(ctx context.Context, input CreateInput) (Booking, error)
	GetByID(ctx context.Context, id int64) (Booking, error)
	List(ctx context.Context, filter ListFilter) ([]Booking, error)
	Cancel(ctx context.Context, id int64) (Booking, error)
}

type store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) Store {
	return &store{pool: pool}
}

func (s *store) Create(ctx context.Context, in CreateInput) (Booking, error) {
	const query = `
		INSERT INTO bookings (user_id, desk_id, start_time, end_time, status)
		VALUES ($1, $2, $3, $4, 'confirmed')
		RETURNING booking_id, user_id, desk_id, start_time, end_time, status, created_at
	`

	var booking Booking
	err := scanBooking(s.pool.QueryRow(ctx, query, in.UserID, in.DeskID, in.StartTime, in.EndTime), &booking)
	if err == nil {
		return booking, nil
	}

	return Booking{}, mapPgError(err)
}

func (s *store) GetByID(ctx context.Context, id int64) (Booking, error) {
	const query = `
		SELECT booking_id, user_id, desk_id, start_time, end_time, status, created_at
		FROM bookings
		WHERE booking_id = $1
	`

	var booking Booking
	err := scanBooking(s.pool.QueryRow(ctx, query, id), &booking)
	if err == nil {
		return booking, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return Booking{}, ErrNotFound
	}

	return Booking{}, err
}

func (s *store) List(ctx context.Context, f ListFilter) ([]Booking, error) {
	const query = `
		SELECT booking_id, user_id, desk_id, start_time, end_time, status, created_at
		FROM bookings
		WHERE ($1::BIGINT IS NULL OR user_id = $1)
		  AND ($2::BIGINT IS NULL OR desk_id = $2)
		  AND ($3::TEXT IS NULL OR status = $3)
		  AND ($4::TIMESTAMP IS NULL OR end_time > $4)
		  AND ($5::TIMESTAMP IS NULL OR start_time < $5)
		  AND ($6::INTEGER = -1 OR EXTRACT(DOW FROM start_time) = $6)
		ORDER BY start_time DESC, booking_id
		LIMIT $7
	`

	// Get the start and end of the filter's date
	var StartTime, EndTime *time.Time = nil, nil
	if f.Date != nil {
		tStartTime := time.Date(f.Date.Year(), f.Date.Month(), f.Date.Day(), 0, 0, 0, 0, f.Date.Location())
		tEndTime := tStartTime.AddDate(0, 0, 1)
		StartTime = &tStartTime
		EndTime = &tEndTime
	}
	rows, err := s.pool.Query(ctx, query, f.UserID, f.DeskID, f.Status, StartTime, EndTime, f.Weekday, f.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Booking, 0)
	for rows.Next() {
		var booking Booking
		if err := scanBooking(rows, &booking); err != nil {
			return nil, err
		}
		items = append(items, booking)
	}

	return items, rows.Err()
}

func (s *store) Cancel(ctx context.Context, id int64) (Booking, error) {
	const updateQuery = `
		UPDATE bookings
		SET status = 'cancelled'
		WHERE booking_id = $1
		  AND status = 'confirmed'
		RETURNING booking_id, user_id, desk_id, start_time, end_time, status, created_at
	`

	var booking Booking
	err := scanBooking(s.pool.QueryRow(ctx, updateQuery, id), &booking)
	if err == nil {
		return booking, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return Booking{}, err
	}

	const statusQuery = `SELECT status FROM bookings WHERE booking_id = $1`
	var status string
	statusErr := s.pool.QueryRow(ctx, statusQuery, id).Scan(&status)
	if statusErr != nil {
		if errors.Is(statusErr, pgx.ErrNoRows) {
			return Booking{}, ErrNotFound
		}
		return Booking{}, statusErr
	}

	return Booking{}, ErrNotCancellable
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanBooking(row rowScanner, b *Booking) error {
	return row.Scan(&b.ID, &b.UserID, &b.DeskID, &b.StartTime, &b.EndTime, &b.Status, &b.CreatedAt)
}
