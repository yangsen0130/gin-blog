package models

import "gorm.io/gorm"

type Comment struct {
	gorm.Model
	Content     string `gorm:"not null" json:"content"`
	PostID      uint   `gorm:"not null" json:"post_id"`
	Post        Post   `json:"-"`
	GuestUserID uint   `gorm:"not null" json:"guest_user_id"`
	GuestUser   GuestUser `gorm:"foreignKey:GuestUserID" json:"guest_user"`
}