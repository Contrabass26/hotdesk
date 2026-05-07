package auth

import (
	"encoding/hex"
	"testing"
)

func TestNewSessionTokenReturnsUniqueTokens(t *testing.T) {
	seen := make(map[string]struct{})

	for range 100 {
		token, err := NewSessionToken()
		if err != nil {
			t.Fatalf("NewSessionToken returned error: %v", err)
		}
		if token == "" {
			t.Fatal("NewSessionToken returned an empty token")
		}
		if _, ok := seen[token]; ok {
			t.Fatalf("NewSessionToken returned duplicate token %q", token)
		}
		seen[token] = struct{}{}
	}
}

func TestHashSessionToken(t *testing.T) {
	const token = "session-token"

	first := HashSessionToken(token)
	second := HashSessionToken(token)

	if first != second {
		t.Fatal("HashSessionToken is not deterministic")
	}
	if len(first) != 64 {
		t.Fatalf("HashSessionToken length = %d, want 64", len(first))
	}
	if _, err := hex.DecodeString(first); err != nil {
		t.Fatalf("HashSessionToken returned non-hex output: %v", err)
	}
}
