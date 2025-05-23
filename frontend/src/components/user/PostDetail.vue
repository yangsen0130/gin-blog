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
          <span>发布于: {{ formatDate(post.CreatedAt) }}</span>
          <span v-if="post.UpdatedAt && post.UpdatedAt !== post.CreatedAt">
            最后更新: {{ formatDate(post.UpdatedAt) }}
          </span>
        </div>
        <div class="post-body" v-html="formatContent(post.content)"></div>
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

// postId 是一个计算属性，它会响应 props.id 或 route.params.id 的变化
const postId = computed(() => {
  const idVal = parseInt(props.id || route.params.id);
  // console.log('[PostDetail] Computed postId:', idVal);
  return idVal;
});

// 监视所有相关状态的变化
// watch([post, loading, error], ([newPost, newLoading, newError], [oldPost, oldLoading, oldError]) => {
//   console.log('[PostDetail] State Change Detected:');
//   console.log('  New State:', { post: newPost, loading: newLoading, error: newError });
//   console.log('  Old State:', { post: oldPost, loading: oldLoading, error: oldError });
//   if (newPost && typeof newPost.title === 'undefined' && !newLoading) {
//     console.warn('[PostDetail] Warning: Post object exists but title is undefined.', newPost);
//   }
//   console.log('  Condition for article (post && !loading):', (newPost && !newLoading));
// }, { deep: true });


const loadPost = async () => {
  const currentPostId = postId.value; // 获取当前的 postId 值
  // console.log(`[PostDetail] loadPost called for postId: ${currentPostId}`);

  if (isNaN(currentPostId)) {
    // console.error('[PostDetail] Invalid postId detected in loadPost:', currentPostId);
    error.value = "无效的文章ID。";
    loading.value = false;
    post.value = null;
    return;
  }

  loading.value = true;
  error.value = null;
  post.value = null; // 在开始加载前显式重置 post
  // console.log(`[PostDetail] Before fetch for postId ${currentPostId}:`, { loading: loading.value, error: error.value, post: post.value });

  try {
    const response = await fetchPostById(currentPostId);
    // console.log(`[PostDetail] API Response for postId ${currentPostId}:`, JSON.parse(JSON.stringify(response))); // 深拷贝打印

    if (response && response.data) {
      // 确保我们只在当前 postId 仍然匹配时更新 post
      // 这可以防止因快速导航导致的旧数据覆盖新数据问题
      if (postId.value === currentPostId) {
        post.value = response.data;
        if (!post.value || typeof post.value.title === 'undefined') {
          // console.warn(`[PostDetail] Post data for postId ${currentPostId} is null or lacks title after fetch. Response data:`, response.data);
          error.value = '获取到的文章数据不完整或为空。';
          post.value = null; // 确保 post 为 null
        } else {
          // console.log(`[PostDetail] Successfully set post for postId ${currentPostId}:`, JSON.parse(JSON.stringify(post.value)));
        }
      } else {
        // console.log(`[PostDetail] postId changed during fetch for ${currentPostId}. Current postId is ${postId.value}. Discarding fetched data.`);
      }
    } else {
      // console.error(`[PostDetail] API response or response.data is null/undefined for postId ${currentPostId}.`);
      if (postId.value === currentPostId) {
        error.value = '未能获取有效文章数据。';
        post.value = null;
      }
    }
  } catch (err) {
    // console.error(`[PostDetail] API Error for postId ${currentPostId}:`, err.response || err.message || err);
    if (postId.value === currentPostId) {
      error.value = `加载文章详情失败: ${err.response?.data?.error || err.message}`;
      if (err.response?.status === 404) {
        error.value = '文章未找到。';
      }
      post.value = null;
    }
  } finally {
    // 仅当 postId 未改变时才设置 loading 为 false，以避免旧的 finally 块影响新的加载状态
    if (postId.value === currentPostId) {
      loading.value = false;
    }
    // console.log(`[PostDetail] Finally block for postId ${currentPostId}. Current loading state: ${loading.value}`);
    // console.log('  Final state in finally:', { postId: postId.value, loading: loading.value, error: error.value, post: JSON.parse(JSON.stringify(post.value)) });
  }
};

// 监视 postId 的变化，如果变化则重新加载文章
watch(postId, (newId, oldId) => {
  // console.log(`[PostDetail] Watcher: postId changed from ${oldId} to ${newId}`);
  if (newId !== oldId && !isNaN(newId)) { // 确保 newId 有效且已改变
    loadPost();
  } else if (isNaN(newId)) {
    // console.error('[PostDetail] Watcher: new postId is NaN. Clearing data.');
    post.value = null;
    error.value = '无效的文章ID参数。';
    loading.value = false;
  }
}, { immediate: false }); // onMounted 会进行首次加载，所以这里 immediate: false

onMounted(() => {
  // console.log('[PostDetail] Component mounted. Initial props.id:', props.id, 'Computed postId:', postId.value);
  if (!isNaN(postId.value)) {
    loadPost();
  } else {
    error.value = "文章ID无效 (onMounted)。";
    loading.value = false;
    post.value = null;
    // console.error('[PostDetail] onMounted: postId is NaN. Not loading post.');
  }
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const formatContent = (content) => {
  if (!content) return '';
  return content.replace(/\n/g, '<br />');
};
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
  margin: 20px auto; /* 居中显示 */
  width: fit-content; /* 根据内容调整宽度 */
  max-width: 90%;
  text-align: left; /* 确保错误信息左对齐 */
  word-break: break-all; /* 防止长错误信息破坏布局 */
}

.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding: 20px;
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
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.post-body ::v-deep(p) {
  margin-bottom: 1.5em;
}
.post-body ::v-deep(h2) {
  font-size: 1.8rem;
  margin-top: 2em;
  margin-bottom: 1em;
}
</style>