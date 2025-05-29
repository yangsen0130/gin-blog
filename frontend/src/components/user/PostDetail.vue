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
        <h1>{{ post.title }}</h1>
        <div class="post-meta-detail">
          <span>作者: {{ post.User?.username || '未知作者' }}</span>
          <span v-if="post.Category">分类: {{ post.Category.name }}</span>
          <span>发布于: {{ formatDate(post.CreatedAt) }}</span>
          <span v-if="post.UpdatedAt && post.UpdatedAt !== post.CreatedAt">
            最后更新: {{ formatDate(post.UpdatedAt) }}
          </span>
        </div>
        <div class="post-tags-section" v-if="post.tags && post.tags.length > 0">
          <strong>标签:</strong>
          <span v-for="tag in post.tags" :key="tag.ID" class="tag-chip">
            {{ tag.name }}
          </span>
        </div>
        <div class="post-body" v-html="formattedContent"></div>
      </article>
      <div v-if="!post && !loading && !error" class="no-post-found-message">
        文章未加载或不存在。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { fetchPostById } from '../../api';
import { useRoute } from 'vue-router';
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
        }
      }
    } else {
      if (postId.value === currentPostId) {
        error.value = '未能获取有效文章数据。';
        post.value = null;
      }
    }
  } catch (err) {
    if (postId.value === currentPostId) {
      error.value = `加载文章详情失败: ${err.response?.data?.error || err.message}`;
      if (err.response?.status === 404) {
        error.value = '文章未找到。';
      }
      post.value = null;
    }
  } finally {
    if (postId.value === currentPostId) {
      loading.value = false;
    }
  }
};

watch(postId, (newId, oldId) => {
  if (newId !== oldId && !isNaN(newId)) {
    loadPost();
  } else if (isNaN(newId)) {
    post.value = null;
    error.value = '无效的文章ID参数。';
    loading.value = false;
  }
}, { immediate: false });

onMounted(() => {
  if (!isNaN(postId.value)) {
    loadPost();
  } else {
    error.value = "文章ID无效 (onMounted)。";
    loading.value = false;
    post.value = null;
  }
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formattedContent = computed(() => {
  if (!post.value || !post.value.content) return '';

  marked.setOptions({
    highlight: function(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-',
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartypants: false,
    xhtml: false
  });

  return marked(post.value.content);
});
</script>

<style scoped>
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
  border-radius: 4px;
  margin: 20px auto;
  width: fit-content;
  max-width: 90%;
  text-align: left;
  word-break: break-all;
}

.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 20px;
}

.post-content {
  padding: 30px;
}

.post-content h1 {
  font-size: 2.5rem;
  margin-top: 0;
  margin-bottom: 15px;
  line-height: 1.3;
}

.post-meta-detail {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 15px;
}

.post-meta-detail span {
  margin-right: 15px;
}

.post-tags-section {
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}
.post-tags-section strong {
  margin-right: 8px;
  color: #555;
}
.tag-chip {
  display: inline-block;
  background-color: #e9ecef;
  color: #495057;
  padding: 3px 8px;
  border-radius: 12px;
  margin-right: 8px;
  margin-bottom: 5px;
  font-size: 0.85rem;
}
.tag-chip a {
  color: inherit;
  text-decoration: none;
}
.tag-chip a:hover {
  text-decoration: underline;
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
.post-body :deep(h1) {
  font-size: 2em;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
}
.post-body :deep(h2) {
  font-size: 1.8rem;
  margin-top: 2em;
  margin-bottom: 1em;
}
.post-body :deep(h3) {
  font-size: 1.5em;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
}
.post-body :deep(ul),
.post-body :deep(ol) {
  margin-bottom: 1em;
  padding-left: 2em;
}
.post-body :deep(li) {
  margin-bottom: 0.5em;
}
.post-body :deep(blockquote) {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid #ccc;
  background-color: #f9f9f9;
  color: #666;
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
.post-body :deep(th),
.post-body :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.post-body :deep(th) {
  background-color: #f2f2f2;
}
</style>