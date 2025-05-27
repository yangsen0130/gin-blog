import axios from 'axios';
import { useAuthStore } from '../store/auth';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL, // 从环境变量读取API基础URL
    headers: {
        'Content-Type': 'application/json', // 设置默认请求内容类型
    },
});

// 请求拦截器：在每个请求发送前附加认证Token (如果存在)
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        const token = authStore.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // 添加Bearer Token到请求头
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器：处理全局错误，例如401未授权时自动登出
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore();
            authStore.logout(); // 如果收到401响应，执行登出操作
        }
        return Promise.reject(error);
    }
);

// 认证相关 API
// export const registerUser = (userData) => apiClient.post('/auth/register', userData); // 注册用户API (已按要求移除)
export const loginUser = (credentials) => apiClient.post('/auth/login', credentials); // 用户登录API

// 文章相关 API
export const fetchPosts = () => apiClient.get('/posts'); // 获取所有文章列表
export const fetchPostsByTag = (tagName) => apiClient.get(`/posts/tag/${tagName}`); // 新增：根据标签名获取文章列表
export const fetchPostById = (id) => apiClient.get(`/posts/${id}`); // 根据ID获取单篇文章详情

// 创建文章API，postData应包含 { title, content, tags: ['tag1', 'tag2', ...] }
export const createPost = (postData) => apiClient.post('/posts', postData);

// 更新文章API，postData应包含 { title, content, tags: ['tag1', 'tag2', ...] }
// 注意：如果只想更新部分字段（如仅标题），tags字段也应在postData中提供（可以是现有标签或新标签列表）
// 如果不提供tags字段，后端逻辑可能保持原有标签不变或按约定处理。当前后端实现是：如果提供了tags字段（即使是空数组），则更新标签。
export const updatePost = (id, postData) => apiClient.put(`/posts/${id}`, postData);

export const deletePost = (id) => apiClient.delete(`/posts/${id}`); // 根据ID删除文章

export default apiClient; // 导出配置好的axios实例