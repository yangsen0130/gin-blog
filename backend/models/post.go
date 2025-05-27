package models

import "gorm.io/gorm"

// Post 结构体定义了文章的数据模型
type Post struct {
	gorm.Model
	Title   string `gorm:"not null" json:"title"`            // 文章标题，不能为空
	Content string `gorm:"not null" json:"content"`          // 文章内容，不能为空
	UserID  uint   `json:"user_id"`                          // 用户ID，关联到创建文章的用户
	User    User   `gorm:"foreignKey:UserID" json:"author"`  // 关联的用户信息 (属于 User)
	Tags    []*Tag `gorm:"many2many:post_tags;" json:"tags"` // 文章标签，与 Tag 模型建立多对多关系，连接表为 post_tags
}
