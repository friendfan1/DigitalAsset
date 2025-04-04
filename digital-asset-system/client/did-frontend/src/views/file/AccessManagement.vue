<template>
  <div class="access-management">
    <!-- 添加动态二进制背景 -->
    <div class="binary-background">
      <div v-for="i in 50" :key="i" class="binary-bit" :style="{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`
      }">{{ Math.round(Math.random()) }}</div>
    </div>
    
    <!-- 标签导航 -->
    <div class="tab-nav">
      <button 
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ 'tab-btn': true, active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 资产列表 -->
    <div v-if="activeTab === 'assets'" class="assets-section">
      <div class="section-header">
        <h2 class="section-title" data-text="资产列表">资产列表</h2>
      </div>
      <Suspense>
        <template #default>
          <AssetList />
        </template>
        <template #fallback>
          <div class="loading-state">
            <el-skeleton :rows="3" animated />
          </div>
        </template>
      </Suspense>
    </div>

    <!-- 资产登记 -->
    <div v-if="activeTab === 'register'" class="register-section">
      <div class="section-header">
        <h2 class="section-title" data-text="资产登记">资产登记</h2>
      </div>
      <FileUpload
        :multiple="false"
        :show-metadata="true"
        @success="handleUploadSuccess"
        @error="handleUploadError"
        @progress="handleProgress"
      />
    </div>

    <div v-if="activeTab === 'certification'" class="certification-section">
      <div class="section-header">
        <h2 class="section-title" data-text="资产认证记录">资产认证记录</h2>
      </div>
      <Suspense>
        <template #default>
          <AssetCertificationRecordsDialog 
            :visible="true"
            @view-asset="viewAssetById"
          />
        </template>
        <template #fallback>
          <div class="loading-state">
            <el-skeleton :rows="3" animated />
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { ElMessage, ElDialog, ElMessageBox } from 'element-plus'
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService'
import { ethers } from 'ethers'
import { RBACService, getRBACService } from '@/utils/web3/RBACService'
import { Suspense } from 'vue'

import FileUpload from '@/components/upload/FileUpload.vue'
import AssetCertificationRecordsDialog from '@/components/AssetCertificationRecordsDialog.vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { useWalletStore } from '@/stores/wallet'
import { debounce } from 'lodash'
import AssetList from '@/views/asset/AssetList.vue'

interface CertificationRequest {
  tokenId: number
  reason: string
  approvers: string[]
}

const userStore = useUserStore()
const walletStore = useWalletStore()

// 标签页配置
const tabs = [
  { id: 'assets', label: '资产列表' },
  { id: 'register', label: '资产登记' },
  { id: 'certification', label: '资产认证记录' }
]
const activeTab = ref('assets')

// 资产认证相关状态
const certifyRequest = ref<CertificationRequest>({
  tokenId: 0,
  reason: '',
  approvers: []
});

// 错误处理
const errorMessage = ref('')

// 认证者列表和加载状态
const availableCertifiers = ref<{address: string; name?: string}[]>([]);
const loadingCertifiers = ref(false);

// 获取可用认证者列表
const fetchAvailableCertifiers = async () => {
  loadingCertifiers.value = true;
  try {
    // 优先从后端API获取认证者列表
    try {
      const token = userStore.profile?.token || '';
      const response = await axios.get('/api/certification/certifiers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("认证者列表：" + (response.data.data ? response.data.data.length : 0));
      if (response.data.success) {
        availableCertifiers.value = response.data.data;
        loadingCertifiers.value = false;
        return; // 成功从后端获取，直接返回
      }
    } catch (apiError) {
      console.warn('从后端获取认证者失败，尝试从区块链获取:', apiError);
    }

    // 如果后端API不可用，从区块链获取
    const rbacService = await getRBACService();
    const memberCount = await rbacService.getRoleMemberCount('CERTIFIER_ROLE');
    
    const certifiers = [];
    for (let i = 0; i < Number(memberCount); i++) {
      const certifierAddress = await rbacService.getRoleMember('CERTIFIER_ROLE', i);
      // 排除当前用户
      if (certifierAddress !== userStore.profile?.walletAddress) {
        certifiers.push({
          address: certifierAddress,
          name: `认证者 ${i+1}`
        });
      }
    }
    
    availableCertifiers.value = certifiers;
  } catch (error) {
    console.error('获取认证者列表失败:', error);
    ElMessage.error('获取认证者列表失败');
    availableCertifiers.value = [];
  } finally {
    loadingCertifiers.value = false;
  }
};



// 当标签页切换时执行相应操作
watch(activeTab, (newTab) => {
  if (newTab === 'register') {
  }
});

// 统一错误处理
const handleServiceError = (error: any) => {
  errorMessage.value = error.message || '操作失败，请重试'
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

// 修改 userAssets 的类型定义和数据处理
interface Asset {
  tokenId: string;
  cid: string;
  registrationDate: Date;
  isCertified: boolean;
  encryptedKey: string;
  version: string;
  metadata: {
    description: string;
    category: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
}

interface PaginatedAssets {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  assets: Asset[];
}

// 在组件挂载时获取用户资产
const userAssets = ref<Asset[]>([]);
const assetsPagination = ref<{
  totalCount: number;
  currentPage: number;
  pageSize: number;
}>({
  totalCount: 0,
  currentPage: 1,
  pageSize: 10
});

const isLoading = ref(false)

// 添加权限状态
const hasRegistrarRole = ref(false);

const fetchUserAssets = async (page: number, forceRefresh: boolean = false) => {
  try {
    isLoading.value = true;
    const service = await getDigitalAssetService();
    const result = await service.getUserAssetsWithPagination(
      walletStore.address,
      page,
      assetsPagination.value.pageSize,
      forceRefresh
    );
    
    // 更新分页信息
    assetsPagination.value = {
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      pageSize: result.pageSize
    };
    
    // 更新资产数据
    userAssets.value = result.assets;
  } catch (error) {
    handleServiceError(error);
  } finally {
    isLoading.value = false;
  }
};


const formatDate = (date: Date) => {
  if (!date) return '未知';
  // 如果传入的是字符串，先转换为Date对象
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// 添加资产详情模态框状态
const detailsDialogVisible = ref(false);
const assetDetails = ref<Asset | null>(null);
const assetPreviewUrl = ref('');
const isLoadingPreview = ref(false);
const fullImageVisible = ref(false); // 控制全屏预览对话框
const iframeLoadFailed = ref(false); // 控制是否显示备用图片预览


const viewAssetDetails = async (asset: Asset) => {
  try {
    selectedAsset.value = asset;
    showAssetDetail.value = true;
    console.log("asset", asset)
    
    // 使用generatePreviewUrl生成预览
    await generatePreviewUrl(asset);
  } catch (error) {
    console.error('查看资产详情失败:', error);
    ElMessage.error('查看资产详情失败');
  }
};


// 生成资产预览URL - 增强版，支持分片文件处理
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

// 判断文件类型是否可预览
const isFilePreviewable = (fileType: string): boolean => {
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
const handleMediaError = (e: Event) => {
  console.error('媒体加载失败:', assetPreviewUrl.value);
  ElMessage.error('媒体加载失败，可能的原因：IPFS网关连接问题或内容结构不正确');
};


// 添加回格式化文件大小函数
const formatFileSize = (size: number): string => {
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

// 下载资产
const downloadAsset = async (asset: Asset) => {
  try {
    if (!asset || !asset.cid) {
      ElMessage.error('无效的文件资产');
      return;
    }
    
    // 导入所需服务
    const { getIPFSUrl } = await import('@/utils/ipfs');
    const { ipfsConfig } = await import('@/config/ipfs.config');
    const { getChunkedFileService } = await import('@/services/ChunkedFileService');
    
    // 获取IPFS网关URL
    const ipfsGateway = window.ipfsGateway || ipfsConfig.gateway;
    const chunkedService = getChunkedFileService(ipfsGateway);
    
    // 显示下载开始消息
    ElMessage.info('准备下载文件，请稍候...');

    // 检查是否是分片文件
    const isChunked = await chunkedService.isChunkedFile(asset.cid);
    
    if (isChunked) {
      console.log('检测到分片文件，准备下载:', asset.cid);
      
      // 获取文件名
      const fileName = asset.metadata?.fileName || '下载文件';
      
      // 使用下载服务下载分片文件
      const downloadUrl = chunkedService.getDownloadUrl(asset.cid, fileName);
      console.log('分片文件下载URL:', downloadUrl);
      
      // 创建隐藏的a标签进行下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      ElMessage.success('分片文件下载已开始');
    } else {
      // 常规文件下载
      const downloadUrl = `${ipfsGateway}${asset.cid}/content`;
      console.log('常规文件下载URL:', downloadUrl);
      
      try {
        // 使用fetch获取文件内容
        const response = await fetch(downloadUrl);
        
        // 检查响应状态
        if (!response.ok) {
          throw new Error(`下载失败: HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = asset.metadata?.fileName || '下载文件';
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        ElMessage.success('文件下载已开始');
      } catch (error) {
        console.error('下载文件失败:', error);
        ElMessage.error('下载失败: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
  } catch (error) {
    console.error('下载文件失败:', error);
    ElMessage.error('下载文件失败: ' + (error instanceof Error ? error.message : String(error)));
  }
};

const initiateCertification = (asset: Asset) => {
  // 设置认证表单
  certifyRequest.value.tokenId = Number(asset.tokenId);
  certifyRequest.value.reason = '';
  certifyRequest.value.approvers = [];
  
  // 设置当前选中的资产并显示对话框
  selectedAssetForCert.value = asset;
  certificationRequestDialogVisible.value = true;
  
  // 获取认证状态
  fetchCertificationStatus(Number(asset.tokenId));
}

// 修改 checkRole 函数
const checkRoleRegistrar = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const rbacService = new RBACService(provider, signer);
  const address = await signer.getAddress();
  
  hasRegistrarRole.value = await rbacService.hasRole(
    'REGISTRAR_ROLE',
    address
  );
  console.log('是否拥有注册权限:', hasRegistrarRole.value);
};


// 添加处理方法
const handleUploadSuccess = async (result: any) => {
  ElMessage.success('资产注册成功');
  
  // 获取服务实例并清除缓存
  const service = await getDigitalAssetService();
  service.clearCache(); // 调用我们新增的清除缓存方法
  
  // 强制刷新资产列表
  await fetchUserAssets(1, true); // 强制刷新，回到第一页
  
  // 切换到资产列表标签
  activeTab.value = 'assets';
};

const handleUploadError = (error: Error) => {
  ElMessage.error(`上传失败: ${error.message}`);
};

const handleProgress = (progress: number) => {
  console.log('上传进度:', progress);
};

const deleteDialogVisible = ref(false)
const assetToDelete = ref<Asset | null>(null)
const deleteConfirmText = ref('')
const isDeleting = ref(false)

// 打开删除确认框
const deleteAsset = (asset: Asset) => {
  assetToDelete.value = asset
  deleteDialogVisible.value = true
  deleteConfirmText.value = '' // 重置确认输入
}

// 确认删除资产
const confirmDelete = async () => {
  if (!assetToDelete.value || deleteConfirmText.value !== 'DELETE') return
  
  try {
    isDeleting.value = true
    errorMessage.value = ''
    
    const service = await getDigitalAssetService()
    await service.deleteAsset(parseInt(assetToDelete.value.tokenId))
    
    ElMessage.success(`资产 ${assetToDelete.value.tokenId} 已成功删除`)
    deleteDialogVisible.value = false
    
    // 刷新资产列表
    await fetchUserAssets(assetsPagination.value.currentPage)
  } catch (error) {
    handleServiceError(error)
  } finally {
    isDeleting.value = false
  }
}

const selectedAssets = ref<Asset[]>([])
const batchDeleteDialogVisible = ref(false)
const batchDeleteConfirmText = ref('')
const isBatchDeleting = ref(false)
const deletedCount = ref(0)

// 处理表格选择变更
const handleSelectionChange = (selection: Asset[]) => {
  selectedAssets.value = selection
}

// 批量删除资产
const batchDeleteAssets = () => {
  if (selectedAssets.value.length === 0) return
  
  batchDeleteDialogVisible.value = true
  batchDeleteConfirmText.value = '' // 重置确认输入
}

// 确认批量删除
const confirmBatchDelete = async () => {
  try {
    if (selectedAssets.value.length === 0) {
      ElMessage.warning('请选择要删除的资产')
      return
    }
    
    if (batchDeleteConfirmText.value !== 'DELETE') {
      ElMessage.warning('请输入正确的确认文本')
      return
    }
    
    isBatchDeleting.value = true
    deletedCount.value = 0
    errorMessage.value = ''
    
    // 获取资产服务
    const service = await getDigitalAssetService()
    
    // 提取所选资产的tokenId
    const tokenIds = selectedAssets.value.map(asset => 
      typeof asset.tokenId === 'string' ? parseInt(asset.tokenId) : asset.tokenId
    )
    
    // 执行批量删除
    const result = await service.batchDeleteAssets(tokenIds)
    
    // 显示结果
    if (result.success > 0) {
      const successMessage = `成功删除 ${result.success} 个资产`
      ElMessage.success(successMessage)
      deletedCount.value = result.success
    }
    
    if (result.failed > 0) {
      // 显示失败信息
      const failedDetails = result.details.filter(item => !item.success)
      
      // 构建错误消息
      let errorMsg = `${result.failed} 个资产删除失败`
      
      if (failedDetails.length <= 3) {
        // 如果失败的数量少，显示所有失败的详细信息
        errorMsg += '：' + failedDetails.map(item => 
          `资产 ${item.tokenId} - ${item.message || '未知错误'}`
        ).join('，')
      }
      
      errorMessage.value = errorMsg
      ElMessage.warning(errorMsg)
      
      // 对于少量失败的资产，单独显示每个错误
      if (failedDetails.length <= 3) {
        failedDetails.forEach(item => {
          ElMessage.error(`资产 ${item.tokenId} 删除失败: ${item.message || '未知错误'}`)
        })
      }
    }
    
    // 关闭对话框并更新列表
    batchDeleteDialogVisible.value = false
    batchDeleteConfirmText.value = ''
    selectedAssets.value = []
    
    // 刷新资产列表
    await fetchUserAssets(assetsPagination.value.currentPage)
  } catch (error) {
    console.error('批量删除错误:', error)
    errorMessage.value = error instanceof Error ? error.message : '批量删除过程中发生错误'
    ElMessage.error(errorMessage.value)
  } finally {
    isBatchDeleting.value = false
  }
}

// 添加辅助函数 - 从详情页面发起认证
const initiateCertificationFromDetails = () => {
  if (!assetDetails.value) return;
  
  // 设置认证表单
  certifyRequest.value.tokenId = Number(assetDetails.value.tokenId);
  certifyRequest.value.reason = '';
  certifyRequest.value.approvers = [];
  
  // 设置当前选中的资产并关闭详情页，打开认证对话框
  selectedAssetForCert.value = assetDetails.value;
  detailsDialogVisible.value = false;
  certificationRequestDialogVisible.value = true;
  
  // 获取认证状态
  fetchCertificationStatus(Number(assetDetails.value.tokenId));
};

// 添加辅助函数 - 从详情页面删除资产
const deleteFromDetails = () => {
  if (!assetDetails.value) return;
  
  // 关闭详情页并打开删除确认框
  detailsDialogVisible.value = false;
  deleteAsset(assetDetails.value);
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

// 添加搜索和筛选逻辑
const searchQuery = ref('')
const expandedPanels = ref([])
const filters = ref({
  fileTypes: [],
  fileSize: '',
  minSize: 0,
  maxSize: 10,
  dateRange: '',
  dateStart: null,
  dateEnd: null,
  certificationStatus: 'all'
})
const sortOption = ref('')
const sortOptions = [
  { value: 'tokenId', label: '按资产ID排序' },
  { value: 'fileName', label: '按文件名排序' },
  { value: 'fileSize', label: '按文件大小排序' },
  { value: 'registrationDate', label: '按注册时间排序' },
  { value: 'isCertified', label: '按认证状态排序' }
]

const filteredAssets = computed(() => {
  let filtered = userAssets.value.slice();

  // 搜索关键字筛选
  if (searchQuery.value) {
    filtered = filtered.filter(asset => 
      asset.metadata.fileName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (asset.metadata.description && asset.metadata.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
  }

  // 文件类型筛选
  if (filters.value.fileTypes.length > 0) {
    filtered = filtered.filter(asset => {
      const type = asset.metadata.fileType;
      return filters.value.fileTypes.some(filterType => {
        if (filterType === 'image') return type.startsWith('image/');
        if (filterType === 'document') return type.includes('pdf') || type.includes('doc') || type.includes('text');
        if (filterType === 'video') return type.startsWith('video/');
        if (filterType === 'audio') return type.startsWith('audio/');
        if (filterType === 'other') {
          return !type.startsWith('image/') && 
                 !type.startsWith('video/') && 
                 !type.startsWith('audio/') && 
                 !type.includes('pdf') && 
                 !type.includes('doc') && 
                 !type.includes('text');
        }
        return false;
      });
    });
  }

  // 文件大小筛选
  if (filters.value.fileSize) {
    filtered = filtered.filter(asset => {
      const sizeInMB = asset.metadata.fileSize / (1024 * 1024);
      if (filters.value.fileSize === 'small') return sizeInMB < 1;
      if (filters.value.fileSize === 'medium') return sizeInMB >= 1 && sizeInMB <= 10;
      if (filters.value.fileSize === 'large') return sizeInMB > 10;
      if (filters.value.fileSize === 'custom') {
        return sizeInMB >= filters.value.minSize && sizeInMB <= filters.value.maxSize;
      }
      return true;
    });
  }

  // 上传日期筛选
  if (filters.value.dateRange) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    filtered = filtered.filter(asset => {
      const assetDate = new Date(asset.registrationDate);
      assetDate.setHours(0, 0, 0, 0);
      
      if (filters.value.dateRange === 'today') {
        return assetDate.getTime() === today.getTime();
      } else if (filters.value.dateRange === 'week') {
        return assetDate >= weekStart;
      } else if (filters.value.dateRange === 'month') {
        return assetDate >= monthStart;
      } else if (filters.value.dateRange === 'custom' && filters.value.dateStart && filters.value.dateEnd) {
        const start = new Date(filters.value.dateStart);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(filters.value.dateEnd);
        end.setHours(23, 59, 59, 999);
        
        return assetDate >= start && assetDate <= end;
      }
      return true;
    });
  }

  // 认证状态筛选
  if (filters.value.certificationStatus && filters.value.certificationStatus !== 'all') {
    filtered = filtered.filter(asset => 
      (filters.value.certificationStatus === 'certified' && asset.isCertified) ||
      (filters.value.certificationStatus === 'uncertified' && !asset.isCertified)
    );
  }

  // 排序处理
  if (sortOption.value) {
    filtered.sort((a, b) => {
      if (sortOption.value === 'tokenId') {
        return parseInt(a.tokenId) - parseInt(b.tokenId);
      } else if (sortOption.value === 'registrationDate') {
        return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
      } else if (sortOption.value === 'fileSize') {
        return a.metadata.fileSize - b.metadata.fileSize;
      } else if (sortOption.value === 'fileName') {
        return a.metadata.fileName.localeCompare(b.metadata.fileName);
      } else if (sortOption.value === 'isCertified') {
        return (b.isCertified ? 1 : 0) - (a.isCertified ? 1 : 0);
      }
      return 0;
    });
  }

  return filtered;
})

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value ||
    filters.value.fileTypes.length > 0 ||
    filters.value.fileSize ||
    filters.value.dateRange ||
    filters.value.certificationStatus
  )
})

const handleSearch = () => {
  fetchUserAssets(1, true)
}

const removeFileTypeFilter = (type: string) => {
  filters.value.fileTypes = filters.value.fileTypes.filter(t => t !== type)
  fetchUserAssets(1, true)
}

const getFileTypeLabel = (type: string) => {
  // 处理筛选选项值
  if (type === 'image') return '图片'
  if (type === 'document') return '文档'
  if (type === 'video') return '视频'
  if (type === 'audio') return '音频'
  if (type === 'other') return '其他'
  
  // 处理MIME类型
  if (type.startsWith('image/')) return '图片'
  if (type.startsWith('video/')) return '视频'
  if (type.startsWith('audio/')) return '音频'
  if (type.startsWith('application/pdf')) return 'PDF'
  if (type.includes('word')) return '文档'
  if (type.includes('excel') || type.includes('spreadsheet')) return '电子表格'
  if (type.includes('presentation') || type.includes('powerpoint')) return '演示文稿'
  return '其他'
}

const getFileSizeLabel = (size: string) => {
  if (size === 'small') return '小 (< 1MB)'
  if (size === 'medium') return '中 (1MB - 10MB)'
  if (size === 'large') return '大 (> 10MB)'
  return '自定义'
}

const getDateRangeLabel = (range: string) => {
  if (range === 'today') return '今天'
  if (range === 'week') return '本周'
  if (range === 'month') return '本月'
  return '自定义'
}

const getCertificationStatusLabel = (status: string) => {
  if (status === 'certified') return '已认证'
  if (status === 'uncertified') return '未认证'
  return '全部'
}

const resetFilters = () => {
  searchQuery.value = ''
  filters.value = {
    fileTypes: [],
    fileSize: '',
    minSize: 0,
    maxSize: 10,
    dateRange: '',
    dateStart: null,
    dateEnd: null,
    certificationStatus: 'all'
  }
  fetchUserAssets(1, true)
}

// 添加缺失的筛选处理方法
const applyFilters = () => {
  // 关闭展开面板
  expandedPanels.value = [];
  // 重新获取资产列表并应用筛选
  fetchUserAssets(1, true);
};

// 表格排序处理函数
const handleSort = (params: any) => {
  if (params.prop) {
    // 根据排序属性设置排序选项
    if (params.prop === 'tokenId') {
      sortOption.value = 'tokenId';
    } else if (params.prop === 'metadata.fileName') {
      sortOption.value = 'fileName';
    } else if (params.prop.includes('fileSize')) {
      sortOption.value = 'fileSize';
    } else if (params.prop.includes('registrationDate')) {
      sortOption.value = 'registrationDate';
    } else if (params.prop.includes('isCertified')) {
      sortOption.value = 'isCertified';
    }
  } else {
    sortOption.value = '';
  }
};

const retryLoadImage = async () => {
  if (!assetDetails.value) return;
  
  ElMessage.info('正在重新尝试加载图片...');
  
  // 尝试使用备用网关
  try {
    const { ipfsConfig } = await import('@/config/ipfs.config');
    // 随机选择一个备用网关
    const alternativeGateways = [...ipfsConfig.alternativeGateways];
    const randomGateway = alternativeGateways[Math.floor(Math.random() * alternativeGateways.length)];
    
    console.log('尝试使用备用网关:', randomGateway);
    assetPreviewUrl.value = `${randomGateway}${assetDetails.value.cid}`;
    
    ElMessage.success('已切换到备用网关，正在重新加载图片');
  } catch (error) {
    console.error('重试加载图片失败:', error);
    ElMessage.error('重试失败，请检查网络连接或IPFS服务');
  }
};

// 处理iframe加载成功
const handleIframeLoad = () => {
  console.log('图片或PDF加载成功');
  iframeLoadFailed.value = false;
};

// 处理iframe加载错误
const handleIframeError = (event: Event) => {
  console.error('图片或PDF加载失败:', assetPreviewUrl.value);
  ElMessage.error('图片或PDF加载失败，正在尝试备用显示方式');
  iframeLoadFailed.value = true;
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  console.error('图片直接加载失败:', assetPreviewUrl.value);
  ElMessage.error('图片加载失败，可能的原因：网络连接问题或文件损坏');
};

// 关闭资产详情对话框
const closeAssetDetails = () => {
  detailsDialogVisible.value = false;
  assetPreviewUrl.value = '';
  isLoadingPreview.value = true;
  iframeLoadFailed.value = false;
};

// 资产认证请求对话框
const certificationRequestDialogVisible = ref(false);
const selectedAssetForCert = ref<Asset | null>(null);

// 认证状态接口定义
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

// 检查是否可以自动认证
const canAutoCertify = computed(() => {
  if (!selectedAssetForCert.value || selectedAssetForCert.value.isCertified) {
    return false;
  }
  
  // 检查是否所有认证者都已通过
  return certificationStatus.value.length > 0 && 
         certificationStatus.value.every(status => status.status === 'APPROVED');
});

// 监听选中的资产变化
watch(() => selectedAssetForCert.value, (newVal) => {
  if (newVal) {
    fetchCertificationStatus(parseInt(newVal.tokenId.toString()));
  }
});


// 查看资产详情（通过ID）
const viewAssetById = async (tokenId: string | number) => {
  try {
    const service = await getDigitalAssetService()
    const asset = await getAssetByTokenId(service, tokenId)
    
    if (asset) {
      viewAssetDetails(asset)
    } else {
      ElMessage.warning(`未找到资产ID为 ${tokenId} 的资产`)
    }
  } catch (error: any) {
    console.error('获取资产详情失败:', error)
    ElMessage.error('获取资产详情失败: ' + (error.message || '未知错误'))
  }
}

onMounted(async () => {
  await checkRoleRegistrar()
})


const getAssetByTokenId = async (service: any, tokenId: string | number) => {
  try {
    // 检查服务是否已有此方法
    if (typeof service.getAssetByTokenId === 'function') {
      return await service.getAssetByTokenId(tokenId)
    }
    
    // 如果没有，可以获取用户所有资产并筛选
    const result = await service.getUserAssets(1, 100, true)  // 获取较多资产以提高找到的概率
    return result.assets.find((asset: any) => parseInt(asset.tokenId) === parseInt(String(tokenId)))
  } catch (error: any) {
    console.error('获取资产详情失败:', error)
    throw error
  }
}

// 资产详情对话框
const showAssetDetail = ref(false);
const selectedAsset = ref<any>(null);

// 组件卸载时清理
onUnmounted(() => {
  if (assetPreviewUrl.value) {
    URL.revokeObjectURL(assetPreviewUrl.value);
  }
});

// 添加注释，仅用于查看文件结构
</script>
<style scoped>
/* 基础布局样式 */
.access-management {
  position: relative;
  min-height: 100vh;
  padding: 2rem;
  overflow: hidden;
}

/* 动态二进制背景 */
.binary-background {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
}

.binary-bit {
  position: absolute;
  color: rgba(0, 0, 0, 0.15);
  font-family: monospace;
  font-size: 0.8rem;
  opacity: 0;
  animation: fadeMove 8s infinite linear;
}

@keyframes fadeMove {
  0% {
    transform: translateY(-20px);
    opacity: 0;
  }
  20% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

/* 标签导航 */
.tab-nav {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-btn {
  padding: 0.75rem 2rem;
  border: 2px solid #ddd;
  background: #f8f8f8;
  border-radius: 30px;
  font-weight: 600;
  color: #444;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tab-btn.active {
  background: #fff;
  border-color: #333;
  color: #000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 内容区块通用样式 */
.assets-section,
.register-section,
.certification-section {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  margin-top: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s ease;
}

.section-header {
  margin-bottom: 2rem;
  position: relative;
}

.section-title {
  display: inline-block;
  font-size: 1.5rem;
  color: #333;
  position: relative;
  padding-bottom: 0.5rem;
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #333 50%, transparent 50%);
  background-size: 8px 100%;
}

/* 加载状态 */
.loading-state {
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
}

/* 打印优化 */
@media print {
  .binary-background,
  .tab-btn:not(.active),
  .el-skeleton {
    display: none !important;
  }

  .access-management {
    padding: 0;
  }

  .tab-nav {
    border-bottom: 2px solid #000;
    margin-bottom: 1rem;
  }

  .tab-btn.active {
    background: transparent !important;
    border: 2px solid #000 !important;
    color: #000 !important;
  }

  .assets-section,
  .register-section,
  .certification-section {
    box-shadow: none;
    background: transparent;
    padding: 0;
    page-break-inside: avoid;
  }

  .section-title::after {
    background: #000;
  }
}

/* 微交互动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
