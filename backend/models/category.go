package models

import "gorm.io/gorm"

type Category struct {
	gorm.Model
	Name  string  `gorm:"unique;not null" json:"name"`
	Posts []*Post `gorm:"foreignKey:CategoryID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"-"`
}