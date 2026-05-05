package teams

import (
	"context"
	"strings"
)

type Service interface {
	Create(ctx context.Context, input CreateInput) (Team, error)
	CreateDepartment(ctx context.Context, input CreateDepartmentInput) (Department, error)
	Delete(ctx context.Context, id int64) error
	DeleteDepartment(ctx context.Context, id int64) error
	GetDepartmentByID(ctx context.Context, id int64) (Department, error)
	GetByID(ctx context.Context, id int64) (Team, error)
	ListDepartments(ctx context.Context, filter DepartmentListFilter) ([]Department, error)
	List(ctx context.Context, filter ListFilter) ([]Team, error)
	Update(ctx context.Context, id int64, input UpdateInput) (Team, error)
	UpdateDepartment(ctx context.Context, id int64, input UpdateDepartmentInput) (Department, error)
}

type service struct {
	store Store
}

func NewService(store Store) Service {
	return &service{store: store}
}

func (s *service) Create(ctx context.Context, input CreateInput) (Team, error) {
	if strings.TrimSpace(input.Name) == "" || input.DepartmentID <= 0 {
		return Team{}, ErrInvalidInput
	}
	return s.store.Create(ctx, input)
}

func (s *service) CreateDepartment(ctx context.Context, input CreateDepartmentInput) (Department, error) {
	if strings.TrimSpace(input.Name) == "" {
		return Department{}, ErrInvalidInput
	}
	return s.store.CreateDepartment(ctx, input)
}

func (s *service) Delete(ctx context.Context, id int64) error {
	if id <= 0 {
		return ErrInvalidInput
	}
	return s.store.Delete(ctx, id)
}

func (s *service) DeleteDepartment(ctx context.Context, id int64) error {
	if id <= 0 {
		return ErrInvalidInput
	}
	return s.store.DeleteDepartment(ctx, id)
}

func (s *service) GetDepartmentByID(ctx context.Context, id int64) (Department, error) {
	if id <= 0 {
		return Department{}, ErrInvalidInput
	}
	return s.store.GetDepartmentByID(ctx, id)
}

func (s *service) GetByID(ctx context.Context, id int64) (Team, error) {
	if id <= 0 {
		return Team{}, ErrInvalidInput
	}
	return s.store.GetByID(ctx, id)
}

func (s *service) ListDepartments(ctx context.Context, filter DepartmentListFilter) ([]Department, error) {
	if filter.Limit == -1 {
		filter.Limit = 100
	}
	if filter.Limit < 0 {
		return nil, ErrInvalidInput
	}
	return s.store.ListDepartments(ctx, filter)
}

func (s *service) List(ctx context.Context, filter ListFilter) ([]Team, error) {
	if filter.Limit == -1 {
		filter.Limit = 100
	}
	if filter.Limit < 0 {
		return nil, ErrInvalidInput
	}
	return s.store.List(ctx, filter)
}

func (s *service) Update(ctx context.Context, id int64, input UpdateInput) (Team, error) {
	if id <= 0 || (input.Name == nil && input.DepartmentID == nil) {
		return Team{}, ErrInvalidInput
	}
	if input.Name != nil && strings.TrimSpace(*input.Name) == "" {
		return Team{}, ErrInvalidInput
	}
	if input.DepartmentID != nil && *input.DepartmentID <= 0 {
		return Team{}, ErrInvalidInput
	}
	return s.store.Update(ctx, id, input)
}

func (s *service) UpdateDepartment(ctx context.Context, id int64, input UpdateDepartmentInput) (Department, error) {
	if id <= 0 || input.Name == nil || strings.TrimSpace(*input.Name) == "" {
		return Department{}, ErrInvalidInput
	}
	return s.store.UpdateDepartment(ctx, id, input)
}
