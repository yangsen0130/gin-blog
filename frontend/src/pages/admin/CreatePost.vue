<template>
    <div class="create-post-container card">
      <h2>撰写新文章</h2>
      <form @submit.prevent="handleCreatePost">
        <div class="form-group">
          <label for="title">标题:</label>
          <input type="text" id="title" v-model="post.title" required />
        </div>
        <div class="form-group">
          <label for="content">内容:</label>
          <textarea id="content" v-model="post.content" rows="10" required></textarea>
        </div>
        <div class="form-group"> <!-- 新增标签输入区域 -->
          <label for="tags">标签 (用逗号分隔):</label>
          <input type="text" id="tags" v-model="tagsInput" placeholder="例如: 技术, Go, Vue" />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? '发布中...' : '发布文章' }}
        </button>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { createPost as apiCreatePost } from '../../api';
  import { useRouter } from 'vue-router';
  
  const post = ref({
    title: '',
    content: '',
    // tags 将通过 tagsInput 处理后添加到发送的数据中
  });
  const tagsInput = ref(''); // 用于用户输入标签的字符串，以逗号分隔
  const loading = ref(false); // 控制加载状态，防止重复提交
  const error = ref(null); // 存储API请求错误信息
  const router = useRouter(); // Vue Router实例，用于导航
  
  const handleCreatePost = async () => {
    loading.value = true;
    error.value = null;
    try {
      // 解析标签输入框的字符串，转换为标签名数组
      // 1. 按逗号分割
      // 2. 去除每个标签名首尾的空格
      // 3. 过滤掉空字符串（例如，连续逗号或末尾逗号导致）
      const tagsArray = tagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
  
      const postData = {
        title: post.value.title,
        content: post.value.content,
        tags: tagsArray, // 将处理好的标签数组包含在请求数据中
      };
  
      await apiCreatePost(postData); // 调用API创建文章
      router.push({ name: 'AdminManagePosts' }); // 成功后跳转到文章管理页面
    } catch (err) {
      // 处理API请求错误
      error.value = '创建文章失败: ' + (err.response?.data?.error || err.message);
    } finally {
      loading.value = false; // 结束加载状态
    }
  };
  </script>
  
  <style scoped>
  .card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%; /* 使输入框填满容器宽度 */
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box; /* 确保 padding 和 border 不会增加元素的总宽度 */
  }
  
  .form-group textarea {
    resize: vertical; /* 允许用户垂直调整文本区域大小 */
  }
  
  .error-message {
    color: red;
    background-color: #ffebee;
    border: 1px solid #ef9a9a;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 15px;
  }
  
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) { /* 仅在未禁用时应用悬停效果 */
    background-color: #0056b3;
  }
  
  .btn-primary:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }
  
  .create-post-container h2 {
    margin-top: 0;
    margin-bottom: 25px;
  }
  </style>