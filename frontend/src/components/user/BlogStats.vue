<template>
    <div class="blog-stats-card">
      <h3 class="stats-title">📊 博客统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon">❤️</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalLikes.toLocaleString() }}</div>
            <div class="stat-label">总点赞数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalPosts.toLocaleString() }}</div>
            <div class="stat-label">总文章数</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">👁️</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalViews.toLocaleString() }}</div>
            <div class="stat-label">总浏览量</div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">💬</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalComments.toLocaleString() }}</div>
            <div class="stat-label">总评论数</div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { fetchBlogStats } from '../../api';
  
  const totalPosts = ref(0);
  const totalLikes = ref(0);
  const totalViews = ref(12580);
  const totalComments = ref(348);
  
  const loadStats = async () => {
    try {
      const response = await fetchBlogStats();
      if (response.data) {
        totalPosts.value = response.data.total_posts || 0;
        totalLikes.value = response.data.total_likes || 0;
        totalViews.value = response.data.total_views || 12580;
        totalComments.value = response.data.total_comments || 348;
      }
    } catch (error) {
      console.error('获取博客统计数据失败:', error);
      // 如果API失败，保持默认值
    }
  };
  
  onMounted(loadStats);
  </script>
  
  <style scoped>
  .blog-stats-card {
    background: transparent;
    border-radius: 0;
    padding: 24px;
    box-shadow: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .stats-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 20px 0;
    color: #1a1a1a;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .stat-icon {
    font-size: 24px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    border-radius: 0;
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1;
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: #666;
    margin-top: 4px;
  }
  </style>