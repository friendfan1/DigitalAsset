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
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalAssets"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 资产详情对话框 -->
    <el-dialog
      v-model="assetDetailsDialogVisible"
      :title="assetDetails?.metadata?.fileName || '资产详情'"
      width="70%"
      destroy-on-close
    >
      <div class="asset-details-content" v-if="assetDetails">
        <div class="asset-info">
          <div class="asset-main">
            <span class="asset-name">{{ assetDetails.metadata.fileName }}</span>
            <el-tag size="small" type="info">{{ assetDetails.metadata.category }}</el-tag>
            <el-tag 
              size="small" 
              :type="assetDetails.isCertified ? 'success' : 'warning'"
              style="margin-left: 10px;"
            >
              {{ assetDetails.isCertified ? '已认证' : '未认证' }}
            </el-tag>
          </div>
          
          <!-- 资产基本信息 -->
          <el-descriptions :column="3" border>
            <el-descriptions-item label="资产ID">{{ assetDetails.tokenId }}</el-descriptions-item>
            <el-descriptions-item label="文件大小">{{ formatFileSize(assetDetails.metadata.fileSize || 0) }}</el-descriptions-item>
            <el-descriptions-item label="文件类型">{{ assetDetails.metadata.fileType }}</el-descriptions-item>
            <el-descriptions-item label="IPFS CID">
              <el-tooltip content="点击复制" placement="top">
                <span class="cid" @click="copyToClipboard(assetDetails.cid)">
                  {{ assetDetails.cid }}
                </span>
              </el-tooltip>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ formatDate(assetDetails.registrationDate) }}</el-descriptions-item>
            <el-descriptions-item label="资产版本">{{ assetDetails.version }}</el-descriptions-item>
          </el-descriptions>
          
          <!-- 认证历史 -->
          <div class="certification-history" v-if="assetDetails.certificationHistory && assetDetails.certificationHistory.length > 0">
            <h3>认证历史</h3>
            <el-timeline>
              <el-timeline-item
                v-for="(cert, index) in assetDetails.certificationHistory"
                :key="index"
                :timestamp="formatDate(cert.timestamp)"
                :type="cert.certifier === userWalletAddress ? 'primary' : 'info'"
              >
                <div class="cert-info">
                  <div><strong>认证人：</strong>{{ formatAddress(cert.certifier) }}</div>
                  <div><strong>评论：</strong>{{ cert.comment }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
          
          <!-- 资产预览 -->
          <div class="asset-preview">
            <h3>资产预览</h3>
            <div class="preview-container">
              <img 
                v-if="assetPreviewUrl && isImageFile(assetDetails.metadata.fileType)"
                :src="assetPreviewUrl" 
                alt="预览图片" 
                class="preview-image"
                @click="showFullImage"
                @error="handleMediaError"
              />
              <iframe
                v-else-if="assetPreviewUrl && isPdfFile(assetDetails.metadata.fileType)"
                :src="assetPreviewUrl"
                type="application/pdf"
                frameborder="0"
                class="preview-iframe"
                @load="iframeLoadFailed = false"
                @error="iframeLoadFailed = true"
              ></iframe>
              <video
                v-else-if="assetPreviewUrl && isVideoFile(assetDetails.metadata.fileType)"
                controls
                :src="assetPreviewUrl" 
                :type="assetDetails.metadata.fileType"
                crossorigin="anonymous"
                @error="handleMediaError"
                class="preview-video"
              >
                您的浏览器不支持视频标签。
              </video>
              <audio
                v-else-if="assetPreviewUrl && isAudioFile(assetDetails.metadata.fileType)"
                controls
                :src="assetPreviewUrl" 
                :type="assetDetails.metadata.fileType"
                crossorigin="anonymous"
                @error="handleMediaError"
                style="width: 100%; margin-bottom: 1rem;"
              >
                您的浏览器不支持音频标签。
              </audio>
              <div v-else-if="isLoadingPreview" class="loading-preview">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>加载预览中...</span>
              </div>
              <div v-else class="no-preview">
                <el-icon><Document /></el-icon>
                <span>无法预览此类型的文件</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
    </el-dialog>

    <!-- 资产认证对话框 -->
    <el-dialog
      v-model="certificationDialogVisible"
      title="资产认证"
      width="500px"
      destroy-on-close
    >
      <template v-if="selectedAssetForCert">
        <p>您正在为以下资产进行认证：</p>
        <div class="cert-asset-info">
          <p><strong>资产ID：</strong> {{ selectedAssetForCert.tokenId }}</p>
          <p><strong>文件名：</strong> {{ selectedAssetForCert.metadata.fileName }}</p>
          <p><strong>文件类型：</strong> {{ selectedAssetForCert.metadata.fileType }}</p>
        </div>
        
        <el-form :model="certificationForm" label-width="100px" class="cert-form">
          <el-form-item label="认证评论" required>
            <el-input 
              v-model="certificationForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入认证评论，说明认证原因和内容真实性的确认..."
            ></el-input>
          </el-form-item>
          
          <el-form-item label="其他认证人">
            <el-select 
              v-model="certificationForm.additionalCertifiers"
              multiple
              clearable
              placeholder="选择至少一名额外认证人（多重签名要求）"
            >
              <el-option
                v-for="certifier in availableCertifiers"
                :key="certifier.walletAddress"
                :label="certifier.username || formatAddress(certifier.walletAddress)"
                :value="certifier.walletAddress"
              ></el-option>
            </el-select>
            <div class="form-hint">注意：区块链认证需要至少两名认证人的签名</div>
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
          </el-form-item>
          
          <el-form-item label="其他认证人">
            <el-select 
              v-model="batchCertificationForm.additionalCertifiers"
              multiple
              clearable
              placeholder="选择至少一名额外认证人（多重签名要求）"
            >
              <el-option
                v-for="certifier in availableCertifiers"
                :key="certifier.walletAddress"
                :label="certifier.username || formatAddress(certifier.walletAddress)"
                :value="certifier.walletAddress"
              ></el-option>
            </el-select>
            <div class="form-hint">注意：区块链认证需要至少两名认证人的签名</div>
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
import { BrowserProvider } from 'ethers';

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
  comment: '',
  additionalCertifiers: []
});

// 批量认证状态
const batchCertificationDialogVisible = ref(false);
const isBatchCertifying = ref(false);
const batchCertificationForm = ref({
  comment: '',
  additionalCertifiers: []
});

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
  return certificationForm.value.comment.trim() !== '' && 
         certificationForm.value.additionalCertifiers.length > 0;
});

const isBatchCertificationFormValid = computed(() => {
  return batchCertificationForm.value.comment.trim() !== '' && 
         batchCertificationForm.value.additionalCertifiers.length > 0;
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
    
    // 使用新的获取待认证资产的方法
    const { assets: assetsData, totalCount } = await digitalAssetServiceSingleton.getAssetsForCertification(
      userStore.profile?.token || '',
      currentPage.value,
      pageSize.value
    );
    
    totalAssets.value = totalCount;
    assets.value = assetsData;
    
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
    iframeLoadFailed.value = false;
    
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
    
    // 导入IPFS配置
    const { ipfsConfig } = await import('@/config/ipfs.config');
    const ipfsGateway = window.ipfsGateway || ipfsConfig.gateway;
    
    // 生成预览URL
    assetPreviewUrl.value = `${ipfsGateway}${asset.cid}/content`;
    
    // 对视频和音频添加时间戳参数避免缓存问题
    if (fileType.startsWith('video/') || fileType.startsWith('audio/')) {
      assetPreviewUrl.value += `?t=${Date.now()}`;
    }
    
  } catch (error) {
    console.error('获取预览失败:', error);
    assetPreviewUrl.value = '';
    ElMessage.error('预览生成失败');
  } finally {
    isLoadingPreview.value = false;
  }
};

const showCertificationDialog = (asset: Asset) => {
  selectedAssetForCert.value = asset;
  certificationForm.value = {
    comment: '',
    additionalCertifiers: []
  };
  certificationDialogVisible.value = true;
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
    ElMessage.warning('请填写认证评论并选择至少一名额外认证人');
    return;
  }
  
  isCertifying.value = true;
  try {
    const digitalAssetService = await getDigitalAssetService();
    
    const request: CertificationRequest = {
      tokenId: Number(selectedAssetForCert.value!.tokenId),
      comment: certificationForm.value.comment,
      approvers: certificationForm.value.additionalCertifiers
    };
    
    await digitalAssetService.certifyAsset(request);
    
    ElMessage.success('资产认证成功');
    certificationDialogVisible.value = false;
    
    await fetchAssets();
    
  } catch (error: any) {
    console.error('资产认证失败:', error);
    ElMessage.error('资产认证失败: ' + (error.message || '未知错误'));
  } finally {
    isCertifying.value = false;
  }
};

const certifyBatchAssets = async () => {
  if (!isBatchCertificationFormValid.value) {
    ElMessage.warning('请填写认证评论并选择至少一名额外认证人');
    return;
  }
  
  if (selectedUncertifiedAssets.value.length === 0) {
    ElMessage.warning('没有可认证的资产');
    return;
  }
  
  isBatchCertifying.value = true;
  try {
    const digitalAssetService = await getDigitalAssetService();
    
    // 循环处理每个资产
    for (const asset of selectedUncertifiedAssets.value) {
      try {
        const request: CertificationRequest = {
          tokenId: Number(asset.tokenId),
          comment: batchCertificationForm.value.comment,
          approvers: batchCertificationForm.value.additionalCertifiers
        };
        
        await digitalAssetService.certifyAsset(request);
      } catch (error: any) {
        console.error(`认证资产 ${asset.tokenId} 失败:`, error);
      }
    }
    
    ElMessage.success(`批量认证完成，成功认证 ${selectedUncertifiedAssets.value.length} 个资产`);
    batchCertificationDialogVisible.value = false;
    
    await fetchAssets();
    
  } catch (error: any) {
    console.error('批量认证失败:', error);
    ElMessage.error('批量认证失败: ' + (error.message || '未知错误'));
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
</script>

<style scoped>
.asset-certification-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  color: #0a192f;
  font-size: 28px;
  margin-bottom: 10px;
}

.page-header p {
  color: #8892b0;
  font-size: 16px;
}

.search-filter-section {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.asset-details-content {
  padding: 15px;
}

.asset-main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.asset-name {
  font-size: 18px;
  font-weight: 600;
}

.cid {
  font-family: monospace;
  background-color: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
  display: inline-block;
}

.certification-history {
  margin-top: 30px;
}

.certification-history h3 {
  color: #0a192f;
  margin-bottom: 15px;
}

.cert-info {
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.asset-preview {
  margin-top: 30px;
}

.asset-preview h3 {
  color: #0a192f;
  margin-bottom: 15px;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
  cursor: pointer;
}

.preview-iframe {
  width: 100%;
  height: 500px;
  border: none;
}

.preview-video {
  max-width: 100%;
  max-height: 500px;
}

.loading-preview, .no-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: #8892b0;
}

.cert-asset-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.cert-form {
  margin-top: 20px;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.batch-certification {
  margin-top: 20px;
  display: flex;
  justify-content: flex-start;
}

/* 全屏图片容器 */
.full-image-container {
  width: 100%;
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.1);
}

.full-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style> 