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
      <div class="form-group"> <!-- 新增标签输入区域 -->
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
import { ref, onMounted } from 'vue';
import { fetchPostById, updatePost as apiUpdatePost } from '../../api';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
  id: { // 从路由参数中获取文章ID
    type: String,
    required: true,
  },
});

const post = ref({ // 存储文章基本信息
  id: null,
  title: '',
  content: '',
  // tags 字段将从API获取，并通过 tagsInput 进行编辑
});
const tagsInput = ref(''); // 用于用户编辑标签的字符串，以逗号分隔
const initialLoading = ref(true); // 控制初始加载文章数据的状态
const loadError = ref(null); // 存储加载文章数据时的错误信息
const updateLoading = ref(false); // 控制更新文章时的加载状态
const updateError = ref(null); // 存储更新文章时的错误信息

const router = useRouter();
const route = useRoute(); // 也可以用 route.params.id 获取ID

const loadPostData = async () => {
  initialLoading.value = true;
  loadError.value = null;
  try {
    const postId = parseInt(props.id || route.params.id); // 确保ID是数字
    if (isNaN(postId)) {
      throw new Error("无效的文章ID");
    }
    const response = await fetchPostById(postId); // 调用API获取文章详情
    post.value = { ...response.data }; // 填充表单数据

    // 将获取到的标签对象数组转换为逗号分隔的字符串，用于输入框显示
    if (response.data.tags && Array.isArray(response.data.tags)) {
      tagsInput.value = response.data.tags.map(tag => tag.name).join(', ');
    } else {
      tagsInput.value = ''; // 如果没有标签，则输入框为空
    }
  } catch (err) {
    loadError.value = '加载文章数据失败: ' + (err.response?.data?.error || err.message);
  } finally {
    initialLoading.value = false;
  }
};

const handleUpdatePost = async () => {
  updateLoading.value = true;
  updateError.value = null;
  try {
    const { ID, title, content } = post.value; // 获取文章ID、标题和内容

    // 解析标签输入框的字符串，转换为标签名数组
    const tagsArray = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    // 准备发送到API的数据，包含标题、内容和处理后的标签数组
    const updateData = { title, content, tags: tagsArray };
    
    await apiUpdatePost(ID, updateData); // 调用API更新文章
    router.push({ name: 'AdminManagePosts' }); // 成功后跳转到文章管理页面
  } catch (err) {
    updateError.value = '更新文章失败: ' + (err.response?.data?.error || err.message);
  } finally {
    updateLoading.value = false;
  }
};

onMounted(loadPostData); // 组件挂载后加载文章数据
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