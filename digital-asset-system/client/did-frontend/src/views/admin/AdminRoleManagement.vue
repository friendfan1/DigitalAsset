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
          <el-button type="primary" size="small" class="refresh-btn" @click="loadUserRoles">
            <el-icon><Refresh /></el-icon>
          </el-button>
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
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="danger" 
              @click="handleRevokeRole(row)"
              :disabled="!row.roles || row.roles.length === 0"
            >
              撤销权限
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
import { ref, reactive, onMounted } from 'vue';
import { ethers } from 'ethers';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { Key, UserFilled, Refresh, OfficeBuilding } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService';
import { RBACService } from '@/utils/web3/RBACService';
import axios from 'axios';

// 定义类型
interface UserRole {
  address: string;
  roles: string[];
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

// 使用 RBAC 服务加载用户角色
const loadUserRoles = async () => {
  try {
    loading.value = true;
    
    // 获取钱包签名者
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // 初始化 RBAC 服务
    const rbacService = new RBACService(provider, signer);
    
    // 获取所有角色成员
    userRoles.value = await rbacService.getAllRoleMembers();
    
  } catch (error) {
    ElMessage.error('加载用户角色失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 修改授予角色的函数
const handleGrantRole = async () => {
  if (!grantRoleFormRef.value) return;
  
  await grantRoleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        grantingRole.value = true;
        
        // 获取钱包签名者
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        console.log(signer.address);
        
        // 初始化 RBAC 服务
        const rbacService = new RBACService(provider, signer);
        
        // 只进行链上授权
        await rbacService.grantRole(
          grantRoleForm.userAddress,
          grantRoleForm.roleType
        );
        
        ElMessage.success('角色授予成功');
        
        // 重新加载用户列表
        loadUserRoles();
        
        // 重置表单
        grantRoleForm.userAddress = '';
        grantRoleForm.roleType = '';
        
      } catch (error) {
        ElMessage.error('角色授予失败');
        console.error(error);
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

// 修改撤销角色的函数
const confirmRevokeRole = async () => {
  if (!selectedUser.value || revokeForm.rolesToRevoke.length === 0) return;
  
  try {
    revokingRole.value = true;
    
    // 获取钱包签名者
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // 初始化 RBAC 服务
    const rbacService = new RBACService(provider, signer);
    
    // 撤销选中的每个角色
    for (const role of revokeForm.rolesToRevoke) {
      // 只进行链上撤销
      await rbacService.revokeRole(selectedUser.value.address, role);
    }
    
    ElMessage.success('角色撤销成功');
    
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

// 修改企业授权函数
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
        
        // 只进行链上授权
        await rbacService.grantRole(
          company.walletAddress,
          companyGrantForm.roleType
        );
        
        ElMessage.success('角色授予成功');
        
        // 重新加载用户列表
        loadUserRoles();
        
        // 重置表单
        companyGrantForm.companyId = '';
        companyGrantForm.roleType = '';
        
      } catch (error) {
        ElMessage.error('角色授予失败');
        console.error(error);
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
  background: #0a192f;
  min-height: calc(100vh - 75px);
  margin-top: 75px;
  
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #e6f1ff;
    margin-bottom: 24px;
  }
  
  .grant-role-card,
  .users-role-card {
    margin-bottom: 24px;
    background: rgba(17, 34, 64, 0.6);
    border: 1px solid #233554;
    backdrop-filter: blur(10px);
    
    :deep(.el-card__header) {
      background: rgba(35, 53, 84, 0.7);
      padding: 15px 20px;
      
      .card-header {
        display: flex;
        align-items: center;
        
        .el-icon {
          color: #64ffda;
          font-size: 18px;
          margin-right: 10px;
        }
        
        span {
          color: #e6f1ff;
          font-size: 18px;
          font-weight: 500;
        }
        
        .refresh-btn {
          margin-left: auto;
          background: transparent;
          border: 1px solid #64ffda;
          color: #64ffda;
          
          &:hover {
            background: rgba(100, 255, 218, 0.1);
          }
        }
      }
    }
    
    :deep(.el-card__body) {
      padding: 20px;
      color: #8892b0;
    }
  }
  
  .el-table {
    background: transparent;
    
    :deep(.el-table__header) {
      th {
        background: rgba(35, 53, 84, 0.5);
        color: #64ffda;
        font-weight: 500;
        border-bottom: 1px solid #233554;
      }
    }
    
    :deep(.el-table__body) {
      td {
        background: rgba(17, 34, 64, 0.3);
        color: #8892b0;
        border-bottom: 1px solid #233554;
      }
      
      tr:hover > td {
        background: rgba(35, 53, 84, 0.3) !important;
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
      color: #8892b0;
    }
  }
  
  .mb-16 {
    margin-bottom: 16px;
  }
}

:deep(.el-dialog) {
  background: #0a192f;
  border: 1px solid #233554;
  border-radius: 8px;
  
  .el-dialog__header {
    background: rgba(35, 53, 84, 0.7);
    margin: 0;
    padding: 16px 20px;
    border-bottom: 1px solid #233554;
    border-radius: 8px 8px 0 0;
    
    .el-dialog__title {
      color: #e6f1ff;
      font-weight: 500;
    }
  }
  
  .el-dialog__body {
    color: #8892b0;
    padding: 20px;
  }
  
  .el-dialog__footer {
    border-top: 1px solid #233554;
    padding: 16px 20px;
  }
}

:deep(.el-form-item__label) {
  color: #e6f1ff;
}

:deep(.el-input__inner),
:deep(.el-select__wrapper) {
  background: rgba(17, 34, 64, 0.6);
  border: 1px solid #233554;
  color: #e6f1ff;
  
  &:focus,
  &:hover {
    border-color: #64ffda;
  }
}

:deep(.el-checkbox__label) {
  color: #8892b0;
}

:deep(.el-button--primary) {
  background: transparent;
  border: 1px solid #64ffda;
  color: #64ffda;
  
  &:hover {
    background: rgba(100, 255, 218, 0.1);
  }
  
  &:disabled {
    border-color: #6c7983;
    color: #6c7983;
    background: transparent;
  }
}

:deep(.el-button--danger) {
  background: transparent;
  border: 1px solid #ff5555;
  color: #ff5555;
  
  &:hover {
    background: rgba(255, 85, 85, 0.1);
  }
  
  &:disabled {
    border-color: #6c7983;
    color: #6c7983;
    background: transparent;
  }
}

.company-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .el-tag {
    margin-left: 8px;
  }
}

.company-grant-card {
  margin-bottom: 24px;
  background: rgba(17, 34, 64, 0.6);
  border: 1px solid #233554;
  backdrop-filter: blur(10px);
  
  :deep(.el-card__header) {
    background: rgba(35, 53, 84, 0.7);
    padding: 15px 20px;
    
    .card-header {
      display: flex;
      align-items: center;
      
      .el-icon {
        color: #64ffda;
        font-size: 18px;
        margin-right: 10px;
      }
      
      span {
        color: #e6f1ff;
        font-size: 18px;
        font-weight: 500;
      }
    }
  }
  
  :deep(.el-card__body) {
    padding: 20px;
    color: #8892b0;
  }
}
</style> 