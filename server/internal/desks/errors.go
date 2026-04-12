package desks

import "errors"

var (
	ErrNotFound     = errors.New("desk not found")
	ErrInvalidInput = errors.New("invalid desk input")
)
