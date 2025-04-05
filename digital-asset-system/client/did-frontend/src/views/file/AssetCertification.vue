<template>
  <div class="asset-certification">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索资产ID或文件名"
          clearable
          @input="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="认证状态" @change="handleSearch">
          <el-option label="全部" value="all" />
          <el-option label="已认证" value="certified" />
          <el-option label="未认证" value="uncertified" />
        </el-select>
      </div>
      <div class="right">
        <el-button
          type="primary"
          :disabled="!hasUncertifiedAssets"
          @click="showBatchCertificationDialog"
        >
          批量认证
        </el-button>
      </div>
    </div>

    <!-- 资产列表 -->
    <el-table
      v-loading="isLoading"
      :data="filteredAssets"
      @selection-change="handleSelectionChange"
      border
      stripe
      style="width: 100%"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="资产ID" prop="tokenId" width="100" />
      <el-table-column label="文件名" min-width="200">
        <template #default="{ row }">
          <div class="file-name">
            <el-button link type="primary" @click="showAssetDetails(row)">
              {{ row.metadata.fileName }}
            </el-button>
          </div>
        </template>
      </el-table-column>
  
      <el-table-column label="文件大小" width="120">
        <template #default="{ row }">
          {{ formatFileSize(row.metadata.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column label="上传时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.metadata.uploadTime) }}
        </template>
      </el-table-column>
      <el-table-column label="认证状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.isCertified ? 'success' : 'warning'">
            {{ row.isCertified ? '已认证' : '未认证' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            :icon="View"
            @click="showAssetDetails(row)"
          >
            查看
          </el-button>
          <el-button
            v-if="!row.isCertified"
            link
            type="success"
            :icon="Check"
            @click="showCertificationDialog(row)"
          >
            认证
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalAssets"
        :page-sizes="[10, 20, 50, 100]"
        layout="sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 资产详情对话框 -->
    <asset-detail-dialog
      v-if="selectedAssetForCert"
      v-model:visible="assetDetailsDialogVisible"
      :asset-details="selectedAssetForCert"
      :asset-preview-url="assetPreviewUrl"
      @close="handleDetailClose"
    >
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assetDetailsDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="selectedAssetForCert && downloadAsset(selectedAssetForCert)">下载文件</el-button>
        </span>
      </template>
    </asset-detail-dialog>

    <!-- 全屏图片预览 -->
    <el-dialog
      v-model="fullImageVisible"
      width="90%"
      :show-close="true"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      class="full-image-dialog"
    >
      <div class="full-image-container">
        <img :src="assetPreviewUrl" class="full-image" :alt="selectedAssetForCert?.metadata.fileName" />
      </div>
    </el-dialog>

    <!-- 认证对话框 -->
    <el-dialog
      v-model="certificationDialogVisible"
      title="资产认证"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-loading="isLoadingStatus">
        <!-- 资产信息 -->
        <div class="certification-asset-info">
          <h3>资产信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="资产ID">
              {{ selectedAssetForCert?.tokenId }}
            </el-descriptions-item>
            <el-descriptions-item label="文件名">
              {{ selectedAssetForCert?.metadata.fileName }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatFileSize(selectedAssetForCert?.metadata.fileSize) }}
            </el-descriptions-item>
            <el-descriptions-item label="上传时间">
              {{ formatDate(selectedAssetForCert?.metadata.uploadTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="文件类型">
              {{ selectedAssetForCert?.metadata.fileType }}
            </el-descriptions-item>
            <el-descriptions-item label="分类">
              {{ selectedAssetForCert?.metadata.category || '未分类' }}
            </el-descriptions-item>
            <el-descriptions-item :span="2" label="描述">
              {{ selectedAssetForCert?.metadata.description || '暂无描述' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 认证请求信息 -->
        <div class="certification-request-info">
          <h3>认证请求信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="请求ID">
              {{ selectedAssetForCert?.certificationRequest?.requestId }}
            </el-descriptions-item>
            <el-descriptions-item label="请求时间">
              {{ formatDate(selectedAssetForCert?.certificationRequest?.requestTime || '') }}
            </el-descriptions-item>
            <el-descriptions-item label="请求者">
              {{ selectedAssetForCert?.certificationRequest?.requester ? formatAddress(selectedAssetForCert.certificationRequest.requester) : '' }}
            </el-descriptions-item>
            <el-descriptions-item label="认证者">
              {{ selectedAssetForCert?.certificationRequest?.certifierAddress ? formatAddress(selectedAssetForCert.certificationRequest.certifierAddress) : '' }}
            </el-descriptions-item>
            <el-descriptions-item :span="2" label="认证请求说明">
              <div style="white-space: pre-wrap;">{{ selectedAssetForCert?.certificationRequest?.reason || '无' }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 认证材料 -->
        <div v-if="selectedAssetForCert?.certificationRequest?.fileResources?.length" class="certification-materials">
          <h3>认证材料</h3>
          <el-table :data="selectedAssetForCert.certificationRequest.fileResources" border stripe>
            <el-table-column label="文件名" prop="fileName" min-width="200" />
            <el-table-column label="类型" prop="contentType" width="150" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button-group>
                  <el-button 
                    type="primary" 
                    link
                    size="small"
                    @click="downloadFile(row)"
                  >
                    <el-icon><Download /></el-icon>
                    下载
                  </el-button>
                  <el-button 
                    type="success" 
                    link
                    size="small"
                    @click="previewFile(row)"
                  >
                    <el-icon><View /></el-icon>
                    预览
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 认证状态 -->
        <div class="certification-status">
          <h3>认证状态</h3>
          <el-timeline>
            <el-timeline-item
              v-for="status in selectedAssetForCert?.certificationStatus"
              :key="status.certifierAddress"
              :type="status.hasCertified === true ? 'success' : 'warning'"
            >
              <div class="status-item" :class="{ 'current-user': status.isCurrentUser }">
                <div class="certifier">
                  认证人：{{ formatAddress(status.certifierAddress) }}
                  <el-tag v-if="status.isCurrentUser" size="small" type="info">当前认证者</el-tag>
                </div>
                <div class="status">
                  状态：{{ status.hasCertified === true ? '已认证' : '待认证' }}
                </div>
                <div v-if="status.comment" class="reason">
                  认证意见：{{ status.comment }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 认证表单 -->
        <div class="certification-form">
          <h3>认证意见</h3>
          <el-form>
            <el-form-item>
              <el-input 
                v-model="certificationForm.comment"
                type="textarea"
                :rows="3"
                placeholder="请输入认证意见"
              />
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
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="certificationDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="isCertifying"
            :disabled="!isCertificationFormValid"
            @click="certifyAsset"
          >
            确认认证
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量认证对话框 -->
    <el-dialog
      v-model="batchCertificationDialogVisible"
      title="批量认证"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="batch-certification-form">
        <h3>待认证资产</h3>
        <el-table :data="selectedUncertifiedAssets" border stripe style="width: 100%">
          <el-table-column label="资产ID" prop="tokenId" width="100" />
          <el-table-column label="文件名">
            <template #default="{ row }">
              {{ row.metadata.fileName }}
            </template>
          </el-table-column>
        </el-table>

        <h3 class="mt-4">认证意见</h3>
        <el-form>
          <el-form-item>
            <el-input 
              v-model="batchCertificationForm.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入认证意见"
            />
            <!-- 添加批量认证常用评论快速选择 -->
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
              >批量拒绝</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchCertificationDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="isBatchCertifying"
            :disabled="!isBatchCertificationFormValid"
            @click="certifyBatchAssets"
          >
            确认认证
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Check, Search, Document, Download } from '@element-plus/icons-vue'
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService'
import { useUserStore } from '@/stores/user'
import { useWalletStore } from '@/stores/wallet'
import AssetDetailDialog from '@/components/AssetDetailDialog.vue'
import { debounce } from 'lodash'
import type { Asset, CertificationStatus, CertificationRequestDTO } from '@/types/asset'
import axios from 'axios'

const userStore = useUserStore()
const walletStore = useWalletStore()

// 状态变量
const isLoading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const totalAssets = ref(0)
const assetList = ref<Asset[]>([])
const selectedAssets = ref<Asset[]>([])

// 资产详情相关
const assetDetails = ref<Asset | null>(null)
const assetDetailsDialogVisible = ref(false)
const assetPreviewUrl = ref('')

// 认证相关
const selectedAssetForCert = ref<Asset | null>(null)
const certificationDialogVisible = ref(false)
const isLoadingStatus = ref(false)
const isCertifying = ref(false)
const certificationStatus = ref<CertificationStatus[]>([])
const certificationForm = ref({
  comment: ''
})

// 批量认证相关
const batchCertificationDialogVisible = ref(false)
const isBatchCertifying = ref(false)
const batchCertificationForm = ref({
  comment: ''
})

// 添加新的状态
const fullImageVisible = ref(false)
const isLoadingPreview = ref(false)
const iframeLoadFailed = ref(false)

// 计算属性
const filteredAssets = computed(() => {
  console.log('原始资产列表:', assetList.value);
  let filtered = assetList.value;
  
  if (searchQuery.value) {
    console.log('搜索关键词:', searchQuery.value);
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(asset => {
      // 确保安全的类型转换
      const tokenIdStr = String(asset.tokenId || '')
      const fileName = (asset.metadata.fileName || '').toLowerCase()
      
      return tokenIdStr.includes(query) || fileName.includes(query)
    })
    console.log('搜索后的结果:', filtered);
  }

  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(asset => {
      // 使用实际的状态字段
      const isCertified = asset.isCertified
      return filterStatus.value === 'certified' ? isCertified : !isCertified
    })
  }

  return filtered
})

const selectedUncertifiedAssets = computed(() => 
  selectedAssets.value.filter(asset => !asset.isCertified)
)

const hasUncertifiedAssets = computed(() => 
  selectedUncertifiedAssets.value.length > 0
)

const isCertificationFormValid = computed(() => 
  certificationForm.value.comment.trim() !== ''
)

const isBatchCertificationFormValid = computed(() => 
  batchCertificationForm.value.comment.trim() !== ''
)

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

// 方法
const fetchAssets = async () => {
  try {
    isLoading.value = true;
    console.log('fetchAssets - 开始获取资产');
    console.log('fetchAssets - 钱包地址:', walletStore.address);
    
    const service = await getDigitalAssetService();
    const response = await service.getPendingCertificationRequests(
      walletStore.address,
      userStore.profile?.token || ''
    );
    if (response.success) {
      const pendingRequests = response.data;
      console.log("整合后的数据", pendingRequests);
      assetList.value = pendingRequests.map((request: CertificationRequestDTO) => ({
        currentCertifierAddress: request.certifierAddress,
        tokenId: request.tokenId.toString(),
        cid: request.cid || '',
        registrationDate: request.requestTime,
        version: request.version || '1',
        metadata: {
          fileName: request.fileName || '',
          fileType: request.fileType || '',
          fileSize: request.fileSize || 0,
          uploadTime: request.requestTime,
          category: request.category || '未分类',
          description: request.description || '暂无描述'
        },
        isCertified: request.chainStatus === 'APPROVED',
        pendingCertifiers: request.pendingCertifiers,
        certificationStatus: request.certificationStatus,
        certificationRequest: request
      }));
      console.log("assetList", assetList.value);
      totalAssets.value = pendingRequests.length;
    } else {
      ElMessage.error(response.message || '获取待认证资产列表失败');
    }
  } catch (error) {
    console.error('获取资产列表失败:', error);
    ElMessage.error('获取资产列表失败');
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = debounce(() => {
  currentPage.value = 1
  fetchAssets()
}, 300)

const handleSelectionChange = (selection: any[]) => {
  selectedAssets.value = selection
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchAssets()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchAssets()
}

const formatFileSize = (size: number | undefined): string => {
  if (!size) return '0 B'
  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }
}

const formatDate = (date: Date | number | string | undefined): string => {
  if (!date) return '未知'
  const dateObj = new Date(date)
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const formatAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const showAssetDetails = async (asset: Asset) => {
  try {
    selectedAssetForCert.value = asset;
    assetDetailsDialogVisible.value = true;
    
    // 生成预览URL
    await generatePreviewUrl(asset);
  } catch (error) {
    console.error('查看资产详情失败:', error);
    ElMessage.error('查看资产详情失败');
  }
};

const handleDetailClose = () => {
  assetDetailsDialogVisible.value = false;
  selectedAssetForCert.value = null;
  // 释放预览URL
  if (assetPreviewUrl.value) {
    URL.revokeObjectURL(assetPreviewUrl.value);
    assetPreviewUrl.value = '';
  }
};

const downloadAsset = async (asset: Asset) => {
  if (!asset) return;
  
  try {
    const service = await getDigitalAssetService();
    const { file } = await service.getAssetContent(asset.cid);
    
    // 创建下载链接
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.metadata.fileName;
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
    ElMessage.error('下载失败');
  }
};

const showCertificationDialog = async (asset: any) => {
  try {
    selectedAssetForCert.value = asset
    console.log('selectedAssetForCert.value:', selectedAssetForCert.value);
    console.log('selectedAssetForCert:', selectedAssetForCert);
    certificationDialogVisible.value = true
    certificationForm.value.comment = asset.certificationRequest.reason
    console.log('asset:', asset);
  } catch (error) {
    console.error('打开认证对话框失败:', error)
    ElMessage.error('打开认证对话框失败')
  }
}

const certifyAsset = async () => {
  if (!selectedAssetForCert.value || !isCertificationFormValid.value) return
  
  try {
    isCertifying.value = true
    const service = await getDigitalAssetService()
    await service.certifyAsset(
      Number(selectedAssetForCert.value.tokenId),
      certificationForm.value.comment,
      userStore.profile?.token || ''
    )
    ElMessage.success('认证成功')
    certificationDialogVisible.value = false
    await fetchAssets()
  } catch (error) {
    console.error('认证失败:', error)
    ElMessage.error('认证失败')
  } finally {
    isCertifying.value = false
  }
}

const showBatchCertificationDialog = () => {
  if (!hasUncertifiedAssets.value) return
  batchCertificationDialogVisible.value = true
  batchCertificationForm.value.comment = ''
}

const certifyBatchAssets = async () => {
  if (!selectedUncertifiedAssets.value.length || !isBatchCertificationFormValid.value) return
  
  try {
    isBatchCertifying.value = true
    const service = await getDigitalAssetService()
    
    let successCount = 0
    let failCount = 0
    
    for (const asset of selectedUncertifiedAssets.value) {
      try {
        await service.certifyAsset(
          Number(asset.tokenId),
          batchCertificationForm.value.comment,
          userStore.profile?.token || ''
        )
        successCount++
      } catch (error) {
        console.error(`认证资产 ${asset.tokenId} 失败:`, error)
        failCount++
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`成功认证 ${successCount} 个资产`)
    }
    if (failCount > 0) {
      ElMessage.warning(`${failCount} 个资产认证失败`)
    }
    
    batchCertificationDialogVisible.value = false
    await fetchAssets()
  } catch (error) {
    console.error('批量认证失败:', error)
    ElMessage.error('批量认证失败')
  } finally {
    isBatchCertifying.value = false
  }
}

// 修改下载文件方法
const downloadFile = async (file: { accessUrl: string, fileName: string }) => {
  try {
    // 直接使用accessUrl，不需要额外拼接base URL
    const fileUrl = file.accessUrl;
    
    // 发送带认证token的请求，设置responseType为blob
    const response = await axios.get(fileUrl, {
      headers: {
        'Authorization': `Bearer ${userStore.profile?.token}`
      },
      responseType: 'blob' // 关键：设置响应类型为blob
    });
    
    // 从响应头获取文件名（如果服务器提供）
    const contentDisposition = response.headers['content-disposition'];
    let fileName = file.fileName;
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (matches != null && matches[1]) {
        fileName = matches[1].replace(/['"]/g, '');
      }
    }
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/octet-stream' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    ElMessage.success('文件下载成功');
  } catch (error) {
    console.error('下载文件失败:', error);
    if (axios.isAxiosError(error)) {
      ElMessage.error(`下载失败: ${error.response?.status === 404 ? '文件不存在' : error.message}`);
    } else {
      ElMessage.error('下载失败');
    }
  }
};

// 修改预览文件方法
const previewFile = async (file: { accessUrl: string, fileName: string, contentType: string }) => {
  try {
    const previewUrl = file.accessUrl;
    const fileName = file.fileName.toLowerCase();
    const contentType = file.contentType;
    
    // 获取文件内容
    const response = await axios.get(previewUrl, {
      headers: {
        'Authorization': `Bearer ${userStore.profile?.token}`
      },
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = URL.createObjectURL(blob);
    
    // 根据文件类型处理预览
    if (contentType.startsWith('image/') || fileName.endsWith('.pdf')) {
      // 图片和PDF直接在新窗口打开
      window.open(url);
      
      // 延迟释放URL
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } else if (fileName.match(/\.(mp3|wav|ogg)$/i)) {
      // 音频文件使用浏览器内置播放器
      const audioPlayer = document.createElement('audio');
      audioPlayer.src = url;
      audioPlayer.controls = true;
      
      // 创建一个对话框来播放音频
      ElMessageBox.alert(audioPlayer.outerHTML, '音频预览', {
        dangerouslyUseHTMLString: true,
        showClose: true,
        closeOnClickModal: false,
        closeOnPressEscape: true,
        callback: () => {
          // 关闭对话框时释放URL
          URL.revokeObjectURL(url);
        }
      });
    } else {
      // 其他类型文件（包括Office文档）直接下载
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 延迟释放URL
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      // 对于Office文档，提示用户使用本地应用打开
      if (fileName.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i)) {
        ElMessage.info('请使用本地Office应用打开文件');
      }
    }
  } catch (error) {
    console.error('预览文件失败:', error);
    if (axios.isAxiosError(error)) {
      ElMessage.error(`预览失败: ${error.response?.status === 404 ? '文件不存在' : error.message}`);
    } else {
      ElMessage.error('预览失败');
    }
  }
};

onMounted(async () => {
  await fetchAssets()
})
</script>

<style lang="scss" scoped>
.asset-certification {
  padding: 20px;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .left {
      display: flex;
      gap: 16px;

      .el-input {
        width: 300px;
      }
    }
  }

  .file-name {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .certification-asset-info,
  .certification-request-info,
  .certification-materials,
  .certification-status,
  .certification-form {
    margin-bottom: 24px;

    h3 {
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  .status-item {
    .certifier,
    .status,
    .reason {
      margin-bottom: 8px;
      color: var(--el-text-color-regular);
    }

    .reason {
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }

    .certifier {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &.current-user {
      background-color: var(--el-color-primary-light-9);
      padding: 8px;
      border-radius: 4px;
    }
  }

  .mt-4 {
    margin-top: 16px;
  }

  .quick-comments {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .quick-comments-label {
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }

    .el-button {
      margin: 0;
    }
  }

  .certification-files {
    margin-top: 8px;
    
    .files-title {
      color: var(--el-text-color-regular);
      margin-bottom: 4px;
    }
    
    .el-link {
      display: inline-flex;
      align-items: center;
      margin-right: 12px;
      
      .el-icon {
        margin-right: 4px;
      }
    }
  }

  .certification-materials {
    .el-table {
      margin-top: 8px;
    }
  }
}

/* 添加全屏图片预览样式 */
.full-image-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.full-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #000;
}

.full-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}
</style> 