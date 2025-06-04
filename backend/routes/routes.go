package routes

import (
	"gin-blog/backend/controllers"
	"gin-blog/backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {
	api := r.Group("/api")

	authRoutes := api.Group("/auth")
	{
		authRoutes.POST("/login", controllers.Login)
		authRoutes.GET("/github/login", controllers.HandleGitHubLogin)
		authRoutes.GET("/github/callback", controllers.HandleGitHubCallback)
	}

	postRoutes := api.Group("/posts")
	{
		postRoutes.GET("", controllers.GetPosts)
		postRoutes.GET("/tag/:tagName", controllers.GetPostsByTag)
		postRoutes.GET("/:id", controllers.GetPost)
		postRoutes.POST("/:id/like", controllers.LikePost)
		postRoutes.POST("/:id/unlike", controllers.UnlikePost)

		adminPostRoutes := postRoutes.Group("")
		adminPostRoutes.Use(middlewares.AuthMiddleware(false))
		{
			adminPostRoutes.POST("", controllers.CreatePost)
			adminPostRoutes.PUT("/:id", controllers.UpdatePost)
			adminPostRoutes.DELETE("/:id", controllers.DeletePost)
		}
		
		
		commentRoutes := postRoutes.Group("/:id/comments")
		commentRoutes.Use(middlewares.AuthMiddleware(true))
		{
			commentRoutes.POST("", controllers.CreateComment)
		}
		// Public route to get comments for a post
		postRoutes.GET("/:id/comments", controllers.GetCommentsForPost)
	}

	categoryRoutes := api.Group("/categories")
	{
		categoryRoutes.GET("", controllers.GetCategories)
		
		protectedCategoryRoutes := categoryRoutes.Group("")
		protectedCategoryRoutes.Use(middlewares.AuthMiddleware(false))
		{
			protectedCategoryRoutes.POST("", controllers.CreateCategory)
		}
	}

	statsRoutes := api.Group("/stats")
	{
		statsRoutes.GET("", controllers.GetBlogStats)
	}
}