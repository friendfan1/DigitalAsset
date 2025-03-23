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
    <div class="user-profile-container">
        <el-row :gutter="20">
            <!-- 左侧主要信息 -->
            <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
                <!-- 用户信息卡片 -->
                <el-card class="user-info-card" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <el-icon class="header-icon"><User /></el-icon>
                            <h2 class="card-title">企业信息管理</h2>
                        </div>
                    </template>
                    
                    <el-skeleton v-if="!userStore.profile" :rows="4" animated />
                    <el-descriptions v-else :column="1" border>
                        <el-descriptions-item label="公司名称">
                            <div class="company-name-wrapper">
                                <el-tag type="info">{{ userStore.profile.username }}</el-tag>
                                <el-button
                                    type="text"
                                    class="edit-btn"
                                    @click="openEditCompanyNameDialog"
                                >
                                    <el-icon><Edit /></el-icon>
                                    修改
                                </el-button>
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="注册邮箱">
                            <el-link type="primary" :underline="false">
                                {{ userStore.profile.email }}
                            </el-link>
                        </el-descriptions-item>
                        <el-descriptions-item label="注册时间">
                            {{ formatDate(new Date(userStore.profile.createdAt)) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="认证状态">
                            <el-tag 
                                :type="getVerificationTagType(userStore.profile.verifications || 'NOT_SUBMITTED')" 
                                effect="dark"
                            >
                                {{ getVerificationStateText(userStore.profile.verifications || 'NOT_SUBMITTED') }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="绑定钱包地址">
                            <div class="wallet-address-wrapper">
                                <template v-if="userStore.profile?.walletAddress">
                                    <div v-if="isWalletAddressMismatch" class="address-mismatch-warning">
                                        <el-alert
                                            type="warning"
                                            :closable="false"
                                            show-icon
                                        >
                                            <p>当前连接的钱包地址与绑定的地址不一致</p>
                                            <p>当前钱包: {{ shortenAddress(walletStore.address) }}</p>
                                            <p>绑定钱包: {{ shortenAddress(userStore.profile.walletAddress) }}</p>
                                            <el-button 
                                                type="warning" 
                                                size="small"
                                                class="mt-8"
                                                @click="handleSwitchWallet"
                                            >
                                                请在 MetaMask 中切换到正确的钱包地址
                                            </el-button>
                                        </el-alert>
                                    </div>
                                    <template v-else>
                                        <el-tag 
                                            type="success"
                                            class="wallet-tag"
                                        >
                                            <AddressDisplay 
                                                :text="userStore.profile.walletAddress"
                                                title="钱包地址"
                                            />
                                        </el-tag>
                                        <el-button
                                            type="danger"
                                            text
                                            :loading="unbindLoading"
                                            @click="handleUnbindWallet"
                                        >
                                            解绑
                                        </el-button>
                                    </template>
                                </template>
                                <el-button
                                    v-else
                                    type="text"
                                    class="bind-btn"
                                    :loading="bindLoading"
                                    :disabled="!isVerified"
                                    @click="handleBindWallet"
                                >
                                    <el-icon><Wallet /></el-icon>
                                    {{ !isVerified ? '请先完成企业认证' : '绑定Web3钱包' }}
                                </el-button>
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="DID标识符">
                            <div class="did-info-wrapper">
                                <template v-if="didInfo">
                                    <div class="did-details">
                                        <el-tag type="success" class="did-tag">
                                            <AddressDisplay 
                                                :text="didInfo.did"
                                                title="DID标识符"
                                            />
                                        </el-tag>
                                        <el-descriptions :column="1" border size="small" class="mt-8">
                                            <el-descriptions-item label="创建时间">
                                                {{ didInfo.created.toLocaleString() }}
                                            </el-descriptions-item>
                                            <el-descriptions-item label="信誉值">
                                                <el-progress 
                                                    :percentage="didInfo.reputation" 
                                                    :format="(val: number) => `${val}分`"
                                                    :status="didInfo.reputation >= 60 ? 'success' : 'warning'"
                                                />
                                            </el-descriptions-item>
                                            <el-descriptions-item label="状态">
                                                <el-tag :type="didInfo.active ? 'success' : 'danger'">
                                                    {{ didInfo.active ? '激活' : '未激活' }}
                                                </el-tag>
                                            </el-descriptions-item>
                                        </el-descriptions>
                                    </div>
                                </template>
                                <el-button
                                    v-else
                                    type="text"
                                    class="bind-btn"
                                    :loading="didLoading"
                                    :disabled="!isVerified || !userStore.profile?.walletAddress"
                                    @click="handleBindDID"
                                >
                                    <el-icon><Wallet /></el-icon>
                                    {{ !isVerified ? '请先完成企业认证' : !userStore.profile?.walletAddress ? '请先绑定钱包' : '激活区块链身份' }}
                                </el-button>
                            </div>
                        </el-descriptions-item>
                    </el-descriptions>
                </el-card>

                <!-- 修改密码卡片 -->
                <el-card class="change-password-card" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <el-icon class="header-icon"><Lock /></el-icon>
                            <h2 class="card-title">安全设置</h2>
                        </div>
                    </template>
                    <div class="security-info">
                        <el-alert
                            title="建议定期修改密码以保证账户安全"
                            type="info"
                            :closable="false"
                            show-icon
                        />
                        <el-button
                            type="primary"
                            class="mt-20"
                            @click="openChangePasswordDialog"
                        >
                            <el-icon class="mr-8"><Edit /></el-icon>
                            修改密码
                        </el-button>
                    </div>
                </el-card>
            </el-col>

            <!-- 右侧认证信息 -->
            <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
                <el-card class="verification-card" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <el-icon class="header-icon"><OfficeBuilding /></el-icon>
                            <h2 class="card-title">企业认证</h2>
                        </div>
                    </template>
                    
                    <div class="verification-status">
                        <el-result
                            v-if="userStore.profile?.verifications === 'VERIFIED'"
                            icon="success"
                            title="认证完成"
                            sub-title="企业信息已通过验证"
                        >
                            <template #extra>
                                <el-button type="info" disabled>已认证</el-button>
                            </template>
                        </el-result>

                        <el-result
                            v-else-if="userStore.profile?.verifications === 'PENDING_REVIEW'"
                            icon="warning"
                            title="审核中"
                            sub-title="您的认证申请正在审核中，请耐心等待"
                        >
                            <template #extra>
                                <el-button type="info" disabled>审核中</el-button>
                            </template>
                        </el-result>

                        <el-result
                            v-else
                            icon="warning"
                            title="待认证"
                            sub-title="请完成企业信息认证"
                            class="unverified-result"
                        >
                            <template #extra>
                                <el-button
                                    type="primary"
                                    @click="openCompanyVerificationDialog"
                                >
                                    <el-icon class="mr-8"><DocumentChecked /></el-icon>
                                    立即认证
                                </el-button>
                                <p class="tip-text">认证后可解锁全部功能</p>
                            </template>
                        </el-result>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 修改公司名称弹窗 -->
        <el-dialog
            v-model="companyNameEditVisible"
            title="修改公司名称"
            width="500px"
            @close="resetCompanyNameForm"
        >
            <el-form
                ref="companyNameFormRef"
                :model="companyNameForm"
                :rules="companyNameRules"
                label-width="100px"
                status-icon
            >
                <el-form-item label="当前名称">
                    <el-input :model-value="userStore.profile?.username" disabled />
                </el-form-item>
                <el-form-item label="新名称" prop="newCompanyName">
                    <el-input
                        v-model="companyNameForm.newCompanyName"
                        placeholder="请输入新的公司名称"
                        clearable
                    >
                        <template #prefix>
                            <el-icon><OfficeBuilding /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="companyNameEditVisible = false">取消</el-button>
                <el-button 
                    type="primary"
                    :loading="companyNameSubmitting"
                    @click="submitCompanyNameChange"
                >
                    确认修改
                </el-button>
            </template>
        </el-dialog>

        <!-- 区块链身份验证弹窗 -->
        <el-dialog
            v-model="showVerificationDialog"
            title="区块链身份验证"
            width="500px"
        >
            <div v-loading="verificationLoading">
                <el-alert
                    title="请确认钱包网络是否正确"
                    type="info"
                    :closable="false"
                    class="mb-20"
                />
                
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="钱包地址">
                        {{ walletStore.address }}
                    </el-descriptions-item>
                    <el-descriptions-item label="当前网络">
                        {{ networkName }}
                    </el-descriptions-item>
                </el-descriptions>

                <div class="verification-action mt-20">                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                    <el-button
                        type="primary"
                        :disabled="!isSupportedNetwork"
                        @click="handleVerifyIdentity"
                    >
                        {{ verificationStep === 1 ? '开始验证' : '重新验证' }}
                    </el-button>
                    
                    <div v-if="verificationStep === 2" class="verification-result">
                        <el-divider />
                        <el-result
                            icon="success"
                            title="验证成功"
                        />
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- DID激活弹窗 -->
        <el-dialog
            v-model="showDIDDialog"
            title="区块链身份激活"
            width="600px"
            :before-close="handleDialogClose"
        >
            <div v-loading="didLoading">
                <el-steps :active="didStep" align-center>
                    <el-step title="钱包验证" />
                    <el-step title="质押确认" />
                    <el-step title="身份生成" />
                </el-steps>

                <div class="step-content">
                    <div v-if="didStep === 1" class="step-1">
                        <el-alert
                            title="请确保已连接正确的钱包地址"
                            type="info"
                            :closable="false"
                            class="mb-20"
                        />
                        <el-descriptions :column="1" border>
                            <el-descriptions-item label="当前钱包地址">
                                {{ walletStore.address || '未连接' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="当前网络">
                                {{ networkName }}
                            </el-descriptions-item>
                        </el-descriptions>
                        <div class="mt-20 text-center">
                            <el-button
                                type="primary"
                                :disabled="!walletStore.isConnected || !isSupportedNetwork"
                                @click="handleWalletConnected"
                            >
                                {{ walletStore.isConnected ? '下一步' : '连接钱包' }}
                            </el-button>
                        </div>
                    </div>

                    <div v-if="didStep === 2" class="step-2">
                        <el-alert
                            :title="`请确认质押金额: ${stakeAmount} ETH`"
                            type="warning"
                            :closable="false"
                            class="mb-20"
                        />
                        <p class="text-center">
                            质押金额将被锁定用于确保身份的有效性，
                            <br>可在未来注销DID时取回
                        </p>
                        <div class="mt-20 text-center">
                            <el-button
                                type="primary"
                                @click="handleStakeConfirmed"
                            >
                                确认质押
                            </el-button>
                        </div>
                    </div>

                    <div v-if="didStep === 3" class="step-3">
                        <el-result
                            icon="success"
                            title="DID 创建成功"
                        >
                            <template #extra>
                                <p class="did-info">DID: {{ generatedDID }}</p>
                                <p class="tx-info">交易哈希: {{ txHash }}</p>
                            </template>
                        </el-result>
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- 企业认证弹窗 -->
        <el-dialog
            v-model="companyVerificationVisible"
            title="企业认证"
            width="600px"
        >
            <el-form
                ref="companyVerificationFormRef"
                :model="companyVerificationForm"
                :rules="companyVerificationRules"
                label-width="140px"
                status-icon
            >
                <el-form-item label="公司名称">
                    <el-input v-model="companyVerificationForm.companyName" disabled />
                </el-form-item>
                <el-form-item label="统一社会信用代码" prop="creditCode">
                    <el-input
                        v-model="companyVerificationForm.creditCode"
                        placeholder="请输入统一社会信用代码"
                        maxlength="18"
                        show-word-limit
                        clearable
                    />
                </el-form-item>
                <el-form-item label="营业执照" prop="businessLicense">
                    <el-upload
                        class="upload-demo"
                        action="#"
                        :auto-upload="false"
                        :on-change="handleBusinessLicenseChange"
                        :before-upload="beforeUploadBusinessLicense"
                    >
                        <template #trigger>
                            <el-button type="primary">选择文件</el-button>
                        </template>
                        <template #tip>
                            <div class="el-upload__tip">
                                只能上传 jpg/png 文件，且不超过 2MB
                            </div>
                        </template>
                    </el-upload>
                    <el-image
                        v-if="companyVerificationForm.businessLicenseUrl"
                        :src="companyVerificationForm.businessLicenseUrl"
                        fit="contain"
                        class="preview-image"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="companyVerificationVisible = false">取消</el-button>
                <el-button
                    type="primary"
                    :loading="verificationSubmitting"
                    @click="submitCompanyVerification"
                >
                    提交认证
                </el-button>
            </template>
        </el-dialog>

        <!-- 修改密码弹窗 -->
        <el-dialog
            v-model="changePasswordVisible"
            title="修改密码"
            width="500px"
            @close="resetChangePasswordForm"
        >
            <el-form
                ref="changePasswordFormRef"
                :model="changePasswordForm"
                :rules="changePasswordRules"
                label-width="100px"
                status-icon
            >
                <el-form-item label="原密码" prop="oldPassword">
                    <el-input
                        v-model="changePasswordForm.oldPassword"
                        type="password"
                        placeholder="请输入原密码"
                        show-password
                        clearable
                    />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                    <el-input
                        v-model="changePasswordForm.newPassword"
                        type="password"
                        placeholder="请输入新密码"
                        show-password
                        clearable
                    />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmNewPassword">
                    <el-input
                        v-model="changePasswordForm.confirmNewPassword"
                        type="password"
                        placeholder="请再次输入新密码"
                        show-password
                        clearable
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="changePasswordVisible = false">取消</el-button>
                <el-button
                    type="primary"
                    :loading="changePasswordSubmitting"
                    @click="submitChangePassword"
                >
                    确认修改
                </el-button>
            </template>
        </el-dialog>

        <WalletBinding />
    </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import axios from 'axios';
import { ethers } from 'ethers';
import { formatEther } from 'ethers';
import { 
  useUserStore,
  type verificationstate 
} from '@/stores/user';
import { 
  useWalletStore} from '@/stores/wallet';
import { 
  getDIDRegistryService, 
  type DIDCreatedEvent 
} from '@/utils/web3/DIDRegistryService';
import { formatDate } from '@/utils/dateFormat';
import { shortenAddress } from '@/utils/address';
import {
  User,
  Lock,
  Edit,
  DocumentChecked,
  OfficeBuilding,
  CircleCheck,
  Wallet
} from '@element-plus/icons-vue';
import WalletConnectionPanel from '@/components/web3/WalletConnectionPanel.vue';
import StakeConfirmation from '@/components/web3/StakeConfirmation.vue';
import DIDGenerationResult from '@/components/web3/DIDGenerationResult.vue';
import type { DIDDocument } from '@/types/web3';
import AddressDisplay from '@/components/common/AddressDisplay.vue'

// Store 初始化
const userStore = useUserStore();
const walletStore = useWalletStore();

// 网络支持列表
const SUPPORTED_NETWORKS: Record<number, string> = {
  1: 'Ethereum 主网',
  137: 'Polygon 主网',
  56: 'BNB Chain',
  1337: 'Ganache',
  80001: 'Polygon 测试网'
};

// DID 信息
interface DIDInfo {
  owner: string
  docHash: string
  created: Date
  reputation: number
  active: boolean
  did: string
}

const didInfo = ref<DIDInfo | null>(null)
const didLoading = ref(false)

// ==================== 公司名称修改 ====================
const resetCompanyNameForm = () => {
  companyNameForm.value.newCompanyName = '';
};
const companyNameEditVisible = ref(false);
const companyNameSubmitting = ref(false);
const companyNameForm = ref({
  newCompanyName: ''
});
const companyNameFormRef = ref<FormInstance>();
const companyNameRules = {
  newCompanyName: [
    { required: true, message: '请输入新的公司名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' },
    { 
      validator: (_: any, value: string | undefined, callback: (arg0: Error | undefined) => void) => {
        if (value === userStore.profile?.username) {
          callback(new Error('新名称不能与当前名称相同'));
        } else {
          callback(undefined);
        }
      },
      trigger: 'blur'
    }
  ]
};

// ==================== 企业认证 ====================
const companyVerificationVisible = ref(false);
const companyVerificationForm = ref({
  companyName: userStore.profile?.username || '',
  creditCode: '',
  businessLicense: null as File | null,
  businessLicenseUrl: ''
});
const companyVerificationFormRef = ref<FormInstance>();
const companyVerificationRules = {
  creditCode: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    { 
      pattern: /^[0-9A-HJ-NPQRTUWXY]{18}$/,
      message: '统一社会信用代码为18位数字或大写字母（不包含I、O、Z、S、V）', 
      trigger: 'blur' 
    }
  ],
  businessLicense: [
    { required: true, message: '请上传营业执照', trigger: 'change' }
  ]
};

// ==================== 钱包绑定 ====================
const showVerificationDialog = ref(false);
const verificationLoading = ref(false);
const bindLoading = ref(false);
const unbindLoading = ref(false);
const verificationStep = ref(1);
const blockchainIdentity = ref('');

// ==================== DID 管理 ====================
const showDIDDialog = ref(false);
const didStep = ref(1);
const generatedDID = ref('');
const txHash = ref('');
const stakeAmount = ref('0');

// ==================== 密码修改 ====================
const changePasswordVisible = ref(false);
const changePasswordSubmitting = ref(false);
const changePasswordForm = ref({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
});
const changePasswordFormRef = ref<FormInstance>();
const changePasswordRules = {
    oldPassword: [
        { required: true, message: '请输入原密码', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 8, max: 20, message: '密码长度需在 8 到 20 位之间', trigger: 'blur' },
        { 
            pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
            message: '需包含字母和数字组合',
            trigger: 'blur'
        }
    ],
    confirmNewPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
            validator: (_: any, value: string, callback: (arg0: Error | undefined) => void) => {
                if (value !== changePasswordForm.value.newPassword) {
                    callback(new Error('两次输入的密码不一致'));
                } else {
                    callback(undefined);
                }
            },
            trigger: 'blur'
        }
    ]
};

const resetChangePasswordForm = () => {
    if (changePasswordFormRef.value) {
        changePasswordFormRef.value.resetFields();
    }
    changePasswordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    };
};

const submitChangePassword = async () => {
    if (!changePasswordFormRef.value) return;
    
    try {
        await changePasswordFormRef.value.validate();
        changePasswordSubmitting.value = true;
        
        const response = await axios.post('/api/change-password', {
            oldPassword: changePasswordForm.value.oldPassword,
            newPassword: changePasswordForm.value.newPassword
        }, {
            headers: {
                Authorization: `Bearer ${userStore.profile?.token}`
            }
        });

        if (response.data.success) {
            ElMessage.success('密码修改成功');
            changePasswordVisible.value = false;
            resetChangePasswordForm();
        } else {
            throw new Error(response.data.message || '修改失败');
        }
    } catch (error: any) {
        ElMessage.error(error.response?.data?.message || error.message || '修改密码失败');
    } finally {
        changePasswordSubmitting.value = false;
    }
};

const openChangePasswordDialog = () => {
    resetChangePasswordForm();
    changePasswordVisible.value = true;
};

// ==================== 计算属性 ====================
const networkName = computed(() => {
  return SUPPORTED_NETWORKS[walletStore.chainId] || '未知网络';
});

const isSupportedNetwork = computed(() => {
  return Object.keys(SUPPORTED_NETWORKS).includes(String(walletStore.chainId));
});

const isWalletAddressMismatch = computed(() => {
    return walletStore.isConnected && 
           userStore.profile?.walletAddress && 
           walletStore.address.toLowerCase() !== userStore.profile.walletAddress.toLowerCase();
});

const isVerified = computed(() => {
    return userStore.profile?.verifications === 'VERIFIED';
});

// ==================== 生命周期钩子 ====================
onMounted(async () => {
    userStore.initialize();
    setupNetworkWatcher();
    await checkCurrentWallet();
    await fetchDIDInfo();
});

// ==================== 方法实现 ====================

// 网络切换监听
const setupNetworkWatcher = () => {
  watch(() => walletStore.chainId, (newVal) => {
    if (showVerificationDialog.value) {
      ElMessage.info(`检测到网络切换，当前网络: ${networkName.value}`);
    }
  });
};

// 公司名称修改
const openEditCompanyNameDialog = () => {
  companyNameForm.value.newCompanyName = '';
  companyNameEditVisible.value = true;
};

const submitCompanyNameChange = async () => {
  if (!companyNameFormRef.value) return;
  
  try {
    await companyNameFormRef.value.validate();
    companyNameSubmitting.value = true;

    const response = await axios.put('/api/update-company-name', {
      newName: companyNameForm.value.newCompanyName
    }, {
      headers: {
        Authorization: `Bearer ${userStore.profile?.token}` 
      }
    });

    if (!response.data.success) {
      throw new Error(response.data.message || '修改失败');
    }

    await userStore.updateProfile({ 
      username: companyNameForm.value.newCompanyName 
    });
    
    ElMessage.success('公司名称修改成功');
    companyNameEditVisible.value = false;
  } catch (error: any) {
    ElMessage.error(error.message || '修改请求发送失败');
  } finally {
    companyNameSubmitting.value = false;
  }
};

// 企业认证
const openCompanyVerificationDialog = () => {
    companyVerificationForm.value = {
        companyName: userStore.profile?.username || '',
        creditCode: '',
        businessLicense: null,
        businessLicenseUrl: ''
    };
    companyVerificationVisible.value = true;
};

const beforeUploadBusinessLicense = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB');
    return false;
  }
  companyVerificationForm.value.businessLicense = file;
  companyVerificationForm.value.businessLicenseUrl = URL.createObjectURL(file);
  return false;
};

const submitCompanyVerification = async () => {
    if (!companyVerificationFormRef.value) return;
    
    try {
        await companyVerificationFormRef.value.validate();
        verificationSubmitting.value = true;
        
        const formData = new FormData();
        formData.append('companyName', companyVerificationForm.value.companyName);
        formData.append('creditCode', companyVerificationForm.value.creditCode);
        
        if (companyVerificationForm.value.businessLicense) {
            formData.append('businessLicense', companyVerificationForm.value.businessLicense);
        }

        const response = await axios.post('/api/company-verification', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${userStore.profile?.token}`
            }
        });

        if (response.data.success) {
            await userStore.updateProfile({ 
                USCC: companyVerificationForm.value.creditCode,
                verifications: 'PENDING_REVIEW'
            });
            
            ElMessage.success('企业认证提交成功，请等待审核');
            companyVerificationVisible.value = false;
        } else {
            throw new Error(response.data.message || '提交失败');
        }
    } catch (error: any) {
        ElMessage.error(error.message || '认证提交失败，请检查信息');
    } finally {
        verificationSubmitting.value = false;
    }
};

// 钱包绑定
const handleBindWallet = async () => {
    try {
        if (!isVerified.value) {
            ElMessage.warning('请先完成企业认证后再绑定钱包');
            return;
        }
        verificationStep.value = 1;
        showVerificationDialog.value = true;
        bindLoading.value = true;
        
        if (!walletStore.isConnected) {
            await walletStore.connectMetaMask();
        }
        
        if (isWalletAddressMismatch.value) {
            ElMessage.warning('请选择正确的钱包地址');
            return;
        }
        
        if (!isSupportedNetwork.value) {
            ElMessage.warning('请切换到支持的区块链网络');
            return;
        }
    } catch (error: any) {
        ElMessage.error(`钱包连接失败: ${error.message}`);
        showVerificationDialog.value = false;
    } finally {
        bindLoading.value = false;
    }
};

const handleVerifyIdentity = async () => {
  try {
    console.log('Verifying identity');
    verificationLoading.value = true;
    // const identity = blockchainIdentity.value;
    console.log('进入bindWalletToBackend前');
    await bindWalletToBackend();
    
    verificationStep.value = 2;
    blockchainIdentity.value = "identity";
    
    ElMessage.success('钱包绑定成功');
    setTimeout(() => showVerificationDialog.value = false, 2000);
  } catch (error: any) {
    ElMessage.error(`验证失败: ${error.message}`);
  } finally {
    verificationLoading.value = false;
  }
};

const handleUnbindWallet = async () => {
  try {
    unbindLoading.value = true;
    await axios.post('/api/unbind-wallet', {}, {
      headers: { Authorization: `Bearer ${userStore.profile?.token}` }
    });
    await userStore.updateProfile({ walletAddress: undefined });
    ElMessage.success('解绑成功');
  } catch (error: any) {
    ElMessage.error(`解绑失败: ${error.message}`);
  } finally {
    unbindLoading.value = false;
  }
};

// DID 管理
const handleBindDID = async () => {
  try {
    didLoading.value = true
    
    // 创建 DID 文档
    const didDocument: DIDDocument = {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: walletStore.address,
      created: new Date().toISOString(),
      verificationMethod: [{
        id: `${walletStore.address}#key-1`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: walletStore.address,
        publicKeyHex: walletStore.address
      }],
      authentication: [`${walletStore.address}#key-1`]
    }

    // 创建 DID
    const didService = await getDIDRegistryService()
    const result = await didService.createDID(didDocument)
    console.log('DID created:', result)
    
    // 刷新 DID 信息
    await fetchDIDInfo()
    
    ElMessage.success('DID 创建成功')
  } catch (error) {
    console.error('DID Creation Error:', error)
    ElMessage.error(error instanceof Error ? error.message : '创建 DID 失败')
  } finally {
    didLoading.value = false
  }
}

const handleWalletConnected = async () => {
  didStep.value = 2;
};

const handleStakeConfirmed = async () => {
  try {
    didLoading.value = true;
    const didService = await getDIDRegistryService();
    const didDoc = generateDIDDocument();
    console.log("DID Document:", didDoc);
    
    // 检查合约连接
    if (!await didService.isContractInitialized()) {
      throw new Error('合约实例未初始化');
    }
    
    // 检查网络连接
    const network = await walletStore.provider?.getNetwork();
    console.log("Current Network:", network);
    
    // 检查钱包余额
    const balance = await walletStore.provider?.getBalance(walletStore.address);
    console.log("Wallet Balance:", balance ? formatEther(balance) : '未知');
    
    // 获取质押金额
    const stakeAmountBN = await didService.getStakeAmount();
    console.log("Required Stake Amount:", formatEther(stakeAmountBN));
    
    if (balance && BigInt(balance) < BigInt(stakeAmountBN)) {
      throw new Error(`余额不足，需要 ${formatEther(stakeAmountBN)} ETH`);
    }
    
    // 尝试创建 DID
    console.log("Attempting to create DID...");
    const { did, txHash: hash } = await didService.createDID({
      ...didDoc,
      id: walletStore.address // 使用钱包地址作为DID标识符
    });
    
    // 更新状态
    generatedDID.value = did;
    txHash.value = hash;

    // 更新用户信息
    await userStore.updateProfile({ did: generatedDID.value });
    ElMessage.success('DID 创建成功！');
    didStep.value = 3;
    
  } catch (error: any) {
    console.error("DID Creation Error:", error);
    if (error.code === 'ACTION_REJECTED') {
      ElMessage.warning('用户取消了交易');
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      ElMessage.error(`余额不足，请确保有足够的 ${stakeAmount.value} ETH`);
    } else if (error.code === 'CALL_EXCEPTION') {
      ElMessage.error('合约调用失败，请检查网络连接和合约状态');
      console.error('Contract call details:', error);
    } else {
      handleDIDError(error);
    }
  } finally {
    didLoading.value = false;
  }
};

const verifyDID = async () => {
  try {
    if (!userStore.profile?.did) return;
    
    const didService = await getDIDRegistryService();
    const docHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(generateDIDDocument()))
    );
    
    const isValid = await didService.verifyDID(
      walletStore.address,
      docHash
    );
    
    ElMessage[isValid ? 'success' : 'warning'](
      isValid ? 'DID验证有效' : 'DID验证失败'
    );
  } catch (error: any) {
    handleDIDError(error);
  }
};

// 通用方法
const generateDIDDocument = () => ({
  "@context": "https://www.w3.org/ns/did/v1",
  "id": walletStore.address,
  "created": new Date().toISOString(),
  "verificationMethod": [{
    id: `${walletStore.address}#keys-1`,
    type: "EcdsaSecp256k1VerificationKey2019",
    controller: walletStore.address,
    publicKeyHex: walletStore.address
  }],
  "authentication": [`${walletStore.address}#keys-1`]
});

const bindWalletToBackend = async () => {
  console.log("进入bindWalletToBackend");
  console.log(walletStore.signer);

  try {
    // 确保 getSigner 返回的是一个有效的对象
    const signer = await walletStore.provider?.getSigner();
    console.log("getSigner:", signer);

    // 使用 signer 对象调用 signMessage 方法
    let signature;
    if (signer) {
      try {
        signature = await signer.signMessage('Bind Wallet');
      } catch (signError) {
        console.error("Error signing message:", signError);
        throw new Error("签名失败");
      }
    } else {
      throw new Error("Signer is null");
    }
    console.log("相关信息", walletStore.address, signature);

    const response = await axios.post('/api/bind-web3-address', {
      address: walletStore.address,
      chainId: walletStore.chainId
    }, {
      headers: { 
        Authorization: `Bearer ${userStore.profile?.token}`,
        'X-Signature': signature
      }
    });
    console.log(response.data);

    await userStore.updateProfile({
      walletAddress: walletStore.address,
    });
  } catch (error: any) {
    console.error("Error in bindWalletToBackend:", error);
    throw new Error(`后端绑定失败: ${error.response?.data?.message || error.message}`);
  }
};


const handleDIDError = (error: Error) => {
  ElMessage.closeAll(); // 关闭所有消息
  ElMessage.error({
    message: `DID 操作失败: ${error.message}`,
    duration: 5000
  });
  
  // 根据错误类型决定是否关闭弹窗和重置状态
  if (error.message.includes('网络') || 
      error.message.includes('MetaMask') || 
      error.message.includes('钱包地址')) {
    showDIDDialog.value = false;
    didStep.value = 1;
  }
};

// 状态标签方法
const getVerificationTagType = (state: verificationstate) => {
  const map: Record<verificationstate, string> = {
    'VERIFIED': 'success',
    'PENDING_REVIEW': 'warning',
    'NOT_SUBMITTED': 'danger'
  };
  return map[state];
};

const getVerificationStateText = (state: verificationstate) => {
  const map: Record<verificationstate, string> = {
    'VERIFIED': '已认证',
    'PENDING_REVIEW': '审核中',
    'NOT_SUBMITTED': '未认证'
  };
  return map[state];
};

const handleSwitchWallet = () => {
    ElMessage.info('请打开 MetaMask 插件，手动切换到绑定的钱包地址');
};

const checkCurrentWallet = async () => {
    try {
        const { ethereum } = window;
        if (ethereum) {
            const accounts = await ethereum.request({ 
                method: 'eth_accounts' 
            }) as string[];
            console.log('accounts:', accounts);
            
            if (accounts.length > 0) {
                await walletStore.connectMetaMask();
            }
        }
    } catch (error) {
        console.error('检查钱包状态失败:', error);
    }
};

const verificationSubmitting = ref(false);

const handleBusinessLicenseChange = (file: any) => {
    if (file) {
        companyVerificationForm.value.businessLicense = file.raw;
        companyVerificationForm.value.businessLicenseUrl = URL.createObjectURL(file.raw);
    }
};

const handleDialogClose = () => {
    showDIDDialog.value = false;
    didStep.value = 1;
};

// 获取 DID 信息
const fetchDIDInfo = async () => {
  try {
    const didService = await getDIDRegistryService()
    const address = await didService.getCurrentAddress()
    const info = await didService.getDIDInfo(address)
    didInfo.value = info
  } catch (error) {
    console.error('获取 DID 信息失败:', error)
    ElMessage.error('获取 DID 信息失败')
  }
}

const generateBinaryBackground = () => {
  const bits = [];
  for (let i = 0; i < 100; i++) {
    bits.push({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`
    });
  }
  return bits;
};

const backgroundBits = generateBinaryBackground();
</script>


<style scoped lang="scss">
@import "@/styles/variables.scss";

.user-profile-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 75px);
  color: #8892b0;
  position: relative;
  z-index: 1;
}

// 添加二进制背景
.binary-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0a192f;
  overflow: hidden;
  z-index: 0;

  .binary-bit {
    position: absolute;
    color: rgba(100, 255, 218, 0.1);
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
  background: rgba(10, 25, 47, 0.7);
  border: 1px solid #233554;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-3px);
    border-color: #64ffda;
  }

  :deep(.el-card__header) {
    background: rgba(35, 53, 84, 0.5);
    border-bottom: 1px solid #233554;
    padding: 18px 20px;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: #64ffda;
    }

    .card-title {
      margin: 0;
      font-size: 18px;
      color: #e6f1ff;
    }
  }
}

// 公司信息卡片
.user-info-card {
  :deep(.el-descriptions) {
    // 整体表格样式
    .el-descriptions__table {
      background: transparent;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #233554;
    }

    // 标签和内容单元格的通用样式
    .el-descriptions__cell {
      background: rgba(10, 25, 47, 0.5) !important;
      border-bottom: 1px solid #233554;
    }

    // 标签单元格
    .el-descriptions-item__label {
      width: 120px;
      font-weight: 500;
      color: #64ffda !important;
      background: rgba(35, 53, 84, 0.5) !important;
      padding: 16px 20px;

      &.is-bordered-content {
        border-right: 1px solid #233554;
      }
    }

    // 内容单元格
    .el-descriptions-item__content {
      background: rgba(10, 25, 47, 0.5) !important;
      color: #8892b0 !important;
      padding: 16px 20px;

      // 链接样式
      .el-link {
        color: #64ffda !important;
        &:hover {
          color: #8892b0 !important;
        }
      }

      // 标签样式
      .el-tag {
        background: rgba(100, 255, 218, 0.1);
        border-color: #64ffda;
        color: #64ffda;
      }
    }

    // 表格边框
    .el-descriptions__body {
      .el-descriptions__table {
        border-collapse: collapse;
        
        td {
          border-right: 1px solid #233554;
          
          &:last-child {
            border-right: none;
          }
        }
      }
    }

    // 确保所有文本颜色正确
    .el-descriptions-item__container {
      .el-descriptions-item__label,
      .el-descriptions-item__content {
        line-height: 1.5;
        
        span, p, div {
          color: inherit;
        }
      }
    }
  }
}

// 安全设置卡片
.change-password-card {
  .security-info {
    .el-alert {
      background: rgba(35, 53, 84, 0.5);
      border: 1px solid #233554;
      color: #8892b0;
    }

    .el-button {
      background: transparent;
      border: 1px solid #64ffda;
      color: #64ffda;

      &:hover {
        background: rgba(100, 255, 218, 0.1);
      }
    }
  }
}

// 企业认证卡片
.verification-card {
  .verification-status {
    .el-result {
      padding: 20px 0;
      color: #e6f1ff;

      :deep(.el-result__icon) {
        .icon-success {
          color: #64ffda;
        }
        .icon-warning {
          color: #ffb86c;
        }
      }

      :deep(.el-result__title) {
        color: #e6f1ff;
      }

      :deep(.el-result__subtitle) {
        color: #8892b0;
      }

      .tip-text {
        margin-top: 12px;
        font-size: 12px;
        color: #8892b0;
        text-align: center;
      }

      .el-button {
        background: transparent;
        border: 1px solid #64ffda;
        color: #64ffda;

        &:hover {
          background: rgba(100, 255, 218, 0.1);
        }

        &:disabled {
          border-color: #8892b0;
          color: #8892b0;
        }
      }
    }
  }
}

// 弹窗样式
:deep(.el-dialog) {
  background: #0a192f;
  border: 1px solid #233554;
  border-radius: 8px;

  .el-dialog__header {
    border-bottom: 1px solid #233554;
    .el-dialog__title {
      color: #e6f1ff;
    }
  }

  .el-dialog__body {
    color: #8892b0;
  }

  .el-form-item__label {
    color: #64ffda;
  }

  .el-input {
    background: rgba(35, 53, 84, 0.5);
    border: 1px solid #233554;
    color: #e6f1ff;

    .el-input__inner {
      background: transparent;
      color: #e6f1ff;
    }
  }

  .el-button {
    &:not(.el-button--primary) {
      background: transparent;
      border: 1px solid #64ffda;
      color: #64ffda;

      &:hover {
        background: rgba(100, 255, 218, 0.1);
      }
    }

    &.el-button--primary {
      background: #64ffda;
      border-color: #64ffda;
      color: #0a192f;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .user-profile-container {
    padding: 10px;

    .el-col-md-8 {
      margin-top: 20px;
    }

    .el-card {
      margin-bottom: 15px;

      :deep(.el-card__header) {
        padding: 14px 16px;
      }

      .card-title {
        font-size: 16px !important;
      }
    }

    :deep(.el-descriptions) {
      .el-descriptions-item__label {
        width: 100px !important;
      }
    }

    .el-dialog {
      width: 90% !important;
    }
  }
}

// 通用工具类
.mt-20 { margin-top: 20px !important; }
.mb-20 { margin-bottom: 20px !important; }
.mr-8 { margin-right: 8px !important; }
.text-center { text-align: center; }

.address-mismatch-warning {
    width: 100%;
    margin-bottom: 12px;
    
    .mt-8 {
        margin-top: 8px;
    }
}

.preview-image {
    margin-top: 10px;
    max-width: 100%;
    max-height: 200px;
}
</style>
