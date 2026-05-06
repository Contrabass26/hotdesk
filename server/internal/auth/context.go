package auth

import "context"

type contextKey string

const (
	actorContextKey contextKey = "auth.actor"
	tokenContextKey contextKey = "auth.token"
)

func ContextWithActor(ctx context.Context, actor Actor, token string) context.Context {
	ctx = context.WithValue(ctx, actorContextKey, actor)
	return context.WithValue(ctx, tokenContextKey, token)
}

func ActorFromContext(ctx context.Context) (Actor, bool) {
	actor, ok := ctx.Value(actorContextKey).(Actor)
	return actor, ok
}

func TokenFromContext(ctx context.Context) (string, bool) {
	token, ok := ctx.Value(tokenContextKey).(string)
	return token, ok
}
