// src/types/global.d.ts
import { MetaMaskInpageProvider } from '@metamask/providers'

interface Message {
  loading?: boolean; // 可选属性
}

interface EthereumProvider {
    request(args: { method: string; params?: any[] }): Promise<any>
  
    // 增强事件监听类型
    on(event: 'accountsChanged', listener: (accounts: string[]) => void): void
    on(event: 'chainChanged', listener: (chainId: string) => void): void
    on(event: 'disconnect', listener: (error: { code: number; message: string }) => void): void
    on(event: string, listener: (...args: any[]) => void): void
    
    // 移除监听
    removeListener(event: string, listener: (...args: any[]) => void): void
    
    // 其他属性
    isMetaMask?: boolean
    chainId?: string
}
  
  declare global {
    interface Window {
      ethereum?: EthereumProvider & {
        isMetaMask?: boolean
        isConnected?: () => boolean
        chainId?: string
      }
      ipfsGateway?: string
    }
  }


  // 定义 DIDDetails 类型
type DIDDetails = {
  id: string;
  owner: string;
  document: object;
};

export interface ReputationChange {
  operator: string
  delta: number
  timestamp: number
  reason: string
}