<template>
  <div class="ai-chat-container">
    <div class="chat-header">
      <div class="header-controls">
        <div class="model-selector">
          <el-select v-model="selectedModel" placeholder="选择模型" size="small">
            <el-option
              v-for="model in AVAILABLE_MODELS"
              :key="model"
              :label="model"
              :value="model"
            />
          </el-select>
        </div>
        <el-button 
          type="danger" 
          size="small" 
          @click="clearHistory"
          :disabled="isLoading"
          class="clear-btn"
        >
          清除
        </el-button>
      </div>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" 
           :class="['message', message.type === 'user' ? 'user-message' : 'ai-message']">
        <div class="message-content">
          <div class="message-text markdown-body" v-html="renderMarkdown(message.content)"></div>
          <div class="message-time">{{ message.time }}</div>
        </div>
      </div>
      <div v-if="isStreaming" class="message ai-message">
        <div class="message-content">
          <div class="message-text markdown-body" v-html="renderMarkdown(streamingContent)"></div>
          <div class="message-time">{{ formatTime() }}</div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="2"
        placeholder="请输入您的问题..."
        @keyup.enter="sendMessage"
        :disabled="isLoading"
      />
      <el-button 
        type="primary" 
        @click="sendMessage" 
        :loading="isLoading"
        :disabled="!inputMessage.trim()"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { aiService, AVAILABLE_MODELS } from '@/services/ai';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'github-markdown-css';

interface Message {
  content: string;
  type: 'user' | 'ai';
  time: string;
}

const messages = ref<Message[]>([]);
const inputMessage = ref('');
const isLoading = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const selectedModel = ref('Qwen/QwQ-32B');
const isStreaming = ref(false);
const streamingContent = ref('');

// 配置marked选项
marked.setOptions({
  breaks: true, // 支持GitHub风格的换行
  gfm: true // 启用GitHub风格的Markdown
});

// 渲染Markdown
const renderMarkdown = (content: string) => {
  if (!content) return '';
  const rawHtml = marked.parse(content) as string;
  return DOMPurify.sanitize(rawHtml);
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatTime = () => {
  return new Date().toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const addMessage = (content: string, type: 'user' | 'ai') => {
  messages.value.push({
    content,
    type,
    time: formatTime()
  });
  scrollToBottom();
};

const clearHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清除所有对话历史吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    messages.value = [];
    aiService.clearHistory();
    addMessage('您好！我是AI助手，很高兴为您服务。请问有什么我可以帮您的吗？', 'ai');
    ElMessage.success('对话历史已清除');
  } catch {
    // 用户取消操作
  }
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;

  const userMessage = inputMessage.value.trim();
  inputMessage.value = '';
  addMessage(userMessage, 'user');

  try {
    isLoading.value = true;
    isStreaming.value = true;
    streamingContent.value = '';

    const response = await aiService.chat(userMessage, selectedModel.value, (text) => {
      streamingContent.value += text;
      scrollToBottom();
    });

    // 流式输出完成后，将完整消息添加到消息列表
    addMessage(response, 'ai');
    isStreaming.value = false;
  } catch (error) {
    ElMessage.error('发送消息失败，请稍后重试');
    isStreaming.value = false;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  addMessage('您好！我是AI助手，很高兴为您服务。请问有什么我可以帮您的吗？', 'ai');
});
</script>

<style scoped>
.ai-chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  border: none;
  margin: 0;
}

.chat-header {
  padding: 6px 10px;
  background: #ffffff;
  border-bottom: 1px solid #dddddd;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.clear-btn {
  background-color: transparent !important;
  border-color: #ff4d4f !important;
  color: #ff4d4f !important;
  padding: 3px 6px;
  font-size: 12px;
  height: 28px;
}

.clear-btn:hover {
  background-color: rgba(255, 77, 79, 0.1) !important;
}

.clear-btn:active {
  background-color: rgba(255, 77, 79, 0.2) !important;
}

.model-selector {
  display: flex;
  justify-content: center;
}

.model-selector .el-select {
  width: 170px;
}

.model-selector :deep(.el-input__wrapper) {
  background-color: #ffffff;
  box-shadow: 0 0 0 1px #dddddd;
  border-color: #dddddd;
  padding: 0 6px;
  height: 28px;
}

.model-selector :deep(.el-input__inner) {
  color: #000000;
  font-size: 12px;
}

.model-selector :deep(.el-select__caret) {
  color: #000000;
  font-size: 12px;
}

:deep(.el-select-dropdown) {
  background-color: #ffffff;
  border: 1px solid #dddddd;
}

:deep(.el-select-dropdown__item) {
  color: #333333;
  font-size: 12px;
  padding: 4px 8px;
}

:deep(.el-select-dropdown__item.hover) {
  background-color: rgba(0, 0, 0, 0.05);
}

:deep(.el-select-dropdown__item.selected) {
  color: #000000;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0.05);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #ffffff;
}

.message {
  display: flex;
  margin-bottom: 8px;
}

.user-message {
  justify-content: flex-end;
}

.message-content {
  max-width: 90%;
  padding: 10px 12px;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.user-message .message-content {
  background: #000000;
  color: #ffffff;
  border-radius: 8px 8px 0 8px;
  border: 1px solid #000000;
}

.user-message .message-content * {
  color: #ffffff !important;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.7) !important;
}

/* 用户消息中的Markdown样式 */
.user-message :deep(.markdown-body) {
  color: #ffffff !important;
  background: transparent;
}

.user-message :deep(.markdown-body p),
.user-message :deep(.markdown-body li),
.user-message :deep(.markdown-body span),
.user-message :deep(.markdown-body div) {
  color: #ffffff !important;
}

.user-message :deep(.markdown-body code) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff !important;
}

.user-message :deep(.markdown-body pre) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff !important;
}

.user-message :deep(.markdown-body pre code) {
  color: #ffffff !important;
}

.user-message :deep(.markdown-body blockquote) {
  color: rgba(255, 255, 255, 0.9) !important;
  border-left-color: rgba(255, 255, 255, 0.3);
}

.user-message :deep(.markdown-body table) {
  color: #ffffff !important;
}

.user-message :deep(.markdown-body table th),
.user-message :deep(.markdown-body table td) {
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff !important;
}

.user-message :deep(.markdown-body table tr) {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.user-message :deep(.markdown-body table tr:nth-child(2n)) {
  background-color: rgba(255, 255, 255, 0.1);
}

.ai-message .message-content {
  background: #ffffff;
  color: #000000;
  border-radius: 8px 8px 8px 0;
  border: 1px solid #dddddd;
}

.message-time {
  font-size: 11px;
  color: #999999;
  margin-top: 4px;
  text-align: right;
}

.chat-input {
  padding: 6px 10px;
  border-top: 1px solid #dddddd;
  display: flex;
  gap: 6px;
  background: #ffffff;
}

.chat-input .el-input {
  flex: 1;
}

.chat-input .el-input :deep(.el-textarea__inner) {
  background: #ffffff;
  border: 1px solid #dddddd;
  transition: all 0.3s;
  min-height: 48px;
  font-size: 13px;
  padding: 6px 10px;
  line-height: 1.4;
}

.chat-input .el-button {
  align-self: flex-end;
  background: #000000;
  border-color: #000000;
  color: #ffffff;
  padding: 6px 12px;
  font-size: 13px;
  height: 32px;
}

.chat-input .el-button:hover {
  background: #333333;
  border-color: #333333;
}

/* Markdown样式优化 */
:deep(.markdown-body) {
  font-size: 13px;
  line-height: 1.5;
  word-wrap: break-word;
  color: inherit;
}

:deep(.markdown-body pre) {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  padding: 12px;
  overflow: auto;
  margin: 6px 0;
}

:deep(.markdown-body code) {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  font-size: 85%;
  margin: 0;
  padding: 0.2em 0.4em;
}

:deep(.markdown-body pre code) {
  background-color: transparent;
  border: 0;
  display: inline;
  line-height: inherit;
  margin: 0;
  overflow: visible;
  padding: 0;
  word-wrap: normal;
}

:deep(.markdown-body blockquote) {
  margin: 6px 0;
  padding: 0 0.8em;
  color: inherit;
  border-left: 0.2em solid rgba(0, 0, 0, 0.1);
}

:deep(.markdown-body table) {
  border-spacing: 0;
  border-collapse: collapse;
  margin: 6px 0;
  width: 100%;
}

:deep(.markdown-body table th),
:deep(.markdown-body table td) {
  padding: 4px 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

:deep(.markdown-body table tr) {
  background-color: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

:deep(.markdown-body table tr:nth-child(2n)) {
  background-color: rgba(0, 0, 0, 0.01);
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

</style> 