<template>
  <div class="ai-chat-container">
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
        <el-avatar v-if="message.role === 'assistant'" :src="botAvatar" />
        <el-avatar v-else icon="el-icon-user" />
        <div class="message-content">{{ message.content }}</div>
      </div>
    </div>

    <div class="chat-input">
      <el-input
        v-model="userInput"
        type="textarea"
        :rows="3"
        placeholder="请输入您的问题..."
        @keyup.enter.ctrl="sendMessage"
      />
      <el-button 
        type="primary" 
        :loading="loading"
        @click="sendMessage"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const botAvatar = ref('/bot-avatar.png') // 机器人头像路径
const userInput = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: '你好!我是你的AI助手,请问有什么可以帮你?'
  }
])

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (!userInput.value.trim()) return
  
  const userMessage = userInput.value
  messages.value.push({
    role: 'user',
    content: userMessage
  })
  
  userInput.value = ''
  scrollToBottom()
  
  try {
    loading.value = true
    const token = userStore.profile?.token
    
    const response = await axios.post(
      'https://api.siliconflow.com/v1/chat/completions',
      {
        messages: messages.value,
        model: 'gpt-3.5-turbo',
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const assistantMessage = response.data.choices[0].message
    messages.value.push({
      role: 'assistant',
      content: assistantMessage.content
    })
    
    scrollToBottom()
  } catch (error) {
    ElMessage.error('发送消息失败,请稍后重试')
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped lang="scss">
.ai-chat-container {
  height: calc(100vh - 100px);
  padding: 20px;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: white;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
    
    .message {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20px;
      
      &.user {
        flex-direction: row-reverse;
        
        .message-content {
          margin-right: 10px;
          background: #e6f3ff;
        }
      }
      
      &.assistant .message-content {
        margin-left: 10px;
        background: #f4f4f5;
      }
      
      .message-content {
        padding: 12px 16px;
        border-radius: 8px;
        max-width: 80%;
        word-break: break-word;
      }
    }
  }

  .chat-input {
    display: flex;
    gap: 10px;
    
    .el-input {
      flex: 1;
    }
    
    .el-button {
      align-self: flex-end;
    }
  }
}

@media (max-width: 768px) {
  .ai-chat-container {
    padding: 10px;
    height: calc(100vh - 80px);
    
    .chat-messages {
      padding: 10px;
      
      .message {
        .message-content {
          max-width: 90%;
        }
      }
    }
  }
}
</style>
