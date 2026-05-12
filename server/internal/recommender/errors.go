package recommender

import "errors"

var (
	ErrInvalidFloorInput = errors.New("invalid floor input")
	ErrUserNotFound      = errors.New("user not found")
	ErrInvalidUserInput  = errors.New("invalid user input")
	ErrInvalidTimeRange  = errors.New("invalid time range")
	ErrUserHasNoTeam     = errors.New("user has no team")
)
