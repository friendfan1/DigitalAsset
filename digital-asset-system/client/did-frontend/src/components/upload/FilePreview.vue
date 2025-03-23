<template>
  <div class="file-preview" :class="{ 'is-error': hasError }">
    <!-- 预览区域 -->
    <div class="preview-content">
      <!-- 图片预览 -->
      <div v-if="isImage" class="image-preview">
        <img :src="previewUrl" :alt="file.name" @error="handleImageError">
      </div>
      
      <!-- PDF 预览 -->
      <div v-else-if="isPDF" class="pdf-preview">
        <iframe v-if="previewUrl" :src="previewUrl" frameborder="0"></iframe>
        <div v-else class="pdf-icon">
          <el-icon :size="40"><Document /></el-icon>
        </div>
      </div>

      <!-- 视频预览 -->
      <div v-else-if="isVideo" class="video-preview">
        <video v-if="previewUrl" controls :src="previewUrl" @error="handleMediaError"></video>
        <div v-else class="video-icon">
          <el-icon :size="40"><VideoCamera /></el-icon>
        </div>
      </div>

      <!-- 音频预览 -->
      <div v-else-if="isAudio" class="audio-preview">
        <audio v-if="previewUrl" controls :src="previewUrl" @error="handleMediaError"></audio>
        <div v-else class="audio-icon">
          <el-icon :size="40"><Headset /></el-icon>
        </div>
      </div>
      
      <!-- 其他文件类型预览 -->
      <div v-else class="file-icon">
        <el-icon :size="40"><Document /></el-icon>
      </div>
    </div>
    
    <!-- 文件信息 -->
    <div class="file-info">
      <div class="file-name" :title="file.name">{{ file.name }}</div>
      <div class="file-meta">
        <span class="file-size">{{ fileUtils.formatFileSize(file.size) }}</span>
        <span class="file-type">{{ getFileType }}</span>
      </div>
    </div>
    
    <!-- 状态和操作 -->
    <div class="file-status">
      <!-- 状态图标替代进度条 -->
      <div v-if="props.status === 'uploading'" class="status-icon">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span class="status-text">上传中...</span>
      </div>
      
      <div v-else-if="props.status === 'success'" class="status-icon success">
        <el-icon><SuccessFilled /></el-icon>
        <span class="status-text">上传成功</span>
      </div>
      
      <!-- 错误信息 -->
      <div v-if="hasError" class="error-message">
        {{ error }}
      </div>
      
      <!-- 操作按钮 -->
      <div class="actions">
        <el-button
          v-if="!isUploading"
          type="danger"
          size="small"
          circle
          @click="handleRemove"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Document, Delete, Loading, SuccessFilled, VideoCamera, Headset } from '@element-plus/icons-vue';
import { uploadConfig } from '@/config/upload.config';
import { fileUtils } from '@/utils/file';

const props = defineProps({
  file: {
    type: File,
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  error: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'idle'
  }
});

const emit = defineEmits<{
  (e: 'remove'): void
}>();

// 预览URL
const previewUrl = ref('');
const previewError = ref(false);

// 计算属性
const isImage = computed(() => {
  return uploadConfig.imagePreviewTypes.includes(props.file.type);
});

const isPDF = computed(() => {
  return uploadConfig.pdfPreviewTypes.includes(props.file.type);
});

const isVideo = computed(() => {
  return uploadConfig.videoPreviewTypes.includes(props.file.type);
});

const isAudio = computed(() => {
  return uploadConfig.audioPreviewTypes.includes(props.file.type);
});

const hasError = computed(() => {
  return !!props.error || previewError.value;
});

const isUploading = computed(() => {
  return props.status === 'uploading';
});

const getFileType = computed(() => {
  const type = props.file.type;
  // 使用更友好的文件类型显示
  const typeMap: Record<string, string> = {
    // 视频类型
    'video/mp4': 'MP4',
    'video/webm': 'WebM',
    'video/ogg': 'OGG',
    'video/quicktime': 'MOV',
    'video/x-msvideo': 'AVI',
    // 音频类型
    'audio/mpeg': 'MP3',
    'audio/ogg': 'OGG',
    'audio/wav': 'WAV',
    'audio/x-m4a': 'M4A',
    'audio/webm': 'WebM音频'
  };

  return typeMap[type] || type.split('/')[1].toUpperCase();
});

// 方法
const handleImageError = () => {
  previewError.value = true;
};

const handleMediaError = () => {
  previewError.value = true;
};

const handleRemove = () => {
  emit('remove');
};

// 生成预览
const generatePreview = async () => {
  try {
    if (isImage.value || isPDF.value || isVideo.value || isAudio.value) {
      previewUrl.value = URL.createObjectURL(props.file);
    }
  } catch (error) {
    console.error('生成预览失败:', error);
    previewError.value = true;
  }
};

// 生命周期
generatePreview();
</script>

<style scoped lang="scss">
.file-preview {
  display: flex;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  margin-bottom: 8px;
  transition: all 0.3s;
  
  &:hover {
    background-color: #f5f7fa;
  }
  
  &.is-error {
    border-color: #f56c6c;
    background-color: #fef0f0;
  }
}

.preview-content {
  width: 60px;
  height: 60px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .image-preview {
    width: 100%;
    height: 100%;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }
  }
  
  .pdf-preview, .file-icon, .video-preview, .audio-preview {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    background-color: #f5f7fa;
    border-radius: 4px;
    
    iframe, video, audio {
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }
  }

  .video-preview .video-icon,
  .audio-preview .audio-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
}

.file-info {
  flex: 1;
  min-width: 0;
  padding: 0 12px;
  
  .file-name {
    font-size: 14px;
    color: #303133;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .file-meta {
    font-size: 12px;
    color: #909399;
    
    .file-size {
      margin-right: 8px;
    }
  }
}

.file-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
  
  .status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    
    &.success {
      color: #67c23a;
    }
    
    .is-loading {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
  
  .status-text {
    margin-left: 8px;
    font-size: 14px;
  }
  
  .error-message {
    color: #f56c6c;
    font-size: 12px;
    margin-bottom: 8px;
    text-align: center;
    word-break: break-word;
  }
  
  .actions {
    margin-top: 8px;
  }
}
</style> 