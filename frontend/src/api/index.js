import axios from 'axios';
import { useAuthStore } from '../store/auth';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        const token = authStore.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            const authStore = useAuthStore();
            authStore.logout();
        }
        return Promise.reject(error);
    }
);

export const loginUser = (credentials) => apiClient.post('/auth/login', credentials);

export const fetchPosts = () => apiClient.get('/posts');
export const fetchPostsByTag = (tagName) => apiClient.get(`/posts/tag/${tagName}`);
export const fetchPostById = (id) => apiClient.get(`/posts/${id}`);
export const createPost = (postData) => apiClient.post('/posts', postData);
export const updatePost = (id, postData) => apiClient.put(`/posts/${id}`, postData);
export const deletePost = (id) => apiClient.delete(`/posts/${id}`);

export const fetchCategories = () => apiClient.get('/categories');
export const createCategory = (categoryData) => apiClient.post('/categories', categoryData);

export default apiClient;