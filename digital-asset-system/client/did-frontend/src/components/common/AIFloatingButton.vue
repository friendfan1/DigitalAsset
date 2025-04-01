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
  background: #0a192f;
  color: #64ffda;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
  border: 1px solid #64ffda;
}

.ai-floating-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: rgba(10, 25, 47, 0.9);
}

.ai-floating-btn:active {
  transform: scale(0.95);
}

.ai-floating-btn .el-icon {
  font-size: 22px;
}

:deep(.ai-chat-dialog) {
  border-radius: 0; /* 移除圆角 */
  border: none; /* 移除边框 */
  box-shadow: none; /* 移除阴影 */
  background: transparent; /* 确保背景透明 */
  padding: 0; /* 移除内边距 */
}

:deep(.el-dialog) {
  border-radius: 0; /* 移除圆角 */
  border: none; /* 移除边框 */
  box-shadow: none; /* 移除阴影 */
  background: transparent; /* 确保背景透明 */
  padding: 0; /* 移除内边距 */
}

:deep(.el-dialog__header) {
  background: #0a192f;
  color: #e6f1ff;
  padding: 8px 12px;
  margin-right: 0;
  border-bottom: 1px solid rgba(35, 53, 84, 0.3);
}

:deep(.el-dialog__title) {
  color: #64ffda;
  font-weight: 600;
  font-size: 16px;
}

/* :deep(.el-dialog__headerbtn) {
  top: 0;
} */

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #64ffda;
}

:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: white;
}

:deep(.el-dialog__body) {
  padding: 0; /* 确保内容区域无额外内边距 */
  background: transparent; /* 确保背景透明 */
}
</style>