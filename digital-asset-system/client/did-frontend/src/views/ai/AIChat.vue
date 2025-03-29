<template>
  <div class="ai-chat-container">
    <div class="chat-header">
      <h2>AI 智能助手</h2>
      <div class="header-controls">
        <div class="model-selector">
          <el-select v-model="selectedModel" placeholder="选择AI模型" size="small">
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
          清除对话
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
        :rows="3"
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
  height: 70vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(100, 255, 218, 0.2);
}

.chat-header {
  padding: 15px 20px;
  background: rgba(10, 25, 47, 0.8);
  border-bottom: 1px solid rgba(100, 255, 218, 0.3);
  text-align: center;
}

.chat-header h2 {
  margin: 0;
  color: #64ffda;
  font-size: 20px;
  margin-bottom: 10px;
  font-weight: 600;
}

.header-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.clear-btn {
  background-color: transparent !important;
  border-color: #ff5252 !important;
  color: #ff5252 !important;
}

.clear-btn:hover {
  background-color: rgba(255, 82, 82, 0.1) !important;
}

.clear-btn:active {
  background-color: rgba(255, 82, 82, 0.2) !important;
}

.model-selector {
  display: flex;
  justify-content: center;
}

.model-selector .el-select {
  width: 300px;
}

.model-selector :deep(.el-input__wrapper) {
  background-color: rgba(10, 25, 47, 0.6);
  box-shadow: 0 0 0 1px rgba(100, 255, 218, 0.3);
  border-color: rgba(100, 255, 218, 0.3);
}

.model-selector :deep(.el-input__inner) {
  color: #e6f1ff;
}

.model-selector :deep(.el-select__caret) {
  color: #64ffda;
}

:deep(.el-select-dropdown) {
  background-color: rgba(10, 25, 47, 0.95);
  border: 1px solid rgba(100, 255, 218, 0.2);
}

:deep(.el-select-dropdown__item) {
  color: #e6f1ff;
}

:deep(.el-select-dropdown__item.hover) {
  background-color: rgba(100, 255, 218, 0.1);
}

:deep(.el-select-dropdown__item.selected) {
  color: #64ffda;
  font-weight: bold;
  background-color: rgba(100, 255, 218, 0.1);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f8f9fa;
}

.message {
  display: flex;
  margin-bottom: 10px;
}

.user-message {
  justify-content: flex-end;
}

.message-content {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-message .message-content {
  background: rgba(10, 25, 47, 0.8);
  color: #e6f1ff;
  border-radius: 12px 12px 0 12px;
  border: 1px solid rgba(100, 255, 218, 0.3);
}

.user-message .message-content * {
  color: #e6f1ff !important;
}

.user-message .message-time {
  color: rgba(230, 241, 255, 0.7) !important;
}

/* 用户消息中的Markdown样式 */
.user-message :deep(.markdown-body) {
  color: #e6f1ff !important;
  background: transparent;
}

.user-message :deep(.markdown-body p),
.user-message :deep(.markdown-body li),
.user-message :deep(.markdown-body span),
.user-message :deep(.markdown-body div) {
  color: #e6f1ff !important;
}

.user-message :deep(.markdown-body code) {
  background-color: rgba(100, 255, 218, 0.2);
  color: #e6f1ff !important;
}

.user-message :deep(.markdown-body pre) {
  background-color: rgba(0, 0, 0, 0.3);
  color: #e6f1ff !important;
}

.user-message :deep(.markdown-body pre code) {
  color: #e6f1ff !important;
}

.user-message :deep(.markdown-body blockquote) {
  color: rgba(230, 241, 255, 0.9) !important;
  border-left-color: rgba(100, 255, 218, 0.5);
}

.user-message :deep(.markdown-body table) {
  color: #e6f1ff !important;
}

.user-message :deep(.markdown-body table th),
.user-message :deep(.markdown-body table td) {
  border-color: rgba(100, 255, 218, 0.3);
  color: #e6f1ff !important;
}

.user-message :deep(.markdown-body table tr) {
  background-color: rgba(0, 0, 0, 0.2);
  border-color: rgba(100, 255, 218, 0.3);
}

.user-message :deep(.markdown-body table tr:nth-child(2n)) {
  background-color: rgba(0, 0, 0, 0.1);
}

.ai-message .message-content {
  background: #fff;
  color: #333;
  border-radius: 12px 12px 12px 0;
  border: 1px solid #e4e7ed;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  text-align: right;
}

.chat-input {
  padding: 20px;
  border-top: 1px solid rgba(100, 255, 218, 0.2);
  display: flex;
  gap: 10px;
  background: rgba(10, 25, 47, 0.05);
}

.chat-input .el-input {
  flex: 1;
}

.chat-input .el-input :deep(.el-textarea__inner) {
  background: #fff;
  border: 1px solid #dcdfe6;
  transition: all 0.3s;
}

.chat-input .el-input :deep(.el-textarea__inner:focus) {
  border-color: #64ffda;
  box-shadow: 0 0 0 2px rgba(100, 255, 218, 0.2);
}

.chat-input .el-button {
  align-self: flex-end;
  background: #0a192f;
  border-color: #0a192f;
  color: #64ffda;
}

.chat-input .el-button:hover {
  background: rgba(10, 25, 47, 0.9);
  border-color: #64ffda;
}

/* Markdown样式覆盖 */
:deep(.markdown-body) {
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  color: inherit;
}

:deep(.markdown-body pre) {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  margin: 8px 0;
}

:deep(.markdown-body code) {
  background-color: rgba(0, 0, 0, 0.1);
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

:deep(.markdown-body pre > code) {
  background-color: transparent;
  border: 0;
  display: block;
  margin: 0;
  overflow: auto;
  padding: 0;
  white-space: pre;
  word-break: normal;
  word-wrap: normal;
}

:deep(.markdown-body blockquote) {
  margin: 8px 0;
  padding: 0 1em;
  color: inherit;
  border-left: 0.25em solid rgba(0, 0, 0, 0.2);
}

:deep(.markdown-body table) {
  border-spacing: 0;
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
}

:deep(.markdown-body table th),
:deep(.markdown-body table td) {
  padding: 6px 13px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

:deep(.markdown-body table tr) {
  background-color: rgba(0, 0, 0, 0.05);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

:deep(.markdown-body table tr:nth-child(2n)) {
  background-color: rgba(0, 0, 0, 0.02);
}

/* 自定义滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(10, 25, 47, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 255, 218, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 255, 218, 0.5);
}

</style> 