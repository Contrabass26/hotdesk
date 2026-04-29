package utils

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"
)

func ParsePositiveID(raw string, field string) (int64, error) {
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s must be an integer", field)
	}
	if id <= 0 {
		return 0, fmt.Errorf("%s must be positive", field)
	}
	return id, nil
}

func ParseOptionalPositiveID(values url.Values, key string) (*int64, error) {
	raw := values.Get(key)
	if raw == "" {
		return nil, nil
	}

	id, err := ParsePositiveID(raw, key)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func ParseOptionalInt(values url.Values, key string) (int, error) {
	raw := values.Get(key)
	if raw == "" {
		return -1, nil
	}

	value, err := strconv.Atoi(raw)
	if err != nil {
		return -1, fmt.Errorf("%s must be an integer", key)
	}

	return value, nil
}

func ParseOptionalBool(values url.Values, key string) (*bool, error) {
	raw := values.Get(key)
	if raw == "" {
		return nil, nil
	}

	value, err := strconv.ParseBool(strings.ToLower(raw))
	if err != nil {
		return nil, fmt.Errorf("%s must be a boolean", key)
	}
	return &value, nil
}

func ParseRequiredTime(values url.Values, key string) (time.Time, error) {
	raw := values.Get(key)
	if raw == "" {
		return time.Time{}, fmt.Errorf("%s query param must be a datetime", key)
	}

	value, err := time.Parse(time.RFC3339Nano, raw)
	if err != nil {
		return time.Time{}, fmt.Errorf("%s query param must be a datetime", key)
	}
	return value, nil
}

func ParseOptionalTime(values url.Values, key string) (*time.Time, error) {
	raw := values.Get(key)
	if raw == "" {
		return nil, nil
	}

	value, err := time.Parse(time.RFC3339Nano, raw)
	if err != nil {
		return nil, fmt.Errorf("%s query param must be a datetime", key)
	}
	return &value, nil
}

func ParseRequiredDate(values url.Values, key string) (time.Time, error) {
	raw := values.Get(key)
	if raw == "" {
		return time.Time{}, fmt.Errorf("%s query param must be a date", key)
	}

	value, err := time.Parse("2006-01-02", raw)
	if err != nil {
		return time.Time{}, fmt.Errorf("%s query param must be a date", key)
	}
	return value, nil
}

func ParseOptionalDate(values url.Values, key string) (*time.Time, error) {
	raw := values.Get(key)
	if raw == "" {
		return nil, nil
	}

	value, err := time.Parse("2006-01-02", raw)
	if err != nil {
		return nil, fmt.Errorf("%s query param must be a date", key)
	}
	return &value, nil
}

func ParseOptionalTrimmedString(values url.Values, key string) *string {
	raw := strings.TrimSpace(values.Get(key))
	if raw == "" {
		return nil
	}
	return &raw
}
