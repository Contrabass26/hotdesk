package bookings

import (
	"context"
	"strings"
)

type Service interface {
	Create(ctx context.Context, input CreateInput) (Booking, error)
	GetByID(ctx context.Context, id int64) (Booking, error)
	List(ctx context.Context, filter ListFilter) ([]Booking, error)
	Cancel(ctx context.Context, id int64) (Booking, error)
}

type service struct {
	store Store
}

func NewService(store Store) Service {
	return &service{store: store}
}

func (s *service) Create(ctx context.Context, input CreateInput) (Booking, error) {
	if err := validateCreateInput(input); err != nil {
		return Booking{}, err
	}

	return s.store.Create(ctx, input)
}

func (s *service) GetByID(ctx context.Context, id int64) (Booking, error) {
	if id <= 0 {
		return Booking{}, ErrInvalidID
	}

	return s.store.GetByID(ctx, id)
}

func (s *service) List(ctx context.Context, filter ListFilter) ([]Booking, error) {
	validated, err := validateListFilter(filter)
	if err != nil {
		return nil, err
	}

	return s.store.List(ctx, validated)
}

func (s *service) Cancel(ctx context.Context, id int64) (Booking, error) {
	if id <= 0 {
		return Booking{}, ErrInvalidID
	}

	return s.store.Cancel(ctx, id)
}

func validateCreateInput(input CreateInput) error {
	if input.UserID <= 0 {
		return ErrInvalidUserID
	}
	if input.DeskID <= 0 {
		return ErrInvalidDeskID
	}
	if input.StartTime.IsZero() || input.EndTime.IsZero() || !input.StartTime.Before(input.EndTime) {
		return ErrInvalidTimeRange
	}

	return nil
}

func validateListFilter(filter ListFilter) (ListFilter, error) {
	if filter.UserID != nil && *filter.UserID <= 0 {
		return ListFilter{}, ErrInvalidUserID
	}
	if filter.DeskID != nil && *filter.DeskID <= 0 {
		return ListFilter{}, ErrInvalidDeskID
	}
	if filter.Limit < 0 {
		return ListFilter{}, ErrInvalidLimit
	}

	if filter.Status != nil {
		status := strings.ToLower(strings.TrimSpace(*filter.Status))
		if !isValidStatus(status) {
			return ListFilter{}, ErrInvalidStatus
		}
		filter.Status = &status
	}

	if filter.StartTime != nil && filter.EndTime != nil && !filter.StartTime.Before(*filter.EndTime) {
		return ListFilter{}, ErrInvalidTimeRange
	}

	if filter.Limit == 0 {
		filter.Limit = 100
	}

	return filter, nil
}

func isValidStatus(status string) bool {
	switch status {
	case StatusConfirmed, StatusCancelled, StatusNoShow:
		return true
	default:
		return false
	}
}
