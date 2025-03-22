<template>
  <div class="address-display">
    <el-tooltip
      :content="copySuccess ? '已复制!' : '点击复制'"
      placement="top"
    >
      <div class="address-content" @click="copyToClipboard">
        <span class="short-text">{{ shortText }}</span>
        <el-icon class="copy-icon"><DocumentCopy /></el-icon>
      </div>
    </el-tooltip>
    
    <el-dialog
      v-model="dialogVisible"
      :title="title"
      width="500px"
    >
      <div class="full-address">
        <p>{{ text }}</p>
        <el-button type="primary" @click="copyToClipboard">
          <el-icon><DocumentCopy /></el-icon>
          复制
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { shortenAddress } from '@/utils/address'

const props = defineProps<{
  text: string
  title?: string
  shortenLength?: number
}>()

const dialogVisible = ref(false)
const copySuccess = ref(false)

const shortText = computed(() => {
  return props.text.startsWith('did:') 
    ? `${props.text.slice(0, 15)}...${props.text.slice(-8)}`
    : shortenAddress(props.text, props.shortenLength || 4)
})

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.text)
    copySuccess.value = true
    ElMessage.success('复制成功')
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped lang="scss">
.address-display {
  display: inline-block;
  
  .address-content {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: var(--el-fill-color-light);
      
      .copy-icon {
        opacity: 1;
      }
    }
  }
  
  .copy-icon {
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 14px;
  }
}

.full-address {
  word-break: break-all;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  
  p {
    font-family: monospace;
    background: var(--el-fill-color-light);
    padding: 12px;
    border-radius: 4px;
    width: 100%;
    text-align: center;
  }
}
</style>
