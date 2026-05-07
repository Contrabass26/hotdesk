package auth

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

var pgErrMap = map[string]error{
	"23503": ErrInvalidTeam,
	"23505": ErrEmailTaken,
}

var (
	ErrEmailTaken         = errors.New("email is already registered")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidInput       = errors.New("invalid auth input")
	ErrInvalidSession     = errors.New("invalid or expired session")
	ErrInvalidTeam        = errors.New("team not found")
	ErrUnauthenticated    = errors.New("authentication required")
	ErrForbidden          = errors.New("access forbidden")
	ErrAdminRequired      = errors.New("admin access required")
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
