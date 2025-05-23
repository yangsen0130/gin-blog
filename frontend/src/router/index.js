import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

// 公共页面
import HomePage from '../pages/user/HomePage.vue';
// import PostDetail from '../pages/user/PostDetail.vue';
import PostDetail from '../components/user/PostDetail.vue'; // 使用 components 下的 PostDetail
import NotFound from '../pages/NotFound.vue';

// 管理员页面
import AdminLogin from '../pages/admin/AdminLogin.vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import Dashboard from '../pages/admin/Dashboard.vue';
import ManagePosts from '../pages/admin/ManagePosts.vue';
import CreatePost from '../pages/admin/CreatePost.vue';
import EditPost from '../pages/admin/EditPost.vue';

// 用户页面
import UserRegister from '../pages/user/UserRegister.vue'; // 新增注册页面

// 用户布局 (如果需要的话)
// import UserLayout from '../layouts/UserLayout.vue'; // 如果用户端也有统一布局

const routes = [
    // 用户端路由
    {
        path: '/',
        name: 'HomePage',
        component: HomePage, // 直接使用 HomePage 作为根路径组件
    },
    {
        path: '/post/:id',
        name: 'PostDetail',
        component: PostDetail,
        props: true,
    },
    {
        path: '/register',
        name: 'UserRegister',
        component: UserRegister,
        meta: { requiresGuest: true },
    },

    // 管理员路由
    {
        path: '/admin/login',
        name: 'AdminLogin',
        component: AdminLogin,
        meta: { requiresGuest: true }, // 已经登录的用户不应该访问登录页
    },
    {
        path: '/admin',
        component: AdminLayout,
        meta: { requiresAuth: true }, // 需要认证才能访问
        children: [
            {
                path: '', // /admin 默认重定向到 dashboard
                redirect: '/admin/dashboard',
            },
            {
                path: 'dashboard',
                name: 'AdminDashboard',
                component: Dashboard,
            },
            {
                path: 'posts',
                name: 'AdminManagePosts',
                component: ManagePosts,
            },
            {
                path: 'posts/create',
                name: 'AdminCreatePost',
                component: CreatePost,
            },
            {
                path: 'posts/edit/:id',
                name: 'AdminEditPost',
                component: EditPost,
                props: true,
            },
        ],
    },

    // 404 Not Found
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// 全局导航守卫
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore(); // 在守卫函数内部获取 store 实例

    // 检查本地是否有 token 和 user 信息，以应对刷新页面 Pinia 状态丢失的情况
    if (!authStore.isAuthenticated && localStorage.getItem('token') && localStorage.getItem('user')) {
        authStore.token = localStorage.getItem('token');
        authStore.user = JSON.parse(localStorage.getItem('user'));
    }

    const isAuthenticated = authStore.isAuthenticated;

    if (to.meta.requiresAuth && !isAuthenticated) {
        // 如果目标路由需要认证但用户未认证，则跳转到登录页
        next({ name: 'AdminLogin', query: { redirect: to.fullPath } });
    } else if (to.meta.requiresGuest && isAuthenticated) {
        // 如果目标路由是为未认证用户准备的（如登录页），但用户已认证，则跳转到后台主页
        next({ name: 'AdminDashboard' });
    } else {
        // 其他情况正常放行
        next();
    }
});

export default router;