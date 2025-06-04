import { defineStore } from 'pinia';
import { loginUser as apiLogin } from '../api';
import router from '../router';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user')) || null, // user: { id (adminId or guestId), username, type ('admin'/'guest'), avatarUrl (for guest) }
        error: null,
        loading: false,
    }),
    getters: {
        isAuthenticated: (state) => !!state.token && !!state.user,
        currentUser: (state) => state.user,
        isAdmin: (state) => state.user && state.user.type === 'admin',
        isGuest: (state) => state.user && state.user.type === 'guest',
    },
    actions: {
        async login(credentials) { // Admin login
            this.loading = true;
            this.error = null;
            try {
                const response = await apiLogin(credentials);
                const { token, user_id, username } = response.data;
                this.token = token;
                this.user = { id: user_id, username, type: 'admin' };
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(this.user));
                router.push({ name: 'AdminDashboard' });
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
        setGuestSession(data) {
            this.token = data.token;
            this.user = {
                id: data.guest_id, // Store guest_id as the primary id for guests
                guestId: data.guest_id,
                username: data.username,
                avatarUrl: data.avatar_url,
                type: 'guest',
            };
            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
            this.error = data.error || null;
        },
        logout() {
            const userType = this.user?.type;
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (userType === 'admin') {
                router.push('/admin/login');
            } else {
                // For guests, redirect to home or current page reloaded
                // router.push('/');
                // Or simply reload to clear state if on a page that needs auth for actions
                if (router.currentRoute.value.meta.requiresGuestAuthToAction) {
                    window.location.reload();
                } else {
                     const currentPath = router.currentRoute.value.path;
                     router.push('/').then(() => {
                        if (currentPath !== '/') router.push(currentPath);
                     });
                }
            }
        },
        clearError() {
            this.error = null;
        }
    },
});