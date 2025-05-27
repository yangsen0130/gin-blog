package models

import "gorm.io/gorm"

// Tag 结构体定义了标签的数据模型
type Tag struct {
	gorm.Model
	Name  string  `gorm:"unique;not null" json:"name"`   // 标签名称，唯一且不能为空
	Posts []*Post `gorm:"many2many:post_tags;" json:"-"` // 反向关联到文章，json:"-"避免在序列化时产生循环引用或不必要的负载
}
