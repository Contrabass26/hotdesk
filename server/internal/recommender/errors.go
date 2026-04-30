package recommender

import "errors"

var (
	ErrDeskNotFound     = errors.New("desk not found")
	ErrInvalidDeskInput = errors.New("invalid desk input")
	ErrUserNotFound     = errors.New("user not found")
	ErrInvalidUserInput = errors.New("invalid user input")
	ErrInvalidTimeRange = errors.New("invalid time range")
	ErrUserHasNoTeam    = errors.New("user has no team")
)
