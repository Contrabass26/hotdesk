package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	CreateSession(ctx context.Context, tokenHash string, userID int64, expiresAt time.Time) error
	CreateUser(ctx context.Context, input SignupInput, passwordHash string) (Actor, error)
	GetUserByEmail(ctx context.Context, email string) (localUser, error)
	GetActorByID(ctx context.Context, id int64) (Actor, error)
	GetActorBySession(ctx context.Context, tokenHash string) (Actor, error)
	ListDemoActors(ctx context.Context) ([]Actor, error)
	RevokeSession(ctx context.Context, tokenHash string) error
}

type store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) Store {
	return &store{pool: pool}
}

func (s *store) CreateSession(ctx context.Context, tokenHash string, userID int64, expiresAt time.Time) error {
	const query = `
		INSERT INTO auth_sessions (token_hash, user_id, expires_at)
		VALUES ($1, $2, $3)
	`

	_, err := s.pool.Exec(ctx, query, tokenHash, userID, expiresAt)
	return err
}

func (s *store) CreateUser(ctx context.Context, input SignupInput, passwordHash string) (Actor, error) {
	const query = `
		INSERT INTO users (name, email, password_hash, is_admin, team_id)
		VALUES ($1, $2, $3, FALSE, $4)
		RETURNING user_id, name, email, is_admin, team_id
	`

	var actor Actor
	err := scanActor(
		s.pool.QueryRow(ctx, query, strings.TrimSpace(input.Name), normalizeEmail(input.Email), passwordHash, input.TeamID),
		&actor,
	)
	if err == nil {
		return actor, nil
	}
	return Actor{}, mapPgError(err)
}

func (s *store) GetUserByEmail(ctx context.Context, email string) (localUser, error) {
	const query = `
		SELECT user_id, name, email, password_hash, is_admin, team_id
		FROM users
		WHERE lower(email) = lower($1)
	`

	var user localUser
	err := scanLocalUser(s.pool.QueryRow(ctx, query, email), &user)
	if err == nil {
		return user, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return localUser{}, ErrInvalidCredentials
	}
	return localUser{}, err
}

func (s *store) GetActorByID(ctx context.Context, id int64) (Actor, error) {
	const query = `
		SELECT user_id, name, email, is_admin, team_id
		FROM users
		WHERE user_id = $1
	`

	var actor Actor
	err := scanActor(s.pool.QueryRow(ctx, query, id), &actor)
	if err == nil {
		return actor, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return Actor{}, ErrInvalidInput
	}
	return Actor{}, err
}

func (s *store) GetActorBySession(ctx context.Context, tokenHash string) (Actor, error) {
	const query = `
		SELECT u.user_id, u.name, u.email, u.is_admin, u.team_id
		FROM auth_sessions s
		JOIN users u ON u.user_id = s.user_id
		WHERE s.token_hash = $1
		  AND s.revoked_at IS NULL
		  AND s.expires_at > NOW()
	`

	var actor Actor
	err := scanActor(s.pool.QueryRow(ctx, query, tokenHash), &actor)
	if err == nil {
		return actor, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return Actor{}, ErrInvalidSession
	}
	return Actor{}, err
}

func (s *store) ListDemoActors(ctx context.Context) ([]Actor, error) {
	const query = `
		SELECT user_id, name, email, is_admin, team_id
		FROM users
		ORDER BY user_id
	`

	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	actors := make([]Actor, 0)
	for rows.Next() {
		var actor Actor
		if err := scanActor(rows, &actor); err != nil {
			return nil, err
		}
		actors = append(actors, actor)
	}

	return actors, rows.Err()
}

func (s *store) RevokeSession(ctx context.Context, tokenHash string) error {
	const query = `
		UPDATE auth_sessions
		SET revoked_at = NOW()
		WHERE token_hash = $1
		  AND revoked_at IS NULL
	`

	_, err := s.pool.Exec(ctx, query, tokenHash)
	return err
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanActor(row rowScanner, a *Actor) error {
	var teamID pgtype.Int8
	if err := row.Scan(&a.ID, &a.Name, &a.Email, &a.IsAdmin, &teamID); err != nil {
		return err
	}
	if teamID.Valid {
		a.TeamID = &teamID.Int64
	}
	return nil
}

func scanLocalUser(row rowScanner, u *localUser) error {
	var teamID pgtype.Int8
	if err := row.Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.IsAdmin, &teamID); err != nil {
		return err
	}
	if teamID.Valid {
		u.TeamID = &teamID.Int64
	}
	return nil
}
