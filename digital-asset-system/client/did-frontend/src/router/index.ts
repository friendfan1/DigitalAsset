import { createRouter, createWebHistory } from 'vue-router';
import { useWalletStore } from '@/stores/wallet';
import { useUserStore } from '@/stores/user';
import { pa } from 'element-plus/es/locales.mjs';
import { ElMessage } from 'element-plus';
import { hasPermission } from '@/utils/permission';

// 在文件顶部定义类型
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresAdmin?: boolean;
    requiresBlockchainRole?: string;
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'), // 首页组件
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/fileshare',
    name: 'FileShare',
    component: () => import('@/views/file/FileShare.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/access',
    name: 'Access',
    component: () => import('@/views/file/AccessManagement.vue'), // 确认路径正确
    meta: { requiresAuth: true } // 如果需要登录权限
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/user/UserProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/roles',
    name: 'AdminRoleManagement',
    component: () => import('@/views/admin/AdminRoleManagement.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/profile',
    name: 'AdminProfile',
    component: () => import('@/views/admin/AdminProfile.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/verify',
    name: 'Verify',
    component: () => import('@/views/admin/AdminCompanyVerification.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/web3roles',
    name: 'Web3RoleManagement',
    component: () => import('@/views/admin/AdminRoleManagement.vue'),
    meta: { requiresAuth: true, requiresBlockchainRole: 'ADMIN_ROLE' }
  },
  {
    path: '/asset/certification',
    name: 'AssetCertification',
    component: () => import('@/views/file/AssetCertification.vue'),
    meta: { requiresAuth: true, requiresBlockchainRole: 'CERTIFIER_ROLE' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach(async (to, from) => {
  const userStore = useUserStore();
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return '/login';
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && userStore.profile?.role !== 'admin') {
    ElMessage.error('需要管理员权限访问此页面');
    return from.path;
  }
  
  // 检查是否需要区块链角色
  if (to.meta.requiresBlockchainRole) {
    const hasRole = await hasPermission(to.meta.requiresBlockchainRole as string);
    if (!hasRole) {
      ElMessage.error(`需要${to.meta.requiresBlockchainRole}权限访问此页面`);
      return from.path;
    }
  }
});

export default router;
