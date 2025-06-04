package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"gin-blog/backend/database"
	"gin-blog/backend/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreatePostInput struct {
	Title      string   `json:"title" binding:"required"`
	Content    string   `json:"content" binding:"required"`
	Tags       []string `json:"tags"`
	CategoryID *uint    `json:"category_id,omitempty"`
}

func CreatePost(c *gin.Context) {
	var input CreatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "上下文中未找到用户ID"})
		return
	}

	var tagsToAssociate []*models.Tag
	if len(input.Tags) > 0 {
		for _, tagName := range input.Tags {
			trimmedTagName := strings.TrimSpace(tagName)
			if trimmedTagName == "" {
				continue
			}
			var tag models.Tag
			err := database.DB.Where("name = ?", trimmedTagName).FirstOrCreate(&tag, models.Tag{Name: trimmedTagName}).Error
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "处理标签失败: " + err.Error()})
				return
			}
			tagsToAssociate = append(tagsToAssociate, &tag)
		}
	}

	post := models.Post{
		Title:      input.Title,
		Content:    input.Content,
		UserID:     userID.(uint),
		CategoryID: input.CategoryID,
	}

	tx := database.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "开启事务失败"})
		return
	}

	if err := tx.Create(&post).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建文章失败"})
		return
	}

	if len(tagsToAssociate) > 0 {
		if err := tx.Model(&post).Association("Tags").Replace(tagsToAssociate); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "关联标签到文章失败"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "提交事务失败"})
		return
	}

	var createdPostWithDetails models.Post
	if err := database.DB.Preload("User").Preload("Tags").Preload("Category").First(&createdPostWithDetails, post.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取创建后的文章详情失败", "post_id": post.ID})
		return
	}
	c.JSON(http.StatusCreated, createdPostWithDetails)
}

func GetPosts(c *gin.Context) {
	var posts []models.Post
	if err := database.DB.Preload("User").Preload("Tags").Preload("Category").Order("created_at desc").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章列表失败"})
		return
	}
	c.JSON(http.StatusOK, posts)
}

func GetPostsByTag(c *gin.Context) {
	tagName := c.Param("tagName")
	if tagName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "标签名不能为空"})
		return
	}

	var tag models.Tag
	if err := database.DB.Where("name = ?", tagName).First(&tag).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "标签未找到"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查找标签失败"})
		return
	}

	var posts []models.Post
	err := database.DB.Model(&tag).Preload("User").Preload("Tags").Preload("Category").Order("created_at desc").Association("Posts").Find(&posts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "根据标签获取文章失败"})
		return
	}

	c.JSON(http.StatusOK, posts)
}

func GetPost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID格式"})
		return
	}

	var post models.Post
	if err := database.DB.Preload("User").Preload("Tags").Preload("Category").First(&post, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章未找到"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章详情失败"})
		return
	}
	c.JSON(http.StatusOK, post)
}

type UpdatePostInput struct {
	Title       *string  `json:"title,omitempty"`
	Content     *string  `json:"content,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	CategoryID  *uint    `json:"category_id,omitempty"`
	SetCategory *bool    `json:"set_category,omitempty"`
}

func UpdatePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID格式"})
		return
	}

	var post models.Post
	if err := database.DB.Preload("Tags").First(&post, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章未找到"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查找待更新的文章失败"})
		return
	}

	userID, _ := c.Get("userID")
	if post.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "您无权修改此文章"})
		return
	}

	var input UpdatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "开启更新事务失败"})
		return
	}

	updateMap := make(map[string]interface{})
	if input.Title != nil {
		updateMap["title"] = *input.Title
	}
	if input.Content != nil {
		updateMap["content"] = *input.Content
	}
	if input.SetCategory != nil && *input.SetCategory {
		updateMap["category_id"] = input.CategoryID
	}

	if len(updateMap) > 0 {
		if err := tx.Model(&post).Updates(updateMap).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新文章字段失败"})
			return
		}
	}

	if input.Tags != nil {
		var tagsToUpdate []*models.Tag
		if len(input.Tags) > 0 {
			for _, tagName := range input.Tags {
				trimmedTagName := strings.TrimSpace(tagName)
				if trimmedTagName == "" {
					continue
				}
				var tag models.Tag
				err := database.DB.Where("name = ?", trimmedTagName).FirstOrCreate(&tag, models.Tag{Name: trimmedTagName}).Error
				if err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "更新时处理标签失败: " + err.Error()})
					return
				}
				tagsToUpdate = append(tagsToUpdate, &tag)
			}
		}
		if err := tx.Model(&post).Association("Tags").Replace(tagsToUpdate); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新文章标签关联失败"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "提交更新事务失败"})
		return
	}

	var updatedPostWithDetails models.Post
	if err := database.DB.Preload("User").Preload("Tags").Preload("Category").First(&updatedPostWithDetails, post.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取更新后的文章详情失败"})
		return
	}
	c.JSON(http.StatusOK, updatedPostWithDetails)
}

func DeletePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID格式"})
		return
	}

	var post models.Post
	if err := database.DB.First(&post, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章未找到"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查找待删除的文章失败"})
		return
	}

	userID, _ := c.Get("userID")
	if post.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "您无权删除此文章"})
		return
	}

	tx := database.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "开启删除事务失败"})
		return
	}

	if err := tx.Model(&post).Association("Tags").Clear(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文章前清除标签关联失败"})
		return
	}

	if err := tx.Delete(&post).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文章失败"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "提交删除事务失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "文章删除成功"})
}

// LikePost 增加文章点赞数
func LikePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID格式"})
		return
	}

	var post models.Post
	if err := database.DB.First(&post, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章未找到"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查找文章失败"})
		return
	}

	// 增加点赞数
	if err := database.DB.Model(&post).UpdateColumn("likes_count", gorm.Expr("likes_count + ?", 1)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新点赞数失败"})
		return
	}

	// 获取更新后的文章数据
	if err := database.DB.Preload("User").Preload("Tags").Preload("Category").First(&post, uint(id)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取更新后的文章数据失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "点赞成功",
		"post":    post,
	})
}

// UnlikePost 减少文章点赞数
func UnlikePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID格式"})
		return
	}

	var post models.Post
	if err := database.DB.First(&post, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章未找到"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查找文章失败"})
		return
	}

	// 减少点赞数，但不能小于0
	if err := database.DB.Model(&post).Where("likes_count > 0").UpdateColumn("likes_count", gorm.Expr("likes_count - ?", 1)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新点赞数失败"})
		return
	}

	// 获取更新后的文章数据
	if err := database.DB.Preload("User").Preload("Tags").Preload("Category").First(&post, uint(id)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取更新后的文章数据失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "取消点赞成功",
		"post":    post,
	})
}

// GetBlogStats 获取博客统计信息
func GetBlogStats(c *gin.Context) {
	var totalPosts int64
	var totalLikes int64

	// 获取文章总数
	if err := database.DB.Model(&models.Post{}).Count(&totalPosts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章总数失败"})
		return
	}

	// 获取总点赞数
	if err := database.DB.Model(&models.Post{}).Select("COALESCE(SUM(likes_count), 0)").Scan(&totalLikes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取总点赞数失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_posts": totalPosts,
		"total_likes": totalLikes,
		"total_views": 12580, // 这里可以后续实现真实的浏览量统计
		"total_comments": 348, // 这里可以后续实现真实的评论统计
	})
}