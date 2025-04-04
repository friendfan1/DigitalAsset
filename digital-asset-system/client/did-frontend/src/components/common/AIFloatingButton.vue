<template>
  <div>
    <!-- 浮动按钮 -->
    <div class="ai-floating-btn" @click="showAIChat = true">
      <el-icon><ChatDotRound /></el-icon>
    </div>

    <!-- AI助手对话框 -->
    <el-dialog
      v-model="showAIChat"
      title="AI 智能助手"
      width="80%"
      height="80%"
      :before-close="handleClose"
      :show-close="true"
      class="ai-chat-dialog"
      :fullscreen="isFullscreen"
    >
      <AIChat />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ChatDotRound } from '@element-plus/icons-vue';
import { useBreakpoints } from '@vueuse/core';
import AIChat from '@/views/ai/AIChat.vue';

const showAIChat = ref(false);
const breakpoints = useBreakpoints({
  mobile: 768,
  desktop: 992
});

const isSmallScreen = ref(false);

onMounted(() => {
  isSmallScreen.value = breakpoints.smaller('desktop').value;
});

const isFullscreen = computed(() => {
  return isSmallScreen.value;
});

const handleClose = () => {
  showAIChat.value = false;
};
</script>

<style scoped>
.ai-floating-btn {
  position: fixed;
  right: 25px;
  bottom: 25px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #ffffff;
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
  border: 1px solid #000000;
}

.ai-floating-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.05);
}

.ai-floating-btn:active {
  transform: scale(0.95);
}

.ai-floating-btn .el-icon {
  font-size: 22px;
}

:deep(.ai-chat-dialog) {
  border-radius: 8px;
  border: 1px solid #dddddd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  padding: 0;
}

:deep(.el-dialog) {
  border-radius: 8px;
  border: 1px solid #dddddd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  padding: 0;
}

:deep(.el-dialog__header) {
  background: #ffffff;
  color: #000000;
  padding: 8px 12px;
  margin-right: 0;
  border-bottom: 1px solid #dddddd;
}

:deep(.el-dialog__title) {
  color: #000000;
  font-weight: 600;
  font-size: 16px;
}

/* :deep(.el-dialog__headerbtn) {
  top: 0;
} */

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #000000;
}

:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: #666666;
}

:deep(.el-dialog__body) {
  padding: 0;
  background: #ffffff;
}
</style>