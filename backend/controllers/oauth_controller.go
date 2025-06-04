package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"gin-blog/backend/database"
	"gin-blog/backend/models"
	"gin-blog/backend/utils"
	"io"
	"net/http"
	"os"
	// "strconv"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

var (
	githubOAuthConfig *oauth2.Config
	oauthStateString  = "random_string_for_state_validation"
)

func initGithubOAuthConfig() {
	if githubOAuthConfig == nil {
		githubOAuthConfig = &oauth2.Config{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("GITHUB_REDIRECT_URL"),
			Scopes:       []string{"read:user", "user:email"},
			Endpoint:     github.Endpoint,
		}
	}
}

func HandleGitHubLogin(c *gin.Context) {
	initGithubOAuthConfig()
	url := githubOAuthConfig.AuthCodeURL(oauthStateString, oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

type GitHubUserResponse struct {
	ID        int64  `json:"id"`
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
	Name      string `json:"name"`
	Email     string `json:"email"`
}

func HandleGitHubCallback(c *gin.Context) {
	initGithubOAuthConfig()
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	state := c.Query("state")
	if state != oauthStateString {
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/auth/callback#error=invalid_state", frontendURL))
		return
	}

	code := c.Query("code")
	token, err := githubOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/auth/callback#error=failed_to_exchange_code&details=%s", frontendURL, err.Error()))
		return
	}

	client := githubOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/auth/callback#error=failed_to_get_user_info&details=%s", frontendURL, err.Error()))
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/auth/callback#error=failed_to_read_user_response&details=%s", frontendURL, err.Error()))
		return
	}

	var ghUser GitHubUserResponse
	if err := json.Unmarshal(body, &ghUser); err != nil {
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/auth/callback#error=failed_to_parse_user_json&details=%s", frontendURL, err.Error()))
		return
	}

	var guestUser models.GuestUser
	err = database.DB.Where("git_hub_id = ?", ghUser.ID).First(&guestUser).Error
	if err != nil { // User not found, create new
		guestUser = models.GuestUser{
			GitHubID:    ghUser.ID,
			Username:    ghUser.Login,
			AvatarURL:   ghUser.AvatarURL,
			AccessToken: token.AccessToken,
		}
		if err := database.DB.Create(&guestUser).Error; err != nil {
			c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/auth/callback#error=failed_to_create_guest_user&details=%s", frontendURL, err.Error()))
			return
		}
	} else { // User found, update if necessary
		guestUser.Username = ghUser.Login
		guestUser.AvatarURL = ghUser.AvatarURL
		guestUser.AccessToken = token.AccessToken // Update access token
		if err := database.DB.Save(&guestUser).Error; err != nil {
			c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/auth/callback#error=failed_to_update_guest_user&details=%s", frontendURL, err.Error()))
			return
		}
	}

	jwtToken, err := utils.GenerateToken(guestUser.ID, guestUser.Username, guestUser.AvatarURL, "guest")
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/auth/callback#error=failed_to_generate_jwt&details=%s", frontendURL, err.Error()))
		return
	}

	redirectURL := fmt.Sprintf("%s/auth/callback#token=%s&guest_id=%d&username=%s&avatar_url=%s&type=guest",
		frontendURL, jwtToken, guestUser.ID, guestUser.Username, guestUser.AvatarURL)
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}