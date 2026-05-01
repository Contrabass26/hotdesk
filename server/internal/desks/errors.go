package desks

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

var pgErrMap = map[string]error{
	"23503": ErrReferenceNotFound,
	"23514": ErrInvalidInput,
}

var (
	ErrNotFound          = errors.New("desk not found")
	ErrInvalidInput      = errors.New("invalid desk input")
	ErrReferenceNotFound = errors.New("floor not found")
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
