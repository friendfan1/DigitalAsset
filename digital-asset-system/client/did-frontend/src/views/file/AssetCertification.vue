<template>
  <div class="asset-certification-container">
    <div class="page-header">
      <h1>资产认证</h1>
      <p>使用此页面对数字资产进行区块链认证，为资产增加信任度和可信性。</p>
    </div>

    <!-- 资产搜索筛选区域 -->
    <div class="search-filter-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索资产 ID、名称或描述..."
        prefix-icon="el-icon-search"
        clearable
        @input="handleSearch"
      />
      <el-select v-model="filterStatus" placeholder="认证状态" @change="handleSearch">
        <el-option label="全部" value="all" />
        <el-option label="未认证" value="uncertified" />
        <el-option label="已认证" value="certified" />
      </el-select>
    </div>

    <!-- 资产列表 -->
    <el-table
      v-loading="isLoading"
      :data="filteredAssets"
      stripe
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="资产ID" prop="tokenId" width="80" sortable />
      <el-table-column label="文件名" prop="metadata.fileName" min-width="200" show-overflow-tooltip sortable />
      <el-table-column label="类型" prop="metadata.fileType" width="120" show-overflow-tooltip />
      <el-table-column label="大小" width="100" sortable>
        <template #default="{ row }">
          {{ formatFileSize(row.metadata.fileSize || 0) }}
        </template>
      </el-table-column>
      <el-table-column label="登记时间" width="160" sortable>
        <template #default="{ row }">
          {{ formatDate(row.registrationDate) }}
        </template>
      </el-table-column>
      <el-table-column label="认证状态" width="100" sortable>
        <template #default="{ row }">
          <el-tag :type="row.isCertified ? 'success' : 'warning'">
            {{ row.isCertified ? '已认证' : '未认证' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small" 
            @click="showAssetDetails(row)" 
            :icon="View"
          >查看</el-button>
          <el-button 
            v-if="!row.isCertified" 
            type="success" 
            size="small" 
            @click="showCertificationDialog(row)" 
            :icon="Check"
          >认证</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页控件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:currentPage="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalAssets"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 资产详情对话框 -->
    <asset-detail-dialog
      v-if="assetDetails"
      v-model:visible="assetDetailsDialogVisible"
      :asset-details="assetDetails"
      :asset-preview-url="assetPreviewUrl"
      @close="closeAssetDetails"
    >
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assetDetailsDialogVisible = false">关闭</el-button>
          <el-button 
            v-if="assetDetails && !assetDetails.isCertified" 
            type="success" 
            @click="showCertificationDialog(assetDetails)"
          >认证此资产</el-button>
        </span>
      </template>
    </asset-detail-dialog>

    <!-- 资产认证对话框 -->
    <el-dialog
      v-model="certificationDialogVisible"
      title="资产认证"
      width="600px"
      destroy-on-close
    >
      <template v-if="selectedAssetForCert">
        <p>您正在为以下资产进行认证：</p>
        <div class="cert-asset-info">
          <p><strong>资产ID：</strong> {{ selectedAssetForCert.tokenId }}</p>
          <p><strong>文件名：</strong> {{ selectedAssetForCert.metadata.fileName }}</p>
          <p><strong>文件类型：</strong> {{ selectedAssetForCert.metadata.fileType }}</p>
        </div>

        <!-- 添加认证申请信息 -->
        <div v-if="selectedAssetForCert.reason" class="certification-request-info">
          <h3>认证申请信息</h3>
          <div class="request-details">
            <div class="request-item">
              <div class="request-label">申请原因：</div>
              <div class="request-content">{{ selectedAssetForCert.reason }}</div>
            </div>
            <div v-if="selectedAssetForCert.requester" class="request-item">
              <div class="request-label">申请者：</div>
              <div class="request-content">{{ formatAddress(selectedAssetForCert.requester) }}</div>
            </div>
            <div v-if="selectedAssetForCert.requestTime" class="request-item">
              <div class="request-label">申请时间：</div>
              <div class="request-content">{{ formatDate(selectedAssetForCert.requestTime) }}</div>
            </div>
          </div>
        </div>

        <!-- 添加认证状态展示 -->
        <div class="certification-status">
          <h3>认证状态</h3>
          <div v-loading="isLoadingStatus" class="status-list">
            <template v-if="certificationStatus.length > 0">
              <div v-for="status in certificationStatus" :key="status.certifierAddress" class="status-item">
                <div class="certifier-info">
                  <span class="certifier-name">{{ status.certifierName || formatAddress(status.certifierAddress) }}</span>
                  <span class="certifier-address">{{ formatAddress(status.certifierAddress) }}</span>
                </div>
                <div class="status-badge" :class="status.status">
                  {{ status.status === 'PENDING' ? '待认证' : 
                     status.status === 'APPROVED' ? '已通过' : 
                     status.status === 'REJECTED' ? '已拒绝' : '已完成' }}
                </div>
                <div v-if="status.timestamp" class="status-time">
                  {{ formatDate(new Date(status.timestamp)) }}
                </div>
                <div v-if="status.reason" class="status-reason">
                  {{ status.reason }}
                </div>
              </div>
            </template>
            <div v-else class="no-status">
              暂无认证记录
            </div>
          </div>
        </div>
        
        <el-form :model="certificationForm" label-width="100px" class="cert-form">
          <el-form-item label="认证评论" required>
            <el-input 
              v-model="certificationForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入认证评论，说明认证原因和内容真实性的确认..."
            ></el-input>
            <!-- 添加常用评论快速选择 -->
            <div class="quick-comments">
              <span class="quick-comments-label">常用评论：</span>
              <el-button 
                type="success" 
                size="small" 
                @click="certificationForm.comment = `我，${userStore.profile?.username || '认证者'}，于${formatDate(new Date())}经过审核认为该资产内容真实有效，符合认证标准，同意认证。`"
              >同意认证</el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="certificationForm.comment = `我，${userStore.profile?.username || '认证者'}，于${formatDate(new Date())}经审核发现该资产内容存在问题，不符合认证标准，拒绝认证。`"
              >拒绝认证</el-button>
            </div>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="certificationDialogVisible = false">取消</el-button>
          <el-button 
            type="success" 
            :loading="isCertifying" 
            :disabled="!isCertificationFormValid" 
            @click="certifyAsset"
          >确认认证</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量认证按钮 -->
    <div class="batch-certification" v-if="selectedAssets.length > 0">
      <el-button 
        type="success" 
        :disabled="!hasUncertifiedAssets" 
        @click="showBatchCertificationDialog"
      >
        批量认证 ({{ selectedUncertifiedAssets.length }})
      </el-button>
    </div>

    <!-- 批量认证对话框 -->
    <el-dialog
      v-model="batchCertificationDialogVisible"
      title="批量资产认证"
      width="550px"
      destroy-on-close
    >
      <div v-if="selectedUncertifiedAssets.length > 0">
        <p>您正在为以下 {{ selectedUncertifiedAssets.length }} 个资产进行批量认证：</p>
        <el-table :data="selectedUncertifiedAssets" height="250px" size="small">
          <el-table-column label="资产ID" property="tokenId" width="80"></el-table-column>
          <el-table-column label="文件名" property="metadata.fileName" show-overflow-tooltip></el-table-column>
        </el-table>
        
        <el-form :model="batchCertificationForm" label-width="100px" class="cert-form" style="margin-top: 20px;">
          <el-form-item label="认证评论" required>
            <el-input 
              v-model="batchCertificationForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入批量认证评论..."
            ></el-input>
            <div class="quick-comments">
              <span class="quick-comments-label">常用评论：</span>
              <el-button 
                type="success" 
                size="small" 
                @click="batchCertificationForm.comment = `我，${userStore.profile?.username || '认证者'}，于${formatDate(new Date())}批量审核通过，这些资产内容真实有效，符合认证标准，同意认证。`"
              >批量同意</el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="batchCertificationForm.comment = `我，${userStore.profile?.username || '认证者'}，于${formatDate(new Date())}经审核发现这些资产内容存在问题，不符合认证标准，拒绝认证。`"
              >拒绝认证</el-button>
            </div>
          </el-form-item>
          
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchCertificationDialogVisible = false">取消</el-button>
          <el-button 
            type="success" 
            :loading="isBatchCertifying" 
            :disabled="!isBatchCertificationFormValid || selectedUncertifiedAssets.length === 0" 
            @click="certifyBatchAssets"
          >确认批量认证</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Document, Check, Loading } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { useWalletStore } from '@/stores/wallet';
import { formatDate } from '@/utils/dateFormat';
import { DigitalAssetService, type CertificationRequest, getDigitalAssetService } from '@/utils/web3/DigitalAssetService';
import { RBACService, getRBACService } from '@/utils/web3/RBACService';
import { hasBlockchainRole } from '@/utils/permission';
import { BrowserProvider, Signature } from 'ethers';
import AssetDetailDialog from '@/components/AssetDetailDialog.vue';
import axios from 'axios';
import { ethers } from 'ethers';

// 用户信息
const userStore = useUserStore();
const userWalletAddress = computed(() => userStore.profile?.walletAddress || '');

// 钱包信息
const walletStore = useWalletStore();

// 权限检查
const checkCertifierRole = async () => {
  const isCertifier = await hasBlockchainRole('CERTIFIER_ROLE');
  if (!isCertifier) {
    ElMessage.error('您没有资产认证权限');
    // 可以在这里重定向回首页
  }
  return isCertifier;
};

// 添加以下接口定义
interface AssetMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  description?: string;
  // 其他元数据字段
}

interface CertificationRecord {
  certifier: string;
  timestamp: Date;
  comment: string;
}

interface Asset {
  tokenId: string | number;
  cid: string;
  metadata: AssetMetadata;
  contentHash: string;
  registrant: string;
  registrationDate: Date;
  isCertified: boolean;
  encryptedKey: string;
  version: string;
  owner: string;
  certificationHistory: CertificationRecord[];
  reason?: string;
  requester?: string;
  requestTime?: Date;
}

// 使用这些类型初始化变量
const assetDetails = ref<Asset | null>(null);
const selectedAssetForCert = ref<Asset | null>(null);
const assets = ref<Asset[]>([]);
const selectedAssets = ref<Asset[]>([]);
const availableCertifiers = ref<{walletAddress: string; username: string}[]>([]);

// 资产列表状态
const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalAssets = ref(0);
const searchQuery = ref('');
const filterStatus = ref('all');

// 资产详情状态
const assetDetailsDialogVisible = ref(false);
const assetPreviewUrl = ref('');
const isLoadingPreview = ref(false);
const iframeLoadFailed = ref(false);
const fullImageVisible = ref(false);

// 认证状态
const certificationDialogVisible = ref(false);
const isCertifying = ref(false);
const certificationForm = ref({
  comment: ''
});

// 批量认证状态
const batchCertificationDialogVisible = ref(false);
const isBatchCertifying = ref(false);
const batchCertificationForm = ref({
  comment: '',
  additionalCertifiers: []
});


interface CertificationStatus {
  certifierAddress: string;
  certifierName?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  timestamp?: string;
  reason?: string;
}

const certificationStatus = ref<CertificationStatus[]>([]);
const isLoadingStatus = ref(false);

// 获取认证状态
const fetchCertificationStatus = async (tokenId: number) => {
  if (tokenId === null) return;
  
  isLoadingStatus.value = true;
  try {
    const token = userStore.profile?.token || '';
    const response = await axios.get(`/api/certification/status/${tokenId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      certificationStatus.value = response.data.data;
    } else {
      throw new Error(response.data.message || '获取认证状态失败');
    }
  } catch (error: any) {
    console.error('获取认证状态失败:', error);
    ElMessage.error('获取认证状态失败: ' + (error.message || '未知错误'));
  } finally {
    isLoadingStatus.value = false;
  }
};

// 计算属性
const filteredAssets = computed(() => {
  let filtered = assets.value.slice();

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(asset => 
      asset.tokenId.toString().includes(query) ||
      asset.metadata.fileName.toLowerCase().includes(query) ||
      (asset.metadata.description && asset.metadata.description.toLowerCase().includes(query))
    );
  }

  // 认证状态筛选
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(asset => 
      (filterStatus.value === 'certified' && asset.isCertified) ||
      (filterStatus.value === 'uncertified' && !asset.isCertified)
    );
  }

  return filtered;
});

const selectedUncertifiedAssets = computed(() => {
  return selectedAssets.value.filter(asset => !asset.isCertified);
});

const hasUncertifiedAssets = computed(() => {
  return selectedUncertifiedAssets.value.length > 0;
});

const isCertificationFormValid = computed(() => {
  return certificationForm.value.comment.trim() !== '';
});

const isBatchCertificationFormValid = computed(() => {
  return batchCertificationForm.value.comment.trim() !== ''
});

// 生命周期钩子
onMounted(async () => {
  await checkCertifierRole();
  fetchAssets();
  fetchAvailableCertifiers();
});

// 方法
const fetchAssets = async () => {
  isLoading.value = true;
  try {
    if (!walletStore.isConnected) {
      await walletStore.connectMetaMask();
    }
    
    const digitalAssetServiceSingleton = await getDigitalAssetService();
    console.log("token", userStore.profile?.token)

    const { assets: assetsData, totalCount } = await digitalAssetServiceSingleton.getAssetsForCertification(
      userStore.profile?.token || '',
      userStore.profile?.walletAddress || '',
      currentPage.value,
      pageSize.value
    );
    
    // 处理每个资产，提取认证请求信息到顶层属性
    const processedAssets = assetsData.map(asset => {
      // 如果有认证请求信息，提取到资产对象的顶层属性
      if (asset.certificationRequest) {
        return {
          ...asset,
          reason: asset.certificationRequest.reason,
          requester: asset.certificationRequest.requesterAddress,
          requestTime: new Date(asset.certificationRequest.requestTime),
          requestId: asset.certificationRequest.id,
          requestStatus: asset.certificationRequest.status
        };
      }
      return asset;
    });
    
    totalAssets.value = totalCount;
    assets.value = processedAssets;
    
  } catch (error) {
    console.error('获取待认证资产列表失败:', error);
    ElMessage.error('获取待认证资产列表失败');
  } finally {
    isLoading.value = false;
  }
};

const fetchMetadataFromIPFS = async (cid: string) => {
  try {
    const { ipfsConfig } = await import('@/config/ipfs.config');
    const ipfsGateway = window.ipfsGateway || ipfsConfig.gateway;
    const metadataUrl = `${ipfsGateway}${cid}/metadata.json`;
    
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取IPFS元数据失败:', error);
    // 返回基本元数据结构
    return {
      fileName: '未知文件名',
      fileSize: 0,
      fileType: '未知类型',
      description: '无法获取详细信息'
    };
  }
};

const fetchAvailableCertifiers = async () => {
  try {
    // 使用单例工厂函数获取服务实例
    const rbacService = await getRBACService();
    
    // 直接使用公开方法获取认证者角色成员数量
    const memberCount = await rbacService.getRoleMemberCount('CERTIFIER_ROLE');
    
    const certifiers = [];
    for (let i = 0; i < Number(memberCount); i++) {
      const certifierAddress = await rbacService.getRoleMember('CERTIFIER_ROLE', i);
      if (certifierAddress !== userWalletAddress.value) {
        certifiers.push({
          walletAddress: certifierAddress,
          username: `认证者 ${certifierAddress.slice(0, 6)}...${certifierAddress.slice(-4)}`
        });
      }
    }
    
    availableCertifiers.value = certifiers;
  } catch (error) {
    console.error('获取认证者列表失败:', error);
    ElMessage.error('获取认证者列表失败');
  }
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  fetchAssets();
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  fetchAssets();
};

const handleSelectionChange = (selection: Asset[]) => {
  selectedAssets.value = selection;
};

const showAssetDetails = async (asset: Asset) => {
  assetDetails.value = asset;
  assetDetailsDialogVisible.value = true;
  assetPreviewUrl.value = '';
  isLoadingPreview.value = true;
  
  // 生成预览URL
  try {
    await generatePreviewUrl(asset);
  } catch (error) {
    console.error('生成预览URL失败:', error);
  } finally {
    isLoadingPreview.value = false;
  }
};

const generatePreviewUrl = async (asset: Asset) => {
  try {
    isLoadingPreview.value = true;
    iframeLoadFailed.value = false; // 重置iframe加载状态
    
    // 检查文件类型是否可以预览
    if (!asset.metadata || !asset.metadata.fileType) {
      assetPreviewUrl.value = '';
      isLoadingPreview.value = false;
      return;
    }
    
    const fileType = asset.metadata.fileType;
    const isPreviewable = isFilePreviewable(fileType);
    
    if (!isPreviewable) {
      assetPreviewUrl.value = '';
      isLoadingPreview.value = false;
      return;
    }
    
    // 导入所需服务
    const { getIPFSUrl } = await import('@/utils/ipfs');
    const { ipfsConfig } = await import('@/config/ipfs.config');
    const { getChunkedFileService } = await import('@/services/ChunkedFileService');
    
    // 获取IPFS网关
    const ipfsGateway = window.ipfsGateway || ipfsConfig.gateway;
    const chunkedService = getChunkedFileService(ipfsGateway);
    
    // 检查是否是分片文件
    const isChunked = await chunkedService.isChunkedFile(asset.cid);
    
    if (isChunked) {
      // 检测到分片文件
      console.log('检测到分片文件:', asset.cid);
      
      // 获取元数据
      const metadata = await chunkedService.getMetadata(asset.cid);
      console.log('分片文件元数据:', metadata);
      
      // 获取预览模式
      const previewMode = chunkedService.getPreviewMode(fileType);
      
      // 根据预览模式处理
      if (previewMode === 'stream') {
        // 视频和音频文件使用流服务
        assetPreviewUrl.value = chunkedService.getStreamUrl(asset.cid, fileType);
        console.log('分片媒体流URL:', assetPreviewUrl.value);
        ElMessage.info('正在加载媒体流，请稍候...');
      } else if (previewMode === 'image') {
        // 图片和PDF，尝试使用流服务直接显示
        if (fileType.startsWith('image/')) {
          // 对于图片，先尝试iframe方式查看
          assetPreviewUrl.value = chunkedService.getStreamUrl(asset.cid, fileType);
          console.log('分片图片流URL:', assetPreviewUrl.value);
          ElMessage.info('正在加载图片...');
        } else if (fileType === 'application/pdf') {
          // PDF文件使用流服务
          assetPreviewUrl.value = chunkedService.getStreamUrl(asset.cid, fileType);
          console.log('分片PDF流URL:', assetPreviewUrl.value);
          ElMessage.info('正在加载PDF...');
        }
      } else {
        // 其他类型文件
        ElMessage.info('该文件过大，已进行分片存储，请下载后查看');
        assetPreviewUrl.value = '';
      }
    } else {
      // 不是分片文件，使用标准路径
      assetPreviewUrl.value = `${ipfsGateway}${asset.cid}/content`;
      
      // 对视频和音频添加时间戳参数避免缓存问题
      if (fileType.startsWith('video/') || fileType.startsWith('audio/')) {
        assetPreviewUrl.value += `?t=${Date.now()}`;
      }
      
      console.log('标准预览URL:', assetPreviewUrl.value);
    }
  } catch (error) {
    console.error('获取预览失败:', error);
    assetPreviewUrl.value = '';
    ElMessage.error('预览生成失败: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    isLoadingPreview.value = false;
  }
};

const showCertificationDialog = (asset: Asset) => {

  selectedAssetForCert.value = asset;
  certificationForm.value = {
    comment: ''
  };
  certificationDialogVisible.value = true;
  // 获取认证状态
  fetchCertificationStatus(Number(asset.tokenId));
};

const showBatchCertificationDialog = () => {
  if (selectedUncertifiedAssets.value.length === 0) {
    ElMessage.warning('没有可认证的资产');
    return;
  }
  
  batchCertificationForm.value = {
    comment: '',
    additionalCertifiers: []
  };
  batchCertificationDialogVisible.value = true;
};

const certifyAsset = async () => {
  if (!isCertificationFormValid.value) {
    ElMessage.warning('请填写认证评论');
    return;
  }
  
  isCertifying.value = true;
  try {
    if (!walletStore.isConnected) {
      await walletStore.connectMetaMask();
    }
    
    const tokenId = Number(selectedAssetForCert.value!.tokenId);
    const reason = certificationForm.value.comment;
    
    // 直接哈希化评论内容，避免中文字符编码问题
    const reasonHash = ethers.keccak256(ethers.toUtf8Bytes(reason));
    
    // 准备要签名的消息 - 匹配智能合约中的验证逻辑
    // 合约使用：keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked(tokenId, comment))))
    const innerMessageData = ethers.solidityPacked(
      ['uint256', 'bytes32'],
      [tokenId, reasonHash]
    ); 
    const innerMessageHash = ethers.keccak256(innerMessageData);
    
    // 获取钱包提供商
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // 关键修改: 使用 signMessage 对 innerMessageHash 的字节表示进行签名
    // ethers.js 的 signMessage 会自动添加前缀 "\x19Ethereum Signed Message:\n" + 长度 + 消息
    // 这样签名的结果将符合合约中的验证逻辑
    const signature = await signer.signMessage(ethers.getBytes(innerMessageHash));
    
    console.log("签名参数:", {
      tokenId,
      reason,
      reasonHash,
      innerMessageData,
      innerMessageHash,
      signature,
      userWalletAddress: userWalletAddress.value
    });
    
    // 验证签名 - 应该使用相同的消息构造方式
    try {
      const recoveredAddress = ethers.verifyMessage(
        ethers.getBytes(innerMessageHash),
        signature
      );
      console.log("签名验证:", {
        recoveredAddress,
        originalAddress: userWalletAddress.value,
        matches: recoveredAddress.toLowerCase() === userWalletAddress.value.toLowerCase()
      });
    } catch (verifyError) {
      console.error("签名验证失败:", verifyError);
    }

    const timestamp = new Date();
    
    // 存储到后端: 保存 tokenId, reason, 签名者地址, 签名, 原始消息 (便于后续验证)
    const response = await axios.post('/api/certification/sign', {
      tokenId,
      reason,
      reasonHash, // 添加评论的哈希值
      certifierAddress: userWalletAddress.value,
      signature,
      messageToSign: innerMessageData, // 存储原始消息数据
      messageHash: innerMessageHash,   // 额外存储消息哈希，便于验证
      timestamp
    } as any, {
      headers: {
        'Authorization': `Bearer ${userStore.profile?.token || ''}`
      }
    });
    
    if (response.data.success) {
      ElMessage.success('认证签名提交成功，等待其他认证者完成认证');
    } else {
      throw new Error(response.data.message || '认证失败');
    }
    
    certificationDialogVisible.value = false;
    
    // 刷新资产列表和认证状态
    await fetchAssets();
    await fetchCertificationStatus(tokenId);
    
  } catch (error: any) {
    console.error('资产认证失败:', error);
    ElMessage.error('资产认证失败: ' + (error.message || '未知错误'));
  } finally {
    isCertifying.value = false;
  }
};

const certifyBatchAssets = async () => {
  if (!isBatchCertificationFormValid.value) {
    ElMessage.warning('请填写认证评论');
    return;
  }
  
  if (selectedUncertifiedAssets.value.length === 0) {
    ElMessage.warning('没有可认证的资产');
    return;
  }
  
  isBatchCertifying.value = true;
  
  // 确认对话框
  try {
    await ElMessageBox.confirm(
      `您确定要批量认证这${selectedUncertifiedAssets.value.length}个资产吗？此操作将调用智能合约，需要支付gas费用。`,
      '批量认证确认',
      {
        confirmButtonText: '确认认证',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const digitalAssetService = await getDigitalAssetService();
    
    let successCount = 0;
    let failedCount = 0;
    
    // 循环处理每个资产
    for (const asset of selectedUncertifiedAssets.value) {
      try {
        const request: CertificationRequest = {
          tokenId: String(asset.tokenId),
          reason: batchCertificationForm.value.comment,
          approvers: batchCertificationForm.value.additionalCertifiers
        };
        
        try {
          await digitalAssetService.certifyAsset(userStore.profile?.token || '', request);
          successCount++;
          ElMessage.success(`资产 ${asset.tokenId} 认证成功`);
        } catch (dryRunError: any) {
          console.error(`资产 ${asset.tokenId} 参数验证失败:`, dryRunError);
          ElMessage.error(`资产 ${asset.tokenId} 参数验证失败: ${dryRunError.message || '未知错误'}`);
          failedCount++;
        }
      } catch (error: any) {
        console.error(`认证资产 ${asset.tokenId} 失败:`, error);
        ElMessage.error(`资产 ${asset.tokenId} 认证失败: ${error.message || '未知错误'}`);
        failedCount++;
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`批量认证已完成: ${successCount} 个成功，${failedCount} 个失败`);
    } else {
      ElMessage.error(`批量认证全部失败: ${failedCount} 个资产认证失败`);
    }
    
    batchCertificationDialogVisible.value = false;
    
    await fetchAssets();
    
  } catch (error: any) {
    if (error === 'cancel') {
      ElMessage.info('已取消批量认证');
    } else {
      console.error('批量认证失败:', error);
      ElMessage.error('批量认证失败: ' + (error.message || '未知错误'));
    }
  } finally {
    isBatchCertifying.value = false;
  }
};

// 文件类型检查函数
const isImageFile = (fileType: string) => fileType && fileType.startsWith('image/');
const isPdfFile = (fileType: string) => fileType && fileType.includes('pdf');
const isVideoFile = (fileType: string) => fileType && fileType.startsWith('video/');
const isAudioFile = (fileType: string) => fileType && fileType.startsWith('audio/');

const isFilePreviewable = (fileType: string) => {
  const previewableTypes = [
    // 图片格式
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
    // 文档格式
    'application/pdf',
    'text/plain', 'text/html', 'text/css', 'text/javascript',
    // 视频格式
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
    // 音频格式
    'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a', 'audio/webm'
  ];
  
  // 对于以某些前缀开头的类型也可预览
  if (fileType.startsWith('image/') || 
      fileType.startsWith('video/') || 
      fileType.startsWith('audio/')) {
    return true;
  }
  
  return previewableTypes.includes(fileType.toLowerCase());
};

// 处理媒体加载错误
const handleMediaError = () => {
  console.error('媒体加载失败:', assetPreviewUrl.value);
  ElMessage.error('媒体加载失败，可能的原因：IPFS网关连接问题或内容结构不正确');
};

// 显示全屏图片
const showFullImage = () => {
  fullImageVisible.value = true;
};

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      ElMessage.success('已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败');
    });
};

// 格式化地址
const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
};

// 添加closeAssetDetails函数
const closeAssetDetails = () => {
  assetDetailsDialogVisible.value = false;
  assetPreviewUrl.value = '';
  isLoadingPreview.value = true;
};
</script>

<style scoped>
.asset-certification-container {
  padding: 15px;
  max-width: 1400px;
  margin: 0 auto;
  height: calc(100vh - 60px); 
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 20px;
  padding: 0 10px;
}

.page-header h1 {
  color: #0a192f;
  font-size: 24px;
  margin-bottom: 8px;
}

.page-header p {
  color: #8892b0;
  font-size: 14px;
}

.search-filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  padding: 0 10px;
}

.search-filter-section .el-input {
  width: 300px;
}

.search-filter-section .el-select {
  width: 150px;
}

/* 表格容器样式 */
.el-table {
  flex: 1;
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
}

/* 分页控件样式 */
.pagination-container {
  padding: 10px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  border-radius: 8px;
  margin-top: auto;
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  margin-top: 5vh !important;
  max-height: 90vh;
}

:deep(.el-dialog__body) {
  padding: 20px;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

.cert-asset-info {
  background-color: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
  border: 1px solid #e2e8f0;
}

.cert-asset-info p {
  margin: 5px 0;
  font-size: 14px;
}

.certification-request-info {
  margin-bottom: 15px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
}

.certification-request-info h3 {
  font-size: 15px;
  color: #0a192f;
  margin-bottom: 10px;
}

.request-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.request-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
}

.request-label {
  font-weight: 500;
  color: #333;
  min-width: 70px;
}

.request-content {
  color: #606266;
  flex: 1;
  line-height: 1.4;
  padding: 4px 8px;
  background-color: #f1f5f9;
  border-radius: 4px;
  word-break: break-word;
}

.certification-status {
  margin: 15px 0;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.certification-status h3 {
  color: #0a192f;
  margin-bottom: 12px;
  font-size: 15px;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  font-size: 13px;
}

.certifier-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.certifier-name {
  color: #0a192f;
  font-weight: 500;
}

.certifier-address {
  color: #64748b;
  font-size: 12px;
}

.status-badge {
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
  border: 1px solid rgba(230, 162, 60, 0.2);
}

.status-badge.approved {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
  border: 1px solid rgba(103, 194, 58, 0.2);
}

.status-badge.rejected {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.2);
}

.status-time {
  color: #64748b;
  font-size: 12px;
}

.status-reason {
  color: #64748b;
  font-size: 12px;
  font-style: italic;
}

.no-status {
  text-align: center;
  color: #64748b;
  padding: 15px;
  background: #ffffff;
  border-radius: 4px;
  border: 1px dashed #e2e8f0;
  font-size: 13px;
}

.quick-comments {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-comments-label {
  font-weight: 500;
  font-size: 13px;
}

.cert-form {
  margin-top: 15px;
}

:deep(.el-form-item__label) {
  font-size: 13px;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
}

:deep(.el-textarea__inner) {
  min-height: 80px;
  font-size: 13px;
}

.batch-certification {
  margin-top: 15px;
  display: flex;
  justify-content: flex-start;
  padding: 0 10px;
}

/* 表格样式优化 */
:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  background-color: #f8fafc;
  font-weight: 600;
  color: #0a192f;
}

:deep(.el-table td) {
  padding: 8px 0;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #f8fafc;
}

/* 按钮样式优化 */
.el-button {
  padding: 6px 12px;
  font-size: 13px;
}

.el-button--small {
  padding: 4px 8px;
  font-size: 12px;
}

/* 标签样式优化 */
.el-tag {
  padding: 2px 6px;
  font-size: 12px;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style> 