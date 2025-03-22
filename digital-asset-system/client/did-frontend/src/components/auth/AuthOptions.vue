<template>
    <el-dialog
      :model-value="visible"
      @update:model-value="$emit('update:visible', $event)"
      title="欢迎"
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
      destroy-on-close
    >
      <div class="auth-options">
        <p class="wallet-address">
          当前钱包地址：
          <el-tag size="small">{{ shortAddress }}</el-tag>
        </p>
        
        <div class="options-container">
          <el-button type="primary" size="large" @click="handleLogin">
            <el-icon><Key /></el-icon>
            登录
          </el-button>
          <el-button type="success" size="large" @click="handleRegister">
            <el-icon><User /></el-icon>
            注册
          </el-button>
        </div>
  
        <div class="disconnect-option">
          <el-button type="danger" link @click="handleDisconnect">
            断开钱包连接
          </el-button>
        </div>
      </div>
    </el-dialog>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import { useWalletStore } from '@/stores/wallet'
  import { Key, User } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  
  // 定义 props
  const props = defineProps<{
    visible: boolean
  }>()
  
  // 定义 emits
  const emit = defineEmits<{
    'update:visible': [value: boolean]
    'login': []
    'register': []
  }>()
  
  const walletStore = useWalletStore()
  
  // 计算属性：显示短地址
  const shortAddress = computed(() => {
    if (!walletStore.address) return ''
    return `${walletStore.address.slice(0, 6)}...${walletStore.address.slice(-4)}`
  })
  
  // 处理登录
  const handleLogin = () => {
    emit('login')
    emit('update:visible', false)
  }
  
  // 处理注册
  const handleRegister = () => {
    emit('register')
    emit('update:visible', false)
  }
  
  // 处理断开连接
  const handleDisconnect = () => {
    walletStore.disconnect()
    emit('update:visible', false)
    ElMessage.success('已断开钱包连接')
  }
  </script>
  
  <style scoped>
  .auth-options {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
  }
  
  .wallet-address {
    margin-bottom: 30px;
    text-align: center;
  }
  
  .options-container {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .disconnect-option {
    margin-top: 20px;
  }
  
  .el-button {
    min-width: 120px;
  }
  </style>
  