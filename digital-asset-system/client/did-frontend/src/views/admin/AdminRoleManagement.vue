<template>
  <div class="admin-roles-container">
    <h1>用户权限管理</h1>
    
    <!-- 企业用户权限授予 -->
    <el-card class="company-grant-card">
      <template #header>
        <div class="card-header">
          <el-icon><OfficeBuilding /></el-icon>
          <span>企业用户权限授予</span>
        </div>
      </template>
      
      <el-form :model="companyGrantForm" label-width="120px" :rules="companyFormRules" ref="companyGrantFormRef">
        <el-form-item label="选择企业" prop="companyId">
          <el-select 
            v-model="companyGrantForm.companyId" 
            placeholder="请选择企业"
            filterable
            @change="handleCompanySelect"
          >
            <el-option 
              v-for="company in companies" 
              :key="company.id"
              :label="company.companyName"
              :value="company.id"
            >
              <div class="company-option">
                <span>{{ company.companyName }}</span>
                <el-tag size="small" type="info">
                  {{ shortenAddress(company.walletAddress) }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="角色类型" prop="roleType">
          <el-select v-model="companyGrantForm.roleType" placeholder="请选择角色类型">
            <el-option label="注册员" value="REGISTRAR_ROLE" />
            <el-option label="认证员" value="CERTIFIER_ROLE" />
            <el-option label="管理员" value="ADMIN_ROLE" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="grantingCompanyRole" @click="handleGrantCompanyRole">
            授予权限
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 原有的直接地址授权表单 -->
    <el-card class="grant-role-card">
      <template #header>
        <div class="card-header">
          <el-icon><Key /></el-icon>
          <span>授予用户权限</span>
        </div>
      </template>
      
      <el-form :model="grantRoleForm" label-width="120px" :rules="formRules" ref="grantRoleFormRef">
        <el-form-item label="钱包地址" prop="userAddress">
          <el-input 
            v-model="grantRoleForm.userAddress" 
            placeholder="请输入用户钱包地址"
            clearable 
            @blur="validateAddress"
          />
        </el-form-item>
        
        <el-form-item label="角色类型" prop="roleType">
          <el-select v-model="grantRoleForm.roleType" placeholder="请选择角色类型">
            <el-option label="注册员" value="REGISTRAR_ROLE" />
            <el-option label="认证员" value="CERTIFIER_ROLE" />
            <el-option label="管理员" value="ADMIN_ROLE" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="grantingRole" @click="handleGrantRole">
            授予权限
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 用户角色列表 -->
    <el-card class="users-role-card">
      <template #header>
        <div class="card-header">
          <el-icon><UserFilled /></el-icon>
          <span>已授权用户列表</span>
          <div class="action-buttons">
            <el-button type="success" size="small" @click="syncAllRoles" :loading="syncingAll">
              <el-icon><RefreshRight /></el-icon> 全部同步
            </el-button>
            <el-button type="primary" size="small" class="refresh-btn" @click="loadUserRoles">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="userRoles" style="width: 100%" v-loading="loading">
        <el-table-column prop="address" label="钱包地址" width="420">
          <template #default="{ row }">
            <el-tooltip :content="row.address" placement="top">
              <span>{{ shortenAddress(row.address) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="当前角色">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role"
              :type="getRoleTagType(role)"
              class="role-tag"
            >
              {{ getRoleDisplayName(role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="同步状态" width="120">
          <template #default="{ row }">
            <el-tag 
              :type="row.synced ? 'success' : 'warning'" 
              effect="dark"
            >
              {{ row.synced ? '已同步' : '未同步' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="primary" 
              @click="handleSyncRole(row)"
              :loading="syncingAddress === row.address"
            >
              同步
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleRevokeRole(row)"
              :disabled="!row.roles || row.roles.length === 0"
            >
              撤销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="empty-placeholder" v-if="userRoles.length === 0 && !loading">
        <el-empty description="暂无授权用户" />
      </div>
    </el-card>
    
    <!-- 撤销权限弹窗 -->
    <el-dialog
      v-model="revokeDialogVisible"
      title="撤销用户权限"
      width="500px"
    >
      <div v-if="selectedUser">
        <p>您正在撤销以下用户的权限：</p>
        <el-tag type="info" class="mb-16">{{ shortenAddress(selectedUser.address) }}</el-tag>
        
        <el-form :model="revokeForm">
          <el-form-item label="选择要撤销的角色">
            <el-checkbox-group v-model="revokeForm.rolesToRevoke">
              <el-checkbox 
                v-for="role in selectedUser.roles"
                :key="role"
                :label="role"
              >
                {{ getRoleDisplayName(role) }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="revokeDialogVisible = false">取消</el-button>
        <el-button 
          type="danger" 
          :loading="revokingRole"
          :disabled="revokeForm.rolesToRevoke.length === 0"
          @click="confirmRevokeRole"
        >
          确认撤销
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ethers } from 'ethers';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { Key, UserFilled, Refresh, OfficeBuilding, RefreshRight } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { RBACService } from '@/utils/web3/RBACService';
import { Web3RoleService } from '@/services/Web3RoleService';
import axios from 'axios';
import { de } from 'element-plus/es/locales.mjs';

// 定义类型
interface UserRole {
  address: string;
  roles: string[];
  synced?: boolean; // 添加同步状态字段
}

// 定义企业类型
interface Company {
  id: string;
  companyName: string;
  walletAddress: string;
}

// Store
const userStore = useUserStore();

// 状态变量
const loading = ref(false);
const grantingRole = ref(false);
const revokingRole = ref(false);
const syncingAll = ref(false);
const syncingAddress = ref(''); // 跟踪正在同步的地址
const userRoles = ref<UserRole[]>([]);
const revokeDialogVisible = ref(false);
const selectedUser = ref<UserRole | null>(null);
const grantRoleFormRef = ref<FormInstance>();
const companies = ref<Company[]>([]);
const grantingCompanyRole = ref(false);
const companyGrantFormRef = ref<FormInstance>();

// 表单数据
const grantRoleForm = reactive({
  userAddress: '',
  roleType: ''
});

const revokeForm = reactive({
  rolesToRevoke: [] as string[]
});

// 企业授权表单
const companyGrantForm = reactive({
  companyId: '',
  roleType: ''
});

// 表单验证规则
const formRules = {
  userAddress: [
    { required: true, message: '请输入钱包地址', trigger: 'blur' },
    { 
      validator: (rule: any, value: string, callback: any) => {
        if (value && !ethers.isAddress(value)) {
          callback(new Error('请输入有效的以太坊钱包地址'));
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    }
  ],
  roleType: [
    { required: true, message: '请选择角色类型', trigger: 'change' }
  ]
};

// 企业表单验证规则
const companyFormRules = {
  companyId: [
    { required: true, message: '请选择企业', trigger: 'change' }
  ],
  roleType: [
    { required: true, message: '请选择角色类型', trigger: 'change' }
  ]
};

// 方法
const validateAddress = (value: string) => {
  if (value && !ethers.isAddress(value)) {
    ElMessage.warning('钱包地址格式不正确');
  }
};

const shortenAddress = (address: string) => {
  if (!address) return '';
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
};

const getRoleDisplayName = (role: string) => {
  const roleMap: Record<string, string> = {
    'REGISTRAR_ROLE': '注册员',
    'CERTIFIER_ROLE': '认证员',
    'ADMIN_ROLE': '管理员'
  };
  return roleMap[role] || role;
};

const getRoleTagType = (role: string) => {
  const typeMap: Record<string, string> = {
    'REGISTRAR_ROLE': 'primary',
    'CERTIFIER_ROLE': 'success',
    'ADMIN_ROLE': 'danger'
  };
  return typeMap[role] || 'info';
};

// 使用区块链 RBAC 服务加载用户角色，并标记同步状态
const loadUserRoles = async () => {
  try {
    loading.value = true;
    
    // 获取钱包签名者
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // 初始化 RBAC 服务
    const rbacService = new RBACService(provider, signer);
    
    // 获取所有链上角色成员
    const chainRoles = await rbacService.getAllRoleMembers();
    
    // 为了标记同步状态，我们需要检查后端的角色数据
    userRoles.value = await Promise.all(
      chainRoles.map(async (user) => {
        try {
          // 调用后端API检查用户角色同步状态
          const response = await Web3RoleService.getUserRoles(user.address);
          
          if (response.data.success) {
            const backendRoles = response.data.data || [];
            // 提取后端角色名称到数组
            const backendRoleNames = backendRoles.map((role: any) => role.roleName);
            
            // 检查链上角色是否全部在后端存在
            const allRolesSynced = user.roles.every(role => 
              backendRoleNames.includes(role)
            );
            
            return {
              ...user,
              synced: allRolesSynced
            };
          }
          return {
            ...user,
            synced: false
          };
        } catch (error) {
          console.error('获取用户后端角色失败:', error);
          return {
            ...user,
            synced: false
          };
        }
      })
    );
    
  } catch (error) {
    ElMessage.error('加载用户角色失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 同步单个用户的角色
const handleSyncRole = async (user: UserRole) => {
  try {
    syncingAddress.value = user.address;
    const response = await Web3RoleService.verifyUserRoles(user.address);
    
    if (response.data.success) {
      ElMessage.success(`已同步 ${shortenAddress(user.address)} 的角色`);
      // 更新该用户的同步状态
      const index = userRoles.value.findIndex(u => u.address === user.address);
      if (index !== -1) {
        userRoles.value[index].synced = true;
      }
    } else {
      ElMessage.error(response.data.message || '角色同步失败');
    }
  } catch (error) {
    console.error('同步角色失败:', error);
    ElMessage.error('角色同步失败');
  } finally {
    syncingAddress.value = '';
  }
};

// 同步所有用户的角色
const syncAllRoles = async () => {
  try {
    syncingAll.value = true;
    
    // 过滤出未同步的用户
    const unsyncedUsers = userRoles.value.filter(user => !user.synced);
    
    if (unsyncedUsers.length === 0) {
      ElMessage.info('所有用户角色已同步');
      return;
    }
    
    // 创建同步任务队列
    const syncPromises = unsyncedUsers.map(async (user) => {
      try {
        await Web3RoleService.verifyUserRoles(user.address);
        return { address: user.address, success: true };
      } catch (error) {
        console.error(`同步角色失败 ${user.address}:`, error);
        return { address: user.address, success: false };
      }
    });
    
    // 等待所有同步任务完成
    const results = await Promise.all(syncPromises);
    
    // 统计成功和失败的数量
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    // 更新用户同步状态
    userRoles.value = userRoles.value.map(user => {
      const result = results.find(r => r.address === user.address);
      if (result && result.success) {
        return { ...user, synced: true };
      }
      return user;
    });
    
    // 显示结果
    if (failCount === 0) {
      ElMessage.success(`已成功同步 ${successCount} 个用户的角色`);
    } else {
      ElMessage.warning(`同步完成: ${successCount} 个成功, ${failCount} 个失败`);
    }
    
  } catch (error) {
    console.error('批量同步角色失败:', error);
    ElMessage.error('批量同步角色失败');
  } finally {
    syncingAll.value = false;
  }
};

// 修改授予角色的函数：同时更新区块链和后端
const handleGrantRole = async () => {
  if (!grantRoleFormRef.value) return;
  
  await grantRoleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        grantingRole.value = true;
        
        // 获取钱包签名者
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // 初始化 RBAC 服务
        const rbacService = new RBACService(provider, signer);
        
        const deadline = Math.floor(Date.now() / 1000) + 300; // 5分钟后的时间戳

        // 1. 在区块链上授权
        await rbacService.grantRoleWithSignature(
          grantRoleForm.userAddress,
          grantRoleForm.roleType,
          deadline
        );
        
        // 2. 在后端同步授权信息
        const backendResponse = await Web3RoleService.assignRole(
          grantRoleForm.userAddress,
          grantRoleForm.roleType
        );
        
        if (backendResponse.data.success) {
          ElMessage.success('角色授予成功并同步到后端');
        } else {
          ElMessage.warning('角色在链上授予成功，但后端同步失败');
        }
        
        // 重新加载用户列表
        loadUserRoles();
        
        // 重置表单
        grantRoleForm.userAddress = '';
        grantRoleForm.roleType = '';
        
      } catch (error) {
        console.error('角色授予失败:', error);
        ElMessage.error('角色授予失败');
      } finally {
        grantingRole.value = false;
      }
    }
  });
};

// 打开撤销权限弹窗
const handleRevokeRole = (user: UserRole) => {
  selectedUser.value = user;
  revokeForm.rolesToRevoke = [];
  revokeDialogVisible.value = true;
};

// 修改撤销角色的函数：同时更新区块链和后端
const confirmRevokeRole = async () => {
  if (!selectedUser.value || revokeForm.rolesToRevoke.length === 0) return;
  
  try {
    revokingRole.value = true;
    
    // 获取钱包签名者
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // 初始化 RBAC 服务
    const rbacService = new RBACService(provider, signer);
    
    // 跟踪成功和失败的角色
    const results = {
      success: [] as string[],
      failure: [] as string[]
    };
    
    // 撤销选中的每个角色
    for (const role of revokeForm.rolesToRevoke) {
      try {
        // 1. 在区块链上撤销
        await rbacService.revokeRole(selectedUser.value.address, role);
        
        // 2. 在后端同步撤销信息
        const backendResponse = await Web3RoleService.revokeRole(
          selectedUser.value.address,
          role
        );
        
        if (backendResponse.data.success) {
          results.success.push(role);
        } else {
          results.failure.push(role);
        }
      } catch (error) {
        console.error(`撤销角色失败 ${role}:`, error);
        results.failure.push(role);
      }
    }
    
    // 显示结果
    if (results.failure.length === 0) {
      ElMessage.success('角色撤销成功');
    } else if (results.success.length === 0) {
      ElMessage.error('角色撤销失败');
    } else {
      const successRoles = results.success.map(getRoleDisplayName).join(', ');
      const failureRoles = results.failure.map(getRoleDisplayName).join(', ');
      ElMessage.warning(`部分角色撤销成功: 成功(${successRoles}), 失败(${failureRoles})`);
    }
    
    // 重新加载用户列表
    loadUserRoles();
    
    // 关闭对话框
    revokeDialogVisible.value = false;
    
  } catch (error) {
    console.error('撤销角色失败:', error);
    ElMessage.error('撤销角色失败');
  } finally {
    revokingRole.value = false;
  }
};

// 获取企业列表
const loadCompanies = async () => {
  try {
    const token = userStore.profile?.token;
    const response = await axios.get('/api/admin/companies/with-wallet', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data.success) {
      companies.value = response.data.data;
    } else {
      ElMessage.error(response.data.message || '获取企业列表失败');
    }
  } catch (error) {
    console.error('获取企业列表失败:', error);
    ElMessage.error('获取企业列表失败');
  }
};

// 处理企业选择
const handleCompanySelect = (companyId: string) => {
  const company = companies.value.find(c => c.id.toString() === companyId);
  if (company) {
    // 可以在这里做一些额外处理
    console.log('选中企业:', company);
  }
};

// 修改企业授权函数：同时更新区块链和后端
const handleGrantCompanyRole = async () => {
  if (!companyGrantFormRef.value) return;
  
  await companyGrantFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        grantingCompanyRole.value = true;
        
        const company = companies.value.find(c => c.id.toString() === companyGrantForm.companyId);
        if (!company) {
          throw new Error('未找到选中的企业');
        }

        // 获取钱包签名者
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // 初始化 RBAC 服务
        const rbacService = new RBACService(provider, signer);
        const deadline = Math.floor(Date.now() / 1000) + 300; // 5分钟后的时间戳
        
        // 1. 在区块链上授权
        await rbacService.grantRoleWithSignature(
          company.walletAddress,
          companyGrantForm.roleType,
          deadline
        );
        
        // 2. 在后端同步授权信息
        const backendResponse = await Web3RoleService.assignRole(
          company.walletAddress,
          companyGrantForm.roleType
        );
        
        if (backendResponse.data.success) {
          ElMessage.success('角色授予成功并同步到后端');
        } else {
          ElMessage.warning('角色在链上授予成功，但后端同步失败');
        }
        
        // 重新加载用户列表
        loadUserRoles();
        
        // 重置表单
        companyGrantForm.companyId = '';
        companyGrantForm.roleType = '';
        
      } catch (error) {
        console.error('角色授予失败:', error);
        ElMessage.error('角色授予失败');
      } finally {
        grantingCompanyRole.value = false;
      }
    }
  });
};

// 生命周期钩子
onMounted(() => {
  loadCompanies();
  loadUserRoles();
});
</script>

<style scoped lang="scss">
.admin-roles-container {
  padding: 20px;
  background: #ffffff;
  min-height: calc(100vh - 75px);
  margin-top: 75px;
  
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #000000;
    margin-bottom: 24px;
  }
  
  .grant-role-card,
  .users-role-card,
  .company-grant-card {
    margin-bottom: 24px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #dddddd;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    :deep(.el-card__header) {
      background: rgba(245, 245, 245, 0.9);
      padding: 15px 20px;
      border-bottom: 1px solid #dddddd;
      
      .card-header {
        display: flex;
        align-items: center;
        
        .el-icon {
          color: #000000;
          font-size: 18px;
          margin-right: 10px;
        }
        
        span {
          color: #000000;
          font-size: 18px;
          font-weight: 500;
        }
        
        .action-buttons {
          margin-left: auto;
          display: flex;
          gap: 8px;
        }
        
        .refresh-btn {
          background: transparent;
          border: 1px solid #000000;
          color: #000000;
          
          &:hover {
            background: rgba(0, 0, 0, 0.05);
          }
        }
      }
    }
    
    :deep(.el-card__body) {
      padding: 20px;
      color: #333333;
    }
  }
  
  .el-table {
    background: transparent;
    
    :deep(.el-table__header) {
      th {
        background: rgba(245, 245, 245, 0.9);
        color: #000000;
        font-weight: 500;
        border-bottom: 1px solid #dddddd;
      }
    }
    
    :deep(.el-table__body) {
      td {
        background: rgba(255, 255, 255, 0.95);
        color: #333333;
        border-bottom: 1px solid #dddddd;
      }
      
      tr:hover > td {
        background: rgba(245, 245, 245, 0.9) !important;
      }
    }
    
    .role-tag {
      margin-right: 6px;
      margin-bottom: 4px;
    }
  }
  
  .empty-placeholder {
    padding: 30px;
    text-align: center;
    
    :deep(.el-empty__description) {
      color: #666666;
    }
  }
  
  .mb-16 {
    margin-bottom: 16px;
  }
}

:deep(.el-dialog) {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 8px;
  
  .el-dialog__header {
    background: rgba(245, 245, 245, 0.9);
    margin: 0;
    padding: 16px 20px;
    border-bottom: 1px solid #dddddd;
    border-radius: 8px 8px 0 0;
    
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
}

:deep(.el-form-item__label) {
  color: #000000;
}

:deep(.el-input__inner),
:deep(.el-select__wrapper) {
  background: rgba(245, 245, 245, 0.9);
  border: 1px solid #dddddd;
  color: #000000;
  
  &:focus,
  &:hover {
    border-color: #000000;
  }
}

:deep(.el-checkbox__label) {
  color: #333333;
}

:deep(.el-button--primary) {
  background: #000000;
  border: 1px solid #000000;
  color: #ffffff;
  
  &:hover {
    background: #333333;
    border-color: #333333;
  }
  
  &:disabled {
    background: #dddddd;
    border-color: #dddddd;
    color: #999999;
  }
}

:deep(.el-button--danger) {
  background: transparent;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  
  &:hover {
    background: rgba(255, 77, 79, 0.1);
  }
  
  &:disabled {
    border-color: #dddddd;
    color: #999999;
    background: transparent;
  }
}

:deep(.el-button--success) {
  background: transparent;
  border: 1px solid #000000;
  color: #000000;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  &:disabled {
    border-color: #dddddd;
    color: #999999;
    background: transparent;
  }
}

.company-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .el-tag {
    margin-left: 8px;
    background: rgba(0, 0, 0, 0.05);
    border-color: #000000;
    color: #000000;
  }
}

:deep(.el-tag) {
  &.el-tag--success {
    background: rgba(0, 0, 0, 0.05);
    border-color: #000000;
    color: #000000;
  }
  
  &.el-tag--danger {
    background: rgba(255, 77, 79, 0.1);
    border-color: #ff4d4f;
    color: #ff4d4f;
  }
  
  &.el-tag--warning {
    background: rgba(250, 173, 20, 0.1);
    border-color: #faad14;
    color: #faad14;
  }
  
  &.el-tag--info {
    background: rgba(0, 0, 0, 0.05);
    border-color: #666666;
    color: #666666;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .admin-roles-container {
    padding: 10px;
    margin-top: 60px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 8px;
    
    .el-button {
      width: 100%;
    }
  }
}
</style> 