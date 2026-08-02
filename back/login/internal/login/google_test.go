package login

import "testing"

func TestIsProfileComplete(t *testing.T) {
	complete := User{
		Email: "cliente@gmail.com",
		Name:  "Cliente Teste",
		CPF:   "123.456.789-01",
	}
	if !isProfileComplete(complete) {
		t.Fatal("expected profile with name, email and 11 CPF digits to be complete")
	}

	complete.CPF = ""
	if isProfileComplete(complete) {
		t.Fatal("expected profile without CPF to be incomplete")
	}
}

func TestIsGoogleAuthoritative(t *testing.T) {
	if !isGoogleAuthoritative("cliente@gmail.com", "") {
		t.Fatal("gmail address should be authoritative")
	}
	if !isGoogleAuthoritative("cliente@empresa.com.br", "empresa.com.br") {
		t.Fatal("workspace hosted domain should be authoritative")
	}
	if isGoogleAuthoritative("cliente@outlook.com", "") {
		t.Fatal("third-party address without hosted domain should not be authoritative")
	}
}

func TestNewLoginResponseRequiresProfileCompletion(t *testing.T) {
	user := User{
		ID:           "user-1",
		Email:        "cliente@gmail.com",
		Name:         "Cliente",
		GoogleSub:    "google-1",
		AuthProvider: googleProvider,
	}

	response := newLoginResponse(user, "token")
	if response.ProfileComplete {
		t.Fatal("expected Google user without CPF to have incomplete profile")
	}
	if response.NextAction != "complete_profile" {
		t.Fatalf("expected complete_profile action, got %q", response.NextAction)
	}
	if response.User.HasPassword {
		t.Fatal("expected Google-only user not to have a password")
	}
}
