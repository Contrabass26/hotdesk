package teams

import (
	"context"
	"strings"
)

type Service interface {
	Create(ctx context.Context, input CreateInput) (Team, error)
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (Team, error)
	List(ctx context.Context, filter ListFilter) ([]Team, error)
	Update(ctx context.Context, id int64, input UpdateInput) (Team, error)
}

type service struct {
	store Store
}

func NewService(store Store) Service {
	return &service{store: store}
}

func (s *service) Create(ctx context.Context, input CreateInput) (Team, error) {
	if strings.TrimSpace(input.Name) == "" || input.DepartmentID <= 0 {
		return Team{}, ErrInvalidInput
	}
	return s.store.Create(ctx, input)
}

func (s *service) Delete(ctx context.Context, id int64) error {
	if id <= 0 {
		return ErrInvalidInput
	}
	return s.store.Delete(ctx, id)
}

func (s *service) GetByID(ctx context.Context, id int64) (Team, error) {
	if id <= 0 {
		return Team{}, ErrInvalidInput
	}
	return s.store.GetByID(ctx, id)
}

func (s *service) List(ctx context.Context, filter ListFilter) ([]Team, error) {
	if filter.Limit == -1 {
		filter.Limit = 100
	}
	if filter.Limit < 0 {
		return nil, ErrInvalidInput
	}
	return s.store.List(ctx, filter)
}

func (s *service) Update(ctx context.Context, id int64, input UpdateInput) (Team, error) {
	if id <= 0 || !hasUpdate(input) {
		return Team{}, ErrInvalidInput
	}
	if input.Name != nil && strings.TrimSpace(*input.Name) == "" {
		return Team{}, ErrInvalidInput
	}
	if input.DepartmentID != nil && *input.DepartmentID <= 0 {
		return Team{}, ErrInvalidInput
	}
	return s.store.Update(ctx, id, input)
}

func hasUpdate(input UpdateInput) bool {
	return input.Name != nil || input.DepartmentID != nil
}
