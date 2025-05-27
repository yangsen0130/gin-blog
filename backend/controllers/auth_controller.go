package controllers

import (
	"net/http"
	"os"

	// "os" // 不再需要 os

	"gin-blog/backend/database"
	"gin-blog/backend/models"
	"gin-blog/backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// type RegisterInput struct { // 删除 RegisterInput 结构体
// 	Username string `json:"username" binding:"required,min=3"`
// 	Password string `json:"password" binding:"required,min=6"`
// }

// func Register(c *gin.Context) { // 删除整个 Register 函数
// 	var input RegisterInput
// 	if err := c.ShouldBindJSON(&input); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}

// 	adminUsernameFromEnv := os.Getenv("ADMIN_USERNAME")
// 	if adminUsernameFromEnv != "" && input.Username == adminUsernameFromEnv {
// 		c.JSON(http.StatusForbidden, gin.H{"error": "This username is reserved and cannot be registered."})
// 		return
// 	}

// 	var existingUser models.User
// 	if err := database.DB.Where("username = ?", input.Username).First(&existingUser).Error; err == nil {
// 		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
// 		return
// 	} else if err != gorm.ErrRecordNotFound {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking username"})
// 		return
// 	}

// 	user := models.User{Username: input.Username}
// 	if err := user.HashPassword(input.Password); err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
// 		return
// 	}

// 	if err := database.DB.Create(&user).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
// 		return
// 	}

// 	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully", "user_id": user.ID, "username": user.Username})
// }

type LoginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"}) // 无效的用户名或密码
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"}) // 数据库错误
		return
	}

	// 检查是否是管理员尝试登录
	adminUsernameFromEnv := os.Getenv("ADMIN_USERNAME")
	if adminUsernameFromEnv != "" && user.Username != adminUsernameFromEnv {
		// 如果配置了管理员用户名，但尝试登录的不是该管理员，则拒绝
		// 这一步是额外的安全措施，确保只有配置的管理员能通过此接口登录
		// 如果未来可能有多用户，则需要调整此逻辑
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Login restricted to admin user only"}) // 仅限管理员用户登录
		return
	}

	if err := user.CheckPassword(input.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"}) // 无效的用户名或密码
		return
	}

	token, err := utils.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"}) // 生成令牌失败
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user_id": user.ID, "username": user.Username})
}
