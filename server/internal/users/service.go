package users

import "context"

type Service interface {
	GetByID(ctx context.Context, id int64) (User, error)
	List(ctx context.Context, filter ListFilter) ([]User, error)
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

func (s *service) List(ctx context.Context, filter ListFilter) ([]User, error) {
	if filter.TeamID != nil && *filter.TeamID <= 0 {
		return nil, ErrInvalidInput
	}
	if filter.Limit < 0 {
		return nil, ErrInvalidInput
	}
	if filter.Limit == -1 {
		filter.Limit = 50
	}

	return s.store.List(ctx, filter)
}
