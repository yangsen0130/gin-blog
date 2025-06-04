<template>
  <div class="post-detail-page">
    <header class="page-header">
      <router-link to="/" class="back-link">&larr; 返回首页</router-link>
    </header>
    <div class="container">
      <div v-if="loading" class="loading-indicator">正在加载文章...</div>
      <div v-if="error" class="error-message">
        错误: {{ error }}
      </div>

      <article v-if="post && !loading" class="post-content card">
        <div class="post-header-section">
          <div class="post-title-area">
            <h1>{{ post.title }}</h1>
            <div class="post-meta-detail">
              <span>作者: {{ post.User?.username || '未知作者' }}</span>
              <span v-if="post.Category">分类: {{ post.Category.name }}</span>
              <span>发布于: {{ formatDate(post.CreatedAt) }}</span>
              <span v-if="post.UpdatedAt && post.UpdatedAt !== post.CreatedAt">
                最后更新: {{ formatDate(post.UpdatedAt) }}
              </span>
            </div>
          </div>
          <div class="post-actions-top">
            <button 
              @click="toggleLike" 
              class="like-button-top"
              :class="{ liked: isLiked }"
              :disabled="likeLoading"
            >
              <span class="like-icon">{{ isLiked ? '👍' : '👍' }}</span>
              <span class="like-count">{{ post.likes_count || 0 }}</span>
            </button>
          </div>
        </div>
        
        <div class="post-tags-section" v-if="post.tags && post.tags.length > 0">
          <strong>标签:</strong>
          <span v-for="tag in post.tags" :key="tag.ID" class="tag-chip">
            {{ tag.name }}
          </span>
        </div>
        
        <div class="post-body" v-html="formattedContent"></div>

        <!-- Comments Section -->
        <section class="comments-section">
          <h2>评论 ({{ comments.length }})</h2>
          
          <div v-if="authStore.isGuest" class="comment-form">
            <div class="comment-user-info">
              <img :src="authStore.currentUser.avatarUrl" alt="avatar" class="comment-avatar" v-if="authStore.currentUser.avatarUrl"/>
              <span>以 {{ authStore.currentUser.username }} 的身份评论</span>
              <button @click="authStore.logout()" class="btn-logout-comment">注销</button>
            </div>
            <textarea v-model="newCommentContent" placeholder="留下你的评论..." rows="4"></textarea>
            <button @click="submitComment" :disabled="commentLoading || !newCommentContent.trim()" class="btn-submit-comment">
              {{ commentLoading ? '提交中...' : '提交评论' }}
            </button>
            <p v-if="commentError" class="comment-error">{{ commentError }}</p>
          </div>
          <div v-else-if="!authStore.isAuthenticated" class="comment-login-section">
            <button @click="loginWithGitHub" class="btn-github-login">
              <svg aria-hidden="true" height="20" viewBox="0 0 16 16" version="1.1" width="20" data-view-component="true" class="github-logo">
                  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.19.01-.82.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21-.15.46-.55.38A8.013 8.013 0 0 1 8 0Z"></path>
              </svg>
              使用 GitHub 登录并评论
            </button>
          </div>
          
           <div v-else-if="authStore.isAdmin">
            <p>管理员账户不能直接评论，请使用 GitHub 访客账户登录进行评论。</p>
          </div>


          <div v-if="commentsLoading" class="loading-indicator">加载评论中...</div>
          <ul v-if="!commentsLoading && comments.length > 0" class="comment-list">
            <li v-for="comment in comments" :key="comment.ID" class="comment-item">
              <div class="comment-item-header">
                <img :src="comment.guest_user?.AvatarURL || 'https://via.placeholder.com/40'" alt="avatar" class="comment-avatar"/>
                <span class="comment-author">{{ comment.guest_user?.Username || '匿名用户' }}</span>
                <span class="comment-date">{{ formatCommentDate(comment.CreatedAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
            </li>
          </ul>
          <p v-if="!commentsLoading && comments.length === 0 && !commentsError">暂无评论。</p>
           <p v-if="commentsError" class="comment-error">加载评论失败: {{ commentsError }}</p>
        </section>

      </article>
      <div v-if="!post && !loading && !error" class="no-post-found-message">
        文章未加载或不存在。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { 
  fetchPostById, 
  likePost, 
  unlikePost,
  GITHUB_LOGIN_URL,
  fetchCommentsByPostId,
  createComment
} from '../../api';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { marked } from 'marked';
import hljs from 'highlight.js';

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
});

const post = ref(null);
const loading = ref(true);
const error = ref(null);
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isLiked = ref(false); // This should ideally be fetched based on user's like status
const likeLoading = ref(false);

// Comments state
const comments = ref([]);
const commentsLoading = ref(false);
const commentsError = ref(null);
const newCommentContent = ref('');
const commentLoading = ref(false);
const commentError = ref(null);


const postId = computed(() => {
  const idVal = parseInt(props.id || route.params.id);
  return idVal;
});

const loadPost = async () => {
  const currentPostId = postId.value;
  if (isNaN(currentPostId)) {
    error.value = "无效的文章ID。";
    loading.value = false;
    post.value = null;
    return;
  }
  loading.value = true;
  error.value = null;
  post.value = null;
  try {
    const response = await fetchPostById(currentPostId);
    if (response && response.data) {
      if (postId.value === currentPostId) {
        post.value = response.data;
        if (!post.value || typeof post.value.title === 'undefined') {
          error.value = '获取到的文章数据不完整或为空。';
          post.value = null;
        } else {
          loadComments(); // Load comments after post is loaded
        }
      }
    } else {
      if (postId.value === currentPostId) {
        error.value = '未能获取有效文章数据。'; post.value = null;
      }
    }
  } catch (err) {
    if (postId.value === currentPostId) {
      error.value = `加载文章详情失败: ${err.response?.data?.error || err.message}`;
      if (err.response?.status === 404) { error.value = '文章未找到。'; }
      post.value = null;
    }
  } finally {
    if (postId.value === currentPostId) { loading.value = false; }
  }
};

const toggleLike = async () => {
  if (likeLoading.value) return;
  likeLoading.value = true;
  try {
    let response;
    if (isLiked.value) {
      response = await unlikePost(post.value.ID);
      isLiked.value = false;
    } else {
      response = await likePost(post.value.ID);
      isLiked.value = true;
    }
    if (response.data && response.data.post) {
      post.value.likes_count = response.data.post.likes_count;
    }
  } catch (err) {
    console.error('点赞操作失败:', err);
    isLiked.value = !isLiked.value; // Revert UI on error
  } finally {
    likeLoading.value = false;
  }
};

const loadComments = async () => {
  if (isNaN(postId.value)) return;
  commentsLoading.value = true;
  commentsError.value = null;
  try {
    const response = await fetchCommentsByPostId(postId.value);
    comments.value = response.data;
  } catch (err) {
    commentsError.value = err.response?.data?.error || err.message || '无法加载评论。';
  } finally {
    commentsLoading.value = false;
  }
};

const submitComment = async () => {
  if (!newCommentContent.value.trim() || isNaN(postId.value)) return;
  commentLoading.value = true;
  commentError.value = null;
  try {
    const response = await createComment(postId.value, { content: newCommentContent.value });
    comments.value.push(response.data);
    newCommentContent.value = '';
  } catch (err) {
    commentError.value = err.response?.data?.error || err.message || '无法提交评论。';
     if (err.response?.status === 401) { // Token might have expired
        commentError.value = '您的会话已过期，请重新登录后评论。';
        authStore.logout(); // Log out guest
    }
  } finally {
    commentLoading.value = false;
  }
};

const loginWithGitHub = () => {
  localStorage.setItem('oauth_redirect_path', route.fullPath);
  window.location.href = GITHUB_LOGIN_URL;
};


watch(postId, (newId, oldId) => {
  if (newId !== oldId && !isNaN(newId)) {
    loadPost(); // This will also trigger loadComments if successful
  } else if (isNaN(newId)) {
    post.value = null; error.value = '无效的文章ID参数。'; loading.value = false;
    comments.value = []; // Clear comments if post ID is invalid
  }
}, { immediate: false }); // Changed immediate to false, onMounted handles initial load

onMounted(() => {
  if (!isNaN(postId.value)) {
    loadPost();
  } else {
    error.value = "文章ID无效 (onMounted)。"; loading.value = false; post.value = null;
  }
  // Clear any auth errors from previous attempts when page loads
  if(authStore.error) authStore.clearError();
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatCommentDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const formattedContent = computed(() => {
  if (!post.value || !post.value.content) return '';
  marked.setOptions({
    highlight: function(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-', pedantic: false, gfm: true, breaks: false, sanitize: false, smartypants: false, xhtml: false
  });
  return marked(post.value.content);
});

</script>

<style scoped>
/* Existing styles for PostDetail ... */
.post-detail-page {
  padding-bottom: 40px;
}
.page-header {
  background-color: #f8f9fa;
  padding: 15px 0;
  margin-bottom: 30px;
  border-bottom: 1px solid #e9ecef;
}
.back-link {
  font-size: 1rem;
  color: #007bff;
  text-decoration: none;
  margin-left: 5%;
}
.back-link:hover {
  text-decoration: underline;
}

.container {
  width: 90%;
  max-width: 800px;
  margin: 0 auto;
}

.loading-indicator, .no-post-found-message {
  text-align: center;
  font-size: 1.2em;
  color: #555;
  padding: 40px 0;
}

.error-message {
  color: red;
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  padding: 10px;
  border-radius: 0;
  margin: 20px auto;
  width: fit-content;
  max-width: 90%;
  text-align: left;
  word-break: break-all;
}

.card {
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.post-content {
  padding: 30px;
}

.post-header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.post-title-area {
  flex: 1;
}

.post-content h1 {
  font-size: 2.5rem;
  margin: 0 0 15px 0;
  line-height: 1.3;
  color: #333;
}

.post-meta-detail {
  font-size: 0.9rem;
  color: #6c757d;
}

.post-meta-detail span {
  margin-right: 15px;
}

.post-actions-top {
  margin-left: 20px;
  flex-shrink: 0;
}

.like-button-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s ease;
  min-width: 70px;
}

.like-button-top:hover {
  border-color: #007bff;
  transform: translateY(-2px);
}

.like-button-top.liked {
  border-color: #007bff;
  background-color: #007bff;
  color: white;
}

.like-button-top.liked .like-icon {
  filter: none;
}

.like-button-top:not(.liked) .like-icon {
  filter: grayscale(100%);
}

.like-button-top:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.like-button-top .like-icon {
  font-size: 24px;
  transition: filter 0.3s ease;
}

.like-button-top .like-count {
  font-weight: 600;
  font-size: 13px;
}

.post-tags-section {
  margin-bottom: 30px;
  font-size: 0.9rem;
}

.post-tags-section strong {
  color: #333;
  margin-right: 10px;
}

.tag-chip {
  display: inline-block;
  background-color: #f1f3f4;
  color: #5f6368;
  padding: 4px 12px;
  margin-right: 8px;
  margin-bottom: 4px;
  border-radius: 16px;
  font-size: 0.8rem;
  transition: background-color 0.2s;
}

.tag-chip:hover {
  background-color: #e8eaed;
}

.post-body {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.post-body :deep(p) {
  margin-bottom: 1.5em;
}

.post-body :deep(h2) {
  font-size: 1.8rem;
  margin-top: 2em;
  margin-bottom: 1em;
}

.post-body :deep(h3) {
  font-size: 1.5rem;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
}

.post-body :deep(pre) {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 1.5em;
}

.post-body :deep(code) {
  font-family: 'Courier New', Courier, monospace;
}

.post-body :deep(pre code.hljs) {
  display: block;
  overflow-x: auto;
  padding: 1em;
  background: transparent;
}

.post-body :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

.post-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5em;
}

.post-body :deep(th), .post-body :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.post-body :deep(th) {
  background-color: #f2f2f2;
}

/* Comments Section Styles */
.comments-section {
  margin-top: 50px;
  padding-top: 30px;
  border-top: 2px solid #eee;
}

.comments-section h2 {
  font-size: 1.5rem;
  margin-bottom: 25px;
  color: #333;
}

.comment-form {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.comment-user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #666;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.btn-logout-comment {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  margin-left: auto;
}

.btn-logout-comment:hover {
  background-color: #dc3545;
  color: white;
}

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 15px;
}

.btn-submit-comment {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-submit-comment:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-submit-comment:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-login-section {
  text-align: center;
  padding: 30px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 30px;
}

.btn-github-login {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #24292e;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-github-login:hover {
  background-color: #1a1e22;
}

.github-logo {
  fill: currentColor;
}

.comment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.comment-item {
  background-color: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.comment-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.comment-author {
  font-weight: 600;
  color: #333;
}

.comment-date {
  color: #666;
  margin-left: auto;
}

.comment-text {
  margin: 0;
  line-height: 1.6;
  color: #333;
}

.comment-error {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 10px;
}

.no-post-found-message {
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  padding: 40px 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .post-content {
    padding: 20px;
  }
  
  .post-header-section {
    flex-direction: column;
    gap: 20px;
  }
  
  .post-actions-top {
    align-self: flex-end;
    margin-left: 0;
  }
  
  .post-content h1 {
    font-size: 2rem;
  }
  
  .comment-form {
    padding: 15px;
  }
  
  .comment-user-info {
    flex-wrap: wrap;
  }
}
</style>