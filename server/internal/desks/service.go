package desks

import "context"

type Service interface {
	GetByID(ctx context.Context, id int64) (Desk, error)
	List(ctx context.Context, filter ListFilter) ([]Desk, error)
	ListAvailability(ctx context.Context, filter AvailabilityFilter) ([]DeskAvailability, error)
}

type service struct {
	store Store
}

func NewService(store Store) Service {
	return &service{store: store}
}

func (s *service) GetByID(ctx context.Context, id int64) (Desk, error) {
	if id <= 0 {
		return Desk{}, ErrInvalidInput
	}

	return s.store.GetByID(ctx, id)
}

func (s *service) List(ctx context.Context, filter ListFilter) ([]Desk, error) {
	if filter.FloorID != nil && *filter.FloorID <= 0 {
		return nil, ErrInvalidInput
	}
	if filter.Limit < 0 {
		return nil, ErrInvalidInput
	}
	if filter.Limit == 0 {
		filter.Limit = 100
	}

	return s.store.List(ctx, filter)
}

func (s *service) ListAvailability(ctx context.Context, filter AvailabilityFilter) ([]DeskAvailability, error) {
	if filter.FloorID != nil && *filter.FloorID <= 0 {
		return nil, ErrInvalidInput
	}
	if filter.StartTime.IsZero() || filter.EndTime.IsZero() || !filter.StartTime.Before(filter.EndTime) {
		return nil, ErrInvalidInput
	}

	return s.store.ListAvailability(ctx, filter)
}
