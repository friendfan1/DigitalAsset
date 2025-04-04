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
    <el-dialog
      v-model="assetDetailsDialogVisible"
      title="资产详情"
      width="800px"
      @close="closeAssetDetails"
    >
      <asset-detail-dialog
        v-if="assetDetails"
        :asset="assetDetails"
        :preview-url="assetPreviewUrl"
      />
    </el-dialog>

    <!-- 认证对话框 -->
    <el-dialog
      v-model="certificationDialogVisible"
      title="资产认证"
      width="600px"
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
          </el-descriptions>
        </div>

        <!-- 认证状态 -->
        <div class="certification-status">
          <h3>认证状态</h3>
          <el-timeline>
            <el-timeline-item
              v-for="status in certificationStatus"
              :key="status.certifierAddress"
              :type="status.status === 'APPROVED' ? 'success' : 'warning'"
              :timestamp="status.timestamp ? formatDate(status.timestamp) : ''"
            >
              <div class="status-item" :class="{ 'current-user': status.isCurrentUser }">
                <div class="certifier">
                  认证人：{{ formatAddress(status.certifierAddress) }}
                  <el-tag v-if="status.isCurrentUser" size="small" type="info">当前认证者</el-tag>
                </div>
                <div class="status">
                  状态：{{ status.status === 'APPROVED' ? '已认证' : '待认证' }}
                </div>
                <div v-if="status.reason" class="reason">
                  认证意见：{{ status.reason }}
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
import { ElMessage } from 'element-plus'
import { View, Check, Search } from '@element-plus/icons-vue'
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService'
import { useUserStore } from '@/stores/user'
import { useWalletStore } from '@/stores/wallet'
import AssetDetailDialog from '@/components/AssetDetailDialog.vue'
import { debounce } from 'lodash'
import type { Asset, CertificationStatus } from '@/types/asset'

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

// 计算属性
const filteredAssets = computed(() => {
  let filtered = assetList.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(asset => 
      asset.tokenId.toString().includes(query) ||
      asset.metadata.fileName.toLowerCase().includes(query)
    )
  }

  // 只显示当前用户作为认证人的资产
  filtered = filtered.filter(asset => {
    const pendingCertifiers = asset.pendingCertifiers || []
    return pendingCertifiers.includes(userStore.profile?.walletAddress || '')
  })

  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(asset => 
      filterStatus.value === 'certified' ? asset.isCertified : !asset.isCertified
    )
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

// 方法
const fetchAssets = async () => {
  try {
    isLoading.value = true
    const service = await getDigitalAssetService()
    
    // 获取所有资产
    const result = await service.getUserAssetsWithPagination(
      walletStore.address,
      currentPage.value,
      pageSize.value
    )
    
    // 获取每个资产的认证状态
    const assetsWithCertificationStatus = await Promise.all(
      result.assets.map(async (asset) => {
        const certificationDetails = await service.getAssetCertificationDetails(Number(asset.tokenId))
        return {
          ...asset,
          pendingCertifiers: certificationDetails.asset.certificationStatus.map(status => status.certifierAddress)
        }
      })
    )
    
    assetList.value = assetsWithCertificationStatus
    totalAssets.value = result.totalCount
  } catch (error) {
    console.error('获取资产列表失败:', error)
    ElMessage.error('获取资产列表失败')
  } finally {
    isLoading.value = false
  }
}

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

const showAssetDetails = async (asset: any) => {
  try {
    assetDetails.value = asset
    assetDetailsDialogVisible.value = true
    
    // 生成预览URL
    const service = await getDigitalAssetService()
    const { file } = await service.getAssetContent(asset.cid)
    assetPreviewUrl.value = URL.createObjectURL(file)
  } catch (error) {
    console.error('获取资产详情失败:', error)
    ElMessage.error('获取资产详情失败')
  }
}

const closeAssetDetails = () => {
  assetDetailsDialogVisible.value = false
  assetDetails.value = null
  if (assetPreviewUrl.value) {
    URL.revokeObjectURL(assetPreviewUrl.value)
    assetPreviewUrl.value = ''
  }
}

const showCertificationDialog = async (asset: any) => {
  try {
    // 检查当前用户是否是认证人
    const service = await getDigitalAssetService()
    const certificationDetails = await service.getAssetCertificationDetails(Number(asset.tokenId))
    const isCurrentUserCertifier = certificationDetails.asset.certificationStatus.some(
      status => status.certifierAddress.toLowerCase() === walletStore.address.toLowerCase()
    )

    if (!isCurrentUserCertifier) {
      ElMessage.warning('您不是该资产的认证人')
      return
    }

    selectedAssetForCert.value = asset
    certificationDialogVisible.value = true
    certificationForm.value.comment = ''
    
    // 获取认证状态
    await fetchCertificationStatus(Number(asset.tokenId))
  } catch (error) {
    console.error('打开认证对话框失败:', error)
    ElMessage.error('打开认证对话框失败')
  }
}

const fetchCertificationStatus = async (tokenId: number) => {
  if (!tokenId) return
  
  isLoadingStatus.value = true
  try {
    const service = await getDigitalAssetService()
    const result = await service.getAssetCertificationDetails(tokenId)
    
    // 显示所有认证者的状态
    certificationStatus.value = result.asset.certificationStatus.map(status => ({
      ...status,
      status: status.status as 'PENDING' | 'APPROVED',
      // 标记当前用户
      isCurrentUser: status.certifierAddress.toLowerCase() === userStore.profile?.walletAddress?.toLowerCase()
    }))
  } catch (error) {
    console.error('获取认证状态失败:', error)
    ElMessage.error('获取认证状态失败')
  } finally {
    isLoadingStatus.value = false
  }
}

const certifyAsset = async () => {
  if (!selectedAssetForCert.value || !isCertificationFormValid.value) return
  
  try {
    isCertifying.value = true
    const service = await getDigitalAssetService()
    await service.certifyAsset(
      Number(selectedAssetForCert.value.tokenId),
      certificationForm.value.comment
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
          batchCertificationForm.value.comment
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
  .certification-status,
  .certification-form,
  .batch-certification-form {
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
}
</style> 