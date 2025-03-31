<template>
  <el-dialog
    v-model="dialogVisible"
    title="钱包地址不一致提醒"
    width="30%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <div class="wallet-check-content">
      <el-alert type="warning" :closable="false" show-icon>
        <p class="alert-title">检测到钱包地址不一致</p>
      </el-alert>
      
      <div class="wallet-info">
        <p><strong>当前账户绑定的钱包地址：</strong></p>
        <p class="address">{{ userStore.profile?.walletAddress }}</p>
        
        <p><strong>MetaMask当前使用的钱包地址：</strong></p>
        <p class="address">{{ walletStore.address }}</p>
      </div>
      
      <div class="warning-text">
        <p>当前MetaMask使用的钱包地址与您账户绑定的钱包地址不一致，这可能导致签名和交易失败。</p>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="connectCorrectAccount">切换到正确账户</el-button>
        <el-button type="primary" @click="updateBinding">更新绑定</el-button>
        <el-button @click="ignoreWarning">忽略</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const userStore = useUserStore();
const walletStore = useWalletStore();
const dialogVisible = ref(false);

// 检查钱包地址是否一致
const checkWalletAddress = async () => {
  // 确保用户已登录且已绑定钱包地址
  if (!userStore.isLoggedIn || !userStore.profile?.walletAddress) {
    return;
  }
  
  // 如果MetaMask钱包未连接，尝试连接
  if (!walletStore.isConnected) {
    try {
      await walletStore.connectMetaMask();
    } catch (error) {
      console.error('连接MetaMask失败:', error);
      return;
    }
  }
  
  // 检查地址是否一致（不区分大小写）
  const userWalletAddress = userStore.profile.walletAddress.toLowerCase();
  const metaMaskAddress = walletStore.address.toLowerCase();
  
  if (userWalletAddress && metaMaskAddress && userWalletAddress !== metaMaskAddress) {
    dialogVisible.value = true;
  }
};

// 更新钱包绑定
const updateBinding = async () => {
  try {
    if (!walletStore.address) {
      ElMessage.error('MetaMask钱包未连接');
      return;
    }
    const result = await userStore.unbindWallet();
    if (result) {
        const success = await axios.post('/api/bind-web3-address', {
      address: walletStore.address,
      chainId: walletStore.chainId
    }, {
      headers: { 
        Authorization: `Bearer ${userStore.profile?.token}`
      }
    });
      if (success) {
        ElMessage.success('钱包绑定已更新');
        dialogVisible.value = false;
      } 
      ElMessage.error('更新钱包绑定失败');
    }
    await userStore.updateProfile({
      walletAddress: walletStore.address,
    });

  } catch (error) {
    console.error('更新钱包绑定错误:', error);
    ElMessage.error('更新钱包绑定时出错');
  }

};

const connectCorrectAccount = async () => {
  ElMessage.info('请在MetaMask中切换到地址匹配您绑定钱包的账户');
  dialogVisible.value = false;
  
  setTimeout(() => {
    checkWalletAddress();
  }, 5000);
};

// 忽略警告
const ignoreWarning = () => {
  dialogVisible.value = false;
};

// 监听钱包地址变化
watch(() => walletStore.address, () => {
  checkWalletAddress();
});

// 组件挂载时检查
onMounted(async () => {
  // 添加一个短延迟，确保stores已完全初始化
  setTimeout(() => {
    checkWalletAddress();
  }, 1000);
});
</script>

<style scoped>
.wallet-check-content {
  padding: 10px 0;
}

.alert-title {
  font-weight: bold;
  margin: 0;
}

.wallet-info {
  margin: 20px 0;
}

.address {
  word-break: break-all;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
}

.warning-text {
  color: #e6a23c;
  margin: 15px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 