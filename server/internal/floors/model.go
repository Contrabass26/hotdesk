package floors

type Floor struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Image string `json:"image"`
}

type ListFilter struct {
	Limit int
}

type CreateInput struct {
	Name  string `json:"name"`
	Image string `json:"image"`
}
