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
      <div class="post-actions">
        <button 
          @click="toggleLike" 
          class="like-button"
          :class="{ liked: isLiked }"
          :disabled="likeLoading"
        >
          <span class="like-icon">👍</span>
          <span class="like-count">{{ post.likes_count || 0 }}</span>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue';
import { likePost, unlikePost } from '../../api';

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['postUpdated']);

const isLiked = ref(false);
const likeLoading = ref(false);

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

const toggleLike = async () => {
  if (likeLoading.value) return;
  
  likeLoading.value = true;
  try {
    let response;
    if (isLiked.value) {
      response = await unlikePost(props.post.ID);
      isLiked.value = false;
    } else {
      response = await likePost(props.post.ID);
      isLiked.value = true;
    }
    
    // 更新本地的点赞数
    if (response.data && response.data.post) {
      props.post.likes_count = response.data.post.likes_count;
      emit('postUpdated', response.data.post);
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    // 如果失败，恢复状态
    isLiked.value = !isLiked.value;
  } finally {
    likeLoading.value = false;
  }
};
</script>

<style scoped>
.post-card {
  background: transparent;
  border-radius: 0;
  padding: 24px;
  box-shadow: none;
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.post-card:hover {
  box-shadow: none;
  transform: none;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 13px;
  color: #999;
  gap: 8px;
  flex: 1;
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
  border-radius: 0;
  transition: all 0.2s;
}

.post-tag-item:hover {
  background-color: #667eea;
  color: white;
  cursor: pointer;
}

.post-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.like-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s ease;
}

.like-button:hover {
  border-color: #007bff;
  color: #007bff;
  transform: scale(1.05);
}

.like-button.liked {
  border-color: #007bff;
  background-color: #007bff;
  color: white;
}

.like-button.liked .like-icon {
  filter: none;
}

.like-button:not(.liked) .like-icon {
  filter: grayscale(100%);
}

.like-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.like-icon {
  font-size: 14px;
  transition: filter 0.3s ease;
}

.like-count {
  font-weight: 500;
  min-width: 16px;
  text-align: center;
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

  .post-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .post-actions {
    align-self: flex-end;
  }
}
</style>