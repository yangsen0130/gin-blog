import { defineStore } from 'pinia';
// import { loginUser as apiLogin, registerUser as apiRegister } from '../api'; // 修改导入
import { loginUser as apiLogin } from '../api'; // 只导入 apiLogin
import router from '../router';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user')) || null,
        error: null,
        loading: false,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token && !!state.user,
        currentUser: (state) => state.user,
    },
    actions: {
        async login(credentials) {
            this.loading = true;
            this.error = null;
            try {
                const response = await apiLogin(credentials);
                const { token, user_id, username } = response.data;
                this.token = token;
                this.user = { id: user_id, username };
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(this.user));
                router.push('/admin/dashboard');
            } catch (err) {
                this.error = err.response?.data?.error || '登录失败';
                this.token = null;
                this.user = null;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                this.loading = false;
            }
        },
        // async register(userData) { // 删除整个 register action
        //     this.loading = true;
        //     this.error = null;
        //     try {
        //         await apiRegister(userData);
        //         router.push({ name: 'AdminLogin', query: { registered: 'true' } });
        //     } catch (err) {
        //         this.error = err.response?.data?.error || '注册失败';
        //     } finally {
        //         this.loading = false;
        //     }
        // },
        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/admin/login');
        },
    },
});