package routes

import (
	"gin-blog/backend/controllers"
	"gin-blog/backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {
	// Public routes
	authRoutes := r.Group("/api/auth")
	{
		// authRoutes.POST("/register", controllers.Register) // 删除注册路由
		authRoutes.POST("/login", controllers.Login)
	}

	// Post routes (some protected, some public)
	postRoutes := r.Group("/api/posts")
	{
		postRoutes.GET("", controllers.GetPosts)    // Get all posts (public)
		postRoutes.GET("/:id", controllers.GetPost) // Get a single post (public)

		// Protected routes for creating, updating, deleting posts
		protectedPostRoutes := postRoutes.Group("")
		protectedPostRoutes.Use(middlewares.AuthMiddleware()) // Apply auth middleware
		{
			protectedPostRoutes.POST("", controllers.CreatePost)
			protectedPostRoutes.PUT("/:id", controllers.UpdatePost)
			protectedPostRoutes.DELETE("/:id", controllers.DeletePost)
		}
	}
}
