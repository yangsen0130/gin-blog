package models

import "gorm.io/gorm"

type GuestUser struct {
	gorm.Model
	GitHubID    int64  `gorm:"unique;not null"`
	Username    string `gorm:"not null"`
	AvatarURL   string
	AccessToken string `json:"-"`
}