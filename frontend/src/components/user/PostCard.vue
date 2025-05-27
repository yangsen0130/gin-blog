<template>
  <article class="post-card">
    <div class="post-header">
      <span class="post-tag">【{{ getCategoryText(post) }}】</span>
      <router-link :to="{ name: 'PostDetail', params: { id: post.ID } }" class="post-title-link">
        <h2 class="post-title">{{ post.title }}</h2>
      </router-link>
    </div>
    <p class="post-excerpt">{{ getExcerpt(post.content) }}</p>
    <div class="post-footer">
      <div class="post-meta">
        <span class="post-author">{{ post.User?.username || 'Yangsen' }}</span> <!-- 优先使用API返回的作者名 -->
        <span class="meta-separator">|</span>
        <span class="post-date">{{ formatDate(post.CreatedAt) }}</span>
        <span class="meta-separator" v-if="post.tags && post.tags.length > 0">|</span>
        <!-- 动态渲染标签列表 -->
        <div class="post-tags-list" v-if="post.tags && post.tags.length > 0">
          <span v-for="tag in post.tags" :key="tag.ID" class="post-tag-item">
            <!-- 未来可以考虑将标签也做成链接，例如:
            <router-link :to="{ name: 'PostsByTagPage', params: { tagName: tag.name } }">
              {{ tag.name }}
            </router-link>
            -->
            {{ tag.name }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

// 动态判断文章分类，可以考虑结合标签信息
const getCategoryText = (post) => {
  const title = post.title.toLowerCase();
  if (post.tags && post.tags.some(tag => tag.name.toLowerCase() === 'unity3d' || tag.name.toLowerCase() === 'unity')) return 'Unity3D笔记';
  if (title.includes('gui') || title.includes('框架') || (post.tags && post.tags.some(tag => tag.name.toLowerCase().includes('gui') || tag.name.toLowerCase().includes('框架')))) return '详细分析';
  if (title.includes('svn') || (post.tags && post.tags.some(tag => tag.name.toLowerCase() === 'svn'))) return 'SVN教程';
  return '技术分享'; // 默认分类
};

// 生成文章摘要
const getExcerpt = (content) => {
  if (!content) return '';
  const plainText = content.replace(/<[^>]*>/g, ''); // 移除HTML标签
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-'); // 格式化为 YYYY-MM-DD
};
</script>

<style scoped>
.post-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.post-header {
  margin-bottom: 12px;
}

.post-tag { /* 文章主分类标签样式 */
  display: inline-block;
  color: #ff6b6b; /* 醒目的颜色 */
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.post-title-link {
  text-decoration: none;
}

.post-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.4;
  transition: color 0.2s;
}

.post-title-link:hover .post-title {
  color: #667eea; /* 鼠标悬停时标题颜色变化 */
}

.post-excerpt {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.post-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.post-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* 允许元信息换行 */
  font-size: 13px;
  color: #999;
  gap: 8px; /* 元信息项之间的间距 */
}

.post-author {
  color: #666;
  font-weight: 500;
}

.meta-separator {
  color: #e0e0e0;
}

.post-date {
  color: #999;
}

.post-tags-list { /* 标签列表容器样式 */
  display: flex;
  gap: 8px; /* 标签之间的间距 */
  flex-wrap: wrap; /* 允许标签换行 */
}

.post-tag-item { /* 单个标签样式 */
  display: inline-block;
  padding: 2px 8px;
  background-color: #f5f5f5; /* 浅灰色背景 */
  color: #666; /* 深灰色文字 */
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.post-tag-item:hover {
  background-color: #667eea; /* 鼠标悬停时背景变化 */
  color: white; /* 鼠标悬停时文字颜色变化 */
  cursor: pointer; /* 如果标签未来可点击，显示手型光标 */
}

@media (max-width: 768px) { /* 响应式调整 */
  .post-card {
    padding: 20px;
  }

  .post-title {
    font-size: 1.125rem;
  }

  .post-meta {
    font-size: 12px;
  }
}
</style>