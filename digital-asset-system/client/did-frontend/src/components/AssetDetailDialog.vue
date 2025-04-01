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
        <div class="asset-description">{{ assetDetails.metadata.description || '暂无描述' }}</div>
        
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
        
        <!-- PDF预览 -->
        <iframe 
          v-else-if="assetPreviewUrl && assetDetails.metadata.fileType === 'application/pdf'"
          :src="assetPreviewUrl"
          @load="handleIframeLoad"
          @error="handleIframeError"
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
import { ref, watch, defineProps, defineEmits } from 'vue';
import { Loading, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { formatDate } from '@/utils/dateFormat';

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
const iframeLoadFailed = ref(false);
const fullImageVisible = ref(false);
const isLoadingPreview = ref(true);

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
  isLoadingPreview.value = true;
  iframeLoadFailed.value = false;
});

// 关闭对话框事件处理
const handleClose = () => {
  emit('close');
};

// iframe加载成功事件处理
const handleIframeLoad = () => {
  isLoadingPreview.value = false;
};

// iframe加载失败事件处理
const handleIframeError = () => {
  iframeLoadFailed.value = true;
  isLoadingPreview.value = false;
};

// 图片加载失败事件处理
const handleImageError = () => {
  isLoadingPreview.value = false;
  ElMessage.error('图片加载失败');
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

// // 格式化日期
// const formatDate = (timestamp: number) => {
//   if (!timestamp) return '未知';
//   const date = new Date(timestamp * 1000);
//   return date.toLocaleString('zh-CN');
// };

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
</style>