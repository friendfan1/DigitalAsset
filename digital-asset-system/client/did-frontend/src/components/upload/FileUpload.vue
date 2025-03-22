<template>
  <div class="file-upload">
    <!-- 拖拽上传区域 -->
    <DragDropZone
      :multiple="multiple"
      :disabled="disabled"
      :accepted-types="acceptedTypes"
      :max-file-size="maxFileSize"
      @files-selected="handleFilesSelected"
    />
    
    <!-- 文件列表 -->
    <div class="file-list" v-if="fileList.length > 0">
      <FilePreview
        v-for="file in fileList"
        :key="file.id"
        :file="file.file"
        :progress="file.progress"
        :status="file.status"
        :error="file.error"
        @remove="handleRemoveFile(file.id)"
      />
    </div>
    
    <!-- 上传选项 -->
    <div class="upload-options" v-if="fileList.length > 0">
      <el-form :model="uploadOptions" label-width="100px">
        <!-- 加密选项 -->
        <el-form-item label="加密存储">
          <el-switch v-model="uploadOptions.encrypt" />
        </el-form-item>
        
        <!-- 元数据 -->
        <template v-if="showMetadata">
          <el-form-item label="资产描述">
            <el-input
              v-model="uploadOptions.metadata.description"
              type="textarea"
              :rows="2"
              placeholder="请输入资产描述"
            />
          </el-form-item>
          
          <el-form-item label="资产分类">
            <el-input
              v-model="uploadOptions.metadata.category"
              placeholder="请输入资产分类"
            />
          </el-form-item>
          
          <el-form-item label="标签">
            <el-tag
              v-for="tag in uploadOptions.metadata.tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
            
            <el-input
              v-if="showTagInput"
              ref="tagInputRef"
              v-model="newTag"
              class="tag-input"
              size="small"
              @keyup.enter="handleTagInputConfirm"
              @blur="handleTagInputConfirm"
            />
            
            <el-button
              v-else
              class="button-new-tag"
              size="small"
              @click="showTagInput = true"
            >
              + 添加标签
            </el-button>
          </el-form-item>
        </template>
      </el-form>
      
      <!-- 上传按钮 -->
      <div class="upload-actions">
        <el-button
          type="primary"
          :loading="isUploading"
          :disabled="!canUpload"
          @click="handleUpload"
        >
          {{ uploadButtonText }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, inject } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { ElMessage } from 'element-plus';
import type { UploadFile, UploadOptions } from '@/types/upload';
import { uploadConfig } from '@/config/upload.config';
import { fileUtils } from '@/utils/file';
import { validateUploadOptions } from '@/utils/validation';
import DragDropZone from './DragDropZone.vue';
import FilePreview from './FilePreview.vue';
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService';

// Props
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
  showMetadata: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits<{
  (e: 'success', result: any): void
  (e: 'error', error: any): void
  (e: 'progress', progress: number): void
}>();

// 状态
const fileList = ref<UploadFile[]>([]);
const uploading = ref(false);
const hasErrors = ref(false);
const showTagInput = ref(false);
const newTag = ref('');
const tagInputRef = ref();
// 映射uploadId到文件ID
const uploadIdMap = ref<Record<string, string>>({});

// 上传选项
const uploadOptions = ref<UploadOptions>({
  metadata: {
    description: '',
    category: '',
    tags: [] as string[]
  },
  encrypt: false
} satisfies UploadOptions);

// 获取上传监视器引用
const uploadMonitor = inject<{ value: any }>('uploadMonitor');

// 计算属性
const canUpload = computed(() => {
  return fileList.value.length > 0 && 
    !uploading.value && 
    !fileList.value.some(file => file.status === 'error');
});

const uploadButtonText = computed(() => {
  if (uploading.value) return '上传中...';
  if (fileList.value.length === 0) return '选择文件';
  return '开始上传';
});

const isUploading = computed(() => uploading.value);

// 方法
const handleFilesSelected = (files: File[]) => {
  // 验证文件
  const validFiles = files.filter(file => {
    const validation = fileUtils.validateFile(file);
    if (!validation.isValid) {
      ElMessage.warning(`文件 ${file.name} ${validation.error}`);
      return false;
    }
    return true;
  });

  // 添加到文件列表（不跟踪进度，只有状态）
  const newFiles = validFiles.map(file => ({
    id: uuidv4(),
    file,
    progress: 0, // 进度将不会更新
    status: 'idle' as const,
    error: ''
  }));

  if (!props.multiple) {
    // 清理旧文件
    fileList.value = newFiles.slice(0, 1);
  } else {
    fileList.value.push(...newFiles);
  }
};

const handleRemoveFile = (id: string) => {
  const index = fileList.value.findIndex(file => file.id === id);
  if (index !== -1) {
    fileList.value.splice(index, 1);
  }
};

const removeTag = (tag: string) => {
  uploadOptions.value.metadata.tags = uploadOptions.value.metadata.tags?.filter(t => t !== tag);
};

const handleTagInputConfirm = () => {
  if (newTag.value) {
    if (!uploadOptions.value.metadata.tags) {
      uploadOptions.value.metadata.tags = [];
    }
    if (uploadOptions.value.metadata.tags.length < 10 && newTag.value.length <= 20) {
      uploadOptions.value.metadata.tags.push(newTag.value);
    }
  }
  showTagInput.value = false;
  newTag.value = '';
};

// 注册上传进度回调
const registerUploadTracking = (file: UploadFile, uploadId: string) => {
  // 记录uploadId和fileId的映射
  uploadIdMap.value[uploadId] = file.id;
  
  // 如果有上传监视器，注册文件信息
  if (uploadMonitor?.value) {
    uploadMonitor.value.registerFileInfo(uploadId, file.file.name, file.file.size);
  }
};

const handleUpload = async () => {
  try {
    // 确保选择了文件
    if (fileList.value.length === 0) {
      ElMessage.error('请至少选择一个文件');
      return;
    }

    // 验证上传选项
    if (!validateUploadOptions(uploadOptions.value)) {
      ElMessage.error('请填写所有必填的元数据字段');
      return;
    }

    // 重置状态
    uploading.value = true;
    hasErrors.value = false;
    
    // 初始化数字资产服务
    const service = await getDigitalAssetService();
    
    // 上传所有文件
    for (const file of fileList.value) {
      try {
        file.status = 'uploading';
        
        // 直接创建上传ID
        const uploadId = service.createUploadId();
        console.log('开始上传文件:', file.file.name);
        console.log('文件大小:', (file.file.size/1024/1024).toFixed(2) + 'MB');
        console.log('上传ID:', uploadId);
        
        // 注册上传进度跟踪
        registerUploadTracking(file, uploadId);
        
        // 注册进度监听器
        const listenerId = service.addUploadProgressListener(uploadId, (progress) => {
          console.log(`文件 ${file.file.name} 上传进度: ${progress}%`);
          file.progress = progress;
          
          // 发出进度事件
          emit('progress', progress);
        });
        
        // 注册资产（进行上传）
        const result = await service.registerAsset(
          file.file, 
          {
            description: uploadOptions.value.metadata.description,
            category: uploadOptions.value.metadata.category,
            tags: uploadOptions.value.metadata.tags,
            encrypt: uploadOptions.value.encrypt,
            uploadId
          }
        );

        // 取消进度监听
        service.removeUploadProgressListener(uploadId, () => {});
        
        // 上传成功，手动设置状态为成功
        file.status = 'success';
        file.progress = 100; // 设置为100%表示完成
        
        // 显示成功消息
        ElMessage.success(`文件 ${file.file.name} 上传成功！`);
        console.log('上传成功，结果:', result);
        
        // 清除缓存，确保下次获取资产列表时能看到新资产
        service.clearCache();
        
        // 发出成功事件
        emit('success', result);
      } catch (error: any) {
        file.status = 'error';
        file.progress = 0;
        hasErrors.value = true;
        
        // 获取错误信息
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // 显示错误信息
        ElMessage.error(`文件 ${file.file.name} 上传失败: ${errorMessage}`);
        console.error('上传文件错误:', error);
        
        // 发出错误事件
        emit('error', error);
      }
    }
  } catch (error: any) {
    hasErrors.value = true;
    const errorMessage = error instanceof Error ? error.message : String(error);
    ElMessage.error(`上传过程中发生错误: ${errorMessage}`);
    console.error('上传处理错误:', error);
    
    // 发出错误事件
    emit('error', error);
  } finally {
    uploading.value = false;
  }
};

// 组件销毁时清理资源
onUnmounted(() => {
  // 不需要清理进度监听器
});
</script>

<style scoped lang="scss">
.file-upload {
  .file-list {
    margin-top: 16px;
  }

  .upload-options {
    margin-top: 24px;
    padding: 16px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #f5f7fa;
  }

  .tag-item {
    margin-right: 8px;
    margin-bottom: 8px;
  }

  .tag-input {
    width: 100px;
    margin-right: 8px;
    vertical-align: bottom;
  }

  .upload-actions {
    margin-top: 16px;
    text-align: right;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}
</style> 