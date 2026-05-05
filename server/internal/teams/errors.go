package teams

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

var pgErrMap = map[string]error{
	"23503": ErrReferenceNotFound,
	"23514": ErrInvalidInput,
}

var (
	ErrConflict          = errors.New("team is still in use")
	ErrInvalidInput      = errors.New("invalid team input")
	ErrNotFound          = errors.New("team not found")
	ErrReferenceNotFound = errors.New("department not found")
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
