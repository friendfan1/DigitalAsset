<template>
    <nav class="header-nav">
        <div class="nav-brand">
            <img src="@/assets/logo.png" class="logo" alt="系统Logo">
            <router-link to="/" class="system-name">数字资产登记系统</router-link>
        </div>

        <!-- 登录后的导航菜单 -->
        <div v-if="authStore.isLoggedIn && authStore.profile?.role==='user'" class="nav-main">
            <router-link to="/access" class="nav-item">资产管理</router-link>
            <router-link v-if="hasCertifierRole" to="/asset/certification" class="nav-item">资产认证</router-link>
        </div>
        <div v-if="authStore.isLoggedIn && authStore.profile?.role==='admin'" class="nav-main">
            <router-link to="/verify" class="nav-item">企业认证审核</router-link>
            <router-link to="/admin/roles" class="nav-item">权限管理</router-link>
            <router-link v-if="hasCertifierRole" to="/asset/certification" class="nav-item">资产认证</router-link>
        </div>

        <!-- 右侧用户功能区 -->
        <div class="nav-right">
            <template v-if="authStore.isLoggedIn">
                <!-- 用户头像下拉菜单 -->
                <el-dropdown trigger="click">
                    <div class="user-avatar-container">
      <div class="user-avatar">
        <img :src="defaultAvatar" alt="用户头像" class="avatar-img" />
      </div>
      <span v-if="authStore.isLoggedIn" class="user-info">
        {{ authStore.profile?.username || '用户' }}
      </span>
    </div>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item @click="goToUserProfile">
                                <el-icon><User /></el-icon> 公司信息
                            </el-dropdown-item>
                            <el-dropdown-item divided @click="handleLogout">
                                <el-icon><SwitchButton /></el-icon> 退出登录
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </template>

            <!-- 未登录时显示登录按钮 -->
            <router-link 
                v-else
                to="/login"
                class="login-btn"
            >
                登录/注册
            </router-link>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { User, SwitchButton } from '@element-plus/icons-vue';
import defaultAvatar from '@/assets/default-avatar.svg';
import { hasBlockchainRole } from '@/utils/permission';

const router = useRouter();
const authStore = useUserStore();
const hasCertifierRole = ref(false);

const checkCertifierRole = async () => {
  if (authStore.isLoggedIn) {
    hasCertifierRole.value = await hasBlockchainRole('CERTIFIER_ROLE');
  } else {
    hasCertifierRole.value = false;
  }
};

onMounted(checkCertifierRole);

watch(() => authStore.isLoggedIn, checkCertifierRole);
watch(() => authStore.profile?.walletAddress, checkCertifierRole);

const goToUserProfile = () => {
    if (authStore.profile?.role === 'admin') {
        router.push('/admin/profile');
    } else {
        router.push('/profile');
    }
};

const handleLogout = async () => {
    await authStore.clearUser();
    router.push('/login');
};
</script>

<style scoped>
/* 紧凑导航栏容器 */
/* 固定定位导航栏 */
.header-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.5rem 1.5rem;
  background: rgba(255,255,255,0.98);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 1000;
  box-sizing: border-box; /* 确保padding不会增加总宽度 */
}

/* 添加页面内容垫片（防止内容被导航栏遮挡） */
body {
  padding-top: 10px; /* 根据导航栏实际高度调整 */
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-nav {
    padding: 0.5rem;
  }
  
  .nav-brand {
    width: auto;
  }
  
  .nav-right {
    min-width: auto;
    padding-right: 0.5rem;
  }
  
  .system-name {
    font-size: 1rem;
  }
  
  .nav-main {
    gap: 1rem;
    margin: 0 1rem;
  }
  
  .user-info {
    display: none;
  }
  
  .login-btn {
    padding: 0.4rem 0.8rem; /* 稍微减小内边距 */
    font-size: 0.85rem; /* 稍微减小字体 */
  }
  
  .user-avatar-container {
    max-width: 150px;
    padding: 0.25rem;
  }
}

/* 品牌标识紧凑布局 */
.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 200px; /* 固定宽度 */
}

.logo {
  height: 32px;
  width: 32px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.system-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  text-decoration: none;
  letter-spacing: -0.5px;
}

/* 紧凑导航菜单 - 居中显示 */
.nav-main {
  display: flex;
  gap: 1.25rem;
  justify-content: center;
  flex: 1;
  margin: 0 auto;
}

.nav-item {
  font-size: 0.9rem;
  color: #666;
  text-decoration: none;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.2s ease;
}

.nav-item:hover {
  color: #333;
}

.nav-item.router-link-active {
  color: #222;
  font-weight: 500;
}

.nav-item.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #333;
  animation: underlineSlide 0.3s ease;
}

/* 右侧用户区紧凑布局 */
.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 200px; /* 改为最小宽度 */
  justify-content: flex-end;
  margin-left: auto;
  padding-right: 0rem; /* 添加右侧内边距 */
}

.user-avatar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: background 0.2s ease;
  max-width: 200px; /* 限制最大宽度 */
  overflow: hidden; /* 超出部分隐藏 */
}

.user-avatar-container:hover {
  background: rgba(0,0,0,0.04);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #eee;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  font-size: 0.9rem;
  color: #444;
  max-width: 120px;
  white-space: nowrap; /* 防止文字换行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.login-btn {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: #f5f5f5;
  color: #333;
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap; /* 防止文字换行 */
  display: inline-block; /* 确保按钮样式正确 */
}

.login-btn:hover {
  background: #eee;
  color: #000;
}

/* 紧凑下拉菜单 */
.el-dropdown-menu {
  min-width: 140px !important;
  padding: 0.5rem 0 !important;
  border-radius: 8px !important;
}

.el-dropdown-menu__item {
  padding: 0.5rem 1rem !important;
  font-size: 0.85rem !important;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.el-icon {
  font-size: 0.95em !important;
}

/* 打印优化 */
@media print {
  .header-nav {
    padding: 0.5rem;
    box-shadow: none;
    border-bottom: 2px solid #000;
  }
  
  .logo,
  .user-avatar,
  .el-icon {
    display: none !important;
  }
  
  .system-name,
  .user-info {
    color: #000 !important;
    font-weight: 600;
  }
  
  .nav-item {
    color: #444 !important;
  }
  
  .nav-main {
    gap: 1rem;
    margin-left: 1rem;
  }
}

/* 微交互动画 */
@keyframes underlineSlide {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.logo:hover {
  transform: rotate(-8deg) scale(1.1);
}
</style>