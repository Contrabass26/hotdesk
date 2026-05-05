package auth

import "testing"

func TestHashPasswordAndCheckPassword(t *testing.T) {
	hash, err := HashPassword("password123")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}

	if !CheckPassword(hash, "password123") {
		t.Fatal("CheckPassword rejected the correct password")
	}

	if CheckPassword(hash, "not-the-password") {
		t.Fatal("CheckPassword accepted the wrong password")
	}
}

func TestSeedPasswordHashMatchesPassword123(t *testing.T) {
	const seedHash = "$2a$10$K1IQSIcYh2Amj2kdhSVN/..DSwZd01b6bw.uXYoqVCRSlQqThC.Bm"
	if !CheckPassword(seedHash, "password123") {
		t.Fatal("seed password hash does not match password123")
	}
}
