package database

import (
	"fmt"
	"log"
	"os"

	"gin-blog/backend/models" // 确保导入了 models 包
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB // 全局数据库连接实例

// ConnectDatabase 初始化并连接数据库，同时执行自动迁移
func ConnectDatabase() {
	dbName := os.Getenv("DB_NAME") // 从环境变量获取数据库名称
	if dbName == "" {
		dbName = "gin_blog.db" // 如果未设置，使用默认名称
	}

	// 连接数据库
	database, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		log.Fatal("无法连接到数据库!", err)
	}

	fmt.Println("数据库连接成功打开")

	// 自动迁移数据库表结构
	// err = database.AutoMigrate(&models.User{}, &models.Post{}) // 旧的迁移命令
	err = database.AutoMigrate(&models.User{}, &models.Post{}, &models.Tag{}) // 添加 Tag 模型到自动迁移列表
	if err != nil {
		log.Fatal("数据库迁移失败!", err)
	}
	fmt.Println("数据库已迁移")

	DB = database // 将数据库实例赋值给全局变量
}
