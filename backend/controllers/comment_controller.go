package controllers

import (
	"gin-blog/backend/database"
	"gin-blog/backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateCommentInput struct {
	Content string `json:"content" binding:"required"`
}

func CreateComment(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID format"})
		return
	}

	var input CreateCommentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	guestUserID, exists := c.Get("guestUserID")
	if !exists || c.GetString("userType") != "guest" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated or not a guest user"})
		return
	}

	var post models.Post
	if err := database.DB.First(&post, uint(postID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	comment := models.Comment{
		Content:     input.Content,
		PostID:      uint(postID),
		GuestUserID: guestUserID.(uint),
	}

	if err := database.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}
	
	database.DB.Preload("GuestUser").First(&comment, comment.ID)
	c.JSON(http.StatusCreated, comment)
}

func GetCommentsForPost(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID format"})
		return
	}

	var comments []models.Comment
	if err := database.DB.Preload("GuestUser").Where("post_id = ?", uint(postID)).Order("created_at asc").Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve comments"})
		return
	}

	c.JSON(http.StatusOK, comments)
}