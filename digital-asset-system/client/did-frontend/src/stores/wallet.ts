import { defineStore } from 'pinia';
import { ethers, BrowserProvider } from 'ethers';
import { markRaw } from 'vue';

// 类型声明扩展window对象
declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    address: '',
    chainId: 0,
    provider: null as BrowserProvider | null,
    signer: null as ethers.Signer | null,
    listeners: {
      accountsChanged: null as ((accounts: string[]) => void) | null,
      chainChanged: null as ((chainId: string) => void) | null,
    },
  }),

  getters: {
    isConnected: (state) => !!state.address,
  },

  actions: {
    async connectMetaMask() {
      const { ethereum } = window;

      if (!ethereum) {
        throw new Error('未检测到 Ethereum 提供者');
      }

      if (!ethereum.isMetaMask) {
        throw new Error('请安装 MetaMask 扩展');
      }

      try {
        // 清理旧监听器
        this.cleanupListeners();

        // 请求账户访问
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts'
        }) as string[];
        console.log('accounts:', accounts);

        if (!accounts?.length) {
          console.log('未获取到账户');
          throw new Error('未获取到账户');
        }

        // 初始化 provider
        const provider = markRaw(new BrowserProvider(ethereum));
        const network = await provider.getNetwork();
        const signer = markRaw(await provider.getSigner());
        console.log('signer:', signer);
        console.log('provider:', provider);
        console.log('network:', network);
        // 验证签名能力
        await signer.signMessage('INIT_TEST');
        
        // 处理链ID转换
        const chainId = this.parseChainId(network.chainId);

        // 更新状态
        this.address = accounts[0];
        this.chainId = chainId;
        this.provider = provider;
        this.signer = signer;

        // 设置事件监听
        this.setupListeners();

      } catch (error) {
        console.error('钱包连接失败:', error);
        throw error;
      }
    },

    disconnect() {
      try {
        // 清理状态
        this.address = '';
        this.chainId = 0;
        this.provider = null;
        this.signer = null;
        
        // 移除所有监听器
        this.cleanupListeners();
        
        console.log('钱包已断开连接');
      } catch (error) {
        console.error('断开连接错误:', error);
        throw error;
      }
    },

    // 设置事件监听
    setupListeners() {
      const { ethereum } = window;

      // 账户变化监听
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.address = accounts[0];
        }
      };

      // 网络变化监听
      const handleChainChanged = (chainId: string) => {
        this.chainId = this.parseChainId(chainId);
      };

      // 绑定监听器
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      // 保存监听器引用
      this.listeners = {
        accountsChanged: handleAccountsChanged,
        chainChanged: handleChainChanged
      };
    },

    // 清理事件监听
    cleanupListeners() {
      const { ethereum } = window;
      
      if (ethereum) {
        if (this.listeners.accountsChanged) {
          ethereum.removeListener('accountsChanged', this.listeners.accountsChanged);
        }
        if (this.listeners.chainChanged) {
          ethereum.removeListener('chainChanged', this.listeners.chainChanged);
        }
      }
      
      this.listeners = { accountsChanged: null, chainChanged: null };
    },

    // 转换链ID格式
    parseChainId(chainId: string | number | bigint): number {
      if (typeof chainId === 'bigint') {
        return Number(chainId);
      }
      if (typeof chainId === 'string' && chainId.startsWith('0x')) {
        return parseInt(chainId, 16);
      }
      return Number(chainId);
    }
  }
});
