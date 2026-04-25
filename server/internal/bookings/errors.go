package bookings

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

var pgErrMap = map[string]error{
	"23P01": ErrConflict,
	"23503": ErrReferenceNotFound,
	"23514": ErrInvalidInput,
}

var (
	ErrNotFound          = errors.New("booking not found")
	ErrConflict          = errors.New("booking conflict")
	ErrNotCancellable    = errors.New("booking cannot be cancelled")
	ErrReferenceNotFound = errors.New("user or desk not found")

	ErrInvalidID        = errors.New("id must be positive")
	ErrInvalidUserID    = errors.New("userId must be positive")
	ErrInvalidDeskID    = errors.New("deskId must be positive")
	ErrInvalidStatus    = errors.New("status must be one of: confirmed, cancelled, no_show")
	ErrInvalidTimeRange = errors.New("startTime must be before endTime")
	ErrInvalidWeekday   = errors.New("weekday must be between 0 and 6")
	ErrInvalidLimit     = errors.New("limit must be zero or positive")
	ErrInvalidInput     = errors.New("invalid booking input")
)

func mapPgError(err error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return err
	}
	if mapped, ok := pgErrMap[pgErr.Code]; ok {
		return mapped
	}
	return err
}
