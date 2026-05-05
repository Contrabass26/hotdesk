package teams

type Team struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	DepartmentID int64  `json:"departmentId"`
}

type ListFilter struct {
	Limit int
}

type CreateInput struct {
	Name         string `json:"name"`
	DepartmentID int64  `json:"departmentId"`
}

type UpdateInput struct {
	Name         *string `json:"name"`
	DepartmentID *int64  `json:"departmentId"`
}
