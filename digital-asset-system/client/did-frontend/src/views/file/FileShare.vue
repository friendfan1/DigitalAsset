<template>
  <div class="file-share">
    <h1 class="page-title">文件共享</h1>
    
    <!-- 选项卡 -->
    <el-tabs v-model="activeTab" class="share-tabs">
      <el-tab-pane label="我的共享" name="myShares">
        <div class="tab-content">
          <h2 class="section-title">我的共享资产</h2>
          
          <!-- 加载状态 -->
          <div v-if="isLoadingMyShares" class="loading-state">
            <el-skeleton :rows="3" animated />
          </div>
          
          <!-- 共享资产列表 -->
          <div v-else-if="myShares.length > 0" class="assets-list">
            <el-table :data="myShares" style="width: 100%">
              <el-table-column prop="name" label="文件名" min-width="180" />
              <el-table-column prop="sharingType" label="共享类型" width="120">
                <template #default="scope">
                  <el-tag 
                    :type="scope.row.sharingType === 'public' ? 'success' : 'warning'"
                  >
                    {{ scope.row.sharingType === 'public' ? '公开' : '私有' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="shareDate" label="共享日期" width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.shareDate) }}
                </template>
              </el-table-column>
              <el-table-column prop="accessCount" label="访问次数" width="120" />
              <el-table-column label="操作" width="220">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="viewShareDetails(scope.row)"
                  >
                    查看
                  </el-button>
                  <el-button 
                    size="small" 
                    type="warning" 
                    @click="manageShareAccess(scope.row)"
                  >
                    管理权限
                  </el-button>
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="removeShare(scope.row)"
                  >
                    取消共享
                  </el-button>
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="shareAsset(scope.row)"
                  >
                    共享
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                layout="prev, pager, next"
                :total="mySharesTotal"
                :current-page="mySharesPage"
                :page-size="pageSize"
                @current-change="handleMySharesPageChange"
              />
            </div>
          </div>
          
          <!-- 没有资产时显示 -->
          <el-empty v-else description="您还没有共享的资产" />
          
          <!-- 底部操作按钮 -->
          <div class="action-buttons">
            <el-button type="primary" @click="showShareNewDialog">共享新资产</el-button>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="共享给我的" name="sharedWithMe">
        <div class="tab-content">
          <h2 class="section-title">共享给我的资产</h2>
          
          <!-- 加载状态 -->
          <div v-if="isLoadingSharedWithMe" class="loading-state">
            <el-skeleton :rows="3" animated />
          </div>
          
          <!-- 共享给我的资产列表 -->
          <div v-else-if="sharedWithMe.length > 0" class="assets-list">
            <el-table :data="sharedWithMe" style="width: 100%">
              <el-table-column prop="name" label="文件名" min-width="180" />
              <el-table-column prop="owner" label="所有者" width="180" />
              <el-table-column prop="shareDate" label="共享日期" width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.shareDate) }}
                </template>
              </el-table-column>
              <el-table-column prop="permissions" label="权限" width="120">
                <template #default="scope">
                  <el-tag 
                    :type="scope.row.permissions.includes('write') ? 'danger' : 'info'"
                  >
                    {{ scope.row.permissions.includes('write') ? '读写' : '只读' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="viewSharedAsset(scope.row)"
                  >
                    查看
                  </el-button>
                  <el-button 
                    v-if="scope.row.permissions.includes('write')"
                    size="small" 
                    type="warning" 
                    @click="editSharedAsset(scope.row)"
                  >
                    编辑
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                layout="prev, pager, next"
                :total="sharedWithMeTotal"
                :current-page="sharedWithMePage"
                :page-size="pageSize"
                @current-change="handleSharedWithMePageChange"
              />
            </div>
          </div>
          
          <!-- 没有资产时显示 -->
          <el-empty v-else description="没有共享给您的资产" />
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 共享新资产对话框 -->
    <el-dialog
      v-model="shareNewDialogVisible"
      title="共享新资产"
      width="50%"
    >
      <div class="share-dialog-content">
        <!-- 选择资产 -->
        <div class="asset-selection">
          <h3>选择要共享的资产</h3>
          <el-select
            v-model="selectedAssetId"
            placeholder="请选择数字资产"
            style="width: 100%"
          >
            <el-option
              v-for="asset in userAssets"
              :key="asset.tokenId"
              :label="asset.metadata.fileName"
              :value="asset.tokenId"
            />
          </el-select>
        </div>
        
        <!-- 共享设置 -->
        <div class="share-settings">
          <h3>共享设置</h3>
          <el-form :model="shareSettings" label-width="120px">
            <el-form-item label="共享类型">
              <el-radio-group v-model="shareSettings.type">
                <el-radio label="public">公开共享</el-radio>
                <el-radio label="private">指定用户</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item v-if="shareSettings.type === 'private'" label="共享用户">
              <el-select
                v-model="shareSettings.users"
                multiple
                filterable
                remote
                placeholder="输入用户地址或DID"
                :remote-method="searchUsers"
                style="width: 100%"
              >
                <el-option
                  v-for="user in userOptions"
                  :key="user.value"
                  :label="user.label"
                  :value="user.value"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="权限设置">
              <el-select v-model="shareSettings.permissions" placeholder="选择权限">
                <el-option label="只读" value="read" />
                <el-option label="读写" value="readwrite" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="过期时间">
              <el-radio-group v-model="shareSettings.expiryType">
                <el-radio label="never">永不过期</el-radio>
                <el-radio label="date">指定日期</el-radio>
              </el-radio-group>
              <el-date-picker
                v-if="shareSettings.expiryType === 'date'"
                v-model="shareSettings.expiryDate"
                type="datetime"
                placeholder="选择过期日期和时间"
                style="width: 100%; margin-top: 10px"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="shareNewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="shareAsset" :loading="isSharing">
            共享
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 共享详情对话框 -->
    <el-dialog
      v-model="shareDetailsDialogVisible"
      title="共享详情"
      width="50%"
    >
      <div v-if="currentShare" class="share-details">
        <div class="share-info">
          <p><strong>文件名：</strong>{{ currentShare.name }}</p>
          <p><strong>共享类型：</strong>{{ currentShare.sharingType === 'public' ? '公开' : '私有' }}</p>
          <p><strong>共享日期：</strong>{{ formatDate(currentShare.shareDate) }}</p>
          <p><strong>访问次数：</strong>{{ currentShare.accessCount }}</p>
          
          <div v-if="currentShare.sharingType === 'private'">
            <h3>已共享给的用户</h3>
            <el-table :data="currentShare.sharedUsers" style="width: 100%">
              <el-table-column prop="address" label="用户地址" width="240" />
              <el-table-column prop="permissions" label="权限" width="100">
                <template #default="scope">
                  {{ scope.row.permissions === 'readwrite' ? '读写' : '只读' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="removeSharedUser(scope.row)"
                  >
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <div class="share-link" v-if="currentShare.sharingType === 'public'">
            <h3>共享链接</h3>
            <el-input
              v-model="currentShare.shareLink"
              readonly
            >
              <template #append>
                <el-button @click="copyShareLink">复制</el-button>
              </template>
            </el-input>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService';
import { useWalletStore } from '@/stores/wallet';
import { useSharingService } from '@/services/SharingService';
import { useRouter } from 'vue-router';

// 标签页状态
const activeTab = ref('myShares');

// 分页常量
const pageSize = 10;

// 我的共享状态
const myShares = ref<any[]>([]);
const mySharesTotal = ref(0);
const mySharesPage = ref(1);
const isLoadingMyShares = ref(false);

// 共享给我的状态
const sharedWithMe = ref<any[]>([]);
const sharedWithMeTotal = ref(0);
const sharedWithMePage = ref(1);
const isLoadingSharedWithMe = ref(false);

// 可共享的资产列表
const userAssets = ref<any[]>([]);

// 共享新资产对话框
const shareNewDialogVisible = ref(false);
const selectedAssetId = ref('');
const userOptions = ref<{label: string; value: string}[]>([]);
const isSharing = ref(false);

// 共享设置
const shareSettings = reactive({
  type: 'public',
  users: [] as string[],
  permissions: 'read',
  expiryType: 'never',
  expiryDate: null as Date | null
});

// 共享详情对话框
const shareDetailsDialogVisible = ref(false);
const currentShare = ref<any>(null);

// 钱包 store
const walletStore = useWalletStore();
// 共享服务
const sharingService = useSharingService();

// 路由
const router = useRouter();

// 方法
const formatDate = (timestamp: number | string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 加载我的共享资产
const loadMyShares = async (page = 1) => {
  isLoadingMyShares.value = true;
  try {
    const result = await sharingService.getMySharedAssets(page, pageSize);
    myShares.value = result.items;
    mySharesTotal.value = result.total;
    mySharesPage.value = page;
  } catch (error) {
    console.error('加载共享资产失败:', error);
    ElMessage.error('加载共享资产失败');
  } finally {
    isLoadingMyShares.value = false;
  }
};

// 加载共享给我的资产
const loadSharedWithMe = async (page = 1) => {
  isLoadingSharedWithMe.value = true;
  try {
    const result = await sharingService.getAssetsSharedWithMe(page, pageSize);
    sharedWithMe.value = result.items;
    sharedWithMeTotal.value = result.total;
    sharedWithMePage.value = page;
  } catch (error) {
    console.error('加载共享给我的资产失败:', error);
    ElMessage.error('加载共享给我的资产失败');
  } finally {
    isLoadingSharedWithMe.value = false;
  }
};

// 加载可共享的资产
const loadUserAssets = async () => {
  try {
    const service = await getDigitalAssetService();
    const isHealthy = await service.checkIPFSHealth();
    if (!isHealthy) {
      ElMessage.error('IPFS节点不可用，请稍后再试');
      return;
    }
    const assets = await service.getUserAssets();
    userAssets.value = assets.assets || [];
  } catch (error) {
    console.error('加载用户资产失败:', error);
    ElMessage.error('加载用户资产失败');
  }
};

// 页码变化处理
const handleMySharesPageChange = (page: number) => {
  loadMyShares(page);
};

const handleSharedWithMePageChange = (page: number) => {
  loadSharedWithMe(page);
};

// 显示共享新资产对话框
const showShareNewDialog = async () => {
  await loadUserAssets();
  shareNewDialogVisible.value = true;
};

// 搜索用户
const searchUsers = async (query: string) => {
  if (query) {
    // 这里应该调用API搜索用户
    // 模拟API响应
    userOptions.value = [
      { label: `${query.substring(0, 10)}...`, value: query },
      { label: '示例用户1', value: '0x1234567890abcdef1234567890abcdef12345678' },
      { label: '示例用户2', value: '0xabcdef1234567890abcdef1234567890abcdef12' }
    ];
  } else {
    userOptions.value = [];
  }
};

// 共享资产
const shareAsset = async (asset: any) => {
  if (!selectedAssetId.value) {
    ElMessage.warning('请选择要共享的资产');
    return;
  }
  
  isSharing.value = true;
  try {
    // 准备共享参数
    const shareParams: any = {
      assetId: selectedAssetId.value,
      type: shareSettings.type,
      permissions: shareSettings.permissions
    };
    
    if (shareSettings.type === 'private') {
      if (shareSettings.users.length === 0) {
        ElMessage.warning('请至少选择一个用户进行共享');
        isSharing.value = false;
        return;
      }
      shareParams.users = shareSettings.users;
    }
    
    if (shareSettings.expiryType === 'date' && shareSettings.expiryDate) {
      shareParams.expiryDate = shareSettings.expiryDate.getTime();
    }
    
    // 调用共享服务
    await sharingService.shareAsset(shareParams);
    
    ElMessage.success('资产共享成功');
    shareNewDialogVisible.value = false;
    loadMyShares(); // 重新加载共享列表
    
    // 重置表单
    selectedAssetId.value = '';
    shareSettings.type = 'public';
    shareSettings.users = [];
    shareSettings.permissions = 'read';
    shareSettings.expiryType = 'never';
    shareSettings.expiryDate = null;
  } catch (error) {
    console.error('共享资产失败:', error);
    ElMessage.error('共享资产失败');
  } finally {
    isSharing.value = false;
  }
};

// 查看共享详情
const viewShareDetails = (share: any) => {
  currentShare.value = share;
  shareDetailsDialogVisible.value = true;
};

// 管理共享权限
const manageShareAccess = (share: any) => {
  // 跳转到权限管理页面或打开管理对话框
  ElMessage.info('权限管理功能正在开发中');
};

// 取消共享
const removeShare = async (share: any) => {
  try {
    await ElMessageBox.confirm(
      '确定取消该资产的共享吗？此操作不可撤销。',
      '确认取消共享',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await sharingService.cancelSharing(share.id);
    ElMessage.success('取消共享成功');
    loadMyShares(); // 重新加载共享列表
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消共享失败:', error);
      ElMessage.error('取消共享失败');
    }
  }
};

// 移除共享用户
const removeSharedUser = async (user: any) => {
  if (!currentShare.value) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要移除对用户 ${user.address} 的共享吗？`,
      '确认移除用户',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await sharingService.removeSharedUser(currentShare.value.id, user.address);
    ElMessage.success('移除用户成功');
    
    // 更新当前显示的共享用户列表
    currentShare.value.sharedUsers = currentShare.value.sharedUsers.filter(
      (u: any) => u.address !== user.address
    );
    
    loadMyShares(); // 重新加载共享列表
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除用户失败:', error);
      ElMessage.error('移除用户失败');
    }
  }
};

// 复制共享链接
const copyShareLink = () => {
  if (!currentShare.value || !currentShare.value.shareLink) return;
  
  navigator.clipboard.writeText(currentShare.value.shareLink)
    .then(() => {
      ElMessage.success('链接已复制到剪贴板');
    })
    .catch(err => {
      console.error('复制失败:', err);
      ElMessage.error('复制失败');
    });
};

// 查看共享给我的资产
const viewSharedAsset = (asset: any) => {
  // 打开资产查看页面或对话框
  ElMessage.info('资产查看功能正在开发中');
};

// 编辑共享给我的资产
const editSharedAsset = (asset: any) => {
  // 打开资产编辑页面或对话框
  ElMessage.info('资产编辑功能正在开发中');
};

// 初始化
onMounted(async () => {
  await loadMyShares();
  await loadSharedWithMe();
});
</script>

<style scoped lang="scss">
.file-share {
  padding: 20px;
  
  .page-title {
    margin-bottom: 20px;
    font-size: 24px;
    color: #303133;
  }
  
  .share-tabs {
    margin-bottom: 20px;
  }
  
  .tab-content {
    min-height: 300px;
  }
  
  .section-title {
    margin-bottom: 16px;
    font-size: 18px;
    color: #303133;
  }
  
  .loading-state {
    padding: 20px 0;
  }
  
  .assets-list {
    margin-bottom: 20px;
  }
  
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
  
  .action-buttons {
    margin-top: 20px;
    text-align: right;
  }
  
  .share-dialog-content {
    .asset-selection, .share-settings {
      margin-bottom: 24px;
      
      h3 {
        margin-bottom: 16px;
        font-size: 16px;
        color: #303133;
      }
    }
  }
  
  .share-details {
    .share-info {
      p {
        margin-bottom: 12px;
        line-height: 1.5;
      }
      
      h3 {
        margin: 20px 0 12px;
        font-size: 16px;
        color: #303133;
      }
      
      .share-link {
        margin-top: 20px;
      }
    }
  }
}
</style>
