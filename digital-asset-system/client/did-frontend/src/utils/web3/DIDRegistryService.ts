// utils/web3/DIDRegistryServices.ts
import { ethers } from 'ethers';
import { DIDRegistry__factory } from '@/contracts/types';
import type { DIDRegistry } from '@/contracts/types/DIDRegistry';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ElMessage } from 'element-plus';
import type { DIDDocument } from '@/types/web3';
import { BaseWeb3Service } from '@/services/BaseWeb3Service';
import { web3Config } from '@/config/web3.config';
//import type { DIDDetails, ReputationChange } from '@/t ypes/global';
// 使用合约生成的类型
export type { DIDCreatedEvent } from '@/contracts/types/DIDRegistry';

export class DIDRegistryService extends BaseWeb3Service {
  private contract: DIDRegistry
  private eventListeners: Array<() => void> = []

  constructor(provider: ethers.BrowserProvider, signer: ethers.Signer) {
    super(provider, signer, web3Config)
    this.contract = DIDRegistry__factory.connect(
      CONTRACT_ADDRESSES.DIDRegistry,
      signer
    )
    this.setupEventListeners()
  }

  private setupEventListeners() {
    const didCreatedListener = this.contract.filters.DIDCreated()
    this.contract.on(didCreatedListener, (user, docHash, timestamp) => {
      console.log('DID Created:', { user, docHash, timestamp })
    })
    this.eventListeners.push(() => this.contract.off(didCreatedListener))
  }

  async createDID(docData: DIDDocument): Promise<{ did: string; txHash: string }> {
    await this.ensureConnection()

    return this.withRetry(async () => {
      try {
        // 验证合约
        if (!await this.isContractInitialized()) {
          throw new Error('合约未正确部署或初始化');
        }

        // 验证网络
        const network = await this.provider.getNetwork();
        console.log('Current network:', network);
        
        // Ganache 的默认 Chain ID 是 1337
        if (network.chainId !== 1337n) {
            throw new Error('请连接到 Ganache 网络');
        }

        // 验证文档格式
        this.validateDIDDocument(docData)
        console.log('docData', docData)
        // 生成标准化哈希
        const docHash = ethers.keccak256(
          ethers.toUtf8Bytes(JSON.stringify(docData))
        )
        console.log('docHash', docHash)

        // 获取质押金额
        const stakeAmount = await this.contract.STAKE_AMOUNT()
        console.log('stakeAmount', stakeAmount)
        // 检查余额
        const signer = await this.signer.getAddress()
        const balance = await this.provider.getBalance(signer)
        console.log('Account:', signer)
        console.log('Balance:', ethers.formatEther(balance))
        
        if (balance < stakeAmount) {
          throw new Error(`余额不足，需要 ${ethers.formatEther(stakeAmount)} ETH，当前余额 ${ethers.formatEther(balance)} ETH`)
        }

        // 检查 DID 状态
        const didDetails = await this.contract.getDIDDetails(signer);
        console.log('DID Details:', {
          owner: didDetails[0],
          docHash: didDetails[1],
          created: Number(didDetails[2]),
          reputation: Number(didDetails[3]),
          active: didDetails[4]
        });

        // 检查 owner 是否为零地址
        if (didDetails[0] === '0x0000000000000000000000000000000000000000') {
          console.log('DID 未创建，可以继续');
        } else {
          if (didDetails[4]) {
            throw new Error(`该地址(${signer})已经注册了DID，请使用新的地址`);
          }
        }

        // 发送交易
        try {
          // 先尝试估算 gas
          const gasEstimate = await this.contract.createDID.estimateGas(docHash, {
            value: stakeAmount,
            from: await this.signer.getAddress()  // 显式指定发送者
          });
          console.log('Estimated gas:', gasEstimate);

          // 检查合约地址
          console.log('Contract address:', this.contract.target);
          console.log('Signer address:', await this.signer.getAddress());
          console.log('DocHash:', docHash);
          console.log('Stake amount:', ethers.formatEther(stakeAmount));

          const tx = await this.contract.createDID(docHash, {
            value: stakeAmount,
            gasLimit: gasEstimate * 120n / 100n // 增加 20% 的 gas 限制
          });
          console.log('tx', tx);
          // 监控交易
          const receipt = await this.monitorTransaction(tx, 'DID 创建')
          if (!receipt) throw new Error('交易回执为空')
          
          // 解析事件
          const event = receipt.logs[0]
          if (!event) throw new Error('未找到交易日志')

          const parsedLog = this.contract.interface.parseLog({
            topics: event.topics,
            data: event.data
          })

          if (!parsedLog) throw new Error('无法解析交易日志')

          return {
            did: `did:example:${parsedLog.args[0]}`,
            txHash: receipt.hash
          }
        } catch (error) {
          throw await this.handleError(error)
        }
      } catch (error) {
        throw await this.handleError(error)
      }
    })
  }

  async verifyDID(user: string, docHash: string): Promise<boolean> {
    await this.ensureConnection()

    return this.withRetry(async () => {
      try {
        const bytes32Hash = ethers.hexlify(ethers.toBeHex(docHash, 32))
        return await this.contract.verifyDID(user, bytes32Hash)
      } catch (error) {
        throw await this.handleError(error)
      }
    })
  }

  async getStakeAmount(): Promise<bigint> {
    return this.contract.STAKE_AMOUNT()
  }

  async getCurrentAddress(): Promise<string> {
    return this.signer.getAddress()
  }

  async isContractInitialized(): Promise<boolean> {
    try {
      const code = await this.provider.getCode(this.contract.target);
      console.log('Contract code:', code);
      return code !== '0x';
    } catch (error) {
      console.error('Contract initialization check failed:', error);
      return false;
    }
  }

  private validateDIDDocument(doc: DIDDocument) {
    if (!doc['@context'] || !doc.id || !doc.created) {
      throw new Error('无效的 DID 文档格式')
    }

    if (!doc.verificationMethod || !Array.isArray(doc.verificationMethod)) {
      throw new Error('无效的验证方法')
    }

    if (!doc.authentication || !Array.isArray(doc.authentication)) {
      throw new Error('无效的认证方法')
    }
  }

  // 清理事件监听器
  destroy() {
    this.eventListeners.forEach(removeListener => removeListener())
    this.eventListeners = []
  }

  async getDIDInfo(address: string) {
    await this.ensureConnection()

    return this.withRetry(async () => {
      try {
        const didDetails = await this.contract.getDIDDetails(address)
        
        // 如果 owner 是零地址，说明 DID 不存在
        if (didDetails[0] === '0x0000000000000000000000000000000000000000') {
          return null
        }

        return {
          owner: didDetails[0],
          docHash: didDetails[1],
          created: new Date(Number(didDetails[2]) * 1000), // 转换为 JavaScript Date 对象
          reputation: Number(didDetails[3]),
          active: didDetails[4],
          did: `did:example:${address}`
        }
      } catch (error) {
        throw await this.handleError(error)
      }
    })
  }
}

// 带缓存的工厂函数
let serviceInstance: DIDRegistryService | null = null

export const getDIDRegistryService = async () => {
  if (!serviceInstance) {
    if (!window.ethereum) throw new Error('请安装MetaMask')
    
    const provider = new ethers.BrowserProvider(window.ethereum)
    await provider.send("eth_requestAccounts", []) // 自动请求账户
    const signer = await provider.getSigner()
    
    serviceInstance = new DIDRegistryService(provider, signer)
  }
  return serviceInstance
}
