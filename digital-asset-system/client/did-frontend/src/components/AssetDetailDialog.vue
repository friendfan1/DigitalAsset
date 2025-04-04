<template>
  <el-dialog
    v-model="dialogVisible"
    title="资产详情"
    width="80%"
    destroy-on-close
    @close="handleClose"
  >
    <div class="asset-details-content" v-if="assetDetails">
      <div class="asset-info">
        <div class="asset-main">
          <span class="asset-name">{{ assetDetails?.metadata?.fileName || '未知文件' }}</span>
          <el-tag size="small" type="info">{{ assetDetails?.metadata?.category || '未分类' }}</el-tag>
          <el-tag 
            size="small" 
            :type="assetDetails?.isCertified ? 'success' : 'warning'"
            style="margin-left: 10px;"
          >
            {{ assetDetails?.isCertified ? '已认证' : '未认证' }}
          </el-tag>
        </div>
        <div class="asset-description">{{ assetDetails?.metadata?.description || '暂无描述' }}</div>
        
        <!-- 资产基本信息 -->
        <el-descriptions :column="3" border>
          <el-descriptions-item label="资产ID">{{ assetDetails?.tokenId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatFileSize(assetDetails?.metadata?.fileSize || 0) }}</el-descriptions-item>
          <el-descriptions-item label="文件类型">{{ assetDetails?.metadata?.fileType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IPFS CID">
            <el-tooltip content="点击复制" placement="top">
              <span class="cid" @click="copyToClipboard(assetDetails?.cid)">
                {{ assetDetails?.cid || '-' }}
              </span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(assetDetails?.registrationDate) }}</el-descriptions-item>
          <el-descriptions-item label="资产版本">{{ assetDetails?.version || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <div class="preview-section">
        <!-- 图片预览 -->
        <div v-if="assetPreviewUrl && assetDetails.metadata.fileType.startsWith('image/')">
          <div class="image-preview-container">
            <img 
              :src="assetPreviewUrl"
              @error="handleImageError"
              alt="资产预览"
              class="preview-image"
            />
          </div>
        </div>
        
        <!-- Office文档预览 -->
        <div v-else-if="isOfficeDocument && assetPreviewUrl" class="document-preview-container">
          <div v-if="!previewError" class="document-preview">
            <!-- Word文档预览 -->
            <div v-if="isWordDocument" class="word-preview" v-html="documentContent"></div>
            
            <!-- Excel文档预览 -->
            <div v-else-if="isExcelDocument" class="excel-preview">
              <el-table
                v-if="excelData.length > 0"
                :data="excelData"
                border
                style="width: 100%"
              >
                <el-table-column
                  v-for="col in excelColumns"
                  :key="col.prop"
                  :prop="col.prop"
                  :label="col.label"
                />
              </el-table>
            </div>
            
            <div v-if="isLoadingPreview" class="preview-loading-overlay">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>正在加载文档预览...</span>
            </div>
          </div>
          
          <div v-else class="preview-fallback">
            <el-icon><Document /></el-icon>
            <p>{{ previewError }}</p>
            <el-button type="primary" size="small" @click="retryPreview">重试</el-button>
            <el-button type="info" size="small" @click="downloadFile">下载查看</el-button>
          </div>
        </div>
        
        <!-- PDF预览 -->
        <iframe 
          v-if="assetPreviewUrl && assetDetails.metadata.fileType === 'application/pdf'"
          :src="assetPreviewUrl"
          style="width: 100%; height: 500px; border: none; margin-bottom: 1rem;"
        ></iframe>
        
        <!-- 视频预览 -->
        <video
          v-else-if="assetPreviewUrl && assetDetails.metadata.fileType.startsWith('video/')"
          controls
          :src="assetPreviewUrl"
          :type="assetDetails.metadata.fileType"
          crossorigin="anonymous"
          @error="handleMediaError"
          style="width: 100%; max-height: 400px; margin-bottom: 1rem;"
        >
          您的浏览器不支持视频标签。
        </video>
        
        <!-- 音频预览 -->
        <audio
          v-else-if="assetPreviewUrl && assetDetails.metadata.fileType.startsWith('audio/')"
          controls
          :src="assetPreviewUrl" 
          :type="assetDetails.metadata.fileType"
          crossorigin="anonymous"
          @error="handleMediaError"
          style="width: 100%; margin-bottom: 1rem;"
        >
          您的浏览器不支持音频标签。
        </audio>
        
        <!-- 加载中状态 -->
        <div v-else-if="isLoadingPreview" class="loading-preview">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载预览中...</span>
        </div>
        
        <!-- 无法预览状态 -->
        <div v-else class="no-preview">
          <el-icon><Document /></el-icon>
          <span>无法预览此类型的文件</span>
        </div>
        
        <!-- 全屏图片预览对话框 -->
        <el-dialog
          v-model="fullImageVisible"
          :title="assetDetails?.metadata?.fileName || '图片预览'"
          width="90%"
          top="5vh"
          destroy-on-close
          append-to-body
          :close-on-click-modal="true"
          :show-close="true"
        >
          <div class="full-image-container">
            <img :src="assetPreviewUrl" alt="全屏预览" class="full-image" />
          </div>
        </el-dialog>
      </div>
    </div>
    
    <!-- 添加插槽 -->
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, defineProps, defineEmits, computed, onMounted } from 'vue';
import { Loading, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { formatDate } from '@/utils/dateFormat';
// @ts-ignore
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  assetDetails: {
    type: Object,
    required: true,
    default: () => ({})
  },
  assetPreviewUrl: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:visible', 'close']);

const dialogVisible = ref(props.visible);
const previewRetries = ref(0);
const maxRetries = 3;
const previewKey = ref(0);
const iframeLoadFailed = ref(false);
const fullImageVisible = ref(false);
const isLoadingPreview = ref(false);
const documentContent = ref('');
const excelData = ref<any[]>([]);
const excelColumns = ref<ExcelColumn[]>([]);
const previewError = ref<string | null>(null);

// 监听props.visible的变化，同步到dialogVisible
watch(() => props.visible, (val) => {
  dialogVisible.value = val;
});

// 监听dialogVisible的变化，通过emit更新父组件的visible
watch(dialogVisible, (val) => {
  emit('update:visible', val);
  if (!val) {
    emit('close');
  }
});

// 监听assetDetails的变化，重置加载状态
watch(() => props.assetDetails, () => {
  previewRetries.value = 0;
  iframeLoadFailed.value = false;
  isLoadingPreview.value = true;
  previewKey.value++;
  if (isOfficeDocument.value) {
    loadDocumentPreview();
  }
});

// 关闭对话框事件处理
const handleClose = () => {
  emit('close');
};

// 判断是否为Office文档
const isWordDocument = computed(() => {
  return props.assetDetails?.metadata?.fileType?.includes('wordprocessingml') || false;
});

const isExcelDocument = computed(() => {
  return props.assetDetails?.metadata?.fileType?.includes('spreadsheetml') || false;
});

const isOfficeDocument = computed(() => {
  return isWordDocument.value || isExcelDocument.value;
});

interface ExcelData {
  [key: string]: string | number;
}

const loadDocumentPreview = async () => {
  if (!props.assetPreviewUrl) return;
  
  isLoadingPreview.value = true;
  previewError.value = null;
  
  try {
    if (isWordDocument.value) {
      const response = await fetch(props.assetPreviewUrl);
      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      documentContent.value = result.value;
    } else if (isExcelDocument.value) {
      const response = await fetch(props.assetPreviewUrl);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<ExcelData>(firstSheet);
      
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        const columns = Object.keys(data[0]).map(key => ({
          prop: key,
          label: key
        }));
        excelColumns.value = columns;
        excelData.value = data;
      }
    }
  } catch (error) {
    console.error('文档预览加载失败:', error);
    previewError.value = '文档预览加载失败';
  } finally {
    isLoadingPreview.value = false;
  }
};

// 重试预览
const retryPreview = async () => {
  previewError.value = null;
  isLoadingPreview.value = true;
  try {
    await loadDocumentPreview();
  } catch (error) {
    previewError.value = '文档预览加载失败';
  } finally {
    isLoadingPreview.value = false;
  }
};

// 下载文件
const downloadFile = () => {
  if (props.assetPreviewUrl) {
    window.open(props.assetPreviewUrl, '_blank');
  }
};

// 图片加载失败事件处理
const handleImageError = () => {
  previewError.value = '图片加载失败';
};

// 媒体加载失败事件处理
const handleMediaError = () => {
  isLoadingPreview.value = false;
  ElMessage.error('媒体文件加载失败');
};

// 复制文本到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      ElMessage.success('已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败');
    });
};

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + ' B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB';
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
};

interface ExcelColumn {
  prop: string;
  label: string;
}
</script>

<style scoped>
.asset-details-content {
  padding: 10px;
}

.asset-info {
  margin-bottom: 20px;
}

.asset-main {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.asset-name {
  font-size: 18px;
  font-weight: bold;
  margin-right: 10px;
}

.asset-description {
  color: #666;
  margin-bottom: 15px;
}

.cid {
  color: #409EFF;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 300px;
}

.loading-preview, .no-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.loading-preview i, .no-preview i {
  font-size: 32px;
  margin-bottom: 10px;
  color: #909399;
}

.full-image-container {
  display: flex;
  justify-content: center;
  overflow: auto;
  max-height: 80vh;
}

.full-image {
  max-width: 100%;
  object-fit: contain;
}

.preview-section img {
  object-fit: contain; /* 确保图片完整显示 */
  max-height: 500px; /* 限制图片最大高度 */
  width: 100%; /* 图片宽度自适应 */
}

.image-preview-container {
  width: 100%;
  height: 500px; /* 固定预览框高度 */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden; /* 隐藏超出部分 */
  background-color: #f9f9f9; /* 设置背景色以区分图片边界 */
  border-radius: 4px;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* 确保图片完整显示 */
}

/* 添加文档预览相关样式 */
.preview-section iframe {
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.document-preview-container {
  position: relative;
  width: 100%;
  min-height: 600px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.document-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.preview-loading-overlay .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.preview-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 20px;
}

.preview-fallback .el-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 16px;
}

.preview-fallback p {
  color: #606266;
  margin: 8px 0 16px;
}

.preview-fallback .el-button {
  margin: 0 8px;
}

.word-preview {
  padding: 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-height: 500px;
  max-height: 800px;
  overflow-y: auto;
}

.excel-preview {
  padding: 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-height: 800px;
  overflow-y: auto;
}
</style>