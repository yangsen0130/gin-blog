package main

import (
	"log"
	"os"

	"gin-blog/backend/database"
	"gin-blog/backend/models"
	"gin-blog/backend/routes"
	"gin-blog/backend/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv" // 确保导入
	"gorm.io/gorm"
)

// setupAdminUser 从 .env 文件读取管理员凭据并在数据库中创建/更新管理员用户
func setupAdminUser() {
	adminUsername := os.Getenv("ADMIN_USERNAME")
	adminPassword := os.Getenv("ADMIN_PASSWORD")

	if adminUsername == "" || adminPassword == "" {
		log.Println("ADMIN_USERNAME or ADMIN_PASSWORD not set in .env. Skipping admin user setup.")
		return
	}

	var adminUser models.User
	// 检查管理员用户是否已存在
	err := database.DB.Where("username = ?", adminUsername).First(&adminUser).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// 用户不存在，创建新用户
			log.Printf("Admin user '%s' not found. Creating new admin user.", adminUsername)
			hashedPassword, hashErr := utils.HashPassword(adminPassword)
			if hashErr != nil {
				log.Fatalf("Failed to hash admin password: %v", hashErr)
				return
			}
			adminUser = models.User{
				Username: adminUsername,
				Password: hashedPassword,
			}
			if createErr := database.DB.Create(&adminUser).Error; createErr != nil {
				log.Fatalf("Failed to create admin user '%s': %v", adminUsername, createErr)
				return
			}
			log.Printf("Admin user '%s' created successfully.", adminUsername)
		} else {
			// 其他数据库错误
			log.Fatalf("Error checking for admin user '%s': %v", adminUsername, err)
			return
		}
	} else {
		// 用户已存在，检查密码是否需要更新 (基于.env文件是密码的真实来源)
		log.Printf("Admin user '%s' found. Checking if password update is needed.", adminUsername)
		hashedPassword, hashErr := utils.HashPassword(adminPassword)
		if hashErr != nil {
			log.Fatalf("Failed to hash admin password for update: %v", hashErr)
			return
		}
		if adminUser.Password != hashedPassword {
			adminUser.Password = hashedPassword
			if updateErr := database.DB.Save(&adminUser).Error; updateErr != nil {
				log.Fatalf("Failed to update password for admin user '%s': %v", adminUsername, updateErr)
				return
			}
			log.Printf("Password for admin user '%s' updated successfully based on .env configuration.", adminUsername)
		} else {
			log.Printf("Password for admin user '%s' is already up-to-date with .env configuration.", adminUsername)
		}
	}
}

func main() {
	// 优先尝试加载 .env.local
	errLocal := godotenv.Load(".env.local")
	if errLocal != nil {
		// 如果 .env.local 加载失败（例如文件不存在），则尝试加载 .env
		log.Println("Info: .env.local file not found or failed to load, trying .env file.")
		errEnv := godotenv.Load() // 默认加载 .env
		if errEnv != nil {
			log.Println("Warning: Neither .env.local nor .env file could be loaded. Using default or system environment variables. Error for .env:", errEnv)
		} else {
			log.Println("Info: .env file loaded successfully.")
		}
	} else {
		log.Println("Info: .env.local file loaded successfully.")
	}

	database.ConnectDatabase()
	setupAdminUser() // 确保管理员用户已设置

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"} // 前端地址
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	routes.SetupRouter(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // 默认端口
	}
	log.Printf("Server is running on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to run server: ", err)
	}
}
