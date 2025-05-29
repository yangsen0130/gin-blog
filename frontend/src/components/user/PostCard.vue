<template>
  <article class="post-card">
    <div class="post-header">
      <span class="post-tag">【{{ post.Category?.name || '未分类' }}】</span>
      <router-link :to="{ name: 'PostDetail', params: { id: post.ID } }" class="post-title-link">
        <h2 class="post-title">{{ post.title }}</h2>
      </router-link>
    </div>
    <p class="post-excerpt">{{ getExcerpt(post.content) }}</p>
    <div class="post-footer">
      <div class="post-meta">
        <span class="post-author">{{ post.User?.username || 'Yangsen' }}</span>
        <span class="meta-separator">|</span>
        <span class="post-date">{{ formatDate(post.CreatedAt) }}</span>
        <span class="meta-separator" v-if="post.tags && post.tags.length > 0">|</span>
        <div class="post-tags-list" v-if="post.tags && post.tags.length > 0">
          <span v-for="tag in post.tags" :key="tag.ID" class="post-tag-item">
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

const getExcerpt = (content) => {
  if (!content) return '';
  const plainText = content.replace(/<[^>]*>/g, '');
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
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

.post-tag {
  display: inline-block;
  color: #ff6b6b;
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
  color: #667eea;
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
  flex-wrap: wrap;
  font-size: 13px;
  color: #999;
  gap: 8px;
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

.post-tags-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.post-tag-item {
  display: inline-block;
  padding: 2px 8px;
  background-color: #f5f5f5;
  color: #666;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.post-tag-item:hover {
  background-color: #667eea;
  color: white;
  cursor: pointer;
}

@media (max-width: 768px) {
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