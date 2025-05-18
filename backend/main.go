package main

import (
	"log"
	"os"

	"gin-blog/backend/database"
	"gin-blog/backend/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, using default or environment variables")
	}

	// Initialize Database
	database.ConnectDatabase()

	// Initialize Gin router
	r := gin.Default()

	// CORS Middleware
	// Adjust origins as needed for your frontend URL
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"} // Frontend URL
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// Setup Routes
	routes.SetupRouter(r)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port if not specified
	}
	log.Printf("Server is running on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to run server: ", err)
	}
}