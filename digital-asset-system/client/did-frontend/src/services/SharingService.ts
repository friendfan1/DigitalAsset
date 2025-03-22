import { ref } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import { getDigitalAssetService } from '@/utils/web3/DigitalAssetService';
import { ElMessage } from 'element-plus';

// 共享的资产类型定义
export interface SharedAsset {
  id: string;
  name: string;
  tokenId: string;
  owner: string;
  cid: string;
  sharingType: 'public' | 'private';
  permissions: string[];
  shareDate: number;
  expiryDate?: number;
  accessCount: number;
  sharedUsers?: SharedUser[];
  shareLink?: string;
}

// 共享用户类型定义
export interface SharedUser {
  address: string;
  permissions: string;
  sharedDate: number;
  lastAccess?: number;
}

// 共享请求参数类型
export interface ShareAssetParams {
  assetId: string;
  type: 'public' | 'private';
  permissions: string;
  users?: string[];
  expiryDate?: number;
}

// 共享服务
class SharingService {
  private mockData = ref({
    myShares: [] as SharedAsset[],
    sharedWithMe: [] as SharedAsset[]
  });

  constructor() {
    // 初始化模拟数据
    this.initMockData();
  }

  // 初始化模拟数据 (仅用于演示，实际项目应通过API获取)
  private initMockData() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // 模拟我的共享资产
    this.mockData.value.myShares = [
      {
        id: '1',
        name: '企业战略规划.pdf',
        tokenId: '1',
        owner: '0x1234567890abcdef1234567890abcdef12345678',
        cid: 'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        sharingType: 'public',
        permissions: ['read'],
        shareDate: now - 7 * day,
        accessCount: 12,
        shareLink: 'https://example.com/share/1234567890'
      },
      {
        id: '2',
        name: '财务分析报告2023.xlsx',
        tokenId: '2',
        owner: '0x1234567890abcdef1234567890abcdef12345678',
        cid: 'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        sharingType: 'private',
        permissions: ['read', 'write'],
        shareDate: now - 3 * day,
        accessCount: 5,
        sharedUsers: [
          {
            address: '0xabcdef1234567890abcdef1234567890abcdef12',
            permissions: 'read',
            sharedDate: now - 3 * day,
            lastAccess: now - day
          },
          {
            address: '0x9876543210fedcba9876543210fedcba98765432',
            permissions: 'readwrite',
            sharedDate: now - 2 * day,
            lastAccess: now
          }
        ]
      }
    ];

    // 模拟共享给我的资产
    this.mockData.value.sharedWithMe = [
      {
        id: '3',
        name: '市场调研数据.docx',
        tokenId: '3',
        owner: '0xabcdef1234567890abcdef1234567890abcdef12',
        cid: 'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        sharingType: 'private',
        permissions: ['read'],
        shareDate: now - 5 * day,
        accessCount: 3
      },
      {
        id: '4',
        name: '产品规格说明书.pdf',
        tokenId: '4',
        owner: '0x9876543210fedcba9876543210fedcba98765432',
        cid: 'QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        sharingType: 'private',
        permissions: ['read', 'write'],
        shareDate: now - day,
        accessCount: 1
      }
    ];
  }

  /**
   * 获取我共享的资产
   */
  async getMySharedAssets(page = 1, pageSize = 10) {
    // 这里应该调用API获取数据
    // 但目前使用模拟数据
    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const items = this.mockData.value.myShares.slice(startIndex, endIndex);
      
      return {
        items,
        total: this.mockData.value.myShares.length,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取共享资产失败:', error);
      throw error;
    }
  }

  /**
   * 获取共享给我的资产
   */
  async getAssetsSharedWithMe(page = 1, pageSize = 10) {
    // 这里应该调用API获取数据
    // 但目前使用模拟数据
    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const items = this.mockData.value.sharedWithMe.slice(startIndex, endIndex);
      
      return {
        items,
        total: this.mockData.value.sharedWithMe.length,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取共享给我的资产失败:', error);
      throw error;
    }
  }

  /**
   * 共享资产
   */
  async shareAsset(params: ShareAssetParams) {
    // 这里应该调用API执行共享操作
    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 获取资产服务
      const assetService = await getDigitalAssetService();
      // 获取用户资产
      const userAssets = await assetService.getUserAssets();
      
      // 查找要共享的资产
      const asset = userAssets.assets.find((a: any) => a.tokenId === params.assetId);
      
      if (!asset) {
        throw new Error('资产不存在');
      }
      
      // 在实际项目中，这里应该调用区块链合约或API服务保存共享记录
      // 这里仅模拟添加到本地数据
      const now = Date.now();
      const shareId = `share_${now}_${Math.random().toString(36).substring(2, 9)}`;
      
      const newShare: SharedAsset = {
        id: shareId,
        name: asset.metadata.fileName,
        tokenId: asset.tokenId,
        owner: await assetService.getCurrentAddress(),
        cid: asset.cid,
        sharingType: params.type,
        permissions: params.permissions === 'readwrite' ? ['read', 'write'] : ['read'],
        shareDate: now,
        accessCount: 0
      };
      
      // 如果是公开共享，添加共享链接
      if (params.type === 'public') {
        newShare.shareLink = `https://example.com/share/${shareId}`;
      }
      
      // 如果是指定用户，添加用户列表
      if (params.type === 'private' && params.users && params.users.length > 0) {
        newShare.sharedUsers = params.users.map(address => ({
          address,
          permissions: params.permissions,
          sharedDate: now
        }));
      }
      
      // 如果设置了过期时间
      if (params.expiryDate) {
        newShare.expiryDate = params.expiryDate;
      }
      
      // 添加到模拟数据
      this.mockData.value.myShares.unshift(newShare);
      
      return {
        success: true,
        shareId,
        shareLink: newShare.shareLink
      };
    } catch (error) {
      console.error('共享资产失败:', error);
      throw error;
    }
  }

  /**
   * 取消共享
   */
  async cancelSharing(shareId: string) {
    // 这里应该调用API取消共享
    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 在实际项目中，这里应该调用区块链合约或API服务删除共享记录
      // 这里仅从模拟数据中删除
      const index = this.mockData.value.myShares.findIndex(share => share.id === shareId);
      
      if (index === -1) {
        throw new Error('共享记录不存在');
      }
      
      this.mockData.value.myShares.splice(index, 1);
      
      return { success: true };
    } catch (error) {
      console.error('取消共享失败:', error);
      throw error;
    }
  }

  /**
   * 移除共享用户
   */
  async removeSharedUser(shareId: string, userAddress: string) {
    // 这里应该调用API移除用户
    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 在实际项目中，这里应该调用区块链合约或API服务更新共享权限
      // 这里仅更新模拟数据
      const share = this.mockData.value.myShares.find(share => share.id === shareId);
      
      if (!share) {
        throw new Error('共享记录不存在');
      }
      
      if (!share.sharedUsers) {
        throw new Error('该共享没有用户列表');
      }
      
      const userIndex = share.sharedUsers.findIndex(user => user.address === userAddress);
      
      if (userIndex === -1) {
        throw new Error('用户不在共享列表中');
      }
      
      // 移除用户
      share.sharedUsers.splice(userIndex, 1);
      
      return { success: true };
    } catch (error) {
      console.error('移除共享用户失败:', error);
      throw error;
    }
  }
}

// 创建单例
let sharingServiceInstance: SharingService | null = null;

// 导出钩子函数，方便在Vue组件中使用
export function useSharingService() {
  if (!sharingServiceInstance) {
    sharingServiceInstance = new SharingService();
  }
  return sharingServiceInstance;
}