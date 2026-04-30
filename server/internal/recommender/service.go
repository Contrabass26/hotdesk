package recommender

import (
	"context"
	"hotdesk/server/internal/bookings"
	"hotdesk/server/internal/desks"
	"hotdesk/server/internal/users"
)

type Service interface {
	ScoreDesk(ctx context.Context, input ScoreInput) (float64, error)
}
type service struct {
	usersService    users.Service
	desksService    desks.Service
	bookingsService bookings.Service
	store           Store
}

func NewService(store Store, usersService users.Service, desksService desks.Service, bookingsService bookings.Service) Service {
	return &service{
		usersService:    usersService,
		desksService:    desksService,
		bookingsService: bookingsService,
		store:           store,
	}
}

func (s *service) ListTeams(ctx context.Context) ([]Team, error) {
	return s.store.ListTeams(ctx)
}

func (s *service) ScoreDesk(ctx context.Context, input ScoreInput) (float64, error) {
	// validate input
	if input.UserID <= 0 {
		return 0, ErrInvalidUserInput
	}
	if input.DeskID <= 0 {
		return 0, ErrInvalidDeskInput
	}
	if input.StartTime.IsZero() || input.EndTime.IsZero() || !input.StartTime.Before(input.EndTime) {
		return 0, ErrInvalidTimeRange
	}
	allUsers, err := s.usersService.List(ctx, users.ListFilter{})
	if err != nil {
		return 0, err
	}
	allDesks, err := s.desksService.List(ctx, desks.ListFilter{})
	if err != nil {
		return 0, err
	}
	allBookings, err := s.bookingsService.List(ctx, bookings.ListFilter{})
	if err != nil {
		return 0, err
	}
	desk, err := s.desksService.GetByID(ctx, input.DeskID)
	if err != nil {
		return 0, ErrDeskNotFound
	}
	target, err := s.usersService.GetByID(ctx, input.UserID)
	if err != nil {
		return 0, ErrUserNotFound
	}
	if target.TeamID == nil {
		return 0, ErrUserHasNoTeam
	}
	teams, err := s.store.ListTeams(ctx)
	if err != nil {
		return 0, err
	}
	score, err := DeskScore(desk, target, input.StartTime, input.EndTime, allDesks, teams, allBookings, allUsers)
	if err != nil {
		return 0, err
	}
	return score, nil
}
