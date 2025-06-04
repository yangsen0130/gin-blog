package utils

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte(os.Getenv("JWT_SECRET"))

type Claims struct {
	UserID      uint   `json:"user_id,omitempty"`
	GuestUserID uint   `json:"guest_user_id,omitempty"`
	Username    string `json:"username"`
	AvatarURL	string `json:"avatar_url,omitempty"`
	Provider    string `json:"provider,omitempty"`
	jwt.RegisteredClaims
}

func ensureJwtKey() {
	if string(jwtKey) == "" {
		loadedKey := os.Getenv("JWT_SECRET")
		if loadedKey == "" || loadedKey == "your_super_secret_key_change_this" {
			fmt.Println("Warning: JWT_SECRET is not set or is using the default insecure value. Please set it in .env")
			if loadedKey == "" {
				jwtKey = []byte("fallback_secret_key_for_dev_only_change_me")
			} else {
				jwtKey = []byte(loadedKey)
			}
		} else {
			jwtKey = []byte(loadedKey)
		}
	}
}

func GenerateToken(id uint, username string, avatarURL string, userType string) (string, error) {
	ensureJwtKey()
	expirationTime := time.Now().Add(7 * 24 * time.Hour) // Extended to 7 days for guest convenience
	
	claims := &Claims{
		Username:  username,
		AvatarURL: avatarURL,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			Issuer:    "gin-blog",
		},
	}

	if userType == "admin" {
		claims.UserID = id
		claims.Provider = "local"
	} else if userType == "guest" {
		claims.GuestUserID = id
		claims.Provider = "github"
	} else {
		return "", fmt.Errorf("unknown user type for token generation")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ValidateToken(tokenStr string) (*Claims, error) {
	ensureJwtKey()
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil {
		if err == jwt.ErrSignatureInvalid {
			return nil, fmt.Errorf("invalid token signature")
		}
		return nil, fmt.Errorf("could not parse token: %v", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}