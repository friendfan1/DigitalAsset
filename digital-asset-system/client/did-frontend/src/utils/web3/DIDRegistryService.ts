// utils/web3/DIDRegistryServices.ts
import { ethers } from 'ethers';
import { DIDRegistry__factory } from '@/contracts/types';
import type { DIDRegistry } from '@/contracts/types/DIDRegistry';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ElMessage } from 'element-plus';
import type { DIDDocument } from '@/types/web3';
import { BaseWeb3Service } from '@/services/BaseWeb3Service';
import { web3Config } from '@/config/web3.config';

export class DIDRegistryService extends BaseWeb3Service {
  private contract: DIDRegistry;
  private eventListeners: Array<() => void> = [];

  constructor(provider: ethers.BrowserProvider, signer: ethers.Signer) {
    super(provider, signer, web3Config);
    this.contract = DIDRegistry__factory.connect(
      CONTRACT_ADDRESSES.DIDRegistry,
      signer
    );
    this.setupEventListeners();
  }

  private setupEventListeners() {
    const didCreatedListener = this.contract.filters.DIDRegistered(undefined,undefined);
    this.contract.on(didCreatedListener, (owner, docHash) => {
      console.log('DID Created:', { owner, docHash });
    });
    this.eventListeners.push(() => this.contract.off(didCreatedListener));
  }

  async createDID(docData: DIDDocument): Promise<{ did: string, txHash: string }> {
    await this.ensureConnection();

    return this.withRetry(async () => {
      try {
        // 验证网络
        const network = await this.provider.getNetwork();
        if (network.chainId !== 1337n) {
          throw new Error('请连接到测试网络');
        }

        // 生成文档哈希
        const docHash = ethers.keccak256(
          ethers.toUtf8Bytes(JSON.stringify(docData))
        );

        // 获取质押金额和当前nonce
        const [stakeAmount, nonce] = await Promise.all([
          this.contract.STAKE_AMOUNT(),
          this.contract.nonces(await this.signer.getAddress())
        ]);

        // 构造EIP-712签名
        const domain = await this.getEIP712Domain();

        const types = {
          CreateDID: [
            { name: 'docHash', type: 'bytes32' },
            { name: 'nonce', type: 'uint256' }
          ]
        };

        const value = {
          docHash,
          nonce
        };

        const signature = await this.signer.signTypedData(domain, types, value);

        // 发送交易
        const tx = await this.contract.createDID(docHash, signature, {
          value: stakeAmount
        });

        const receipt = await this.monitorTransaction(tx, 'DID 创建');
        if (!receipt) {
          throw new Error('交易回执为空');
        }
        return { did: receipt.hash, txHash: receipt.hash };
      } catch (error) {
        throw await this.handleError(error);
      }
    });
  }

  async updateDID(newDocData: DIDDocument, deadline: number): Promise<string> {
    await this.ensureConnection();

    return this.withRetry(async () => {
      try {
        const newDocHash = ethers.keccak256(
          ethers.toUtf8Bytes(JSON.stringify(newDocData))
        );

        const signerAddress = await this.signer.getAddress();
        const nonce = await this.contract.nonces(signerAddress);

        // 构造EIP-712签名
        const domain = await this.getEIP712Domain();
        const types = {
          UpdateDID: [
            { name: 'newDocHash', type: 'bytes32' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        };

        const value = {
          newDocHash,
          nonce,
          deadline
        };

        const signature = await this.signer.signTypedData(domain, types, value);

        const tx = await this.contract.updateDID(newDocHash, deadline, signature);
        const receipt = await this.monitorTransaction(tx, '更新DID');
        if (!receipt) {
          throw new Error('交易回执为空');
        }
        return receipt.hash;
      } catch (error) {
        throw await this.handleError(error);
      }
    });
  }

  async getDIDInfo(address: string) {
    await this.ensureConnection();

    return this.withRetry(async () => {
      try {
        const did = await this.contract.getDID(address);
        
        if (!did.active) return null;

        return {
          docHash: did.docHash,
          created: new Date(Number(did.created) * 1000),
          reputation: Number(did.reputation),
          active: did.active,
          controller: did.controller
        };
      } catch (error) {
        throw await this.handleError(error);
      }
    });
  }

  async getCurrentNonce(): Promise<bigint> {
    const address = await this.signer.getAddress();
    return this.contract.nonces(address);
  }

  private async getEIP712Domain() {
    const network = await this.provider.getNetwork();
    return {
      name: 'DIDRegistry',
      version: '1',
      chainId: network.chainId,
      verifyingContract: ethers.getAddress(await this.contract.target.toString()) // 关键修正
    };
  }

  async checkDocHashAvailability(docHash: string): Promise<boolean> {
    const owner = await this.contract.getDocHashOwner(docHash);
    return owner === ethers.ZeroAddress;
  }

  destroy() {
    this.eventListeners.forEach(removeListener => removeListener());
    this.eventListeners = [];
  }
}

// 工厂函数
let serviceInstance: DIDRegistryService | null = null;

export const getDIDRegistryService = async () => {
  if (!serviceInstance) {
    if (!window.ethereum) throw new Error('请安装以太坊钱包');
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    serviceInstance = new DIDRegistryService(provider, signer);
  }
  return serviceInstance;
};
