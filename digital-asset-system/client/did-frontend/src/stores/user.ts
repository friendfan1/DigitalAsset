import { defineStore } from 'pinia'
//import { encrypt, decrypt } from '@/utils/crypto' // 添加加密工具
import axios from 'axios'

type UserRole = 'user' | 'auditor' | 'admin'
export type verificationstate = 'NOT_SUBMITTED' | 'VERIFIED' | 'PENDING_REVIEW'

type UserProfile = {
  userId: number
  username: string
  email: string
  USCC: string
  role: UserRole
  token: string
  createdAt: Date
  verifications: verificationstate
  walletAddress: string
  did: string
}


export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null as UserProfile | null,
  }),
  getters: {
    isLoggedIn(state): boolean {
      return !!state.profile?.token
    },
    isAdmin(state): boolean {
      return state.profile?.role === 'admin'
    },
    isVerification(state): boolean {
      return state.profile?.verifications === 'VERIFIED'
    }
  },

  actions: {
    // 初始化时从安全存储加载
    initialize() {
      const Profile = localStorage.getItem('userProfile')
      if (Profile) {
        try {
            this.profile = JSON.parse(Profile);
            console.log('加载的用户信息:', this.profile); // 调试用
        } catch (error: any) {
            console.error('解析用户信息出错:', error);
            this.clearUser();
        }
      } else {
        console.log('本地存储中没有用户信息');
      }
    },

    // 设置用户信息
    async setAuthData(authData: UserProfile) {
      console.log('后端设置用户信息:', authData.username); // 调试用
      // 将 createdAt 转换为 Date 类型
      const newProfile = {
        ...authData,
        createdAt: new Date(authData.createdAt)
      };
      this.profile = newProfile;
      console.log('前端接口用户信息:', this.profile); // 调试用
      localStorage.setItem('userProfile', JSON.stringify(this.profile));
    },

    // 清除用户数据
    clearUser() {
      this.profile = null
      localStorage.removeItem('userProfile')
    },

    // 更新用户资料
    async updateProfile(updateData: Partial<UserProfile>) {
      if (!this.profile) return
      
      this.profile = { ...this.profile, ...updateData }
      localStorage.setItem('userProfile', JSON.stringify(this.profile))
    },

    // 绑定钱包
    async bindWallet(walletAddress: string) {
      try {
        const response = await axios.post('/api/bind-web3-address', { address: walletAddress });
        if (response.data.success) {
          if (this.profile) {
            this.profile.walletAddress = walletAddress;
            localStorage.setItem('userProfile', JSON.stringify(this.profile));
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('绑定钱包失败:', error);
        return false;
      }
    },
    
    // 解绑钱包
    async unbindWallet() {
      try {
        const response = await axios.post('/api/unbind-wallet');
        if (response.data.success) {
          if (this.profile) {
            this.profile.walletAddress = '';
            localStorage.setItem('userProfile', JSON.stringify(this.profile));
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('解绑钱包失败:', error);
        return false;
      }
    }
  }
})
