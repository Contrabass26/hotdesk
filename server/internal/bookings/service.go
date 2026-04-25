package bookings

import (
	"context"
	"math"
	"strings"
	"time"
)

type Service interface {
	Create(ctx context.Context, input CreateInput) (Booking, error)
	GetByID(ctx context.Context, id int64) (Booking, error)
	List(ctx context.Context, filter ListFilter) ([]Booking, error)
	Cancel(ctx context.Context, id int64) (Booking, error)
	PredictNumBookings(ctx context.Context, query time.Time) (int, error)
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

// PredictNumBookings
// Predict how many bookings will intersect this time
func (s *service) PredictNumBookings(ctx context.Context, query time.Time) (int, error) {
	// How many bookings, on this weekday, tend to contain this time?
	fWeekday := int(query.Weekday())          // the weekday we're looking for
	fTime := query.Hour()*60 + query.Minute() // the time of day (in minutes) we're looking for

	// Request some bookings for the right weekday
	bookings, err := s.store.List(ctx, ListFilter{Weekday: fWeekday})
	if err != nil {
		return -1, err
	}

	// Count how many days are covered by these bookings
	numDays := 0
	{
		prevDay := -1
		for _, booking := range bookings {
			day := booking.StartTime.Day()
			if day != prevDay {
				numDays++
				prevDay = day
			}
		}
		// We're not going to use the last day, because we might not have all the bookings for it
		numDays--
	}

	// Count the total number of bookings in the days we're using
	count := 0
	{
		daysSeen := 0
		prevDay := -1
		for _, booking := range bookings {
			// Check whether it's a new day
			startTime := booking.StartTime
			day := startTime.Day()
			if day != prevDay {
				daysSeen++
				prevDay = day
				// Maybe we're done
				if daysSeen > numDays {
					break
				}
			}
			// Add this booking to the count, if it contains the time of day we're looking for
			endTime := booking.EndTime
			bStart := startTime.Hour()*60 + startTime.Minute()
			bEnd := endTime.Hour()*60 + endTime.Minute()
			if bStart < fTime && bEnd > fTime {
				count++
			}
		}
	}

	// average = count / numDays
	if numDays <= 0 {
		return 0, nil
	}
	return int(math.Round(float64(count) / float64(numDays))), nil
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

	if filter.Weekday != -1 && (filter.Weekday < 0 || filter.Weekday > 6) {
		return ListFilter{}, ErrInvalidWeekday
	}

	if filter.Limit == -1 {
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
