package floors

import "errors"

var (
	ErrNotFound     = errors.New("floor not found")
	ErrInvalidInput = errors.New("invalid floor input")
)
