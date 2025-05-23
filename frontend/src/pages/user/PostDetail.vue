<template>
  <div class="post-detail-page">
    <header class="page-header">
      <router-link to="/" class="back-link">&larr; 返回首页</router-link>
    </header>
    <div class="container">
      <div v.if="loading" class="loading-indicator">正在加载文章...</div>
      <div v.if="error" class="error-message">{{ error }}</div>

      <article v.if="post && !loading" class="post-content card">
        <h1>{{ post.title }}</h1>
        <div class="post-meta-detail">
          <span>作者: {{ post.User?.username || '未知作者' }}</span>
          <span>发布于: {{ formatDate(post.CreatedAt) }}</span>
          <span v.if="post.UpdatedAt && post.UpdatedAt !== post.CreatedAt">
            最后更新: {{ formatDate(post.UpdatedAt) }}
          </span>
        </div>
        <div class="post-body" v-html="formatContent(post.content)"></div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { fetchPostById } from '../../api';
import { useRoute } from 'vue-router';

const props = defineProps({
  id: {
    type: [String, Number], // 路由参数可能是字符串
    required: true,
  },
});

const post = ref(null);
const loading = ref(true);
const error = ref(null);
const route = useRoute();

const postId = computed(() => parseInt(props.id || route.params.id));

const loadPost = async () => {
  if (isNaN(postId.value)) {
    error.value = "无效的文章ID";
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const response = await fetchPostById(postId.value);
    post.value = response.data;
  } catch (err) {
    error.value = '加载文章详情失败: ' + (err.response?.data?.error || err.message);
    if (err.response?.status === 404) {
      error.value = '文章未找到。';
    }
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// 简单的将换行符转为 <br>，实际应用中可能需要 Markdown 解析器
const formatContent = (content) => {
  if (!content) return '';
  return content.replace(/\n/g, '<br />');
};

onMounted(loadPost);
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
  margin-left: 5%; /* 与 container 对齐 */
}
.back-link:hover {
  text-decoration: underline;
}

.container {
  width: 90%;
  max-width: 800px; /* 文章详情页内容区域可以窄一些 */
  margin: 0 auto;
}

.loading-indicator {
  text-align: center;
  font-size: 1.2em;
  color: #555;
  padding: 40px 0;
}

.post-content {
  /* 使用全局 .card 样式 */
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
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.post-meta-detail span {
  margin-right: 15px;
}

.post-body {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  /* 确保长单词或链接能正确换行 */
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 如果内容是 HTML，可能需要为其中的元素设置样式 */
.post-body ::v-deep(p) { /* 或者 :deep(p) */
  margin-bottom: 1.5em;
}
.post-body ::v-deep(h2) {
  font-size: 1.8rem;
  margin-top: 2em;
  margin-bottom: 1em;
}
/* ... 其他 HTML 元素样式 */
</style>