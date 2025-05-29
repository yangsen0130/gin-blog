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
      <div class="form-group">
        <label for="category">分类:</label>
        <select id="category" v-model="selectedCategoryId" :disabled="!!newCategoryName">
          <option :value="null">-- 选择分类 --</option>
          <option v-for="category in categories" :key="category.ID" :value="category.ID">
            {{ category.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label for="newCategoryName">或新建分类:</label>
        <input type="text" id="newCategoryName" v-model="newCategoryName" placeholder="输入新分类名称" />
      </div>
      <div class="form-group">
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
import { ref, onMounted } from 'vue';
import { 
  createPost as apiCreatePost, 
  fetchCategories as apiFetchCategories,
  createCategory as apiCreateCategory
} from '../../api';
import { useRouter } from 'vue-router';

const post = ref({
  title: '',
  content: '',
});
const tagsInput = ref('');
const categories = ref([]);
const selectedCategoryId = ref(null);
const newCategoryName = ref('');
const loading = ref(false);
const error = ref(null);
const router = useRouter();

const loadCategories = async () => {
  try {
    const response = await apiFetchCategories();
    categories.value = response.data;
  } catch (err) {
    error.value = '加载分类失败: ' + (err.response?.data?.error || err.message);
  }
};

onMounted(loadCategories);

const handleCreatePost = async () => {
  loading.value = true;
  error.value = null;
  let categoryIdToSubmit = selectedCategoryId.value;

  try {
    if (newCategoryName.value.trim() !== '') {
      try {
        const newCategoryResponse = await apiCreateCategory({ name: newCategoryName.value.trim() });
        categoryIdToSubmit = newCategoryResponse.data.ID;
      } catch (catErr) {
        if (catErr.response && catErr.response.status === 409) { // Conflict, category already exists
           categoryIdToSubmit = catErr.response.data.category.ID; // Use existing category ID
           error.value = `分类 "${newCategoryName.value.trim()}" 已存在，将使用现有分类。`;
        } else {
          error.value = '创建新分类失败: ' + (catErr.response?.data?.error || catErr.message);
          loading.value = false;
          return;
        }
      }
    }

    const tagsArray = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    const postData = {
      title: post.value.title,
      content: post.value.content,
      tags: tagsArray,
      category_id: categoryIdToSubmit,
    };

    await apiCreatePost(postData);
    router.push({ name: 'AdminManagePosts' });
  } catch (err) {
    if (!error.value) { // Avoid overwriting category creation error
      error.value = '创建文章失败: ' + (err.response?.data?.error || err.message);
    }
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
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
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

.btn-primary:hover:not(:disabled) {
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