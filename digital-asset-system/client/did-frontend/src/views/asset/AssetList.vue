<template>
  <div class="asset-list">
    <!-- 搜索和筛选区 -->
    <div class="search-filter-container">
      <!-- 基本搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索资产..."
          clearable
          prefix-icon="el-icon-search"
          @input="handleSearch"
        />
      </div>
      
      <!-- 高级筛选面板 -->
      <div class="filter-panel">
        <el-collapse v-model="expandedPanels">
          <el-collapse-item title="高级筛选" name="filters">
            <div class="filter-options">
              <!-- 文件类型筛选 -->
              <div class="filter-group">
                <h4>文件类型</h4>
                <el-checkbox-group v-model="filters.fileTypes">
                  <el-checkbox label="image">图片</el-checkbox>
                  <el-checkbox label="document">文档</el-checkbox>
                  <el-checkbox label="video">视频</el-checkbox>
                  <el-checkbox label="audio">音频</el-checkbox>
                  <el-checkbox label="other">其他</el-checkbox>
                </el-checkbox-group>
              </div>
              
              <!-- 文件大小筛选 -->
              <div class="filter-group">
                <h4>文件大小</h4>
                <el-radio-group v-model="filters.fileSize">
                  <el-radio label="small">小 (< 1MB)</el-radio>
                  <el-radio label="medium">中 (1MB - 10MB)</el-radio>
                  <el-radio label="large">大 (> 10MB)</el-radio>
                  <el-radio label="custom">自定义</el-radio>
                </el-radio-group>
                
                <div v-if="filters.fileSize === 'custom'" class="custom-size-range">
                  <el-input-number
                    v-model="filters.minSize"
                    :min="0"
                    :step="1"
                    size="small"
                    controls-position="right"
                  />
                  <span>MB 到</span>
                  <el-input-number
                    v-model="filters.maxSize"
                    :min="0"
                    :step="1"
                    size="small"
                    controls-position="right"
                  />
                  <span>MB</span>
                </div>
              </div>
              
              <!-- 上传日期筛选 -->
              <div class="filter-group">
                <h4>上传日期</h4>
                <el-radio-group v-model="filters.dateRange">
                  <el-radio label="today">今天</el-radio>
                  <el-radio label="week">本周</el-radio>
                  <el-radio label="month">本月</el-radio>
                  <el-radio label="custom">自定义</el-radio>
                </el-radio-group>
                
                <div v-if="filters.dateRange === 'custom'" class="custom-date-range">
                  <el-date-picker
                    v-model="filters.dateStart"
                    type="date"
                    placeholder="开始日期"
                    size="small"
                    style="width: 150px"
                  />
                  <span>至</span>
                  <el-date-picker
                    v-model="filters.dateEnd"
                    type="date"
                    placeholder="结束日期"
                    size="small"
                    style="width: 150px"
                  />
                </div>
              </div>
              
              <!-- 认证状态筛选 -->
              <div class="filter-group">
                <h4>认证状态</h4>
                <el-radio-group v-model="filters.certificationStatus">
                  <el-radio label="all">全部</el-radio>
                  <el-radio label="certified">已认证</el-radio>
                  <el-radio label="uncertified">未认证</el-radio>
                </el-radio-group>
              </div>
              
              <!-- 排序选项 -->
              <div class="filter-group">
                <h4>排序方式</h4>
                <el-select v-model="sortOption" placeholder="选择排序方式" style="width: 100%">
                  <el-option 
                    v-for="option in sortOptions" 
                    :key="option.value" 
                    :label="option.label" 
                    :value="option.value"
                  />
                </el-select>
              </div>
              
              <!-- 筛选按钮 -->
              <div class="filter-actions">
                <el-button type="primary" @click="applyFilters">应用筛选</el-button>
                <el-button @click="resetFilters">重置</el-button>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
      
      <!-- 已选筛选条件标签 -->
      <div class="selected-filters" v-if="hasActiveFilters">
        <span class="filter-label">已选筛选:</span>
        <el-tag 
          v-if="searchQuery"
          closable
          @close="searchQuery = ''; handleSearch()"
        >
          关键词: {{ searchQuery }}
        </el-tag>
        <el-tag 
          v-for="type in filters.fileTypes" 
          :key="'type-'+type"
          closable
          @close="removeFileTypeFilter(type)"
        >
          文件类型: {{ getFileTypeLabel(type) }}
        </el-tag>
        <el-tag 
          v-if="filters.fileSize !== ''"
          closable
          @close="filters.fileSize = ''"
        >
          文件大小: {{ getFileSizeLabel(filters.fileSize) }}
        </el-tag>
        <el-tag 
          v-if="filters.dateRange !== ''"
          closable
          @close="filters.dateRange = ''"
        >
          日期范围: {{ getDateRangeLabel(filters.dateRange) }}
        </el-tag>
        <el-tag 
          v-if="filters.certificationStatus !== 'all'"
          closable
          @close="filters.certificationStatus = 'all'"
        >
          认证状态: {{ getCertificationStatusLabel(filters.certificationStatus) }}
        </el-tag>
        <el-button size="small" type="info" plain @click="resetFilters">清空全部</el-button>
      </div>
      
      <!-- 筛选结果统计 -->
      <div class="filter-results-count" v-if="!loading">
        找到 {{ filteredAssets.length }} 个资产
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>
    
    <!-- 资产列表 -->
    <template v-if="filteredAssets.length > 0">
      <div class="asset-controls" v-if="filteredAssets.length > 0">
        <el-button-group>
          <el-button 
            type="danger" 
            :disabled="selectedAssets.length === 0"
            @click="batchDeleteAssets"
          >
            批量删除 ({{ selectedAssets.length }})
          </el-button>
        </el-button-group>
      </div>
      
      <el-table 
        v-loading="loading"
        :data="filteredAssets"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @sort-change="handleSort"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="资产ID" prop="tokenId" width="80" sortable/>
        <el-table-column label="文件名" prop="metadata.fileName" min-width="120" show-overflow-tooltip sortable/>
        <el-table-column label="类型" prop="metadata.fileType" width="120" show-overflow-tooltip/>
        <el-table-column label="大小" width="100" sortable>
          <template #default="scope">
            {{ formatFileSize(scope.row.metadata.fileSize || 0) }}
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="160" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.registrationDate) }}
          </template>
        </el-table-column>
        <el-table-column label="认证状态" width="100" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.isCertified ? 'success' : 'warning'">
              {{ scope.row.isCertified ? '已认证' : '未认证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="viewAssetDetails(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              type="primary" 
              v-if="!scope.row.isCertified"
              @click="initiateCertification(scope.row)"
            >
              认证
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteAsset(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 无数据状态 -->
    <template v-else>
      <div class="empty-state">
        <div v-if="hasActiveFilters">
          <el-empty description="没有符合筛选条件的资产" />
          <el-button type="info" @click="resetFilters">清除筛选条件</el-button>
        </div>
        <div v-else>
          <el-empty description="暂无资产" />
          <el-button type="primary" @click="$router.push('/asset/register')">注册新资产</el-button>
        </div>
      </div>
    </template>

    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
        v-if="assetsPagination.totalCount > 0"
        layout="prev, pager, next"
        :total="assetsPagination.totalCount"
        :current-page="assetsPagination.currentPage"
        :page-size="assetsPagination.pageSize"
        @current-change="changePage"
      />
    </div>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除资产"
      width="30%"
    >
      <div class="delete-confirmation">
        <p>您确定要删除以下资产吗？此操作不可撤销。</p>
        <div v-if="assetToDelete" class="asset-to-delete">
          <p><strong>资产ID:</strong> {{ assetToDelete.tokenId }}</p>
          <p><strong>文件名:</strong> {{ assetToDelete.metadata.fileName }}</p>
          <p><strong>注册时间:</strong> {{ formatDate(assetToDelete.registrationDate) }}</p>
        </div>
        <div class="safety-check">
          <p>请输入"DELETE"以确认删除:</p>
          <el-input v-model="deleteConfirmText" placeholder="请输入DELETE"></el-input>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button
            type="danger"
            :disabled="deleteConfirmText !== 'DELETE' || isDeleting"
            @click="confirmDelete"
          >
            <span v-if="!isDeleting">确认删除</span>
            <span v-else>删除中...</span>
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量删除确认对话框 -->
    <el-dialog
      v-model="batchDeleteDialogVisible"
      title="确认批量删除资产"
      width="40%"
    >
      <div class="delete-confirmation">
        <p>您确定要删除以下 {{ selectedAssets.length }} 个资产吗？此操作不可撤销。</p>
        <div class="selected-assets-list">
          <el-scrollbar max-height="200px">
            <ul>
              <li v-for="asset in selectedAssets" :key="asset.tokenId">
                ID: {{ asset.tokenId }} - {{ asset.metadata.fileName }}
              </li>
            </ul>
          </el-scrollbar>
        </div>
        <div class="safety-check">
          <p>请输入"DELETE"以确认批量删除:</p>
          <el-input v-model="batchDeleteConfirmText" placeholder="请输入DELETE"></el-input>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDeleteDialogVisible = false">取消</el-button>
          <el-button
            type="danger"
            :disabled="batchDeleteConfirmText !== 'DELETE' || isBatchDeleting"
            @click="confirmBatchDelete"
          >
            <span v-if="!isBatchDeleting">确认删除</span>
            <span v-else>删除中 ({{ deletedCount }}/{{ selectedAssets.length }})...</span>
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 资产详情组件 -->
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
          <el-button 
            v-if="!selectedAsset?.isCertified"
            type="success" 
            @click="selectedAsset && initiateCertification(selectedAsset)"
          >
            发起认证
          </el-button>
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
        <img :src="assetPreviewUrl" class="full-image" :alt="selectedAsset?.metadata.fileName" />
      </div>
    </el-dialog>

    <!-- 认证请求对话框 -->
    <el-dialog
      v-model="certificationRequestDialogVisible"
      title="请求资产认证"
      width="600px"
      destroy-on-close
    >
      <div v-if="selectedAssetForCert">
        <p>您正在为以下资产请求认证：</p>
        <div class="cert-asset-info">
          <p><strong>资产ID：</strong> {{ selectedAssetForCert.tokenId }}</p>
          <p><strong>文件名：</strong> {{ selectedAssetForCert.metadata.fileName }}</p>
          <p><strong>文件类型：</strong> {{ selectedAssetForCert.metadata.fileType }}</p>
        </div>

        <!-- 认证状态展示 -->
        <div class="certification-status">
          <h3>认证状态</h3>
          <div v-loading="isLoadingStatus" class="status-list">
            <template v-if="certificationStatus.length > 0">
              <div v-for="status in certificationStatus" :key="status.certifierAddress" class="status-item">
                <div class="certifier-info">
                  <span class="certifier-name">{{ status.certifierName || formatAddress(status.certifierAddress) }}</span>
                  <span class="certifier-address">{{ formatAddress(status.certifierAddress) }}</span>
                </div>
                <div class="status-badge" :class="status.status.toLowerCase()">
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
              <p>暂无认证记录</p>
              <p v-if="!selectedAssetForCert.isCertified">您可以提交认证请求，选择认证者进行资产认证</p>
            </div>
          </div>
        </div>
        
        <!-- 认证表单 -->
        <div v-if="!selectedAssetForCert.isCertified" class="cert-form">
          <h3>提交认证申请</h3>
          <div class="form-group">
            <label>认证说明:</label>
            <el-input 
              v-model="certifyRequest.reason"
              type="textarea"
              :rows="4"
              placeholder="请详细说明认证请求的原因和资产的真实性..."
            />
          </div>

          <!-- 添加认证资料上传 -->
          <div class="form-group">
            <label>认证资料上传 (支持多个文件，每个文件大小不超过10MB):</label>
            <el-upload
              ref="uploadRef"
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :before-upload="beforeFileUpload"
              :limit="5"
              multiple
              :file-list="certifyRequest.files"
            >
              <template #trigger>
                <el-button type="primary">选择文件</el-button>
              </template>
              <template #tip>
                <div class="el-upload__tip">
                  支持的文件类型：PDF、Word、图片等，单个文件不超过10MB
                </div>
              </template>
            </el-upload>
          </div>

          <div class="form-group">
            <label>选择认证者 (至少选择2位):</label>
            <el-select
              v-model="certifyRequest.approvers"
              multiple
              filterable
              placeholder="请选择认证者"
              :loading="loadingCertifiers"
              style="width: 100%;"
            >
              <el-option
                v-for="certifier in availableCertifiers"
                :key="certifier.address"
                :label="`${certifier.name || '未命名认证者'} (${formatAddress(certifier.address)})`"
                :value="certifier.address"
              />
            </el-select>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="certificationRequestDialogVisible = false">关闭</el-button>
          <el-button 
            v-if="selectedAssetForCert && !selectedAssetForCert.isCertified"
            type="primary" 
            :loading="isCertifying" 
            :disabled="!isCertifyFormValid" 
            @click="handleCertification"
          >提交认证请求</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService'
import { getRBACService } from '@/utils/web3/RBACService'
import { useUserStore } from '@/stores/user'
import { useWalletStore } from '@/stores/wallet'
import { debounce } from 'lodash'
import axios from 'axios'
import AssetDetailDialog from '@/components/AssetDetailDialog.vue'

const router = useRouter()
const userStore = useUserStore()
const walletStore = useWalletStore()

const digitalAssetService = await getDigitalAssetService()

// 资产列表相关状态
interface Asset {
  tokenId: string;
  cid: string;
  registrationDate: number;
  isCertified: boolean;
  metadata: {
    description: string;
    category: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
}

const loading = ref(false)
const assetList = ref<Asset[]>([])
const assetsPagination = ref({
  totalCount: 0,
  currentPage: 1,
  pageSize: 10
})

// 搜索和筛选状态
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

// 删除相关状态
const deleteDialogVisible = ref(false)
const assetToDelete = ref<Asset | null>(null)
const deleteConfirmText = ref('')
const isDeleting = ref(false)

const selectedAssets = ref<Asset[]>([])
const batchDeleteDialogVisible = ref(false)
const batchDeleteConfirmText = ref('')
const isBatchDeleting = ref(false)
const deletedCount = ref(0)

// 添加资产详情相关状态
const selectedAsset = ref<Asset | null>(null)
const showAssetDetail = ref(false)
const assetPreviewUrl = ref('')

// 添加认证相关状态
const certificationRequestDialogVisible = ref(false)
const selectedAssetForCert = ref<Asset | null>(null)
const certificationStatus = ref<CertificationStatus[]>([])
const isLoadingStatus = ref(false)
const isCertifying = ref(false)
const loadingCertifiers = ref(false)
const availableCertifiers = ref<{address: string; name?: string}[]>([])

// 添加自动认证相关状态
const canAutoCertify = ref(false)

interface CertificationStatus {
  certifierAddress: string;
  certifierName?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  timestamp?: string;
  reason?: string;
}

const certifyRequest = ref<{
  tokenId: number;
  reason: string;
  approvers: string[];
  files: any[]; // 新增files字段
}>({
  tokenId: 0,
  reason: '',
  approvers: [],
  files: []
})

// 添加新的状态
const isLoadingPreview = ref(false)
const fullImageVisible = ref(false)
const iframeLoadFailed = ref(false)

// 添加文件上传相关方法
const uploadRef = ref()

const beforeFileUpload = (file: File) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  return true
}

const handleFileChange = (file: any) => {
  if (!beforeFileUpload(file.raw)) {
    return
  }
  certifyRequest.value.files.push(file)
}

const handleFileRemove = (file: any) => {
  const index = certifyRequest.value.files.findIndex(f => f.uid === file.uid)
  if (index !== -1) {
    certifyRequest.value.files.splice(index, 1)
  }
}

// 计算属性
const filteredAssets = computed(() => {
  let filtered = assetList.value
  console.log('filteredAssets - 原始数据:', assetList.value)
  console.log('filteredAssets - 筛选条件:', {
    searchQuery: searchQuery.value,
    fileTypes: filters.value.fileTypes,
    fileSize: filters.value.fileSize,
    dateRange: filters.value.dateRange,
    certificationStatus: filters.value.certificationStatus
  })

  // 搜索关键字筛选
  if (searchQuery.value) {
    filtered = filtered.filter(asset => 
      asset.metadata.fileName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (asset.metadata.description && asset.metadata.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  }

  // 文件类型筛选
  if (filters.value.fileTypes.length > 0) {
    filtered = filtered.filter(asset => {
      const type = asset.metadata.fileType
      return filters.value.fileTypes.some(filterType => {
        if (filterType === 'image') return type.startsWith('image/')
        if (filterType === 'document') return type.includes('pdf') || type.includes('doc') || type.includes('text')
        if (filterType === 'video') return type.startsWith('video/')
        if (filterType === 'audio') return type.startsWith('audio/')
        if (filterType === 'other') {
          return !type.startsWith('image/') && 
                 !type.startsWith('video/') && 
                 !type.startsWith('audio/') && 
                 !type.includes('pdf') && 
                 !type.includes('doc') && 
                 !type.includes('text')
        }
        return false
      })
    })
  }

  // 文件大小筛选
  if (filters.value.fileSize) {
    filtered = filtered.filter(asset => {
      const sizeInMB = asset.metadata.fileSize / (1024 * 1024)
      if (filters.value.fileSize === 'small') return sizeInMB < 1
      if (filters.value.fileSize === 'medium') return sizeInMB >= 1 && sizeInMB <= 10
      if (filters.value.fileSize === 'large') return sizeInMB > 10
      if (filters.value.fileSize === 'custom') {
        return sizeInMB >= filters.value.minSize && sizeInMB <= filters.value.maxSize
      }
      return true
    })
  }

  // 上传日期筛选
  if (filters.value.dateRange) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    
    filtered = filtered.filter(asset => {
      const assetDate = new Date(asset.registrationDate)
      assetDate.setHours(0, 0, 0, 0)
      
      if (filters.value.dateRange === 'today') {
        return assetDate.getTime() === today.getTime()
      } else if (filters.value.dateRange === 'week') {
        return assetDate >= weekStart
      } else if (filters.value.dateRange === 'month') {
        return assetDate >= monthStart
      } else if (filters.value.dateRange === 'custom' && filters.value.dateStart && filters.value.dateEnd) {
        const start = new Date(filters.value.dateStart)
        start.setHours(0, 0, 0, 0)
        
        const end = new Date(filters.value.dateEnd)
        end.setHours(23, 59, 59, 999)
        
        return assetDate >= start && assetDate <= end
      }
      return true
    })
  }

  // 认证状态筛选
  if (filters.value.certificationStatus && filters.value.certificationStatus !== 'all') {
    filtered = filtered.filter(asset => 
      (filters.value.certificationStatus === 'certified' && asset.isCertified) ||
      (filters.value.certificationStatus === 'uncertified' && !asset.isCertified)
    )
  }

  // 排序处理
  if (sortOption.value) {
    filtered.sort((a, b) => {
      if (sortOption.value === 'tokenId') {
        return parseInt(a.tokenId) - parseInt(b.tokenId)
      } else if (sortOption.value === 'registrationDate') {
        return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
      } else if (sortOption.value === 'fileSize') {
        return a.metadata.fileSize - b.metadata.fileSize
      } else if (sortOption.value === 'fileName') {
        return a.metadata.fileName.localeCompare(b.metadata.fileName)
      } else if (sortOption.value === 'isCertified') {
        return (b.isCertified ? 1 : 0) - (a.isCertified ? 1 : 0)
      }
      return 0
    })
  }

  console.log('filteredAssets - 筛选后数据:', filtered)
  return filtered
})

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value ||
    filters.value.fileTypes.length > 0 ||
    filters.value.fileSize ||
    filters.value.dateRange ||
    filters.value.certificationStatus !== 'all'
  )
})

const isCertifyFormValid = computed(() => {
  return (
    certifyRequest.value.tokenId !== null &&
    certifyRequest.value.reason.trim() !== '' &&
    certifyRequest.value.approvers.length >= 2
  )
})

// 方法
const fetchAssets = async () => {
  try {
    loading.value = true
    console.log('fetchAssets - 开始获取资产')
    console.log('fetchAssets - 钱包地址:', walletStore.address)
    
    const service = await getDigitalAssetService()
    const result = await service.getUserAssetsWithPagination(
      walletStore.address,
      assetsPagination.value.currentPage,
      assetsPagination.value.pageSize
    )
    
    console.log('fetchAssets - 获取到的结果:', result)
    
    assetList.value = result.assets
    console.log('assetList.value:', assetList.value)

    assetsPagination.value = {
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      pageSize: result.pageSize
    }

    console.log('fetchAssets - 更新后的 assetList:', assetList.value)
  } catch (error) {
    console.error('获取资产列表失败:', error)
    ElMessage.error('获取资产列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = debounce(() => {
  fetchAssets()
}, 300)

const changePage = async (page: number) => {
  await fetchAssets()
}

const formatDate = (date: Date | number | undefined | null) => {
  if (!date) return '未知'
  const dateObj = typeof date === 'number' ? new Date(date) : date as Date
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

const formatFileSize = (size: number): string => {
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

const handleSelectionChange = (selection: Asset[]) => {
  selectedAssets.value = selection
}

const handleSort = (params: any) => {
  if (params.prop) {
    if (params.prop === 'tokenId') {
      sortOption.value = 'tokenId'
    } else if (params.prop === 'metadata.fileName') {
      sortOption.value = 'fileName'
    } else if (params.prop.includes('fileSize')) {
      sortOption.value = 'fileSize'
    } else if (params.prop.includes('registrationDate')) {
      sortOption.value = 'registrationDate'
    } else if (params.prop.includes('isCertified')) {
      sortOption.value = 'isCertified'
    }
  } else {
    sortOption.value = ''
  }
}

const deleteAsset = (asset: Asset) => {
  assetToDelete.value = asset
  deleteDialogVisible.value = true
  deleteConfirmText.value = ''
}

const confirmDelete = async () => {
  if (!assetToDelete.value || deleteConfirmText.value !== 'DELETE') return
  
  try {
    isDeleting.value = true
    const service = await getDigitalAssetService()
    await service.deleteAsset(parseInt(assetToDelete.value.tokenId))
    
    ElMessage.success(`资产 ${assetToDelete.value.tokenId} 已成功删除`)
    deleteDialogVisible.value = false
    
    await fetchAssets()
  } catch (error) {
    console.error('删除资产失败:', error)
    ElMessage.error('删除资产失败')
  } finally {
    isDeleting.value = false
  }
}

const batchDeleteAssets = () => {
  if (selectedAssets.value.length === 0) return
  
  batchDeleteDialogVisible.value = true
  batchDeleteConfirmText.value = ''
}

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
    
    const service = await getDigitalAssetService()
    const tokenIds = selectedAssets.value.map(asset => 
      typeof asset.tokenId === 'string' ? parseInt(asset.tokenId) : asset.tokenId
    )
    
    const result = await service.batchDeleteAssets(tokenIds)
    
    if (result.success > 0) {
      ElMessage.success(`成功删除 ${result.success} 个资产`)
      deletedCount.value = result.success
    }
    
    if (result.failed > 0) {
      const failedDetails = result.details.filter(item => !item.success)
      let errorMsg = `${result.failed} 个资产删除失败`
      
      if (failedDetails.length <= 3) {
        errorMsg += '：' + failedDetails.map(item => 
          `资产 ${item.tokenId} - ${item.message || '未知错误'}`
        ).join('，')
      }
      
      ElMessage.warning(errorMsg)
    }
    
    batchDeleteDialogVisible.value = false
    batchDeleteConfirmText.value = ''
    selectedAssets.value = []
    
    await fetchAssets()
  } catch (error) {
    console.error('批量删除错误:', error)
    ElMessage.error('批量删除过程中发生错误')
  } finally {
    isBatchDeleting.value = false
  }
}

const removeFileTypeFilter = (type: string) => {
  filters.value.fileTypes = filters.value.fileTypes.filter(t => t !== type)
  fetchAssets()
}

const getFileTypeLabel = (type: string) => {
  if (type === 'image') return '图片'
  if (type === 'document') return '文档'
  if (type === 'video') return '视频'
  if (type === 'audio') return '音频'
  if (type === 'other') return '其他'
  return type
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
  fetchAssets()
}

const applyFilters = () => {
  expandedPanels.value = []
  fetchAssets()
}

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

// 修改查看资产详情方法
const viewAssetDetails = async (asset: Asset) => {
  try {
    selectedAsset.value = asset;
    showAssetDetail.value = true;
    
    // 生成预览URL
    await generatePreviewUrl(asset);
  } catch (error) {
    console.error('查看资产详情失败:', error);
    ElMessage.error('查看资产详情失败');
  }
};

const handleDetailClose = () => {
  showAssetDetail.value = false;
  selectedAsset.value = null;
  // 释放预览URL
  if (assetPreviewUrl.value) {
    URL.revokeObjectURL(assetPreviewUrl.value);
    assetPreviewUrl.value = '';
  }
};

const initiateCertification = async (asset: Asset) => {
  // 设置认证表单
  certifyRequest.value.tokenId = Number(asset.tokenId)
  certifyRequest.value.reason = ''
  certifyRequest.value.approvers = []
  
  // 设置当前选中的资产并显示对话框
  selectedAssetForCert.value = asset
  certificationRequestDialogVisible.value = true
  
  // 获取认证状态
  await fetchCertificationStatus(Number(asset.tokenId))
}

const fetchCertificationStatus = async (tokenId: number) => {
  if (tokenId === null) return
  
  isLoadingStatus.value = true
  try {
    const token = userStore.profile?.token || ''
    const response = await axios.get(`/api/certification/status/${tokenId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.data.success) {
      certificationStatus.value = response.data.data
    } else {
      throw new Error(response.data.message || '获取认证状态失败')
    }
  } catch (error: any) {
    console.error('获取认证状态失败:', error)
    ElMessage.error('获取认证状态失败: ' + (error.message || '未知错误'))
  } finally {
    isLoadingStatus.value = false
  }
}

const handleCertification = async () => {
  if (!isCertifyFormValid.value) {
    ElMessage.warning('请完成所有必填项并选择至少两位认证者')
    return
  }
  
  isCertifying.value = true
  try {
    const service = await getDigitalAssetService()
    const tx = await service.setCertifiers(
      Number(certifyRequest.value.tokenId), 
      certifyRequest.value.approvers
    )
    
    if (tx) {
      // 准备表单数据
      const formData = new FormData()
      formData.append('tokenId', String(certifyRequest.value.tokenId))
      formData.append('reason', certifyRequest.value.reason)
      formData.append('requester', userStore.profile?.walletAddress || '')
      formData.append('requestDate', new Date().toISOString())
      
      // 添加文件
      certifyRequest.value.files.forEach((file: any) => {
        formData.append('files', file.raw)
      })
      
      const token = userStore.profile?.token || ''
      const requests = certifyRequest.value.approvers.map(async approver => {
        const requestFormData = new FormData()
        for (const [key, value] of formData.entries()) {
          requestFormData.append(key, value)
        }
        requestFormData.append('certifierAddress', approver)
        
        return axios.post('/api/certification/request', requestFormData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
      })
      
      const responses = await Promise.all(requests)
      const allSuccess = responses.every(response => response.data.success)
      
      if (allSuccess) {
        ElMessage.success('所有认证请求已提交')
        // 重置表单
        certifyRequest.value = {
          tokenId: 0,
          reason: '',
          approvers: [],
          files: []
        }
      }
      
      // 关闭对话框
      certificationRequestDialogVisible.value = false
      
      // 刷新认证状态
      if (selectedAssetForCert.value) {
        await fetchCertificationStatus(Number(selectedAssetForCert.value.tokenId))
      }
    }
  } catch (error: any) {
    console.error('提交认证请求失败:', error)
    ElMessage.error('提交认证请求失败: ' + (error.message || '未知错误'))
  } finally {
    isCertifying.value = false
  }
}

const formatAddress = (address: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const fetchAvailableCertifiers = async () => {
  loadingCertifiers.value = true
  try {
    try {
      const token = userStore.profile?.token || ''
      const response = await axios.get('/api/certification/certifiers', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        availableCertifiers.value = response.data.data
        loadingCertifiers.value = false
        return
      }
    } catch (apiError) {
      console.warn('从后端获取认证者失败,尝试从区块链获取:', apiError)
    }

    // 如果后端API不可用,从区块链获取
    const service = await getRBACService()
    const memberCount = await service.getRoleMemberCount('CERTIFIER_ROLE')
    
    const certifiers = []
    for (let i = 0; i < Number(memberCount); i++) {
      const certifierAddress = await service.getRoleMember('CERTIFIER_ROLE', i)
      if (certifierAddress !== userStore.profile?.walletAddress) {
        certifiers.push({
          address: certifierAddress,
          name: `认证者 ${i+1}`
        })
      }
    }
    
    availableCertifiers.value = certifiers
  } catch (error) {
    console.error('获取认证者列表失败:', error)
    ElMessage.error('获取认证者列表失败')
  } finally {
    loadingCertifiers.value = false
  }
}

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


onMounted(async () => {
  await fetchAssets()
  await fetchAvailableCertifiers()
})
</script>

<style scoped>
/* 基础布局 */
.asset-list {
  position: relative;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.98);
}

@keyframes glitch {
  0% { clip-path: inset(0 0 97% 0); }
  5% { clip-path: inset(0 0 80% 0); }
  10% { clip-path: inset(0 0 50% 0); }
  15% { clip-path: inset(0 0 35% 0); }
  20%, 100% { clip-path: inset(0 0 0 0); }
}

/* 搜索筛选容器 */
.search-filter-container {
  position: relative;
  margin: 2rem 0;
  transition: all 0.3s ease;
}

/* 搜索框样式 */
.search-box {
  position: relative;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-radius: 8px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-box:hover {
  transform: translateY(-2px);
}

/* 高级筛选面板 */
.filter-panel {
  border: 1px solid #eee;
  border-radius: 8px;
  margin: 1rem 0;
  background: rgba(255,255,255,0.95);
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}

/* 已选筛选标签 */
.selected-filters {
  margin: 1rem 0;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.el-tag {
  border-radius: 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #444;
  transition: all 0.2s ease;
}

.el-tag:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 资产表格增强 */
.el-table {
  --el-table-border-color: #eee;
  --el-table-header-bg-color: #fafafa;
  --el-table-row-hover-bg-color: #f8f8f8;
  border-radius: 8px;
  overflow: hidden;
}

.el-table::before {
  display: none;
}

.el-table__body tr:hover td {
  background: #f8f8f8 !important;
}

/* 分页组件 */
.pagination-container {
  margin: 2rem 0;
  display: flex;
  justify-content: center;
}

.el-pagination.is-background .btn-next,
.el-pagination.is-background .btn-prev,
.el-pagination.is-background .el-pager li {
  border-radius: 8px;
  margin: 0 3px;
  background: #f5f5f5;
}

/* 对话框增强 */
.el-dialog {
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff, #f8f8f8);
}

.el-dialog__header {
  border-bottom: 1px solid #eee;
}

/* 加载状态 */
.loading-state {
  padding: 2rem;
  background: rgba(255,255,255,0.9);
  border-radius: 8px;
}

/* 认证状态徽章 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  
  &.PENDING { background: #f0f0f0; color: #666; }
  &.APPROVED { background: #e8f5e9; color: #2e7d32; }
  &.REJECTED { background: #ffebee; color: #c62828; }
}

/* 打印优化 */
@media print {
  .glitch-text {
    text-shadow: none !important;
    animation: none !important;
  }
  
  .el-dialog,
  .full-image-dialog {
    position: static !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  
  .el-table {
    border: 2px solid #000 !important;
    
    th, td {
      border: 1px solid #000 !important;
      background: transparent !important;
    }
  }
  
  .el-tag,
  .status-badge {
    background: transparent !important;
    border: 1px solid #000 !important;
    color: #000 !important;
  }
  
  .el-button,
  .el-pagination,
  .el-skeleton {
    display: none !important;
  }
}

/* 微交互动画 */
.filter-group {
  transition: all 0.3s ease;
  padding: 1rem;
  border-radius: 8px;
}

.filter-group:hover {
  background: rgba(245,245,245,0.5);
}

/* 文件类型标签动画 */
@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.el-tag {
  animation: scaleIn 0.3s ease;
}

/* 骨架屏动画增强 */
.el-skeleton {
  --el-skeleton-color: rgba(0,0,0,0.08);
  --el-skeleton-to-color: rgba(0,0,0,0.04);
}

/* 紧凑型筛选面板 */
.filter-panel {
  border: 1px solid #eee;
  border-radius: 6px;
  margin: 0.5rem 0;
  background: rgba(255,255,255,0.95);
}

.filter-options {
  padding: 0.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.filter-group {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.filter-group:last-child {
  border-bottom: none;
}

.filter-group h4 {
  margin: 0 0 0.5rem 0;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

/* 紧凑型表单组件 */
.el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.el-checkbox {
  margin-right: 0;
  height: 24px;
}

.el-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.el-radio {
  margin-right: 0;
}

.custom-size-range,
.custom-date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.el-input-number--small {
  width: 80px;
}

/* 紧凑型筛选按钮 */
.filter-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.el-button {
  padding: 8px 12px;
  height: auto;
}

/* 紧凑型标签区域 */
.selected-filters {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0.5rem 0;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 12px;
  color: #666;
  margin-right: 0.3rem;
}

.el-tag {
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  line-height: 22px;
}

/* 紧凑结果统计 */
.filter-results-count {
  font-size: 12px;
  color: #666;
  margin-left: auto;
  padding-left: 0.5rem;
}

/* 认证请求对话框样式 */
.cert-asset-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  border: 1px solid #eee;
}

.cert-asset-info p {
  margin: 8px 0;
  color: #606266;
}

.cert-asset-info strong {
  color: #303133;
  margin-right: 8px;
}

.certification-status {
  margin: 24px 0;
}

.certification-status h3 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 16px;
  font-weight: 600;
}

.status-list {
  background: #fff;
  border-radius: 8px;
  padding: 8px;
}

.status-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.status-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.status-item:last-child {
  margin-bottom: 0;
}

.certifier-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.certifier-name {
  font-weight: 500;
  color: #303133;
}

.certifier-address {
  color: #909399;
  font-size: 0.9em;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  margin: 8px 0;
}

.status-badge.pending {
  background: #e6f7ff;
  color: #1890ff;
}

.status-badge.approved {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.rejected {
  background: #fff1f0;
  color: #f5222d;
}

.status-badge.completed {
  background: #f5f5f5;
  color: #595959;
}

.status-time {
  font-size: 12px;
  color: #909399;
  margin: 4px 0;
}

.status-reason {
  font-size: 13px;
  color: #606266;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
}

.no-status {
  text-align: center;
  padding: 24px;
  color: #909399;
}

.no-status p {
  margin: 8px 0;
}

.cert-form {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.cert-form h3 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 16px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-weight: 500;
}

.el-textarea {
  margin-top: 8px;
}

.el-select {
  width: 100%;
}

.dialog-footer {
  text-align: right;
  margin-top: 16px;
}

/* 对话框动画效果 */
.el-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.el-dialog__header {
  background: #f8f9fa;
  margin: 0;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.el-dialog__title {
  font-weight: 600;
  color: #303133;
}

.el-dialog__body {
  padding: 24px;
}

.el-dialog__footer {
  border-top: 1px solid #ebeef5;
  padding: 16px 24px;
}

/* 按钮样式优化 */
.el-button {
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.el-button--primary {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
}

.el-button--primary:hover {
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
}

/* 加载动画优化 */
.el-loading-spinner .circular {
  animation: loading-rotate 2s linear infinite;
}

@keyframes loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式优化 */
@media screen and (max-width: 768px) {
  .cert-asset-info,
  .status-item,
  .cert-form {
    padding: 12px;
  }
  
  .el-dialog {
    width: 90% !important;
    margin: 5vh auto !important;
  }
  
  .certifier-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .certifier-address {
    margin-top: 4px;
  }
}
</style>