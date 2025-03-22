import { ethers } from 'ethers';

export class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async connectWallet() {
    try {
      // 检查是否安装了MetaMask
      if (typeof window.ethereum === 'undefined') {
        throw new Error('请安装MetaMask钱包');
      }

      // 连接钱包
      this.provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // 获取签名者
      this.signer = await this.provider.getSigner();
      
      // 获取钱包地址
      const address = await this.signer.getAddress();
      
      return {
        address,
        provider: this.provider,
        signer: this.signer
      };
    } catch (error) {
      console.error('钱包连接失败:', error);
      throw error;
    }
  }

  async getAddress(): Promise<string | null> {
    try {
      if (!this.signer) return null;
      return await this.signer.getAddress();
    } catch (error) {
      return null;
    }
  }
}

export const walletService = new WalletService();
