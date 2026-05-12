package users

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	GetByID(ctx context.Context, id int64) (User, error)
	List(ctx context.Context, filter ListFilter) ([]User, error)
	Update(ctx context.Context, id int64, isAdmin bool, teamId *int64) (User, error)
}

type store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) Store {
	return &store{pool: pool}
}

func (s *store) GetByID(ctx context.Context, id int64) (User, error) {
	const query = `
		SELECT user_id, name, email, is_admin, team_id
		FROM users
		WHERE user_id = $1
	`

	var user User
	err := scanUser(s.pool.QueryRow(ctx, query, id), &user)
	if err == nil {
		// no database error, return user
		return user, nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		// user not found, return not found error
		return User{}, ErrNotFound
	}
	// some other database error, don't return malformed user data
	return User{}, err
}

func (s *store) List(ctx context.Context, filter ListFilter) ([]User, error) {
	const query = `
		SELECT user_id, name, email, is_admin, team_id
		FROM users
		WHERE ($1::BIGINT IS NULL OR team_id = $1)
		  AND ($2::BOOLEAN IS NULL OR is_admin = $2)
		ORDER BY user_id
		LIMIT $3
	`

	rows, err := s.pool.Query(ctx, query, filter.TeamID, filter.IsAdmin, filter.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]User, 0)
	for rows.Next() {
		var user User
		if err := scanUser(rows, &user); err != nil {
			return nil, err
		}
		items = append(items, user)
	}

	return items, rows.Err()
}

func (s *store) Update(ctx context.Context, id int64, isAdmin bool, teamId *int64) (User, error) {
	if teamId == nil {
		const query = `
		UPDATE users
		SET is_admin = $2, team_id = NULL
		WHERE user_id = $1
		RETURNING user_id, name, email, is_admin, team_id
	`

		var user User
		err := scanUser(s.pool.QueryRow(ctx, query, id, isAdmin), &user)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return User{}, ErrNotFound
			}
			return User{}, err
		}

		return user, nil
	} else {
		const query = `
		UPDATE users
		SET is_admin = $2, team_id = $3
		WHERE user_id = $1
		RETURNING user_id, name, email, is_admin, team_id
	`

		var user User
		err := scanUser(s.pool.QueryRow(ctx, query, id, isAdmin, *teamId), &user)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return User{}, ErrNotFound
			}
			return User{}, err
		}

		return user, nil
	}
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanUser(row rowScanner, u *User) error {
	var teamID pgtype.Int8
	if err := row.Scan(&u.ID, &u.Name, &u.Email, &u.IsAdmin, &teamID); err != nil {
		return err
	}
	if teamID.Valid {
		u.TeamID = &teamID.Int64
	}

	return nil
}
