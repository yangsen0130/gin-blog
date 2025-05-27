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
        <!-- 新增：显示文章标签区域 -->
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
import { fetchPostById } from '../../api'; // 确保API路径正确
import { useRoute } from 'vue-router';
import { marked } from 'marked'; // 新增
import hljs from 'highlight.js'; // 新增

const props = defineProps({
  id: { // 从路由接收文章ID
    type: [String, Number], // ID可能是字符串或数字
    required: true,
  },
});

const post = ref(null); // 存储文章数据
const loading = ref(true); // 加载状态
const error = ref(null); // 错误信息
const route = useRoute(); // Vue Router实例

// 计算属性，确保postId是数字类型
const postId = computed(() => {
  const idVal = parseInt(props.id || route.params.id); // 优先使用props.id，其次是route.params.id
  return idVal;
});

// 加载文章数据的异步函数
const loadPost = async () => {
  const currentPostId = postId.value; // 获取当前计算出的postId

  if (isNaN(currentPostId)) { // 验证postId是否有效
    error.value = "无效的文章ID。";
    loading.value = false;
    post.value = null;
    return;
  }

  loading.value = true;
  error.value = null;
  post.value = null; // 开始加载前重置文章数据

  try {
    const response = await fetchPostById(currentPostId); // 调用API获取文章

    if (response && response.data) {
      // 防止因快速导航导致旧数据覆盖新数据
      if (postId.value === currentPostId) {
        post.value = response.data;
        if (!post.value || typeof post.value.title === 'undefined') {
          // API返回了数据，但数据不完整
          error.value = '获取到的文章数据不完整或为空。';
          post.value = null;
        }
      }
    } else {
      // API未返回有效数据
      if (postId.value === currentPostId) {
        error.value = '未能获取有效文章数据。';
        post.value = null;
      }
    }
  } catch (err) {
    // API请求失败
    if (postId.value === currentPostId) {
      error.value = `加载文章详情失败: ${err.response?.data?.error || err.message}`;
      if (err.response?.status === 404) { // 特定处理404错误
        error.value = '文章未找到。';
      }
      post.value = null;
    }
  } finally {
    // 确保仅当postId未改变时才更新加载状态
    if (postId.value === currentPostId) {
      loading.value = false;
    }
  }
};

// 监视postId的变化，如果变化则重新加载文章
watch(postId, (newId, oldId) => {
  if (newId !== oldId && !isNaN(newId)) { // ID有效且发生变化
    loadPost();
  } else if (isNaN(newId)) { // 新ID无效
    post.value = null;
    error.value = '无效的文章ID参数。';
    loading.value = false;
  }
}, { immediate: false }); // onMounted会进行首次加载，所以这里不需要立即执行

// 组件挂载时加载文章
onMounted(() => {
  if (!isNaN(postId.value)) {
    loadPost();
  } else {
    error.value = "文章ID无效 (onMounted)。";
    loading.value = false;
    post.value = null;
  }
});

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// 使用 marked 和 highlight.js 格式化文章内容
const formattedContent = computed(() => {
  if (!post.value || !post.value.content) return '';

  marked.setOptions({
    highlight: function(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-', // CSS 类名前缀，与 highlight.js 兼容
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false, // 注意：如果您的 Markdown 内容可能来自不受信任的源，请考虑使用 DOMPurify 等库进行HTML清理
    smartypants: false,
    xhtml: false
  });

  return marked(post.value.content);
});
// const formatContent = (content) => { //
//   if (!content) return ''; //
//   // 如果内容是Markdown，这里应该使用Markdown解析器 //
//   // 如果内容是纯文本且希望保留换行，则进行替换 //
//   // 如果内容已经是HTML，则直接返回 //
//   return content.replace(/\n/g, '<br />');  //
// }; //
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
  padding: 20px; /* card自身的padding */
}

.post-content { /* article元素，作为card的子元素 */
  padding: 30px; /* article内部的padding，可以根据需要调整或移除，若card的padding已足够 */
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
  margin-bottom: 15px; /* 元信息和标签区域之间的间距 */
}

.post-meta-detail span {
  margin-right: 15px;
}

.post-tags-section { /* 标签区域样式 */
  margin-bottom: 30px; /* 标签区域和正文之间的间距 */
  padding-bottom: 15px; /* 标签区域底部的padding */
  border-bottom: 1px solid #eee; /* 标签区域底部的分隔线 */
  font-size: 0.9rem;
}
.post-tags-section strong { /* “标签:”文字的样式 */
  margin-right: 8px;
  color: #555;
}
.tag-chip { /* 单个标签的样式 */
  display: inline-block;
  background-color: #e9ecef; /* 标签背景色 */
  color: #495057; /* 标签文字颜色 */
  padding: 3px 8px; /* 标签内边距 */
  border-radius: 12px; /* 标签圆角 */
  margin-right: 8px; /* 标签右边距 */
  margin-bottom: 5px; /* 标签底边距，用于换行时保持间距 */
  font-size: 0.85rem;
}
.tag-chip a { /* 如果标签是链接 */
  color: inherit; /* 继承父元素颜色 */
  text-decoration: none; /* 去除下划线 */
}
.tag-chip a:hover {
  text-decoration: underline; /* 鼠标悬停时显示下划线 */
}

.post-body {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  word-wrap: break-word; /* 允许长单词换行 */
  overflow-wrap: break-word; /* 同上，更现代的属性 */
}

/* 使用 :deep() 选择器来确保 v-html 插入的内容中的元素也能应用样式 */
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