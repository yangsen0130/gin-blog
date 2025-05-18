package database

import (
	"fmt"
	"log"
	"os"

	"gin-blog/backend/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "gin_blog.db" // Default if not set
	}

	database, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database!", err)
	}

	fmt.Println("Database connection successfully opened")

	err = database.AutoMigrate(&models.User{}, &models.Post{})
	if err != nil {
		log.Fatal("Failed to migrate database!", err)
	}
	fmt.Println("Database Migrated")

	DB = database
}