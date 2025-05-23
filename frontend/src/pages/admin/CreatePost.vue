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
});
const loading = ref(false);
const error = ref(null);
const router = useRouter();

const handleCreatePost = async () => {
  loading.value = true;
  error.value = null;
  try {
    await apiCreatePost(post.value);
    router.push({ name: 'AdminManagePosts' }); // 成功后跳转到文章管理页
  } catch (err) {
    error.value = '创建文章失败: ' + (err.response?.data?.error || err.message);
  } finally {
    loading.value = false;
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
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
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

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

/* 使用全局 .card 和 .form-group 样式 */
.create-post-container h2 {
  margin-top: 0;
  margin-bottom: 25px;
}
</style>