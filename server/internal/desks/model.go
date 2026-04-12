package desks

import "time"

type Desk struct {
	ID        int64   `json:"id"`
	FloorID   int64   `json:"floorId"`
	Label     string  `json:"label"`
	XCoord    float64 `json:"xCoord"`
	YCoord    float64 `json:"yCoord"`
	IsEnabled bool    `json:"isEnabled"`
}

type DeskAvailability struct {
	DeskID      int64  `json:"deskId"`
	FloorID     int64  `json:"floorId"`
	Label       string `json:"label"`
	IsEnabled   bool   `json:"isEnabled"`
	IsAvailable bool   `json:"isAvailable"`
}

type ListFilter struct {
	FloorID   *int64
	IsEnabled *bool
	Limit     int
}

type AvailabilityFilter struct {
	StartTime time.Time
	EndTime   time.Time
	FloorID   *int64
}
