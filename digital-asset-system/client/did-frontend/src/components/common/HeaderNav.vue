<template>
    <nav class="header-nav">
        <div class="nav-brand">
            <img src="@/assets/logo.png" class="logo" alt="系统Logo">
            <router-link to="/" class="system-name">数字资产登记系统</router-link>
        </div>

        <!-- 登录后的导航菜单 -->
        <div v-if="authStore.isLoggedIn && authStore.profile?.role==='user'" class="nav-main">
            <router-link to="/access" class="nav-item">资产管理</router-link>
            <router-link to="/asset/trade" class="nav-item">资产交易</router-link>
            <router-link to="/asset/cert" class="nav-item">资产存证</router-link>
        </div>
        <div v-if="authStore.isLoggedIn && authStore.profile?.role==='admin'" class="nav-main">
            <router-link to="/verify" class="nav-item">企业认证审核</router-link>
            <router-link to="/admin/roles" class="nav-item">权限管理</router-link>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { User, SwitchButton } from '@element-plus/icons-vue';
import defaultAvatar from '@/assets/default-avatar.svg';

const router = useRouter();
const authStore = useUserStore();

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
/* 导航栏整体样式 */
.header-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 75px;
    background: #0a192f;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;
    z-index: 1000;
}

/* 导航栏品牌区域 */
.nav-brand {
    display: flex;
    align-items: center;
    gap: 20px;
}

/* 系统 logo */
.logo {
    height: 45px;
    width: auto;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* 系统名称 */
.system-name {
    font-size: 24px;
    font-weight: 700;
    color: #64ffda;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    text-decoration: none;
    
    &:hover {
        transform: scale(1.02);
        transition: transform 0.3s ease;
    }
}

/* 主导航菜单 */
.nav-main {
    display: flex;
    gap: 40px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}

/* 导航菜单项 */
.nav-item {
    color: #8892b0;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s ease;
    text-decoration: none;
    position: relative;
    padding: 8px 16px;
    border-radius: 20px;

    &:hover {
        color: #64ffda;
        background: rgba(100, 255, 218, 0.1);
    }

    &.router-link-exact-active {
        color: #64ffda;
        font-weight: 600;
        background: rgba(100, 255, 218, 0.1);
    }
}

/* 右侧导航区域 */
.nav-right {
    display: flex;
    align-items: center;
    gap: 25px;
}

/* 用户头像容器 */
.user-avatar-container {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    border-radius: 25px;
    background: rgba(100, 255, 218, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(100, 255, 218, 0.2);
        transform: scale(1.02);
    }
}

/* 用户头像 */
.user-avatar {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.8);
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* 用户信息 */
.user-info {
    color: #fff;
    font-size: 14px;
    font-weight: 500;
}

/* 登录/注册按钮 */
.login-btn {
    color: #64ffda;
    padding: 8px 24px;
    border-radius: 25px;
    font-weight: 500;
    transition: all 0.3s ease;
    text-decoration: none;
    background: transparent;
    border: 1px solid #64ffda;

    &:hover {
        background: rgba(100, 255, 218, 0.1);
        transform: scale(1.05);
    }
}

/* 下拉菜单样式覆盖 */
:deep(.el-dropdown-menu) {
    background: #0a192f;
    border: 1px solid #233554;
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.el-dropdown-menu__item) {
    color: #8892b0;
    border-radius: 8px;
    padding: 8px 16px;
    
    &:hover {
        background: rgba(100, 255, 218, 0.1);
        color: #64ffda;
    }

    .el-icon {
        margin-right: 8px;
        color: #64ffda;
    }
}
</style>