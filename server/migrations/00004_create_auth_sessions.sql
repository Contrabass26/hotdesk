-- +goose Up
CREATE TABLE auth_sessions (
    token_hash     CHAR(64) PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at     TIMESTAMPTZ NOT NULL,
    revoked_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

UPDATE users
SET password_hash = '$2a$10$K1IQSIcYh2Amj2kdhSVN/..DSwZd01b6bw.uXYoqVCRSlQqThC.Bm'
WHERE password_hash = '$2b$12$placeholder.hash.for.testing.only';

-- +goose Down
UPDATE users
SET password_hash = '$2b$12$placeholder.hash.for.testing.only'
WHERE password_hash = '$2a$10$K1IQSIcYh2Amj2kdhSVN/..DSwZd01b6bw.uXYoqVCRSlQqThC.Bm';

DROP INDEX IF EXISTS idx_users_email_lower;
DROP TABLE IF EXISTS auth_sessions;
