package recommender

import (
	"context"
	"hotdesk/server/internal/auth"
	"hotdesk/server/internal/bookings"
	"hotdesk/server/internal/desks"
	"hotdesk/server/internal/floors"
	"hotdesk/server/internal/users"
)

type Service interface {
	ScoreDesks(ctx context.Context, input ScoreInput) (map[int64]float64, error)
	ScoreDesksForActor(ctx context.Context, actor auth.Actor, input ScoreInput) (map[int64]float64, error)
}
type service struct {
	usersService    users.Service
	desksService    desks.Service
	floorsService   floors.Service
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

func (s *service) ScoreDesksForActor(ctx context.Context, actor auth.Actor, input ScoreInput) (map[int64]float64, error) {
	if input.UserID <= 0 {
		return nil, ErrInvalidUserInput
	}
	if !canScoreForUser(actor, input.UserID) {
		return nil, auth.ErrForbidden
	}
	return s.ScoreDesks(ctx, input)
}

func (s *service) ScoreDesks(ctx context.Context, input ScoreInput) (map[int64]float64, error) {
	// validate input
	if input.UserID <= 0 {
		return nil, ErrInvalidUserInput
	}
	if input.FloorID <= 0 {
		return nil, ErrInvalidFloorInput
	}
	if input.StartTime.IsZero() || input.EndTime.IsZero() || !input.StartTime.Before(input.EndTime) {
		return nil, ErrInvalidTimeRange
	}
	// Users
	allUsers, err := s.usersService.List(ctx, users.ListFilter{})
	if err != nil {
		return nil, err
	}
	// Bookings
	allBookings, err := s.bookingsService.List(ctx, bookings.ListFilter{
		Start:   &input.StartTime,
		End:     &input.EndTime,
		Weekday: -1,
	})
	if err != nil {
		return nil, err
	}
	// Desks
	allDesks, err := s.desksService.List(ctx, desks.ListFilter{
		FloorID: &(input.FloorID),
		Limit:   -1,
	})
	if err != nil {
		return nil, err
	}
	freeDesks := FreeDesks(allDesks, input.StartTime, input.EndTime, allBookings)
	// User we're making recommendations for
	target, err := s.usersService.GetByID(ctx, input.UserID)
	if err != nil {
		return nil, ErrUserNotFound
	}
	if target.TeamID == nil {
		return nil, ErrUserHasNoTeam
	}
	// Teams
	teams, err := s.store.ListTeams(ctx)
	if err != nil {
		return nil, err
	}

	// Get score for each desk
	scores := make(map[int64]float64)
	for _, desk := range freeDesks {
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
			return nil, err
		}
		scores[desk.ID] = score
	}
	return scores, nil
}

func canScoreForUser(actor auth.Actor, userID int64) bool {
	return actor.IsAdmin || actor.ID == userID
}
