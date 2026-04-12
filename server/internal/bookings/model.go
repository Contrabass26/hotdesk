package bookings

import "time"

const (
	StatusConfirmed = "confirmed"
	StatusCancelled = "cancelled"
	StatusNoShow    = "no_show"
)

type Booking struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"userId"`
	DeskID    int64     `json:"deskId"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type CreateInput struct {
	UserID    int64     `json:"userId"`
	DeskID    int64     `json:"deskId"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
}

type ListFilter struct {
	UserID    *int64
	DeskID    *int64
	Status    *string
	StartTime *time.Time
	EndTime   *time.Time
	Limit     int
}
