<template>
  <div 
    class="drag-drop-zone"
    :class="{ 
      'is-dragover': isDragOver,
      'is-disabled': disabled 
    }"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @dragover.prevent
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <input
      ref="fileInput"
      type="file"
      class="file-input"
      :accept="acceptedTypes.join(',')"
      :multiple="multiple"
      @change="handleFileSelect"
    >
    
    <div class="upload-content">
      <div class="upload-icon">
        <el-icon :size="40"><Upload /></el-icon>
      </div>
      
      <div class="upload-text">
        <p class="primary-text">
          {{ dragText }}
        </p>
        <p class="secondary-text">
          支持的文件类型: {{ displayAcceptedTypes }}
        </p>
        <p class="secondary-text">
          最大文件大小: {{ fileUtils.formatFileSize(maxFileSize) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Upload } from '@element-plus/icons-vue';
import { uploadConfig } from '@/config/upload.config';
import { fileUtils } from '@/utils/file';

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  acceptedTypes: {
    type: Array as () => string[],
    default: () => uploadConfig.allowedTypes
  },
  maxFileSize: {
    type: Number,
    default: uploadConfig.maxFileSize
  },
  dragText: {
    type: String,
    default: '点击或拖拽文件到此处上传'
  }
});

const emit = defineEmits<{
  (e: 'filesSelected', files: File[]): void
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

// 计算显示的文件类型
const displayAcceptedTypes = computed(() => {
  return props.acceptedTypes
    .map(type => type.split('/')[1].toUpperCase())
    .join(', ');
});

// 触发文件选择
const triggerFileInput = () => {
  if (!props.disabled && fileInput.value) {
    fileInput.value.click();
  }
};

// 处理拖拽事件
const handleDragEnter = (e: DragEvent) => {
  if (props.disabled) return;
  isDragOver.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  if (props.disabled) return;
  isDragOver.value = false;
};

const handleDrop = (e: DragEvent) => {
  if (props.disabled) return;
  isDragOver.value = false;
  
  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length > 0) {
    handleFiles(files);
  }
};

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || []);
  if (files.length > 0) {
    handleFiles(files);
  }
};

// 处理文件
const handleFiles = (files: File[]) => {
  // 如果不是多选模式，只取第一个文件
  const selectedFiles = props.multiple ? files : [files[0]];
  emit('filesSelected', selectedFiles);
  
  // 重置 input，以便能够重复选择同一个文件
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};
</script>

<style scoped lang="scss">
.drag-drop-zone {
  position: relative;
  width: 100%;
  min-height: 200px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background-color: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    border-color: #409eff;
    background-color: #ecf5ff;
  }
  
  &.is-dragover {
    border-color: #409eff;
    background-color: #ecf5ff;
  }
  
  &.is-disabled {
    cursor: not-allowed;
    background-color: #f5f7fa;
    border-color: #dcdfe6;
    
    .upload-content {
      opacity: 0.5;
    }
  }
}

.file-input {
  display: none;
}

.upload-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 100%;
  padding: 20px;
}

.upload-icon {
  color: #909399;
  margin-bottom: 16px;
}

.upload-text {
  .primary-text {
    font-size: 16px;
    color: #303133;
    margin-bottom: 8px;
  }
  
  .secondary-text {
    font-size: 14px;
    color: #909399;
    margin: 4px 0;
  }
}
</style> 