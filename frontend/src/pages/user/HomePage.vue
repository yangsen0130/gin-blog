<template>
  <div class="blog-container">
    <!-- 顶部导航栏 -->
    <header class="blog-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="blog-title">Yangsen's Blog</h1>
        </div>
        <div class="header-center">
          <div class="search-box">
            <input type="text" placeholder="Search" v-model="searchQuery" @keyup.enter="handleSearch">
            <span class="search-shortcut">⌘ K</span>
          </div>
        </div>
        <div class="header-right">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link v-if="authStore.isAuthenticated" :to="{ name: 'AdminDashboard' }" class="nav-link">管理后台</router-link>
          <button class="menu-btn">⋯</button>
        </div>
      </div>
    </header>

    <!-- Banner 区域 -->
    <section class="hero-banner">
      <h2 class="hero-title">Yangsen's Blog</h2>
      
    </section>

    <!-- 主内容区域 -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- 左侧文章列表 -->
        <div class="posts-section">
          <div v-if="loading" class="loading-indicator">正在加载文章...</div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="!loading && posts.length === 0 && !error" class="no-posts-message">
            还没有发布的文章哦！
          </div>

          <div class="posts-list" v-if="!loading && posts.length > 0">
            <PostCard v-for="post in posts" :key="post.ID" :post="post" />
          </div>
        </div>

        <!-- 右侧边栏 -->
        <aside class="sidebar">
          <!-- 个人信息卡片 -->
          <div class="profile-card">
            <div class="profile-avatar">
              <div class="avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <h3 class="profile-name">Yangsen</h3>
            <div class="profile-stats">
              <div class="stat-item">
                <div class="stat-value">{{ posts.length || 36 }}</div>
                <div class="stat-label">博客文章</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">4+</div>
                <div class="stat-label">本月更新</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">0+</div>
                <div class="stat-label">本周更新</div>
              </div>
            </div>
          </div>

          <!-- 精选文章 -->
          <div class="featured-posts">
            <h3 class="section-title">🔥 精选文章</h3>
            <ul class="featured-list">
              <li v-for="(post, index) in featuredPosts" :key="index" class="featured-item">
                <span class="featured-number">{{ index + 1 }}</span>
                <router-link :to="{ name: 'PostDetail', params: { id: post.ID } }" class="featured-link">
                  {{ post.title }}
                </router-link>
                <span class="featured-date">{{ formatShortDate(post.CreatedAt) }}</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { fetchPosts } from '../../api';
import PostCard from '../../components/user/PostCard.vue';
import { useAuthStore } from '../../store/auth';

const posts = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const authStore = useAuthStore();

const featuredPosts = computed(() => {
  return [...posts.value].slice(0, 5);
});

const loadPosts = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetchPosts();
    posts.value = response.data;
  } catch (err) {
    error.value = '加载文章列表失败: ' + (err.response?.data?.error || err.message);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  console.log('Search:', searchQuery.value);
};

const formatShortDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

onMounted(loadPosts);
</script>

<style scoped>
.blog-container {
  min-height: 100vh;
  background-color: #ffffff;
  position: relative;
  overflow-x: hidden;
}

.blog-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 70vh;
  background: radial-gradient(
      ellipse at 80% 20%,
      rgba(120, 170, 255, 0.35) 0%,
      rgba(170, 140, 255, 0.25) 40%,
      rgba(240, 130, 220, 0.2) 75%,
      rgba(255, 255, 255, 0) 100%
  );
  filter: blur(100px);
  z-index: 0;
  pointer-events: none;
}

.blog-header {
  background-color: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  flex: 0 0 auto;
}

.blog-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 40px;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-box input {
  width: 100%;
  padding: 8px 40px 8px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
  background-color: #f5f5f5;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #666;
  background-color: white;
}

.search-shortcut {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #999;
  background-color: white;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #e5e5e5;
}

.header-right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-link {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #1a1a1a;
  text-decoration: none;
}

.menu-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
}

.hero-banner {
  background-color: transparent;
  color: #1a1a1a;
  padding: 80px 20px;
  text-align: center;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.hero-banner::before {
  display: none;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 20px 0;
  position: relative;
  z-index: 1;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 40px;
  align-items: start;
}

.posts-section {
  min-width: 0;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loading-indicator,
.no-posts-message {
  text-align: center;
  padding: 40px;
  color: #666;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sidebar {
  position: sticky;
  top: 84px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.profile-avatar {
  margin: 0 auto 20px;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto;
}

.avatar-placeholder svg {
  width: 40px;
  height: 40px;
}

.profile-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #1a1a1a;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
}

.featured-posts {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1a1a1a;
}

.featured-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.featured-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.featured-item:last-child {
  border-bottom: none;
}

.featured-number {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  background-color: #f0f0f0;
  color: #666;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.featured-item:nth-child(1) .featured-number {
  background-color: #ff6b6b;
  color: white;
}

.featured-item:nth-child(2) .featured-number {
  background-color: #4ecdc4;
  color: white;
}

.featured-item:nth-child(3) .featured-number {
  background-color: #45b7d1;
  color: white;
}

.featured-link {
  flex: 1;
  color: #1a1a1a;
  text-decoration: none;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured-link:hover {
  color: #667eea;
  text-decoration: none;
}

.featured-date {
  flex: 0 0 auto;
  font-size: 12px;
  color: #999;
}

@media (max-width: 768px) {
  .header-center {
    display: none;
  }

  .hero-title {
    font-size: 2rem;
  }

  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .sidebar {
    position: static;
  }
}
</style>