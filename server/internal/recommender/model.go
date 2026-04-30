package recommender

import (
	"time"
)

type ScoreInput struct {
	UserID    int64     `json:"userId"`
	DeskID    int64     `json:"deskId"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
}

type Team struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	DepartmentID *int64 `json:"departmentId,omitempty"`
}
