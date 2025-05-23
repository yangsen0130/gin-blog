<template>
  <div class="manage-posts-container">
    <h2>文章管理</h2>
    <router-link :to="{ name: 'AdminCreatePost' }" class="btn btn-primary add-post-btn">
      撰写新文章
    </router-link>

    <div v.if="loading" class="loading-indicator">加载中...</div>
    <div v.if="error" class="error-message">{{ error }}</div>

    <div v.if="!loading && posts.length === 0 && !error" class="no-posts">
      您还没有创建任何文章。
    </div>

    <table v.if="!loading && posts.length > 0" class="posts-table">
      <thead>
      <tr>
        <th>标题</th>
        <th>作者</th>
        <th>创建时间</th>
        <th>操作</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="post in posts" :key="post.ID">
        <td>{{ post.title }}</td>
        <td>{{ post.User?.username || 'N/A' }}</td>
        <td>{{ formatDate(post.CreatedAt) }}</td>
        <td>
          <router-link :to="{ name: 'AdminEditPost', params: { id: post.ID } }" class="btn btn-secondary btn-sm">编辑</router-link>
          <button @click="confirmDelete(post.ID)" class="btn btn-danger btn-sm">删除</button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchPosts, deletePost as apiDeletePost } from '../../api';
import { useAuthStore } from '../../store/auth';

const posts = ref([]);
const loading = ref(true);
const error = ref(null);
const authStore = useAuthStore();

const loadPosts = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetchPosts();
    // 后端返回所有文章，前端根据当前登录用户筛选其文章
    // 或者后端提供一个只返回当前用户文章的接口
    // 当前后端 GetPosts 获取所有文章，但 Update/Delete 有用户ID校验
    // 为了演示，这里我们假设管理员可以看到所有文章，但只能操作自己的
    // 如果严格按照后端逻辑，这里应该只显示当前用户ID的文章
    if (authStore.user && authStore.user.id) {
      // 筛选属于当前用户的文章
      // posts.value = response.data.filter(post => post.user_id === authStore.user.id);
      // 暂时显示所有，因为后端 GetPosts 没做用户过滤，但删除/更新有
      posts.value = response.data;
    } else {
      posts.value = response.data; // 如果没有用户信息，显示所有（不应该发生在此页面）
    }

  } catch (err) {
    error.value = '加载文章失败: ' + (err.response?.data?.error || err.message);
  } finally {
    loading.value = false;
  }
};

const confirmDelete = async (postId) => {
  if (window.confirm('您确定要删除这篇文章吗?')) {
    try {
      await apiDeletePost(postId);
      // 删除成功后重新加载文章列表
      loadPosts();
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.error || err.message));
    }
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

onMounted(loadPosts);
</script>

<style scoped>
.manage-posts-container {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.manage-posts-container h2 {
  margin-top: 0;
  margin-bottom: 20px;
}

.add-post-btn {
  margin-bottom: 20px;
  display: inline-block;
}

.loading-indicator, .no-posts {
  text-align: center;
  padding: 20px;
  color: #666;
}

.posts-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.posts-table th, .posts-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.posts-table th {
  background-color: #f7f7f7;
  font-weight: bold;
}

.posts-table tr:nth-child(even) {
  background-color: #fdfdfd;
}

.posts-table tr:hover {
  background-color: #f0f0f0;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.85rem;
  margin-right: 5px;
}
.error-message {
  color: red;
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}
</style>