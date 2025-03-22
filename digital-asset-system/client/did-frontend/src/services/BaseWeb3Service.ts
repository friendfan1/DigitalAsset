import { ethers } from 'ethers';
import { ElMessage } from 'element-plus';
import type { Web3Config } from '@/types/web3';

export abstract class BaseWeb3Service {
  protected provider: ethers.BrowserProvider;
  protected signer: ethers.Signer;
  protected config: Web3Config;
  protected isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(
    provider: ethers.BrowserProvider,
    signer: ethers.Signer,
    config: Web3Config
  ) {
    this.provider = provider;
    this.signer = signer;
    this.config = config;
  }

  protected async ensureConnection() {
    if (this.isConnected) return;
    
    if (!this.connectionPromise) {
      this.connectionPromise = (async () => {
        try {
          await this.checkNetwork();
          await this.provider.send("eth_requestAccounts", []);
          this.isConnected = true;
        } finally {
          this.connectionPromise = null;
        }
      })();
    }
    
    await this.connectionPromise;
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    customAttempts?: number
  ): Promise<T> {
    const attempts = customAttempts || this.config.retry.attempts;
    let lastError;

    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        if (error.code === 'NETWORK_ERROR') {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retry.delay * (i + 1))
          );
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  protected async checkNetwork() {
    const network = await this.provider.getNetwork();
    // 不再检查网络限制，只要能连接到网络即可
    return true;
  }

  protected async monitorTransaction(
    tx: ethers.ContractTransactionResponse,
    description: string
  ) {
    const messageKey = `tx-${tx.hash}`;
    
    ElMessage({
      message: `${description}交易已发送，等待确认...`,
      type: 'info',
      duration: 0,
      showClose: true,
      onClose: () => ElMessage.closeAll()
    });

    try {
      const receipt = await tx.wait();
      ElMessage.success(`${description}成功`);
      return receipt;
    } catch (error) {
      ElMessage.error(`${description}失败`);
      throw error;
    } finally {
      ElMessage.closeAll();
    }
  }

  protected async handleError(error: any): Promise<Error> {
    console.error('Web3 Error:', error);

    if (error.data?.data) {
      try {
        const iface = new ethers.Interface(['function Error(string)']);
        const decoded = iface.parseError(error.data.data);
        return new Error(`合约错误: ${decoded?.args[0] || '未知错误'}`);
      } catch (e) {
        // 继续处理其他错误类型
      }
    }

    const errorMap: Record<string, string> = {
      ACTION_REJECTED: '用户取消操作',
      INSUFFICIENT_FUNDS: '余额不足',
      NETWORK_ERROR: '网络连接失败，请检查网络设置',
      UNPREDICTABLE_GAS_LIMIT: '无法估算 Gas 费用，请检查合约状态',
      INVALID_ARGUMENT: '参数错误',
      UNSUPPORTED_OPERATION: '不支持的操作',
      CALL_EXCEPTION: '合约调用异常，请检查合约状态',
      NONCE_EXPIRED: '交易 nonce 已过期，请刷新页面重试'
    };

    return new Error(
      errorMap[error.code] || 
      error.reason || 
      error.message || 
      '未知错误'
    );
  }
}
