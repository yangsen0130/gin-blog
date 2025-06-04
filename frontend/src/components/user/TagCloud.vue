<template>
    <div class="tag-cloud-card">
      <h3 class="tags-title">🏷️ 标签云</h3>
      <div class="tags-container" v-if="tags.length > 0">
        <router-link 
          v-for="tag in tags" 
          :key="tag.name"
          :to="`/tag/${tag.name}`"
          class="tag-item"
          :style="{ fontSize: getTagSize(tag.count) + 'px' }"
        >
          {{ tag.name }}
          <span class="tag-count">({{ tag.count }})</span>
        </router-link>
      </div>
      <div v-else class="no-tags">暂无标签</div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { fetchPosts } from '../../api';
  
  const tags = ref([]);
  
  const getTagsFromPosts = async () => {
    try {
      const response = await fetchPosts();
      const posts = response.data;
      const tagMap = new Map();
      
      posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            const count = tagMap.get(tag.name) || 0;
            tagMap.set(tag.name, count + 1);
          });
        }
      });
      
      tags.value = Array.from(tagMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };
  
  const getTagSize = (count) => {
    const maxCount = Math.max(...tags.value.map(t => t.count));
    const minSize = 14;
    const maxSize = 24;
    return minSize + (count / maxCount) * (maxSize - minSize);
  };
  
  onMounted(getTagsFromPosts);
  </script>
  
  <style scoped>
  .tag-cloud-card {
    background: transparent;
    border-radius: 0;
    padding: 24px;
    box-shadow: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .tags-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 20px 0;
    color: #1a1a1a;
  }
  
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    line-height: 1.8;
  }
  
  .tag-item {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    background-color: #f5f5f5;
    color: #666;
    text-decoration: none;
    border-radius: 0;
    transition: all 0.2s;
    white-space: nowrap;
  }
  
  .tag-item:hover {
    background-color: #667eea;
    color: white;
    transform: translateY(-2px);
  }
  
  .tag-count {
    font-size: 0.75em;
    margin-left: 4px;
    opacity: 0.7;
  }
  
  .no-tags {
    color: #999;
    font-size: 14px;
    text-align: center;
    padding: 20px 0;
  }
  </style>