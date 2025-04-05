<template>
  <div class="certification-records-container">
    <!-- 认证记录筛选区 -->
    <div class="search-filter-container">
      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="certSearchQuery"
          placeholder="搜索资产ID或认证者地址..."
          clearable
          prefix-icon="el-icon-search"
          @input="handleCertSearch"
        />
      </div>
      
      <!-- 筛选选项 -->
      <div class="filter-row">    
        <div class="filter-group">
          <span class="filter-label">时间范围:</span>
          <el-date-picker
            v-model="certDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </div>
        
        <div class="filter-group">
          <el-button type="primary" @click="fetchCertificationRecords">筛选</el-button>
          <el-button @click="resetCertFilters">重置</el-button>
        </div>
      </div>
    </div>
    
    <!-- 认证记录表格 -->
    <el-table
      v-loading="loadingCertRecords"
      :data="groupedAssetRecords"
      stripe
      style="width: 100%"
      @sort-change="handleCertSort"
    >
      <el-table-column type="expand" width="50">
        <template #default="{ row: assetRecord }">
          <div class="certification-details">
            <div class="certification-status-summary">
              <div class="status-header">认证状态概览</div>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="status-item">
                    <div class="status-label">已认证</div>
                    <div class="status-value">{{ getCertifiedCount(assetRecord.allCertifierStatuses) }}</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="status-item">
                    <div class="status-label">待认证</div>
                    <div class="status-value">{{ getPendingCount(assetRecord.allCertifierStatuses) }}</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="status-item">
                    <div class="status-label">总认证人数</div>
                    <div class="status-value">{{ assetRecord.allCertifierStatuses.length }}</div>
                  </div>
                </el-col>
              </el-row>
            </div>

            <el-table
              :data="assetRecord.allCertifierStatuses"
              border
              size="small"
              style="width: 100%; margin-top: 20px;"
            >
              <el-table-column label="认证者" min-width="220">
                <template #default="{ row: certifier }">
                  <div class="certifier-info-row">
                    <el-tooltip :content="certifier.certifierAddress" placement="top">
                      <span class="certifier-address">{{ formatAddress(certifier.certifierAddress) }}</span>
                    </el-tooltip>
                    <el-tag 
                      v-if="certifier.isCurrentUser" 
                      size="small" 
                      type="info" 
                      style="margin-left: 8px;"
                    >
                      当前用户
                    </el-tag>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="认证状态" width="120">
                <template #default="{ row: certifier }">
                  <el-tag :type="certifier.hasCertified ? 'success' : 'warning'">
                    {{ certifier.hasCertified ? '已认证' : '待认证' }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column label="认证时间" width="180">
                <template #default="{ row: certifier }">
                  {{ certifier.timestamp ? formatDate(certifier.timestamp) : '-' }}
                </template>
              </el-table-column>

              <el-table-column label="认证评论" min-width="200">
                <template #default="{ row: certifier }">
                  <el-tooltip 
                    v-if="certifier.comment" 
                    :content="certifier.comment" 
                    placement="top"
                  >
                    <span class="comment-text">{{ truncateComment(certifier.comment) }}</span>
                  </el-tooltip>
                  <span v-else>-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="资产ID" prop="tokenId" width="120" sortable>
        <template #default="{ row: assetRecord }">
          <el-tooltip :content="'查看资产详情'" placement="top">
            <span class="link-text" @click="viewAssetById(assetRecord.tokenId)">{{ assetRecord.tokenId }}</span>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="认证进度" min-width="280">
        <template #default="{ row: assetRecord }">
          <div class="cert-progress">
            <el-progress 
              :percentage="calculateCertProgress(assetRecord.allCertifierStatuses)"
              :format="() => `${getCertifiedCount(assetRecord.allCertifierStatuses)}/${assetRecord.allCertifierStatuses.length}`"
              :status="getCertProgressStatus(assetRecord.allCertifierStatuses)"
              :stroke-width="18"
            />
          </div>
        </template>
      </el-table-column>

      <el-table-column label="最近更新" width="180" sortable>
        <template #default="{ row: assetRecord }">
          {{ formatDate(getLatestCertificationTime(assetRecord.allCertifierStatuses)) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row: assetRecord }">
          <el-button size="small" type="primary" @click="viewAssetById(assetRecord.tokenId)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 无数据状态 -->
    <div v-if="groupedAssetRecords.length === 0 && !loadingCertRecords" class="empty-state">
      <el-empty description="暂无认证记录" />
    </div>
    
    <!-- 分页 -->
    <div class="pagination-container" v-if="totalCertRecords > 0">
      <el-pagination
        layout="total, prev, pager, next"
        :total="totalCertRecords"
        :current-page="certCurrentPage"
        :page-size="certPageSize"
        @current-change="handleCertPageChange"
      />
    </div>
    
    <!-- 资产详情对话框 -->
    <asset-detail-dialog
      v-if="selectedAsset"
      v-model:visible="showAssetDetail"
      :asset-details="selectedAsset"
      :asset-preview-url="assetPreviewUrl"
      @close="handleDetailClose"
    >
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAssetDetail = false">关闭</el-button>
          <el-button type="primary" @click="selectedAsset && downloadAsset(selectedAsset)">下载文件</el-button>
        </span>
      </template>
    </asset-detail-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService'
import { useUserStore } from '@/stores/user'
import { useWalletStore } from '@/stores/wallet'
import { debounce } from 'lodash'
import axios from 'axios'
import AssetDetailDialog from '@/components/AssetDetailDialog.vue'

// 定义认证记录接口
interface CertificationRecord {
  tokenId: string | number;
  certifierAddress: string;
  certificationTime: string | Date;
  comment?: string;
  cid: string;
  contentHash?: string;
  registrationDate: number | bigint;
  version: number | bigint;
  isCertified: boolean;
  certificationStatus: CertifierStatus[];
}

// 定义认证者状态接口
interface CertifierStatus {
  certifierAddress: string;
  hasCertified: boolean;
  isCurrentUser: boolean;
  timestamp: number | null;
  comment: string | null;
}

// 定义资产接口
interface Asset {
  tokenId: string | number;
  cid: string;
  registrationDate: number | Date;
  isCertified: boolean;
  metadata: {
    description: string;
    category: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
  [key: string]: any;
}

// 定义分组后的资产记录接口
interface GroupedAssetRecord {
  tokenId: string | number;
  cid: string;
  registrationDate: number | bigint;
  version: number | bigint;
  isCertified: boolean;
  certificationRecords: CertificationRecord[];
  allCertifierStatuses: CertifierStatus[];
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'close', 'view-asset'])

// 添加组件卸载标记
const isComponentMounted = ref(true)

const userStore = useUserStore()
const walletStore = useWalletStore()

// 认证记录状态
const certificationRecords = ref<CertificationRecord[]>([])
const certSearchQuery = ref('')
const certDateRange = ref<[string, string] | null>(null)
const certCurrentPage = ref(1)
const certPageSize = ref(10)
const totalCertRecords = ref(0)
const loadingCertRecords = ref(false)

// 资产详情相关状态
const selectedAsset = ref<Asset | null>(null)
const showAssetDetail = ref(false)
const assetPreviewUrl = ref('')
const isLoadingPreview = ref(false)

// 查询已过滤的认证记录
const filteredCertRecords = computed(() => {
  if (!certSearchQuery.value) {
    return certificationRecords.value
  }
  
  const query = certSearchQuery.value.toLowerCase()
  return certificationRecords.value.filter(record => 
    record.tokenId.toString().includes(query) ||
    record.certifierAddress.toLowerCase().includes(query)
  )
})

// 对认证记录按资产ID分组的计算属性
const groupedAssetRecords = computed<GroupedAssetRecord[]>(() => {
  const groupedMap = new Map<string | number, CertificationRecord[]>();
  
  // 按资产ID分组
  certificationRecords.value.forEach(record => {
    if (!groupedMap.has(record.tokenId)) {
      groupedMap.set(record.tokenId, []);
    }
    groupedMap.get(record.tokenId)?.push(record);
  });
  
  // 转换为最终的分组记录
  return Array.from(groupedMap.entries()).map(([tokenId, records]) => {
    // 使用第一条记录的基本信息
    const firstRecord = records[0];
    
    // 合并所有认证者状态
    const allStatuses = new Map<string, CertifierStatus>();
    records.forEach(record => {
      record.certificationStatus.forEach(status => {
        allStatuses.set(status.certifierAddress, status);
      });
    });
    
    return {
      tokenId,
      cid: firstRecord.cid,
      registrationDate: firstRecord.registrationDate,
      version: firstRecord.version,
      isCertified: firstRecord.isCertified,
      certificationRecords: records,
      allCertifierStatuses: Array.from(allStatuses.values())
    };
  });
});

// 获取已认证数量
const getCertifiedCount = (statuses?: CertifierStatus[]): number => {
  if (!statuses?.length) return 0;
  return statuses.filter(status => status.hasCertified).length;
};

// 获取待认证数量
const getPendingCount = (statuses?: CertifierStatus[]): number => {
  if (!statuses?.length) return 0;
  return statuses.filter(status => !status.hasCertified).length;
};

// 计算认证进度百分比
const calculateCertProgress = (statuses?: CertifierStatus[]): number => {
  if (!statuses?.length) return 0;
  return Math.round((getCertifiedCount(statuses) / statuses.length) * 100);
};

// 获取认证进度状态
const getCertProgressStatus = (statuses?: CertifierStatus[]): 'success' | 'warning' | 'exception' => {
  if (!statuses?.length) return 'exception';
  const progress = calculateCertProgress(statuses);
  if (progress === 100) return 'success';
  if (progress > 0) return 'warning';
  return 'exception';
};

// 获取最新认证时间
const getLatestCertificationTime = (statuses?: CertifierStatus[]): Date => {
  if (!statuses?.length) return new Date();
  const timestamps = statuses
    .filter(status => status.timestamp)
    .map(status => status.timestamp as number);
  
  if (!timestamps.length) return new Date();
  return new Date(Math.max(...timestamps));
};

// 截断评论文本
const truncateComment = (comment: string, maxLength: number = 50): string => {
  if (!comment) return ''
  return comment.length > maxLength 
    ? `${comment.slice(0, maxLength)}...` 
    : comment
}

// 格式化日期
const formatDate = (date: string | Date | number | null): string => {
  if (!date) return '-';
  
  // 如果是时间戳（毫秒），转换为Date对象
  const dateObj = typeof date === 'number' 
    ? new Date(date)
    : typeof date === 'string' 
      ? new Date(date) 
      : date;

  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// 格式化地址
const formatAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// 获取认证记录
const fetchCertificationRecords = async () => {
  if (!isComponentMounted.value) return
  console.log('开始获取认证记录...')
  loadingCertRecords.value = true
  try {
    const service = await getDigitalAssetService()
    const certifications = await service.getCertificationsByAddress(userStore.profile?.walletAddress || '')
    
    // 检查组件是否已卸载
    if (!isComponentMounted.value) return

    // 转换数据格式
    const records = certifications.map(cert => ({
      tokenId: cert.tokenId,
      certifierAddress: cert.certifierAddress,
      certificationTime: new Date(cert.certificationTime),
      comment: cert.comment,
      cid: cert.cid,
      version: cert.version,
      isCertified: cert.isCertified,
      registrationDate: cert.registrationDate,
      certificationStatus: cert.certificationStatus
    }))

    // 根据日期范围过滤
    let filteredRecords = records
    if (certDateRange.value && certDateRange.value[0] && certDateRange.value[1]) {
      const startDate = new Date(certDateRange.value[0]).getTime()
      const endDate = new Date(certDateRange.value[1]).getTime()
      filteredRecords = records.filter(record => {
        const recordTime = record.certificationTime.getTime()
        return recordTime >= startDate && recordTime <= endDate
      })
    }

    // 处理分页
    const startIndex = (certCurrentPage.value - 1) * certPageSize.value
    const endIndex = startIndex + certPageSize.value
    
    // 再次检查组件是否已卸载
    if (!isComponentMounted.value) return
    
    certificationRecords.value = filteredRecords.slice(startIndex, endIndex)
    totalCertRecords.value = filteredRecords.length
  } catch (error: any) {
    if (!isComponentMounted.value) return
    console.error('获取认证记录失败:', error)
    ElMessage.error('获取认证记录失败: ' + (error.message || '未知错误'))
    certificationRecords.value = []
    totalCertRecords.value = 0
  } finally {
    if (isComponentMounted.value) {
      loadingCertRecords.value = false
    }
  }
}

// 重置认证记录筛选
const resetCertFilters = () => {
  certSearchQuery.value = ''
  certDateRange.value = null
  fetchCertificationRecords()
}

// 处理认证记录搜索
const handleCertSearch = debounce(() => {
  fetchCertificationRecords()
}, 300)

// 处理认证记录排序
const handleCertSort = ({ prop, order }: { prop: string, order: string }) => {
  console.log('排序:', prop, order)
  // 这里可以实现排序逻辑
}

// 处理认证记录分页变化
const handleCertPageChange = (page: number) => {
  certCurrentPage.value = page
  fetchCertificationRecords()
}


// 查看资产详情
const viewAssetById = async (tokenId: string | number) => {
  if (!isComponentMounted.value) return
  try {
    const asset = await getAssetByTokenId(tokenId)
    if (!isComponentMounted.value) return
    if (asset) {
      viewAssetDetails(asset)
    } else {
      ElMessage.warning(`未找到资产ID为 ${tokenId} 的资产`)
    }
  } catch (error) {
    if (!isComponentMounted.value) return
    console.error('查看资产详情失败:', error)
    ElMessage.error('查看资产详情失败')
  }
}

// 根据资产ID获取资产详情
const getAssetByTokenId = async (tokenId: string | number) => {
  try {
    const service = await getDigitalAssetService()
    
    try {
      // 尝试使用getAssetMetadata获取元数据
      const metadata = await service.getAssetMetadata(Number(tokenId))
      
      // 转换元数据为资产对象格式
      return {
        tokenId: tokenId.toString(),
        cid: metadata[0] || '',
        version: metadata[3] || 1,
        isCertified: metadata[4] || false,
        registrationDate: new Date(Number(metadata[2]) * 1000),
        metadata: {
          fileName: metadata.fileName || '',
          fileType: metadata.fileType || '',
          fileSize: metadata.fileSize || 0,
          category: metadata.category || '未分类',
          description: metadata.description || '暂无描述'
        }
      }
    } catch (metadataError) {
      console.error('通过元数据获取资产失败:', metadataError)
      
      // 如果获取元数据失败，尝试从用户资产列表中查找
      const assets = await service.getUserAssets(walletStore.address, true)
      const asset = assets.find((asset: any) => 
        parseInt(asset.tokenId.toString()) === parseInt(tokenId.toString())
      )
      
      if (!asset) {
        throw new Error(`未找到ID为 ${tokenId} 的资产`)
      }
      
      return asset
    }
  } catch (error) {
    console.error('获取资产详情失败:', error)
    throw error
  }
}

// 查看资产详情方法
const viewAssetDetails = async (asset: Asset) => {
  try {
    selectedAsset.value = asset
    showAssetDetail.value = true
    
    // 生成预览URL
    await generatePreviewUrl(asset)
  } catch (error) {
    console.error('查看资产详情失败:', error)
    ElMessage.error('查看资产详情失败')
  }
}

// 处理详情对话框关闭
const handleDetailClose = () => {
  showAssetDetail.value = false
  selectedAsset.value = null
  // 释放预览URL
  if (assetPreviewUrl.value) {
    URL.revokeObjectURL(assetPreviewUrl.value)
    assetPreviewUrl.value = ''
  }
}

// 生成资产预览URL
const generatePreviewUrl = async (asset: Asset) => {
  try {
    isLoadingPreview.value = true;
    
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
  ]
  
  // 对于以某些前缀开头的类型也可预览
  if (fileType.startsWith('image/') || 
      fileType.startsWith('video/') || 
      fileType.startsWith('audio/')) {
    return true
  }
  
  return previewableTypes.includes(fileType.toLowerCase())
}

// 下载资产
const downloadAsset = async (asset: Asset) => {
  if (!asset) return
  
  try {
    const service = await getDigitalAssetService()
    const { file } = await service.getAssetContent(asset.cid)
    
    // 创建下载链接
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = asset.metadata.fileName
    document.body.appendChild(a)
    a.click()
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
    
    ElMessage.success('文件下载已开始')
  } catch (error) {
    console.error('下载文件失败:', error)
    ElMessage.error('下载失败')
  }
}

// 组件挂载和卸载
onMounted(() => {
  isComponentMounted.value = true
  fetchCertificationRecords()
})

onBeforeUnmount(() => {
  isComponentMounted.value = false
})
</script>

<style lang="scss" scoped>
.certification-records-container {
  max-width: 100%;
  margin: 0 auto;
}

.search-filter-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  background-color: rgba(10, 25, 47, 0.6);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(100, 255, 218, 0.2);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(100, 255, 218, 0.05), transparent);
    z-index: -1;
    border-radius: 8px;
  }
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: #64ffda;
  margin-right: 0.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  text-align: center;
  background: rgba(10, 25, 47, 0.5);
  border-radius: 10px;
  border: 1px dashed rgba(100, 255, 218, 0.2);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.link-text {
  color: #64ffda;
  cursor: pointer;
  font-weight: 500;
  font-family: monospace;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(100, 255, 218, 0.1);
    text-decoration: none;
  }
}

.txhash-text {
  color: #64ffda;
  cursor: pointer;
  font-family: monospace;
}

.txhash-text:hover {
  text-decoration: underline;
}

.certifier-info-row {
  display: flex;
  flex-direction: column;
}

.certifier-address {
  font-family: monospace;
  font-weight: 500;
}

.certification-details {
  padding: 20px;
  background: rgba(10, 25, 47, 0.3);
  border-radius: 8px;
  
  .el-table {
    background: transparent;
    
    &::before {
      display: none;
    }
    
    th {
      background: rgba(100, 255, 218, 0.1);
      border-bottom: 1px solid rgba(100, 255, 218, 0.2);
    }
    
    td {
      border-bottom: 1px solid rgba(100, 255, 218, 0.1);
    }
  }
}

.certification-status-summary {
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(100, 255, 218, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(100, 255, 218, 0.1);

  .status-header {
    font-size: 16px;
    font-weight: 600;
    color: #64ffda;
    margin-bottom: 16px;
  }

  .status-item {
    text-align: center;
    padding: 12px;
    background: rgba(10, 25, 47, 0.4);
    border-radius: 6px;
    border: 1px solid rgba(100, 255, 218, 0.1);

    .status-label {
      font-size: 14px;
      color: #8892b0;
      margin-bottom: 8px;
    }

    .status-value {
      font-size: 24px;
      font-weight: 600;
      color: #64ffda;
    }
  }
}

.cert-progress {
  padding: 8px 0;
  
  .el-progress {
    margin: 0;
    
    :deep(.el-progress-bar__outer) {
      background-color: rgba(100, 255, 218, 0.1);
    }
    
    :deep(.el-progress-bar__inner) {
      transition: all 0.3s ease;
    }
    
    :deep(.el-progress__text) {
      font-size: 13px;
      font-weight: 500;
      color: #8892b0;
    }
  }
}

.comment-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #8892b0;
  
  &:hover {
    color: #64ffda;
  }
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    margin-bottom: 0.5rem;
  }
}
</style> 