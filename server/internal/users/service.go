package users

import (
	"context"

	"hotdesk/server/internal/auth"
)

type Service interface {
	GetByID(ctx context.Context, id int64) (User, error)
	GetByIDForActor(ctx context.Context, actor auth.Actor, id int64) (User, error)
	List(ctx context.Context, filter ListFilter) ([]User, error)
	Update(ctx context.Context, id int64, isAdmin bool) (User, error)
}

type service struct {
	store Store
}

func NewService(store Store) Service {
	return &service{store: store}
}

func (s *service) GetByID(ctx context.Context, id int64) (User, error) {
	if id <= 0 {
		return User{}, ErrInvalidInput
	}

	return s.store.GetByID(ctx, id)
}

func (s *service) GetByIDForActor(ctx context.Context, actor auth.Actor, id int64) (User, error) {
	if id <= 0 {
		return User{}, ErrInvalidInput
	}
	if !canAccessUser(actor, id) {
		return User{}, auth.ErrForbidden
	}
	return s.store.GetByID(ctx, id)
}

func (s *service) Update(ctx context.Context, id int64, isAdmin bool) (User, error) {
	if id <= 0 {
		return User{}, ErrInvalidInput
	}

	return s.store.Update(ctx, id, isAdmin)
}

func (s *service) List(ctx context.Context, filter ListFilter) ([]User, error) {
	if filter.TeamID != nil && *filter.TeamID <= 0 {
		return nil, ErrInvalidInput
	}
	if filter.Limit == -1 {
		filter.Limit = 50
	}
	if filter.Limit < 0 {
		return nil, ErrInvalidInput
	}

	return s.store.List(ctx, filter)
}

func canAccessUser(actor auth.Actor, userID int64) bool {
	return actor.IsAdmin || actor.ID == userID
}
