package utils

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte(os.Getenv("JWT_SECRET"))

type Claims struct {
	UserID uint `json:"user_id"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint) (string, error) {
	if string(jwtKey) == "" || string(jwtKey) == "your_super_secret_key_change_this" {
		// In a real app, you might fetch this from a secure config or ensure it's always set.
		// For this example, we'll use a default if not set, but log a warning.
		fmt.Println("Warning: JWT_SECRET is not set or is using the default insecure value. Please set it in .env")
		if string(jwtKey) == "" {
			jwtKey = []byte("fallback_secret_key_for_dev_only") // Extremely insecure, for dev only
		}
	}
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			Issuer:    "gin-blog",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ValidateToken(tokenStr string) (*Claims, error) {
	if string(jwtKey) == "" || string(jwtKey) == "your_super_secret_key_change_this" {
		fmt.Println("Warning: JWT_SECRET is not set or is using the default insecure value during validation.")
		if string(jwtKey) == "" {
			jwtKey = []byte("fallback_secret_key_for_dev_only")
		}
	}
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