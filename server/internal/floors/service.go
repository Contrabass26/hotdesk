package floors

import "context"

type Service interface {
	GetByID(ctx context.Context, id int64) (Floor, error)
	List(ctx context.Context, filter ListFilter) ([]Floor, error)
	Delete(ctx context.Context, id int64) error
	Create(ctx context.Context, input CreateInput) (Floor, error)
}

type service struct {
	store Store
}

func NewService(store Store) Service {
	return &service{store: store}
}

func (s *service) GetByID(ctx context.Context, id int64) (Floor, error) {
	if id <= 0 {
		return Floor{}, ErrInvalidInput
	}

	return s.store.GetByID(ctx, id)
}

func (s *service) List(ctx context.Context, filter ListFilter) ([]Floor, error) {
	if filter.Limit == -1 {
		filter.Limit = 50
	}
	if filter.Limit < 0 {
		return nil, ErrInvalidInput
	}

	return s.store.List(ctx, filter)
}

func (s *service) Delete(ctx context.Context, id int64) error {
	if id <= 0 {
		return ErrInvalidInput
	}
	return s.store.Delete(ctx, id)
}

func (s *service) Create(ctx context.Context, input CreateInput) (Floor, error) {
	return s.store.Create(ctx, input)
}
