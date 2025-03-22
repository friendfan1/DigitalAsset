<template>
  <div class="progress-container">
    <div class="progress-info" v-if="showInfo">
      <span class="progress-text">{{ status }}</span>
      <span class="progress-percentage">{{ percentage }}%</span>
    </div>
    
    <div class="progress-bar">
      <div 
        class="progress-inner" 
        :style="{ 
          width: `${percentage}%`,
          backgroundColor: getStatusColor
        }"
      ></div>
    </div>
    
    <div class="progress-status" v-if="showIcon">
      <el-icon v-if="status === 'success'" class="success"><CircleCheck /></el-icon>
      <el-icon v-else-if="status === 'error'" class="error"><CircleClose /></el-icon>
      <el-icon v-else-if="isActive" class="loading"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CircleCheck, CircleClose, Loading } from '@element-plus/icons-vue';

const props = defineProps({
  percentage: {
    type: Number,
    default: 0,
    validator: (value: number) => value >= 0 && value <= 100
  },
  status: {
    type: String,
    default: 'normal',
    validator: (value: string) => {
      return ['normal', 'success', 'error', 'uploading'].includes(value);
    }
  },
  showInfo: {
    type: Boolean,
    default: true
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  strokeWidth: {
    type: Number,
    default: 6
  }
});

// 计算是否处于活动状态
const isActive = computed(() => {
  return props.status === 'uploading' && props.percentage < 100;
});

// 根据状态获取颜色
const getStatusColor = computed(() => {
  const colors = {
    normal: '#409eff',
    success: '#67c23a',
    error: '#f56c6c',
    uploading: '#409eff'
  };
  return colors[props.status as keyof typeof colors];
});
</script>

<style scoped lang="scss">
.progress-container {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 14px;
  
  .progress-text {
    color: #606266;
  }
  
  .progress-percentage {
    color: #303133;
    font-weight: 500;
  }
}

.progress-bar {
  flex: 1;
  height: v-bind(strokeWidth + 'px');
  background-color: #ebeef5;
  border-radius: 100px;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  transition: width 0.3s ease-in-out, background-color 0.3s ease-in-out;
  border-radius: 100px;
}

.progress-status {
  display: flex;
  align-items: center;
  font-size: 16px;
  
  .el-icon {
    &.success {
      color: #67c23a;
    }
    
    &.error {
      color: #f56c6c;
    }
    
    &.loading {
      color: #409eff;
      animation: rotating 2s linear infinite;
    }
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 