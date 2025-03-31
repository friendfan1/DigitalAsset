<template>
  <el-config-provider>
    <div class="app-container">
      <header class="app-header">
        <HeaderNav />
      </header>
      <main class="app-main">
        <router-view></router-view>
      </main>
      
      <!-- 上传状态监视器 -->
      <UploadStatusMonitor ref="uploadMonitorRef" />
      
      <!-- AI助手浮动按钮 -->
      <AIFloatingButton v-if="authStore.isLoggedIn" />
      
      <!-- 钱包地址检查 -->
      <WalletAddressCheck v-if="authStore.isLoggedIn && authStore.profile?.walletAddress" />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import HeaderNav from './components/common/HeaderNav.vue';
import UploadStatusMonitor from './components/upload/UploadStatusMonitor.vue';
import AIFloatingButton from './components/common/AIFloatingButton.vue';
import WalletAddressCheck from './components/common/WalletAddressCheck.vue';
import { ref, provide } from 'vue';
import { useUserStore } from '@/stores/user';

// 用户认证store
const authStore = useUserStore();

// 提供上传状态监视器的引用
const uploadMonitorRef = ref(null);
provide('uploadMonitor', uploadMonitorRef);
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  margin-top: 70px;
}


/* .logo {
  font-size: 1.5rem;
  font-weight: bold;
} */

/* .app-main {
  padding: 2rem;
} */
</style>
