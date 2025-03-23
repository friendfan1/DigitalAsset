<template>
  <div class="wallet-binding">
    <div v-if="!userProfile?.walletAddress">
      <el-input v-model="walletAddress" placeholder="请输入钱包地址"></el-input>
      <el-button @click="bindWallet" :loading="binding">绑定钱包</el-button>
    </div>
    <div v-else>
      <div>当前绑定钱包: {{ userProfile.walletAddress }}</div>
      <el-button @click="unbindWallet" :loading="unbinding">解绑钱包</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';

const userStore = useUserStore();
const userProfile = computed(() => userStore.profile);
const walletAddress = ref('');
const binding = ref(false);
const unbinding = ref(false);

const bindWallet = async () => {
  if (!walletAddress.value) {
    ElMessage.warning('请输入钱包地址');
    return;
  }
  
  binding.value = true;
  try {
    const success = await userStore.bindWallet(walletAddress.value);
    if (success) {
      ElMessage.success('钱包绑定成功');
      walletAddress.value = '';
    } else {
      ElMessage.error('钱包绑定失败');
    }
  } catch (error) {
    ElMessage.error('钱包绑定失败');
    console.error(error);
  } finally {
    binding.value = false;
  }
};

const unbindWallet = async () => {
  unbinding.value = true;
  try {
    const success = await userStore.unbindWallet();
    if (success) {
      ElMessage.success('钱包解绑成功');
    } else {
      ElMessage.error('钱包解绑失败');
    }
  } catch (error) {
    ElMessage.error('钱包解绑失败');
    console.error(error);
  } finally {
    unbinding.value = false;
  }
};
</script>
