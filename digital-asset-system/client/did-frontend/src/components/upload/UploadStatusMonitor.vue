<template>
  <div class="upload-status-monitor" v-if="hasActiveUploads">
    <div class="monitor-header" @click="toggleExpanded">
      <el-icon><Upload /></el-icon>
      <span class="title">文件上传 ({{ activeUploads.length }})</span>
      <div class="actions">
        <el-icon v-if="expanded"><ArrowUp /></el-icon>
        <el-icon v-else><ArrowDown /></el-icon>
      </div>
    </div>
    
    <div class="monitor-content" v-if="expanded">
      <div 
        v-for="upload in activeUploads" 
        :key="upload.id" 
        class="upload-item"
      >
        <div class="upload-info">
          <span class="file-name">{{ upload.name }}</span>
          <span class="file-progress">{{ upload.progress }}%</span>
        </div>
        <el-progress 
          :percentage="upload.progress" 
          :status="getProgressStatus(upload.progress)"
          :stroke-width="5"
        />
      </div>
      
      <div class="no-uploads" v-if="activeUploads.length === 0">
        没有正在进行的上传
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Upload, ArrowUp, ArrowDown } from '@element-plus/icons-vue';
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService';

// 状态
const expanded = ref(false);
const uploadStatuses = ref<Record<string, number>>({});
const uploadInfoMap = ref<Record<string, { name: string, size: number }>>({});
const refreshInterval = ref<number | null>(null);

// 计算属性
const activeUploads = computed(() => {
  return Object.entries(uploadStatuses.value)
    .filter(([_, progress]) => progress >= 0 && progress < 100)
    .map(([id, progress]) => {
      return {
        id,
        name: uploadInfoMap.value[id]?.name || `文件-${id.substring(0, 6)}`,
        size: uploadInfoMap.value[id]?.size || 0,
        progress
      };
    });
});

const completedUploads = computed(() => {
  return Object.entries(uploadStatuses.value)
    .filter(([_, progress]) => progress === 100)
    .map(([id]) => id);
});

const failedUploads = computed(() => {
  return Object.entries(uploadStatuses.value)
    .filter(([_, progress]) => progress === -1)
    .map(([id]) => id);
});

const hasActiveUploads = computed(() => {
  // 如果有活跃上传或刚完成的上传，显示监视器
  return activeUploads.value.length > 0 || 
         (completedUploads.value.length > 0 && !expanded.value) ||
         (failedUploads.value.length > 0 && !expanded.value);
});

// 方法
const toggleExpanded = () => {
  expanded.value = !expanded.value;
};

const getProgressStatus = (progress: number): '' | 'success' | 'exception' => {
  if (progress === 100) return 'success';
  if (progress === -1) return 'exception';
  return '';
};

const updateUploadStatuses = async () => {
  try {
    const service = await getDigitalAssetService();
    // 获取所有上传状态
    uploadStatuses.value = service.getUploadStatuses();
    
    // 自动清理完成很久的上传
    const currentTime = Date.now();
    Object.keys(uploadStatuses.value).forEach(id => {
      // 如果ID是很久以前创建的（超过10分钟），而且已经完成或失败，则从显示中移除
      const timestamp = parseInt(id.split('_')[1] || '0');
      const progress = uploadStatuses.value[id];
      if (
        timestamp > 0 && 
        currentTime - timestamp > 10 * 60 * 1000 && // 10分钟
        (progress === 100 || progress === -1)
      ) {
        delete uploadStatuses.value[id];
        delete uploadInfoMap.value[id];
      }
    });
  } catch (error) {
    console.error('更新上传状态失败:', error);
  }
};

// 注册文件信息
const registerFileInfo = (id: string, name: string, size: number) => {
  uploadInfoMap.value[id] = { name, size };
};

// 暴露方法给父组件
defineExpose({
  registerFileInfo
});

// 生命周期钩子
onMounted(() => {
  // 每秒更新一次上传状态
  refreshInterval.value = window.setInterval(updateUploadStatuses, 1000);
  // 初始加载
  updateUploadStatuses();
});

onUnmounted(() => {
  // 清理定时器
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style scoped lang="scss">
.upload-status-monitor {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 300px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  z-index: 1000;
  overflow: hidden;
  transition: all 0.3s;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.monitor-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #409eff;
  color: #fff;
  cursor: pointer;
  
  .el-icon {
    margin-right: 8px;
  }
  
  .title {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }
  
  .actions {
    display: flex;
    align-items: center;
  }
}

.monitor-content {
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.upload-item {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .upload-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    
    .file-name {
      font-size: 12px;
      color: #606266;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .file-progress {
      font-size: 12px;
      color: #303133;
      margin-left: 8px;
    }
  }
}

.no-uploads {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 16px 0;
}
</style> 