package routes

import (
	"gin-blog/backend/controllers" // 确保导入了 controllers 包
	"gin-blog/backend/middlewares" // 确保导入了 middlewares 包

	"github.com/gin-gonic/gin"
)

// SetupRouter 配置应用的所有路由
func SetupRouter(r *gin.Engine) {
	// 公共认证路由组
	authRoutes := r.Group("/api/auth")
	{
		// authRoutes.POST("/register", controllers.Register) // 根据您的需求，注册路由已被移除
		authRoutes.POST("/login", controllers.Login) // 用户登录接口
	}

	// 文章相关路由组
	postRoutes := r.Group("/api/posts")
	{
		// 公开访问的接口
		postRoutes.GET("", controllers.GetPosts)                   // 获取所有文章列表
		postRoutes.GET("/tag/:tagName", controllers.GetPostsByTag) // 新增：根据标签名获取文章列表
		postRoutes.GET("/:id", controllers.GetPost)                // 获取单篇文章详情

		// 需要认证保护的接口 (创建、更新、删除文章)
		protectedPostRoutes := postRoutes.Group("")           // 创建一个子路由组应用中间件
		protectedPostRoutes.Use(middlewares.AuthMiddleware()) // 对此子路由组下的所有路由应用认证中间件
		{
			protectedPostRoutes.POST("", controllers.CreatePost)       // 创建新文章
			protectedPostRoutes.PUT("/:id", controllers.UpdatePost)    // 更新指定ID的文章
			protectedPostRoutes.DELETE("/:id", controllers.DeletePost) // 删除指定ID的文章
		}
	}
}
