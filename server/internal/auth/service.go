package auth

import (
	"context"
	"net/mail"
	"strings"
	"time"
)

const minPasswordLength = 8

type Service interface {
	AuthenticateToken(ctx context.Context, token string) (Actor, error)
	Login(ctx context.Context, input LoginInput) (string, AuthResponse, error)
	Logout(ctx context.Context, token string) error
	Signup(ctx context.Context, input SignupInput) (string, AuthResponse, error)
}

type service struct {
	store Store
	ttl   time.Duration
}

func NewService(store Store) Service {
	return &service{
		store: store,
		ttl:   DefaultSessionTTL,
	}
}

func (s *service) AuthenticateToken(ctx context.Context, token string) (Actor, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return Actor{}, ErrInvalidSession
	}
	return s.store.GetActorBySession(ctx, HashSessionToken(token))
}

func (s *service) Login(ctx context.Context, input LoginInput) (string, AuthResponse, error) {
	email := normalizeEmail(input.Email)
	if email == "" || input.Password == "" {
		return "", AuthResponse{}, ErrInvalidCredentials
	}

	user, err := s.store.GetUserByEmail(ctx, email)
	if err != nil {
		return "", AuthResponse{}, err
	}
	if !CheckPassword(user.PasswordHash, input.Password) {
		return "", AuthResponse{}, ErrInvalidCredentials
	}

	return s.issueSession(ctx, user.Actor)
}

func (s *service) Logout(ctx context.Context, token string) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil
	}
	return s.store.RevokeSession(ctx, HashSessionToken(token))
}

func (s *service) Signup(ctx context.Context, input SignupInput) (string, AuthResponse, error) {
	input.Name = strings.TrimSpace(input.Name)
	input.Email = normalizeEmail(input.Email)
	if input.Name == "" || !isValidEmail(input.Email) || len(input.Password) < minPasswordLength || input.TeamID <= 0 {
		return "", AuthResponse{}, ErrInvalidInput
	}

	passwordHash, err := HashPassword(input.Password)
	if err != nil {
		return "", AuthResponse{}, err
	}

	actor, err := s.store.CreateUser(ctx, input, passwordHash)
	if err != nil {
		return "", AuthResponse{}, err
	}

	return s.issueSession(ctx, actor)
}

func (s *service) issueSession(ctx context.Context, actor Actor) (string, AuthResponse, error) {
	token, err := NewSessionToken()
	if err != nil {
		return "", AuthResponse{}, err
	}

	expiresAt := time.Now().UTC().Add(s.ttl)
	if err := s.store.CreateSession(ctx, HashSessionToken(token), actor.ID, expiresAt); err != nil {
		return "", AuthResponse{}, err
	}

	return token, AuthResponse{
		User:      actor,
		ExpiresAt: expiresAt,
	}, nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func isValidEmail(email string) bool {
	address, err := mail.ParseAddress(email)
	return err == nil && address.Address == email
}
