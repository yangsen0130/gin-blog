package models

import "gorm.io/gorm"

type Post struct {
	gorm.Model
	Title      string    `gorm:"not null" json:"title"`
	Content    string    `gorm:"not null" json:"content"`
	UserID     uint      `json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"User"`
	Tags       []*Tag    `gorm:"many2many:post_tags;" json:"tags"`
	CategoryID *uint     `json:"category_id,omitempty"`
	Category   *Category `gorm:"foreignKey:CategoryID" json:"Category,omitempty"`
	LikesCount int       `gorm:"default:0" json:"likes_count"`
}