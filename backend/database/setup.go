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
		dbName = "gin_blog.db"
	}

	database, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		log.Fatal("无法连接到数据库!", err)
	}

	fmt.Println("数据库连接成功打开")

	err = database.AutoMigrate(&models.User{}, &models.Post{}, &models.Tag{}, &models.Category{})
	if err != nil {
		log.Fatal("数据库迁移失败!", err)
	}
	fmt.Println("数据库已迁移")

	DB = database
}