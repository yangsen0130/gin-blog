package controllers

import (
	"net/http"
	"strconv"
	"strings" // 导入 strings 包用于处理字符串

	"gin-blog/backend/database"
	"gin-blog/backend/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm" // 导入 gorm 包以使用其特定错误类型，如 gorm.ErrRecordNotFound
)

// CreatePostInput 定义了创建文章时接收的请求体结构
type CreatePostInput struct {
	Title   string   `json:"title" binding:"required"`   // 文章标题，必填
	Content string   `json:"content" binding:"required"` // 文章内容，必填
	Tags    []string `json:"tags"`                       // 文章标签名称列表，可选
}

// CreatePost 处理创建新文章的请求
func CreatePost(c *gin.Context) {
	var input CreatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		// 通常在中间件中设置userID，如果不存在则表示服务器内部错误或配置问题
		c.JSON(http.StatusInternalServerError, gin.H{"error": "上下文中未找到用户ID"})
		return
	}

	// 处理标签
	var tagsToAssociate []*models.Tag
	if len(input.Tags) > 0 {
		for _, tagName := range input.Tags {
			trimmedTagName := strings.TrimSpace(tagName) // 去除标签名称前后的空格
			if trimmedTagName == "" {
				continue // 跳过空标签
			}
			var tag models.Tag
			// 查找或创建标签：如果标签已存在则获取，不存在则创建
			err := database.DB.Where("name = ?", trimmedTagName).FirstOrCreate(&tag, models.Tag{Name: trimmedTagName}).Error
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "处理标签失败: " + err.Error()})
				return
			}
			tagsToAssociate = append(tagsToAssociate, &tag)
		}
	}

	post := models.Post{
		Title:   input.Title,
		Content: input.Content,
		UserID:  userID.(uint), // 从上下文中获取的用户ID
		// Tags 字段将在事务中通过 Association().Replace() 方法关联
	}

	// 使用数据库事务确保文章创建和标签关联的原子性
	tx := database.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "开启事务失败"})
		return
	}

	// 创建文章记录
	if err := tx.Create(&post).Error; err != nil {
		tx.Rollback() // 创建失败则回滚事务
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建文章失败"})
		return
	}

	// 关联标签到文章
	if len(tagsToAssociate) > 0 {
		if err := tx.Model(&post).Association("Tags").Replace(tagsToAssociate); err != nil {
			tx.Rollback() // 关联失败则回滚事务
			c.JSON(http.StatusInternalServerError, gin.H{"error": "关联标签到文章失败"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil { // 提交事务
		c.JSON(http.StatusInternalServerError, gin.H{"error": "提交事务失败"})
		return
	}

	// 为了确保返回的数据包含完整的关联信息（用户和标签），在事务提交后重新加载文章
	var createdPostWithDetails models.Post
	if err := database.DB.Preload("User").Preload("Tags").First(&createdPostWithDetails, post.ID).Error; err != nil {
		// 如果加载失败，仍然可以返回已创建的基础文章信息，但可能不含关联数据
		// 或者返回一个错误，取决于业务需求
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取创建后的文章详情失败", "post_id": post.ID})
		return
	}
	c.JSON(http.StatusCreated, createdPostWithDetails) // 返回创建成功的文章（包含关联数据）
}

// GetPosts 处理获取所有文章列表的请求
func GetPosts(c *gin.Context) {
	var posts []models.Post
	// 预加载 User (作者) 和 Tags (标签) 信息，并按创建时间降序排序
	// if err := database.DB.Preload("User").Order("created_at desc").Find(&posts).Error; err != nil { // 旧的查询，未包含标签
	if err := database.DB.Preload("User").Preload("Tags").Order("created_at desc").Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章列表失败"})
		return
	}
	c.JSON(http.StatusOK, posts)
}

// GetPostsByTag 处理根据标签名获取文章列表的请求
func GetPostsByTag(c *gin.Context) {
	tagName := c.Param("tagName") // 从URL路径参数中获取标签名
	if tagName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "标签名不能为空"})
		return
	}

	var tag models.Tag
	// 根据标签名查找标签
	if err := database.DB.Where("name = ?", tagName).First(&tag).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "标签未找到"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查找标签失败"})
		return
	}

	var posts []models.Post
	// 通过标签的 Posts 关联获取所有相关文章，并预加载这些文章的 User 和 Tags 信息
	// GORM 会自动处理多对多关系的查询
	err := database.DB.Model(&tag).Preload("User").Preload("Tags").Order("created_at desc").Association("Posts").Find(&posts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "根据标签获取文章失败"})
		return
	}

	c.JSON(http.StatusOK, posts)
}

// GetPost 处理获取单篇文章详情的请求
func GetPost(c *gin.Context) {
	idStr := c.Param("id")                      // 从URL路径参数中获取文章ID
	id, err := strconv.ParseUint(idStr, 10, 32) // 将ID字符串转换为uint
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID格式"})
		return
	}

	var post models.Post
	// 预加载 User (作者) 和 Tags (标签) 信息
	// if err := database.DB.Preload("User").First(&post, uint(id)).Error; err != nil { // 旧的查询，未包含标签
	if err := database.DB.Preload("User").Preload("Tags").First(&post, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound { // 如果文章未找到
			c.JSON(http.StatusNotFound, gin.H{"error": "文章未找到"})
			return
		}
		// 其他数据库错误
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文章详情失败"})
		return
	}
	c.JSON(http.StatusOK, post)
}

// UpdatePostInput 定义了更新文章时接收的请求体结构
type UpdatePostInput struct {
	Title   string   `json:"title"`   // 文章标题，可选
	Content string   `json:"content"` // 文章内容，可选
	Tags    []string `json:"tags"`    // 文章标签名称列表，可选。如果提供此字段（即使是空数组），则会更新标签关联。
}

// UpdatePost 处理更新现有文章的请求
func UpdatePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID格式"})
		return
	}

	var post models.Post
	// 查找文章，预加载现有标签以便进行比较和更新
	// if err := database.DB.First(&post, uint(id)).Error; err != nil { // 旧的查询
	if err := database.DB.Preload("Tags").First(&post, uint(id)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章未找到"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查找待更新的文章失败"})
		return
	}

	// 验证用户权限
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

	// 处理标签更新
	var tagsToUpdate []*models.Tag
	// 仅当请求中明确提供了 'tags' 字段时才处理标签更新逻辑
	// 如果 'tags' 字段为 null (即请求中未包含此字段)，则不修改现有标签
	// 如果 'tags' 字段为一个空数组 []，则表示清空文章的所有标签
	if input.Tags != nil {
		for _, tagName := range input.Tags {
			trimmedTagName := strings.TrimSpace(tagName)
			if trimmedTagName == "" {
				continue
			}
			var tag models.Tag
			err := database.DB.Where("name = ?", trimmedTagName).FirstOrCreate(&tag, models.Tag{Name: trimmedTagName}).Error
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "更新时处理标签失败: " + err.Error()})
				return
			}
			tagsToUpdate = append(tagsToUpdate, &tag)
		}
	}

	// 使用数据库事务确保更新的原子性
	tx := database.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "开启更新事务失败"})
		return
	}

	// 更新文章基本信息 (标题和内容)
	// 只有当输入中提供了相应字段时才更新
	updateData := make(map[string]interface{})
	if input.Title != "" {
		updateData["title"] = input.Title
	}
	if input.Content != "" {
		updateData["content"] = input.Content
	}

	if len(updateData) > 0 { // 如果有字段需要更新
		if err := tx.Model(&post).Updates(updateData).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新文章字段失败"})
			return
		}
	}

	// 更新标签关联：使用 Replace 方法可以处理新增、删除和保持不变的标签
	// 仅当 input.Tags 字段在请求中被提供时（即 input.Tags != nil），才执行标签替换操作
	if input.Tags != nil {
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

	// 重新加载文章以包含所有更新后的信息（包括用户和标签）
	var updatedPostWithDetails models.Post
	if err := database.DB.Preload("User").Preload("Tags").First(&updatedPostWithDetails, post.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取更新后的文章详情失败"})
		return
	}
	c.JSON(http.StatusOK, updatedPostWithDetails)
}

// DeletePost 处理删除文章的请求
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

	// 验证用户权限
	userID, _ := c.Get("userID")
	if post.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "您无权删除此文章"})
		return
	}

	// 使用事务确保删除操作的原子性
	tx := database.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "开启删除事务失败"})
		return
	}

	// 在删除文章之前，需要先清除其与标签的关联记录 (在 post_tags 连接表中)
	// GORM 的 Delete 操作对于多对多关系，默认不会自动删除连接表中的记录，需要手动清除
	if err := tx.Model(&post).Association("Tags").Clear(); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文章前清除标签关联失败"})
		return
	}

	// 删除文章本身
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
