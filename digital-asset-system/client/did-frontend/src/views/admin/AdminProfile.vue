<template>
    <div class="binary-background">
      <div v-for="bit in backgroundBits" 
            :key="bit.id" 
            class="binary-bit"
            :style="{
              left: bit.left,
              top: bit.top,
              animationDelay: bit.delay
            }">
          {{ Math.round(Math.random()) }}
      </div>
    </div>
    
    <div class="admin-profile-container">
      <el-row :gutter="20">
        <!-- 左侧管理员信息 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <el-card class="admin-info-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><User /></el-icon>
                <h2 class="card-title">管理员信息</h2>
              </div>
            </template>
            
            <el-skeleton v-if="!userStore.profile" :rows="4" animated />
            <el-descriptions v-else :column="1" border>
              <el-descriptions-item label="管理员账号">
                <el-tag type="danger">{{ userStore.profile.username }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">
                <el-link type="primary" :underline="false">
                  {{ userStore.profile.email }}
                </el-link>
              </el-descriptions-item>
              <el-descriptions-item label="账号创建时间">
                {{ formatDate(new Date(userStore.profile.createdAt)) }}
              </el-descriptions-item>
              <el-descriptions-item label="权限级别">
                <el-tag type="success">系统管理员</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="钱包地址">
                <template v-if="userStore.profile?.walletAddress">
                  <div class="wallet-info">
                    <el-tag>{{ shortenAddress(userStore.profile.walletAddress) }}</el-tag>
                    <el-button 
                      type="danger" 
                      size="small" 
                      @click="handleUnbind" 
                      :loading="unbinding"
                    >
                      解除绑定
                    </el-button>
                  </div>
                </template>
                <template v-else>
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="openConnectWalletDialog"
                  >
                    绑定钱包
                  </el-button>
                </template>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
          
          <!-- 修改密码卡片 -->
          <el-card class="security-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><Lock /></el-icon>
                <h2 class="card-title">安全设置</h2>
              </div>
            </template>
            <div class="security-form">
              <el-form 
                :model="passwordForm" 
                :rules="passwordRules" 
                ref="passwordFormRef" 
                label-width="120px"
              >
                <el-form-item label="当前密码" prop="currentPassword">
                  <el-input 
                    v-model="passwordForm.currentPassword" 
                    type="password" 
                    show-password
                    placeholder="请输入当前密码"
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input 
                    v-model="passwordForm.newPassword" 
                    type="password"
                    show-password
                    placeholder="请输入新密码"
                  />
                </el-form-item>
                <el-form-item label="确认新密码" prop="confirmPassword">
                  <el-input 
                    v-model="passwordForm.confirmPassword" 
                    type="password"
                    show-password
                    placeholder="请再次输入新密码"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button 
                    type="primary"
                    :loading="passwordLoading"
                    @click="changePassword"
                  >
                    更新密码
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-card>
        </el-col>
        
        <!-- 右侧系统状态 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <el-card class="system-stats-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><DataAnalysis /></el-icon>
                <h2 class="card-title">系统概览</h2>
              </div>
            </template>
            
            <div class="stats-container">
              <!-- <div class="stat-item">
                <div class="stat-value">{{ systemStats.userCount }}</div>
                <div class="stat-label">注册用户</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ systemStats.pendingVerifications }}</div>
                <div class="stat-label">待审核企业</div>
                <el-button 
                  v-if="systemStats.pendingVerifications > 0"
                  type="primary" 
                  size="small"
                  class="action-btn"
                  @click="navigateToVerifyPage"
                >
                  处理审核
                </el-button>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ systemStats.totalAssets }}</div>
                <div class="stat-label">资产总数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ systemStats.certifiedAssets }}</div>
                <div class="stat-label">已认证资产</div>
              </div> -->
            </div>
            
            <div class="system-actions">
              <h3 class="section-title">快速操作</h3>
              <div class="action-buttons">
                <el-button @click="navigateToRolesPage">
                  <el-icon><Key /></el-icon>
                  权限管理
                </el-button>
                <el-button @click="navigateToVerifyPage">
                  <el-icon><Check /></el-icon>
                  企业认证
                </el-button>
                <el-button @click="refreshSystemStats">
                  <el-icon><Refresh /></el-icon>
                  刷新数据
                </el-button>
              </div>
            </div>
          </el-card>
          
          <!-- <el-card class="activity-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><Timer /></el-icon>
                <h2 class="card-title">最近活动</h2>
              </div>
            </template>
            
            <el-timeline>
              <el-timeline-item
                v-for="(activity, index) in recentActivities"
                :key="index"
                :timestamp="activity.time"
                :type="activity.type"
              >
                {{ activity.content }}
              </el-timeline-item>
            </el-timeline>
          </el-card> -->
        </el-col>
      </el-row>
      
      <!-- 连接钱包弹窗 -->
      <el-dialog
        v-model="walletDialogVisible"
        title="连接钱包"
        width="500px"
      >
        <el-alert
          title="请确保您已安装MetaMask或其他以太坊钱包"
          type="info"
          :closable="false"
          show-icon
          class="mb-20"
        />
        
        <el-button 
          type="primary" 
          class="connect-wallet-btn"
          :loading="connectingWallet"
          @click="connectWallet"
        >
          <el-icon class="mr-8"><Wallet /></el-icon>
          连接 MetaMask
        </el-button>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage } from 'element-plus';
  import type { FormInstance } from 'element-plus';
  import { 
    User, Lock, Link, DataAnalysis, 
    Key, Check, Refresh, Timer, Wallet
  } from '@element-plus/icons-vue';
  import { useUserStore } from '@/stores/user';
  import { ethers } from 'ethers';
  
  const router = useRouter();
  const userStore = useUserStore();
  
  // 背景动画
  const backgroundBits = ref([...Array(50)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`
  })));
  
  // 状态变量
  const walletDialogVisible = ref(false);
  const connectingWallet = ref(false);
  const passwordLoading = ref(false);
  const passwordFormRef = ref<FormInstance>();
  const binding = ref(false);
  const unbinding = ref(false);
  
  // 表单数据
  const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 表单验证规则
  const passwordRules = {
    currentPassword: [
      { required: true, message: '请输入当前密码', trigger: 'blur' }
    ],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 8, message: '密码长度不能少于8个字符', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      { 
        validator: (rule: any, value: string, callback: any) => {
          if (value !== passwordForm.newPassword) {
            callback(new Error('两次输入的密码不一致'));
          } else {
            callback();
          }
        },
        trigger: 'blur'
      }
    ]
  };
  
  // 系统概览数据
  const systemStats = reactive({
    userCount: 125,
    pendingVerifications: 3,
    totalAssets: 427,
    certifiedAssets: 358
  });
  
  // 最近活动
  const recentActivities = ref([
    { 
      content: '审核通过企业"杭州未来科技有限公司"的认证申请', 
      time: '2023-11-25 14:30', 
      type: 'success' 
    },
    { 
      content: '授予用户0x7A3c...5F4b注册人权限', 
      time: '2023-11-25 10:15', 
      type: 'primary' 
    },
    { 
      content: '系统更新至v2.3.1版本', 
      time: '2023-11-24 18:42', 
      type: 'info' 
    },
    { 
      content: '撤销用户0x4B6d...9E2a的认证人权限', 
      time: '2023-11-24 11:20', 
      type: 'danger' 
    }
  ]);
  
  // 方法
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };
  
  const openConnectWalletDialog = () => {
    walletDialogVisible.value = true;
  };
  
  const connectWallet = async () => {
    try {
      connectingWallet.value = true;
      // 实际钱包连接逻辑
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];
      
      await userStore.updateProfile({ walletAddress: address });
      
      ElMessage.success('钱包绑定成功');
      walletDialogVisible.value = false;
    } catch (error) {
      ElMessage.error('钱包连接失败');
    } finally {
      connectingWallet.value = false;
    }
  };
  
  const changePassword = async () => {
    if (!passwordFormRef.value) return;
    
    await passwordFormRef.value.validate(async (valid) => {
      if (!valid) return;
      
      try {
        passwordLoading.value = true;
        // 实际密码修改逻辑
        await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟延迟
        
        ElMessage.success('密码修改成功');
        passwordForm.currentPassword = '';
        passwordForm.newPassword = '';
        passwordForm.confirmPassword = '';
      } catch (error) {
        ElMessage.error('密码修改失败');
      } finally {
        passwordLoading.value = false;
      }
    });
  };
  
  const navigateToRolesPage = () => {
    router.push('/admin/roles');
  };
  
  const navigateToVerifyPage = () => {
    router.push('/verify');
  };
  
  const refreshSystemStats = async () => {
    ElMessage.success('系统数据已更新');
    // 实际数据刷新逻辑
  };
  
  const handleUnbind = async () => {
    try {
      unbinding.value = true;
      await userStore.updateProfile({ walletAddress: '' });
      ElMessage.success('解除绑定成功');
    } catch (error) {
      console.error('解除绑定失败:', error);
      ElMessage.error('解除绑定失败');
    } finally {
      unbinding.value = false;
    }
  };
  
  onMounted(() => {
    // 初始化数据
  });
  </script>
  
  <style scoped lang="scss">
  .admin-profile-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 100px 20px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  
  // 二进制背景
  .binary-background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    overflow: hidden;
    background: #ffffff;
    
    .binary-bit {
      position: absolute;
      color: rgba(0, 0, 0, 0.05);
      font-family: monospace;
      font-size: 14px;
      animation: float 5s infinite;
      pointer-events: none;
    }
  }
  
  @keyframes float {
    0% {
      transform: translateY(0);
      opacity: 0;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      transform: translateY(-100px);
      opacity: 0;
    }
  }
  
  // 通用卡片样式
  .el-card {
    margin-bottom: 20px;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #dddddd;
    backdrop-filter: blur(10px);
  
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  
    :deep(.el-card__header) {
      background: rgba(245, 245, 245, 0.9);
      border-bottom: 1px solid #dddddd;
      padding: 18px 20px;
    }
  
    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
  
      .header-icon {
        font-size: 24px;
        color: #000000;
      }
  
      .card-title {
        margin: 0;
        font-size: 18px;
        color: #000000;
      }
    }
  }
  
  // 管理员信息卡片
  .admin-info-card {
    :deep(.el-descriptions) {
      .el-descriptions__table {
        background: transparent;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #dddddd;
      }
  
      .el-descriptions__cell {
        background: rgba(255, 255, 255, 0.95) !important;
        border-bottom: 1px solid #dddddd;
      }
  
      .el-descriptions-item__label {
        width: 120px;
        font-weight: 500;
        color: #000000 !important;
        background: rgba(245, 245, 245, 0.9) !important;
        padding: 16px 20px;
  
        &.is-bordered-content {
          border-right: 1px solid #dddddd;
        }
      }
  
      .el-descriptions-item__content {
        background: rgba(255, 255, 255, 0.95) !important;
        color: #333333 !important;
        padding: 16px 20px;
  
        .el-link {
          color: #000000 !important;
          &:hover {
            color: #666666 !important;
          }
        }
  
        .el-tag {
          background: rgba(0, 0, 0, 0.05);
          border-color: #000000;
          color: #000000;
          
          &.el-tag--danger {
            background: rgba(255, 77, 79, 0.1);
            border-color: #ff4d4f;
            color: #ff4d4f;
          }

          &.el-tag--success {
            background: rgba(0, 0, 0, 0.05);
            border-color: #000000;
            color: #000000;
          }
        }
      }
    }
  }
  
  // 安全设置卡片
  .security-card {
    .security-form {
      padding: 10px;
    }

    :deep(.el-input__wrapper) {
      background: rgba(245, 245, 245, 0.9);
      border: 1px solid #dddddd;
      box-shadow: none;

      &:hover, &.is-focus {
        border-color: #000000;
      }
    }

    :deep(.el-input__inner) {
      color: #000000;
    }

    :deep(.el-form-item__label) {
      color: #000000;
    }

    :deep(.el-button--primary) {
      background: #000000;
      border-color: #000000;
      color: #ffffff;

      &:hover {
        background: #333333;
        border-color: #333333;
      }
    }
  }
  
  .wallet-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .el-tag {
      background: rgba(0, 0, 0, 0.05);
      border-color: #000000;
      color: #000000;
    }
  }
  
  // 系统状态卡片
  .system-stats-card {
    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;

      .stat-item {
        text-align: center;
        padding: 20px;
        background: rgba(245, 245, 245, 0.9);
        border-radius: 8px;
        border: 1px solid #dddddd;

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #000000;
          margin-bottom: 8px;
        }

        .stat-label {
          color: #666666;
          font-size: 14px;
        }
      }
    }

    .system-actions {
      .section-title {
        color: #000000;
        font-size: 16px;
        margin-bottom: 16px;
      }

      .action-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;

        .el-button {
          background: transparent;
          border: 1px solid #000000;
          color: #000000;

          &:hover {
            background: rgba(0, 0, 0, 0.05);
          }

          .el-icon {
            margin-right: 8px;
          }
        }
      }
    }
  }
  
  // 对话框样式
  :deep(.el-dialog) {
    background: #ffffff;
    border: 1px solid #dddddd;
    border-radius: 8px;

    .el-dialog__header {
      background: rgba(245, 245, 245, 0.9);
      padding: 16px 20px;
      border-bottom: 1px solid #dddddd;
      margin: 0;

      .el-dialog__title {
        color: #000000;
        font-weight: 500;
      }
    }

    .el-dialog__body {
      color: #333333;
      padding: 20px;
    }

    .el-dialog__footer {
      border-top: 1px solid #dddddd;
      padding: 16px 20px;
    }

    .el-button {
      &.el-button--primary {
        background: #000000;
        border-color: #000000;
        color: #ffffff;

        &:hover {
          background: #333333;
          border-color: #333333;
        }
      }
    }
  }
  
  // 响应式适配
  @media (max-width: 768px) {
    .admin-profile-container {
      padding: 80px 10px 20px;
    }

    .system-actions .action-buttons {
      grid-template-columns: 1fr;
    }
  }
  </style>