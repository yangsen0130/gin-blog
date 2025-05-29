package routes

import (
	"gin-blog/backend/controllers"
	"gin-blog/backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {
	authRoutes := r.Group("/api/auth")
	{
		authRoutes.POST("/login", controllers.Login)
	}

	postRoutes := r.Group("/api/posts")
	{
		postRoutes.GET("", controllers.GetPosts)
		postRoutes.GET("/tag/:tagName", controllers.GetPostsByTag)
		postRoutes.GET("/:id", controllers.GetPost)

		protectedPostRoutes := postRoutes.Group("")
		protectedPostRoutes.Use(middlewares.AuthMiddleware())
		{
			protectedPostRoutes.POST("", controllers.CreatePost)
			protectedPostRoutes.PUT("/:id", controllers.UpdatePost)
			protectedPostRoutes.DELETE("/:id", controllers.DeletePost)
		}
	}

	categoryRoutes := r.Group("/api/categories")
	{
		categoryRoutes.GET("", controllers.GetCategories)
		
		protectedCategoryRoutes := categoryRoutes.Group("")
		protectedCategoryRoutes.Use(middlewares.AuthMiddleware())
		{
			protectedCategoryRoutes.POST("", controllers.CreateCategory)
		}
	}
}