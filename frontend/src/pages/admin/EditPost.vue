<template>
  <div class="edit-post-container card">
    <h2>编辑文章</h2>
    <div v-if="initialLoading" class="loading-indicator">加载文章数据中...</div>
    <div v-if="loadError" class="error-message">{{ loadError }}</div>

    <form v-if="!initialLoading && !loadError" @submit.prevent="handleUpdatePost">
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
          <option v-for="categoryItem in categories" :key="categoryItem.ID" :value="categoryItem.ID">
            {{ categoryItem.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label for="newCategoryName">或新建分类 (如果选择此项，将覆盖上方选择):</label>
        <input type="text" id="newCategoryName" v-model="newCategoryName" placeholder="输入新分类名称" />
      </div>
      <div class="form-group">
        <label for="tags">标签 (用逗号分隔):</label>
        <input type="text" id="tags" v-model="tagsInput" placeholder="例如: 技术, Go, Vue" />
      </div>
      <div v-if="updateError" class="error-message">{{ updateError }}</div>
      <button type="submit" class="btn btn-primary" :disabled="updateLoading">
        {{ updateLoading ? '更新中...' : '更新文章' }}
      </button>
      <router-link :to="{ name: 'AdminManagePosts' }" class="btn btn-secondary" style="margin-left: 10px;">
        取消
      </router-link>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { 
  fetchPostById, 
  updatePost as apiUpdatePost,
  fetchCategories as apiFetchCategories,
  createCategory as apiCreateCategory
} from '../../api';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const post = ref({
  id: null,
  title: '',
  content: '',
});
const tagsInput = ref('');
const categories = ref([]);
const selectedCategoryId = ref(null);
const newCategoryName = ref('');

const initialLoading = ref(true);
const loadError = ref(null);
const updateLoading = ref(false);
const updateError = ref(null);

const router = useRouter();
const route = useRoute();

const loadCategories = async () => {
  try {
    const response = await apiFetchCategories();
    categories.value = response.data;
  } catch (err) {
    loadError.value = (loadError.value ? loadError.value + '; ' : '') + '加载分类失败: ' + (err.response?.data?.error || err.message);
  }
};

const loadPostData = async () => {
  initialLoading.value = true;
  loadError.value = null;
  await loadCategories(); 
  try {
    const postId = parseInt(props.id || route.params.id);
    if (isNaN(postId)) {
      throw new Error("无效的文章ID");
    }
    const response = await fetchPostById(postId);
    post.value = { ...response.data };
    selectedCategoryId.value = response.data.category_id || null;

    if (response.data.tags && Array.isArray(response.data.tags)) {
      tagsInput.value = response.data.tags.map(tag => tag.name).join(', ');
    } else {
      tagsInput.value = '';
    }
  } catch (err) {
    loadError.value = (loadError.value ? loadError.value + '; ' : '') + '加载文章数据失败: ' + (err.response?.data?.error || err.message);
  } finally {
    initialLoading.value = false;
  }
};

watch(() => props.id, () => {
    loadPostData();
}, { immediate: true });


const handleUpdatePost = async () => {
  updateLoading.value = true;
  updateError.value = null;
  let categoryIdToSubmit = selectedCategoryId.value;
  let setCategoryFlag = true;


  try {
    if (newCategoryName.value.trim() !== '') {
      try {
        const newCategoryResponse = await apiCreateCategory({ name: newCategoryName.value.trim() });
        categoryIdToSubmit = newCategoryResponse.data.ID;
      } catch (catErr) {
         if (catErr.response && catErr.response.status === 409) { // Conflict, category already exists
             categoryIdToSubmit = catErr.response.data.category.ID;
             updateError.value = `分类 "${newCategoryName.value.trim()}" 已存在，将使用现有分类。`;
          } else {
            updateError.value = '创建新分类失败: ' + (catErr.response?.data?.error || catErr.message);
            updateLoading.value = false;
            return;
          }
      }
    } else if (selectedCategoryId.value === null && post.value.category_id === null) {
        setCategoryFlag = false; // No change from null to null
    } else if (selectedCategoryId.value !== null && selectedCategoryId.value === post.value.category_id) {
        setCategoryFlag = false; // No change if category is the same
    }


    const tagsArray = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    const updateData = {
      title: post.value.title !== '' ? post.value.title : undefined,
      content: post.value.content !== '' ? post.value.content : undefined,
      tags: tagsInput.value !== '' ? tagsArray : undefined, // Send tags if input is not empty, allows clearing
    };

    if (setCategoryFlag) {
        updateData.category_id = categoryIdToSubmit;
        updateData.set_category = true;
    }
    
    await apiUpdatePost(post.value.ID, updateData);
    router.push({ name: 'AdminManagePosts' });
  } catch (err) {
    if (!updateError.value) {
        updateError.value = '更新文章失败: ' + (err.response?.data?.error || err.message);
    }
  } finally {
    updateLoading.value = false;
  }
};

onMounted(loadPostData);
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
  text-decoration: none; 
  display: inline-block; 
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
.btn-secondary { 
  background-color: #6c757d;
  color: white;
}
.btn-secondary:hover {
  background-color: #545b62;
}

.edit-post-container h2 {
  margin-top: 0;
  margin-bottom: 25px;
}
.loading-indicator {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>