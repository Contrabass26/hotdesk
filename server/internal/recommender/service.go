package recommender

import (
	"context"
	"hotdesk/server/internal/auth"
	"hotdesk/server/internal/bookings"
	"hotdesk/server/internal/desks"
	"hotdesk/server/internal/users"
)

type Service interface {
	ScoreDesk(ctx context.Context, input ScoreInput) (float64, error)
	ScoreDeskForActor(ctx context.Context, actor auth.Actor, input ScoreInput) (float64, error)
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

func (s *service) ScoreDeskForActor(ctx context.Context, actor auth.Actor, input ScoreInput) (float64, error) {
	if input.UserID <= 0 {
		return 0, ErrInvalidUserInput
	}
	if !canScoreForUser(actor, input.UserID) {
		return 0, auth.ErrForbidden
	}
	return s.ScoreDesk(ctx, input)
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

	// only consider desks that are free for the entire time range
	if !isFree(desk, input.StartTime, input.EndTime, allBookings) {
		return 0, ErrInvalidDeskInput
	}
	freeDesks := FreeDesks(allDesks, input.StartTime, input.EndTime, allBookings)
	score, err := DeskScore(
		desk,
		target,
		input.StartTime,
		input.EndTime,
		freeDesks,
		teams,
		allBookings,
		allUsers,
	)
	if err != nil {
		return 0, err
	}
	return score, nil
}

func canScoreForUser(actor auth.Actor, userID int64) bool {
	return actor.IsAdmin || actor.ID == userID
}
