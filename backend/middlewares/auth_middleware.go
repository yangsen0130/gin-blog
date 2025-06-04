package middlewares

import (
	"net/http"
	"strings"

	"gin-blog/backend/utils"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(allowGuests bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		tokenStr := parts[1]
		claims, err := utils.ValidateToken(tokenStr)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token: " + err.Error()})
			c.Abort()
			return
		}

		if claims.UserID != 0 {
			c.Set("userID", claims.UserID)
			c.Set("username", claims.Username)
			c.Set("userType", "admin")
		} else if claims.GuestUserID != 0 {
			if !allowGuests {
				c.JSON(http.StatusForbidden, gin.H{"error": "Guest users are not permitted for this action"})
				c.Abort()
				return
			}
			c.Set("guestUserID", claims.GuestUserID)
			c.Set("username", claims.Username)
			c.Set("avatarURL", claims.AvatarURL)
			c.Set("userType", "guest")
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token: Missing user identifier"})
			c.Abort()
			return
		}
		c.Next()
	}
}