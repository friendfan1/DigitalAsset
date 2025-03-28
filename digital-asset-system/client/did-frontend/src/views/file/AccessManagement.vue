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
        <h2 class="section-title glitch-text" data-text="我的数字资产">我的数字资产</h2>
      </div>
      
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
        <div class="filter-results-count" v-if="!isLoading">
          找到 {{ filteredAssets.length }} 个资产
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>
      
      <!-- 资产列表 -->
      <template v-else>
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
          v-loading="isLoading"
          :data="filteredAssets"
          stripe
          style="width: 100%"
          @selection-change="handleSelectionChange"
          @sort-change="handleSort"
          v-if="filteredAssets.length > 0"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="资产ID" prop="tokenId" width="80" sortable/>
          <el-table-column label="文件名" prop="metadata.fileName" min-width="200" show-overflow-tooltip sortable/>
          <el-table-column label="类型" prop="metadata.fileType" width="120" show-overflow-tooltip/>
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
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
                <el-button size="small" @click="viewAssetDetails(row)">查看</el-button>
                <el-button 
                  size="small" 
                  type="primary" 
                  v-if="!row.isCertified"
                @click="initiateCertification(row)"
              >
                认证
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteAsset(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 无数据状态 -->
        <div v-else class="empty-state">
          <div v-if="hasActiveFilters">
            <el-empty description="没有符合筛选条件的资产" />
            <el-button type="info" @click="resetFilters">清除筛选条件</el-button>
        </div>
          <div v-else>
            <el-empty description="暂无资产" />
            <el-button type="primary" @click="activeTab = 'register'">注册新资产</el-button>
    </div>
      </div>

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
      </template>
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

    <!-- 全局状态提示 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
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

    <!-- 资产详情模态框 -->
    <asset-detail-dialog
      v-if="assetDetails"
      v-model:visible="detailsDialogVisible"
      :asset-details="assetDetails"
      :asset-preview-url="assetPreviewUrl"
      @close="closeAssetDetails"
    >
      <!-- 添加操作按钮插槽 -->
      <template #footer>
        <div class="asset-actions">
          <el-button
            type="primary"
            @click="downloadAsset(assetDetails)"
          >
            下载文件
          </el-button>
          <el-button
            v-if="!assetDetails.isCertified"
            type="success"
            @click="initiateCertificationFromDetails()"
          >
            申请认证
          </el-button>
          <el-button
            type="danger"
            @click="deleteFromDetails()"
          >
            删除资产
          </el-button>
        </div>
      </template>
    </asset-detail-dialog>

    <!-- 资产认证请求对话框 -->
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
        
        <!-- 只有未认证的资产才显示认证申请表单 -->
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
            type="success" 
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
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElDialog } from 'element-plus'
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService'
import type { CertificationRequest } from '@/utils/web3/DigitalAssetService'
import { ethers } from 'ethers'
import { RBACService, getRBACService } from '@/utils/web3/RBACService'
import { RBAC__factory } from '@/contracts/types'
import { CONTRACT_ADDRESSES } from '@/config/contracts'
import { create } from 'ipfs-http-client'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import FileUpload from '@/components/upload/FileUpload.vue'
// 导入Element Plus图标组件
import { Document, Loading, PictureFilled } from '@element-plus/icons-vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
// 在<script setup>部分中导入组件
import AssetDetailDialog from '@/components/AssetDetailDialog.vue';

const userStore = useUserStore()
const ipfs = create({
  url: import.meta.env.VITE_IPFS_API_URL  //  自动注入环境变量
})

// 标签页配置
const tabs = [
  { id: 'assets', label: '资产列表' },
  { id: 'register', label: '资产登记' }
]
const activeTab = ref('assets')

// 资产认证相关状态
const certifyRequest = ref<CertificationRequest>({
  tokenId: 0,
  reason: '',
  approvers: []
});
const isCertifying = ref(false)

// 错误处理
const errorMessage = ref('')

// 表单验证
const isCertifyFormValid = computed(() => {
  return (
    certifyRequest.value.tokenId > 0 &&
    certifyRequest.value.reason.trim() !== '' &&
    certifyRequest.value.approvers.length >= 2
  );
});

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

// 格式化钱包地址显示
const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 在组件加载时获取认证者列表
onMounted(() => {
  fetchAvailableCertifiers();
});

// 当标签页切换时执行相应操作
watch(activeTab, (newTab) => {
  if (newTab === 'register') {
    // 注册相关操作
  }
});

// 处理认证请求提交
const handleCertification = async () => {
  if (!isCertifyFormValid.value) {
    ElMessage.warning('请完成所有必填项并选择至少两位认证者');
    return;
  }
  
  isCertifying.value = true;
  try {
    // 获取基本请求信息
    const baseRequest = {
      tokenId: Number(certifyRequest.value.tokenId),
      reason: certifyRequest.value.reason,
      requester: userStore.profile?.walletAddress,
      requestDate: new Date().toISOString(),
    };
    
    console.log("请求者地址：" + userStore.profile?.walletAddress);
    
    // 为每个approver创建单独的请求
    const token = userStore.profile?.token || '';
    const requests = certifyRequest.value.approvers.map(approver => ({
      ...baseRequest,
      certifierAddress: approver // 每个请求只包含一个认证者
    }));
    
    // 并行发送所有请求
    const responses = await Promise.all(
      requests.map(request => 
        axios.post('/api/certification/request', request, {
          headers: { Authorization: `Bearer ${token}` }
        })
      )
    );
    
    // 检查所有请求是否成功
    const allSuccess = responses.every(response => response.data.success);
    
    if (allSuccess) {
      ElMessage.success('所有认证请求已提交');
      // 重置表单
      certifyRequest.value = {
        tokenId: 0,
        reason: '',
        approvers: []
      };
      
      // 关闭对话框
      certificationRequestDialogVisible.value = false;
      
      // 刷新认证状态
      if (selectedAssetForCert.value) {
        await fetchCertificationStatus(parseInt(selectedAssetForCert.value.tokenId.toString()));
      }
    } else {
      throw new Error('部分请求提交失败');
    }
  } catch (error: any) {
    console.error('提交认证请求失败:', error);
    ElMessage.error('提交认证请求失败: ' + (error.message || '未知错误'));
  } finally {
    isCertifying.value = false;
  }
};

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

onMounted(async () => {
  await fetchUserAssets()
  await checkRole()
  fetchAvailableCertifiers();
})

const fetchUserAssets = async (page = 1, forceRefresh = false) => {
  try {
    isLoading.value = true;
    const service = await getDigitalAssetService();
    const result = await service.getUserAssets(page, assetsPagination.value.pageSize, forceRefresh);
    
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

// 资产列表相关函数
const changePage = async (page: number) => {
  await fetchUserAssets(page, false) // 翻页时不需要强制刷新
}

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

// 查看资产详情
const viewAssetDetails = async (asset: Asset) => {
  assetDetails.value = asset;
  detailsDialogVisible.value = true;
  
  // 重置状态
  iframeLoadFailed.value = false;
  
  // 尝试获取预览URL
  await generatePreviewUrl(asset);
};

// 显示全屏图片
const showFullImage = () => {
  fullImageVisible.value = true;
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
  certifyRequest.value.tokenId = parseInt(asset.tokenId);
  certifyRequest.value.reason = '';
  certifyRequest.value.approvers = [];
  
  // 设置当前选中的资产并显示对话框
  selectedAssetForCert.value = asset;
  certificationRequestDialogVisible.value = true;
  
  // 获取认证状态
  fetchCertificationStatus(parseInt(asset.tokenId));
}

// 修改 checkRole 函数
const checkRole = async () => {
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
    await fetchUserAssets()
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
    await fetchUserAssets()
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
  certifyRequest.value.tokenId = parseInt(assetDetails.value.tokenId);
  certifyRequest.value.reason = '';
  certifyRequest.value.approvers = [];
  
  // 设置当前选中的资产并关闭详情页，打开认证对话框
  selectedAssetForCert.value = assetDetails.value;
  detailsDialogVisible.value = false;
  certificationRequestDialogVisible.value = true;
  
  // 获取认证状态
  fetchCertificationStatus(parseInt(assetDetails.value.tokenId));
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
  if (!tokenId) return;
  
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
</script>

<style lang="scss" scoped>
.access-management {
  max-width: 100%; /* 修改为100%以消除两侧白边 */
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  position: relative;
  color: #e6f1ff;
  background: #0a192f;
  border-radius: 0; /* 移除圆角 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  margin-top: 0; /* 移除顶部边距 */
  margin-bottom: 0; /* 移除底部边距 */
  overflow-x: hidden; /* 防止水平滚动 */
  min-height: calc(100vh - 70px); /* 确保最小高度填满视口 */
}

/* 二进制背景 */
.binary-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  opacity: 0.08;
  pointer-events: none;
}

.binary-bit {
  position: absolute;
  font-family: monospace;
  font-size: 1.2rem;
  color: #64ffda;
  animation: fadeInOut 8s infinite;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.tab-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(100, 255, 218, 0.2);
  padding-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.tab-btn {
  position: relative;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  color: #8892b0;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1rem;
    left: 0;
    width: 100%;
    height: 2px;
    background: #64ffda;
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }
  
  &:hover {
    color: #64ffda;
  }
  
  &:hover::after,
  &.active::after {
    transform: scaleX(1);
  }
  
  &.active {
    font-weight: 600;
    color: #64ffda;
  }
}

.section-header {
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

.section-title {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: #ccd6f6;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #64ffda, transparent);
  }
}

.glitch-text {
  position: relative;
  text-shadow: 0.03em 0 0 rgba(255, 0, 0, 0.4),
              -0.015em -0.05em 0 rgba(0, 255, 0, 0.4),
              0.025em 0.05em 0 rgba(0, 0, 255, 0.4);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  position: relative;
  z-index: 1;
}

.loading-text {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #8892b0;
}

.upload-area {
  border: 2px dashed #64ffda;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  background: rgba(100, 255, 218, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(100, 255, 218, 0.1);
    box-shadow: 0 0 20px rgba(100, 255, 218, 0.2);
  }
}

.file-input {
  display: none;
}

.upload-label {
  cursor: pointer;
  color: #64ffda;
}

.file-info {
  margin-top: 1rem;
}

.options-section {
  margin-bottom: 2rem;
}

.metadata-fields {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.submit-button {
  background: transparent;
  color: #64ffda;
  padding: 1rem 2rem;
  border: 1px solid #64ffda;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: rgba(100, 255, 218, 0.1);
    transition: all 0.5s ease;
    z-index: -1;
  }
  
  &:hover {
    color: #0a192f;
    background-color: #64ffda;
  }
  
  &:hover::before {
    left: 0;
  }
}

.submit-button:disabled {
  background: rgba(100, 255, 218, 0.1);
  color: rgba(100, 255, 218, 0.5);
  border-color: rgba(100, 255, 218, 0.5);
  cursor: not-allowed;
  
  &:hover {
    color: rgba(100, 255, 218, 0.5);
    background: rgba(100, 255, 218, 0.1);
  }
  
  &::before {
    display: none;
  }
}

.error-message {
  color: #ff5252;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 8px;
  background: rgba(255, 82, 82, 0.1);
  border: 1px solid rgba(255, 82, 82, 0.2);
  position: relative;
  z-index: 1;
}

.certify-form {
  display: grid;
  gap: 1.5rem;
  background: rgba(10, 25, 47, 0.5);
  padding: 2rem;
  border-radius: 10px;
  border: 1px solid rgba(100, 255, 218, 0.2);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(100, 255, 218, 0.05), transparent);
    z-index: -1;
    border-radius: 10px;
  }
}

.approver-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  
  input {
    background: rgba(10, 25, 47, 0.8);
    border: 1px solid rgba(100, 255, 218, 0.3);
    color: #e6f1ff;
    padding: 0.5rem;
    border-radius: 4px;
    flex: 1;
    
    &:focus {
      border-color: #64ffda;
      outline: none;
      box-shadow: 0 0 5px rgba(100, 255, 218, 0.5);
    }
  }
  
  button {
    background: transparent;
    color: #ff5252;
    border: 1px solid #ff5252;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: rgba(255, 82, 82, 0.1);
    }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    color: #8892b0;
    font-size: 0.9rem;
  }
  
  input, textarea {
    background: rgba(10, 25, 47, 0.8);
    border: 1px solid rgba(100, 255, 218, 0.3);
    color: #e6f1ff;
    padding: 0.8rem;
    border-radius: 4px;
    
    &:focus {
      border-color: #64ffda;
    }
  }
  
  textarea {
    min-height: 100px;
    resize: vertical;
  }
}

/* 资产列表样式 */
.assets-section {
  margin-top: 1rem;
  position: relative;
  z-index: 1;
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

.loading-state {
  padding: 20px;
  background: rgba(10, 25, 47, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(100, 255, 218, 0.1);
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

.asset-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.filter-panel {
  width: 100%;
  margin-top: 1rem;
  border-radius: 8px;
  overflow: hidden;
  
  :deep(.el-collapse-item__header) {
    background-color: rgba(10, 25, 47, 0.8);
    color: #64ffda;
    border-bottom: 1px solid rgba(100, 255, 218, 0.2);
  }
  
  :deep(.el-collapse-item__content) {
    background-color: rgba(10, 25, 47, 0.5);
    color: #e6f1ff;
  }
}

.filter-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  padding-top: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
  h4 {
    margin: 0;
    font-size: 14px;
    color: #64ffda;
    font-weight: 600;
  }
}

.selected-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: rgba(10, 25, 47, 0.5);
  border-radius: 4px;
  align-items: center;
  border: 1px solid rgba(100, 255, 218, 0.2);
}

.filter-label {
  font-weight: 600;
  color: #64ffda;
  margin-right: 0.5rem;
}

.filter-results-count {
  margin-top: 1rem;
  text-align: right;
  font-size: 14px;
  color: #8892b0;
}

.asset-controls {
  margin-bottom: 1rem;
}

/* 表格样式修复 */
:deep(.el-table) {
  background-color: transparent !important; /* 强制透明背景 */
  color: #e6f1ff !important; /* 强制文字颜色 */
  
  th {
    background-color: rgba(10, 25, 47, 0.8) !important;
    color: #64ffda !important;
    font-weight: 600;
    border-bottom: 1px solid rgba(100, 255, 218, 0.2);
  }
  
  td {
    background-color: rgba(10, 25, 47, 0.5) !important;
    border-bottom: 1px solid rgba(100, 255, 218, 0.1);
  }
  
  tr:hover > td {
    background-color: rgba(100, 255, 218, 0.1) !important;
    color: #ffffff !important; /* 更亮的文字颜色 */
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5); /* 添加文字阴影 */
    font-weight: 600; /* 加粗文字 */
  }
  
  /* 确保表头和单元格文字清晰可见 */
  .cell {
    color: #e6f1ff !important; 
  }
  
  /* 悬停时确保所有内容都保持可见 */
  tr:hover .cell {
    color: #ffffff !important;
  }
  
  /* 表格内部组件样式调整 */
  .el-button {
    color: #64ffda;
  }
  
  /* 确保表格加载遮罩有正确的颜色 */
  .el-loading-mask {
    background-color: rgba(10, 25, 47, 0.7) !important;
  }
  
  /* 修复表格内复选框样式 */
  .el-checkbox__inner {
    background-color: rgba(10, 25, 47, 0.5) !important;
    border-color: rgba(100, 255, 218, 0.3) !important;
  }
  
  .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: #64ffda !important;
    border-color: #64ffda !important;
  }
}

/* 增强资产详情内容区域样式 */
.asset-details-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background-color: rgba(10, 25, 47, 0.7);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid rgba(100, 255, 218, 0.2);
  
  @media (min-width: 992px) {
    flex-direction: row;
  }
}

.asset-info {
  flex: 1;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(100, 255, 218, 0.2);
  padding-bottom: 20px;
  background-color: rgba(10, 25, 47, 0.5);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

  .asset-main {
    display: flex;
    align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
  background-color: rgba(10, 25, 47, 0.7);
  padding: 15px;
  border-radius: 8px 8px 0 0;
  border-bottom: 2px solid rgba(100, 255, 218, 0.2);
}
    
    .asset-name {
  font-size: 24px;
  font-weight: bold;
  margin-right: 10px;
  color: #e6f1ff;
  position: relative;
  text-shadow: 0 0 5px rgba(230, 241, 255, 0.3);
  
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, #64ffda, transparent);
    transform: scaleX(0.3);
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  
  &:hover::after {
    transform: scaleX(1);
    }
  }
  
  .asset-description {
  color: #8892b0;
  margin: 20px 0;
  line-height: 1.6;
  font-size: 14px;
  position: relative;
  padding: 15px;
  background-color: rgba(10, 25, 47, 0.5);
  border-radius: 6px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(to bottom, #64ffda, transparent);
  }
}

:deep(.el-descriptions) {
  background-color: rgba(10, 25, 47, 0.9) !important; /* 加深背景色 */
  border-radius: 8px;
  border: 1px solid rgba(100, 255, 218, 0.3) !important; /* 增强边框可见度 */
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); /* 添加阴影增强层次感 */
  margin-top: 20px; /* 增加顶部间距 */
  
  .el-descriptions__header {
    padding: 12px 20px;
    border-bottom: 1px solid rgba(100, 255, 218, 0.3) !important;
    background-color: rgba(10, 25, 47, 0.95) !important; /* 表头背景更深 */
  }
  
  .el-descriptions__label {
    color: #64ffda !important; /* 更亮的标签颜色 */
    font-weight: 600 !important;
    text-shadow: 0 0 3px rgba(100, 255, 218, 0.3); /* 添加文字阴影增强可读性 */
    background-color: rgba(10, 25, 47, 0.95) !important; /* 标签背景加深 */
    padding: 12px 15px !important;
    font-size: 14px !important;
  }
  
  .el-descriptions__content {
    color: #e6f1ff !important; /* 更亮的内容文字 */
    background-color: rgba(17, 34, 64, 0.9) !important; /* 内容背景加深且与标签区分 */
    font-weight: 500 !important;
    padding: 12px 15px !important;
    font-size: 14px !important;
  }
  
  .el-descriptions-item__cell {
    padding: 12px 15px !important;
    border: 1px solid rgba(100, 255, 218, 0.2) !important; /* 确保边框可见 */
  }
  
  .el-descriptions-item__label {
    background-color: rgba(10, 25, 47, 0.95) !important; /* 标签背景 */
  }
  
  .el-descriptions-item__content {
    background-color: rgba(17, 34, 64, 0.9) !important; /* 内容背景 */
  }
}

.preview-section {
  flex: 1;
    display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  background-color: rgba(10, 25, 47, 0.5);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  @media (min-width: 992px) {
    max-width: 50%;
  }
}

.loading-preview, .no-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 250px;
  border: 1px dashed rgba(100, 255, 218, 0.3);
  border-radius: 8px;
  color: #8892b0;
  margin-bottom: 20px;
  background-color: rgba(10, 25, 47, 0.7);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
  
  .el-icon {
    font-size: 40px;
    margin-bottom: 15px;
    color: #64ffda;
  }
}

/* 响应式样式 */
@media (max-width: 768px) {
  .filter-options {
    grid-template-columns: 1fr;
  }
  
  .selected-filters {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .selected-filters .el-tag {
    margin-bottom: 0.5rem;
  }
  
  .section-title {
    font-size: 1.8rem;
  }
}

:deep(.el-button) {
  &.el-button--primary {
    background-color: transparent;
    border-color: #64ffda;
    color: #64ffda;
    
    &:hover {
      background-color: rgba(100, 255, 218, 0.1);
      border-color: #64ffda;
      color: #64ffda;
    }
    
    &:focus {
      background-color: rgba(100, 255, 218, 0.1);
      border-color: #64ffda;
      color: #64ffda;
    }
  }
  
  &.el-button--danger {
    background-color: transparent;
    border-color: #ff5252;
    color: #ff5252;
    
    &:hover {
      background-color: rgba(255, 82, 82, 0.1);
      border-color: #ff5252;
      color: #ff5252;
    }
  }
  
  &.el-button--info {
    background-color: transparent;
    border-color: #909399;
    color: #909399;
    
    &:hover {
      background-color: rgba(144, 147, 153, 0.1);
      border-color: #909399;
      color: #909399;
    }
  }
}

:deep(.el-dialog) {
  background-color: #0a192f !important;
  border-radius: 12px;
  border: 1px solid rgba(100, 255, 218, 0.3);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
  
  .el-dialog__header {
    border-bottom: 1px solid rgba(100, 255, 218, 0.3);
    background-color: rgba(10, 25, 47, 0.95) !important;
    border-radius: 12px 12px 0 0;
    
    .el-dialog__title {
      color: #64ffda !important;
      font-weight: 600;
      font-size: 1.2rem;
    }
    
    .el-dialog__headerbtn .el-dialog__close {
      color: #e6f1ff !important;
      
      &:hover {
        color: #64ffda !important;
      }
    }
  }
  
  .el-dialog__body {
    color: #e6f1ff !important;
    background-color: #0a192f !important;
    padding: 20px;
  }
  
  .el-dialog__footer {
    border-top: 1px solid rgba(100, 255, 218, 0.3);
    background-color: rgba(10, 25, 47, 0.95) !important;
    border-radius: 0 0 12px 12px;
    padding: 15px 20px;
  }
}

.delete-confirmation {
  p {
    color: #e6f1ff;
  }
  
  .asset-to-delete {
    background-color: rgba(10, 25, 47, 0.5);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    border: 1px solid rgba(255, 82, 82, 0.2);
  }
}

:deep(.el-checkbox) {
  .el-checkbox__input.is-checked .el-checkbox__inner {
    background-color: #64ffda;
    border-color: #64ffda;
  }
  
  .el-checkbox__label {
    color: #e6f1ff;
  }
}

:deep(.el-radio) {
  .el-radio__input.is-checked .el-radio__inner {
    background-color: #64ffda;
    border-color: #64ffda;
  }
  
  .el-radio__label {
    color: #e6f1ff;
  }
}

:deep(.el-input) {
  .el-input__wrapper {
    background-color: rgba(10, 25, 47, 0.8) !important;
    box-shadow: 0 0 0 1px rgba(100, 255, 218, 0.3) !important;
  }
  
  .el-input__inner {
    background-color: transparent !important;
    color: #e6f1ff !important;
  }
  
  &.is-focus .el-input__wrapper {
    box-shadow: 0 0 0 1px #64ffda !important;
  }
}

:deep(.el-tag) {
  &.el-tag--success {
    background-color: rgba(103, 194, 58, 0.1);
    border-color: rgba(103, 194, 58, 0.2);
    color: #67c23a;
  }
  
  &.el-tag--warning {
    background-color: rgba(230, 162, 60, 0.1);
    border-color: rgba(230, 162, 60, 0.2);
    color: #e6a23c;
  }
  
  &.el-tag--info {
    background-color: rgba(144, 147, 153, 0.1);
    border-color: rgba(144, 147, 153, 0.2);
    color: #909399;
  }
}

@keyframes glitch {
  0% {
    text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75),
                -0.025em -0.05em 0 rgba(0, 255, 0, 0.75),
                0.025em 0.05em 0 rgba(0, 0, 255, 0.75);
  }
  14% {
    text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75),
                -0.025em -0.05em 0 rgba(0, 255, 0, 0.75),
                0.025em 0.05em 0 rgba(0, 0, 255, 0.75);
  }
  15% {
    text-shadow: -0.05em -0.025em 0 rgba(255, 0, 0, 0.75),
                0.025em 0.025em 0 rgba(0, 255, 0, 0.75),
                -0.05em -0.05em 0 rgba(0, 0, 255, 0.75);
  }
  49% {
    text-shadow: -0.05em -0.025em 0 rgba(255, 0, 0, 0.75),
                0.025em 0.025em 0 rgba(0, 255, 0, 0.75),
                -0.05em -0.05em 0 rgba(0, 0, 255, 0.75);
  }
  50% {
    text-shadow: 0.025em 0.05em 0 rgba(255, 0, 0, 0.75),
                0.05em 0 0 rgba(0, 255, 0, 0.75),
                0 -0.05em 0 rgba(0, 0, 255, 0.75);
  }
  99% {
    text-shadow: 0.025em 0.05em 0 rgba(255, 0, 0, 0.75),
                0.05em 0 0 rgba(0, 255, 0, 0.75),
                0 -0.05em 0 rgba(0, 0, 255, 0.75);
  }
  100% {
    text-shadow: -0.025em 0 0 rgba(255, 0, 0, 0.75),
                -0.025em -0.025em 0 rgba(0, 255, 0, 0.75),
                -0.025em -0.05em 0 rgba(0, 0, 255, 0.75);
  }
}

/* Element Plus 组件全局样式增强 */
:deep(.el-pagination) {
  .el-pagination__total,
  .el-pagination__jump,
  .btn-prev,
  .btn-next,
  .el-pager li {
    background-color: rgba(10, 25, 47, 0.5) !important;
    color: #e6f1ff !important;
    border: 1px solid rgba(100, 255, 218, 0.2) !important;
  }
  
  .el-pager li.is-active {
    background-color: #64ffda !important;
    color: #0a192f !important;
  }
}

/* 修复按钮组件样式 */
:deep(.el-button-group) {
  .el-button {
    background-color: rgba(10, 25, 47, 0.5) !important;
    border-color: rgba(100, 255, 218, 0.2) !important;
    
    &:hover {
      background-color: rgba(100, 255, 218, 0.1) !important;
    }
  }
}

/* 修复输入框背景 */
:deep(.el-input) {
  .el-input__wrapper {
    background-color: rgba(10, 25, 47, 0.8) !important;
    box-shadow: 0 0 0 1px rgba(100, 255, 218, 0.3) !important;
  }
  
  .el-input__inner {
    background-color: transparent !important;
    color: #e6f1ff !important;
  }
  
  &.is-focus .el-input__wrapper {
    box-shadow: 0 0 0 1px #64ffda !important;
  }
}

/* 修复下拉选择器 */
:deep(.el-select) {
  .el-input__wrapper {
    background-color: rgba(10, 25, 47, 0.8) !important;
    box-shadow: 0 0 0 1px rgba(100, 255, 218, 0.3) !important;
  }
}

:deep(.el-select-dropdown) {
  background-color: #0a192f !important;
  border: 1px solid rgba(100, 255, 218, 0.2) !important;
  
  .el-select-dropdown__item {
    color: #e6f1ff !important;
    
    &.selected {
      color: #64ffda !important;
      background-color: rgba(100, 255, 218, 0.1) !important;
    }
    
    &:hover {
      background-color: rgba(100, 255, 218, 0.05) !important;
    }
  }
}

/* 日期选择器样式修复 */
:deep(.el-date-editor) {
  .el-input__wrapper {
    background-color: rgba(10, 25, 47, 0.8) !important;
    box-shadow: 0 0 0 1px rgba(100, 255, 218, 0.3) !important;
  }
}

:deep(.el-picker__popper) {
  background-color: #0a192f !important;
  border: 1px solid rgba(100, 255, 218, 0.2) !important;
  
  .el-date-table td, .el-date-picker__header {
    color: #e6f1ff !important;
  }
  
  .el-date-table td.today {
    color: #64ffda !important;
  }
  
  .el-date-table td.current:not(.disabled) {
    background-color: #64ffda !important;
    color: #0a192f !important;
  }
}

/* 表格单元格内容对齐 */
:deep(.el-table__body) td.el-table__cell {
  padding: 12px 0;
  
  .cell {
    line-height: 1.5;
  }
}

/* 自定义滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(10, 25, 47, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 255, 218, 0.3);
  border-radius: 4px;
  
  &:hover {
    background: rgba(100, 255, 218, 0.5);
  }
}

/* 优化资产详情中的CID样式 */
    .cid {
      font-family: monospace;
  background-color: rgba(10, 25, 47, 0.9) !important;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #64ffda !important; /* 更亮的CID文字颜色 */
  border: 1px solid rgba(100, 255, 218, 0.2);
  display: inline-block;
  word-break: break-all;
  font-weight: 600;
  letter-spacing: 0.5px;
  
  &:hover {
    background-color: rgba(100, 255, 218, 0.2) !important;
    border-color: #64ffda;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(100, 255, 218, 0.3);
  }
}

/* 提高表格中文字的整体对比度 */
:deep(.el-table) {
  --el-table-text-color: #e6f1ff;
  --el-table-header-text-color: #64ffda;
  
  .el-table__header-wrapper th {
    background-color: rgba(10, 25, 47, 0.9) !important;
    color: var(--el-table-header-text-color) !important;
    font-weight: 600;
  }
  
  .el-table__body-wrapper td {
    color: var(--el-table-text-color) !important;
  }
}

/* 悬停时确保所有内容都保持可见 */
tr:hover .cell {
  color: #ffffff !important;
}

/* 修复表格行悬停状态下的标签和按钮样式 */
tr:hover .el-tag {
  border-width: 2px !important;
  font-weight: 600 !important;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}

tr:hover .el-tag--success {
  background-color: rgba(103, 194, 58, 0.2) !important;
  border-color: #67c23a !important;
  color: #ffffff !important;
}

tr:hover .el-tag--warning {
  background-color: rgba(230, 162, 60, 0.2) !important;
  border-color: #e6a23c !important;
  color: #ffffff !important;
}

tr:hover .el-tag--info {
  background-color: rgba(144, 147, 153, 0.2) !important;
  border-color: #909399 !important;
  color: #ffffff !important;
}

tr:hover .el-button {
  border-width: 2px !important;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
}

tr:hover .el-button--default {
  background-color: rgba(255, 255, 255, 0.1) !important;
  border-color: #ffffff !important;
  color: #ffffff !important;
}

tr:hover .el-button--primary {
  background-color: rgba(100, 255, 218, 0.2) !important;
  border-color: #64ffda !important;
  color: #ffffff !important;
}

tr:hover .el-button--danger {
  background-color: rgba(255, 82, 82, 0.2) !important;
  border-color: #ff5252 !important;
  color: #ffffff !important;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 1px dashed rgba(100, 255, 218, 0.3);
  border-radius: 8px;
  color: #8892b0;
  background-color: rgba(10, 25, 47, 0.7);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
  
  .el-icon {
    font-size: 40px;
    margin-bottom: 15px;
    color: #64ffda;
  }
}

.image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 1px dashed rgba(100, 255, 218, 0.3);
  border-radius: 8px;
  color: #8892b0;
  background-color: rgba(10, 25, 47, 0.7);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
  
  .el-icon {
    font-size: 40px;
    margin-bottom: 15px;
    color: #64ffda;
  }
}

.custom-image-preview {
  width: 100%;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  background-color: rgba(10, 25, 47, 0.5);
  min-height: 300px;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  cursor: zoom-in;
  border-radius: 4px;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.02);
  }
}

.full-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-height: 80vh;
  overflow: auto;
  background-color: rgba(10, 25, 47, 0.9);
  border-radius: 4px;
}

.full-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.certifier-option {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
  width: 100%;
}

.certifier-name {
  font-size: 14px;
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 4px;
}

.certifier-address {
  font-size: 12px;
  color: #bbbec4;
  margin-top: 2px;
  font-weight: 500;
}

.certifier-org {
  font-size: 12px;
  color: #67c23a;
  margin-top: 2px;
}

/* 添加认证状态样式 */
.certification-status {
  margin: 20px 0;
  padding: 15px;
  background: rgba(10, 25, 47, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(100, 255, 218, 0.2);
}

.certification-status h3 {
  color: #64ffda;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: rgba(10, 25, 47, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(100, 255, 218, 0.2);
}

.certifier-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.certifier-name {
  color: #e6f1ff;
  font-weight: 500;
}

.certifier-address {
  color: #8892b0;
  font-size: 12px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  min-width: 64px;
  text-align: center;
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

.status-badge.completed {
  background: rgba(100, 255, 218, 0.1);
  color: #64ffda;
  border: 1px solid rgba(100, 255, 218, 0.2);
}

.status-time {
  color: #8892b0;
  font-size: 12px;
}

.status-reason {
  color: #8892b0;
  font-size: 12px;
  font-style: italic;
}

.no-status {
  text-align: center;
  color: #8892b0;
  padding: 20px;
  background: rgba(10, 25, 47, 0.5);
  border-radius: 6px;
  border: 1px dashed rgba(100, 255, 218, 0.2);
}

.cert-form {
  margin-top: 20px;
  padding: 15px;
  background: rgba(10, 25, 47, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(100, 255, 218, 0.2);
}

.cert-form h3 {
  color: #64ffda;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
}

.cert-asset-info {
  background: rgba(10, 25, 47, 0.7);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid rgba(100, 255, 218, 0.2);
}
</style>
