package teams

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

var pgErrMap = map[string]error{
	"23503": ErrForeignKeyViolation,
	"23514": ErrInvalidInput,
}

var (
	ErrDepartmentNotFound  = errors.New("department not found")
	ErrConflict            = errors.New("resource is still in use")
	ErrForeignKeyViolation = errors.New("foreign key violation")
	ErrInvalidInput        = errors.New("invalid input")
	ErrTeamNotFound        = errors.New("team not found")
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
