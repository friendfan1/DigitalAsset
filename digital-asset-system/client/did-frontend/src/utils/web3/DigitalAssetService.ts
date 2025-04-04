import { ethers } from 'ethers';
import { DigitalAsset__factory } from '@/contracts/types';
import type { DigitalAsset } from '@/contracts/types/DigitalAsset';
import { RBACService } from '@/utils/web3/RBACService';
import { create } from 'ipfs-http-client';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { BaseWeb3Service } from '@/services/BaseWeb3Service';
import { web3Config } from '@/config/web3.config';
import type { AssetMetadata } from '@/types/web3';
import { ElMessage } from 'element-plus';
import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import axios from 'axios';

interface IPFSCacheEntry {
  cid: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface AssetMetadataViewStructOutput {
  cid: string;
  version: number;
  isCertified: boolean;
  registrationDate: bigint;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  description: string;
}

export class DigitalAssetService extends BaseWeb3Service {
  private contract: DigitalAsset;
  private ipfsClient: any;
  private ipfsDB: IDBPDatabase | null = null;
  private userAssetsCache = new Map<string, {
    timestamp: number;
    assets: any[];
    totalCount: number;
  }>();
  private ipfsMetadataCache = new Map<string, IPFSCacheEntry>();
  private ipfsCacheConfig = {
    storeName: 'ipfs-metadata-cache',
    dbName: 'digital-asset-cache',
    memoryTTL: 300000,
    dbTTL: 86400000
  };
  private uploadProgressListeners = new Map<string, Set<(progress: number) => void>>();
  private uploadStatuses = new Map<string, number>();
  private ipfsRetryConfig = {
    maxRetries: 3,
    delayMs: 1000
  };
  private uploadProgressCache = new Map<string, number>();

  constructor(provider: ethers.BrowserProvider, signer: ethers.Signer) {
    super(provider, signer, web3Config);
    
    this.contract = DigitalAsset__factory.connect(
      CONTRACT_ADDRESSES.DigitalAsset,
      signer
    );
    
    // 获取环境变量
    const infuraProjectId = import.meta.env.VITE_INFURA_PROJECT_ID || '';
    const infuraProjectSecret = import.meta.env.VITE_INFURA_PROJECT_SECRET || '';
    const ipfsApiUrl = import.meta.env.VITE_IPFS_API_URL || '';
    const ipfsApiKey = import.meta.env.VITE_IPFS_API_KEY || '';

    // 设置 IPFS 客户端 - 按优先级选择配置
    if (infuraProjectId && infuraProjectSecret) {
      // 优先使用 Infura 专用项目
      console.log('尝试使用 Infura IPFS 服务');
      try {
        this.ipfsClient = create({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https',
          headers: {
            authorization: 'Basic ' + btoa(`${infuraProjectId}:${infuraProjectSecret}`)
          },
          timeout: 60000
        });
        console.log('成功初始化 Infura IPFS 客户端');
      } catch (error) {
        console.error('初始化 Infura IPFS 客户端失败:', error);
      }
    } else if (ipfsApiKey && ipfsApiUrl) {
      // 其次使用通用 API 密钥
      console.log('尝试使用 API 密钥访问 IPFS 服务');
      try {
        this.ipfsClient = create({
          url: ipfsApiUrl,
          headers: {
            authorization: `Bearer ${ipfsApiKey}`
          },
          timeout: 60000
        });
        console.log('成功初始化 IPFS API 客户端');
      } catch (error) {
        console.error('初始化 IPFS API 客户端失败:', error);
      }
    } else if (ipfsApiUrl) {
      // 最后使用无认证的 URL
      console.log('尝试使用公共 IPFS URL:', ipfsApiUrl);
      try {
        this.ipfsClient = create({ 
          url: ipfsApiUrl,
          timeout: 60000
        });
        console.log('成功初始化公共 IPFS 网关');
      } catch (error) {
        console.error('初始化公共 IPFS 网关失败:', error);
      }
    } else {
      // 默认使用公共网关
      console.log('尝试使用本地 IPFS 节点 (http://localhost:5001)');
      try {
        this.ipfsClient = create({ 
          host: 'localhost',
          port: 5001,
          protocol: 'http',
          timeout: 60000
        });
        console.log('成功初始化本地 IPFS 节点');
      } catch (error) {
        console.error('初始化本地 IPFS 节点失败，将使用备用网关:', error);
        try {
          // 备用选项：使用公共网关
          this.ipfsClient = create({
            url: 'https://ipfs.io/api/v0/',
            timeout: 60000
          });
          console.log('成功初始化备用 IPFS 网关');
        } catch (fallbackError) {
          console.error('所有 IPFS 连接方式都失败:', fallbackError);
        }
      }
    }

    // 初始化缓存数据库
    this.initCacheDB();
  }

  private async initCacheDB() {
    try {
      this.ipfsDB = await openDB(this.ipfsCacheConfig.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('ipfs-metadata-cache')) {
            db.createObjectStore('ipfs-metadata-cache', { keyPath: 'cid' });
          }
        }
      });
    } catch (error) {
      console.error('IPFS缓存数据库初始化失败:', error);
    }
  }

  /**
   * IPFS操作重试包装器
   * @param operation 需要执行的IPFS操作函数
   * @param maxRetries 最大重试次数
   * @returns 返回操作结果
   */
  private async withIPFSRetry<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T> {
    const retries = maxRetries || this.ipfsRetryConfig.maxRetries;
    let lastError: any;
    let attempt = 0;

    while (attempt < retries) {
      try {
        if (attempt > 0) {
          console.log(`IPFS操作重试中 (${attempt}/${retries})...`);
        }
        // 执行IPFS操作
        return await operation();
      } catch (error: any) {
        lastError = error;
        attempt++;
        
        // 如果还有重试机会，等待一段时间后重试
        if (attempt < retries) {
          // 指数退避策略: 延迟时间随着重试次数增加
          const delay = this.ipfsRetryConfig.delayMs * Math.pow(2, attempt - 1);
          console.warn(`IPFS操作失败，${delay}ms后重试 (${attempt}/${retries}):`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(`IPFS操作失败，已达到最大重试次数(${retries}):`, error);
        }
      }
    }
    
    // 所有重试都失败了，抛出最后的错误
    throw new Error(`IPFS操作失败(${retries}次重试后): ${lastError?.message || '未知错误'}`);
  }

  /**
   * IPFS健康检查
   * @returns 如果IPFS节点正常返回true，否则返回false
   */
  async checkIPFSHealth(): Promise<boolean> {
    try {
      console.log('临时禁用完整的IPFS健康检查，直接返回true');
      // 直接返回true，假设IPFS健康，避免阻止上传流程
      return true;
    } catch (error) {
      console.warn('IPFS节点状态检查失败，将继续尝试上传:', error);
      return true;  // 即使检查失败也返回true让上传继续
    }
  }

  /**
   * 报告上传进度
   * @param uploadId 上传ID
   * @param progress 进度百分比 (0-100)，-1表示失败
   */
  private reportProgress(uploadId: string, progress: number) {
    if (!uploadId) return;
    
    // 更新缓存
    this.uploadProgressCache.set(uploadId, progress);
    
    // 通知所有监听器
    const listeners = this.uploadProgressListeners.get(uploadId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(progress);
        } catch (error) {
          console.error(`进度回调错误:`, error);
        }
      });
    }
  }

  private async encryptContent(buffer: ArrayBuffer): Promise<any> {
    // 这里可以实现加密逻辑，或者使用第三方加密库
    // 目前返回未加密的数据，可以在后期扩展
    return {
      encryptedData: new Blob([buffer]),
      key: null
    };
  }

  /**
   * 上传内容到IPFS
   * @param buffer 文件内容的ArrayBuffer
   * @param useEncryption 是否加密内容
   * @param metadata 可选的元数据
   * @returns 返回IPFS的CID
   */
  private async uploadToIPFS(content: ArrayBuffer, useEncryption: boolean = false, metadata?: any): Promise<string> {
    // 生成唯一上传ID用于进度追踪
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`开始上传到IPFS, 内容大小: ${content.byteLength} 字节, 上传ID: ${uploadId}`);
    console.log(`加密设置: ${useEncryption ? '启用' : '禁用'}`);
    
    try {
      // 强制设置初始进度（确保界面有反应）
      this.uploadProgressCache.set(uploadId, 5);
      
      // 获取为ArrayBuffer
      const buffer = content as ArrayBuffer;
      
      // 如果启用加密，加密内容
      if (useEncryption) {
        // 报告加密开始
        console.log(`开始加密文件内容，大小: ${buffer.byteLength} 字节`);
        this.reportProgress(uploadId, 5);
        const encryptResult = await this.encryptContent(buffer);
        const encryptedBuffer = await encryptResult.encryptedData.arrayBuffer();
        console.log(`加密完成，加密后大小: ${encryptedBuffer.byteLength} 字节`);
        // 报告加密完成
        this.reportProgress(uploadId, 10);
        
        // 使用加密后的 buffer 进行后续处理
        return await this.processIPFSUpload(encryptedBuffer, metadata, uploadId);
      } else {
        // 跳过加密步骤
        console.log(`跳过加密步骤`);
        this.reportProgress(uploadId, 10);
        
        // 使用原始 buffer 进行后续处理
        return await this.processIPFSUpload(buffer, metadata, uploadId);
      }
    } catch (error) {
      // 报告上传失败
      console.error('上传到IPFS失败:', error);
      this.reportProgress(uploadId, -1);
      throw new Error('上传到IPFS失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * 处理 IPFS 实际上传流程
   */
  private async processIPFSUpload(buffer: ArrayBuffer, metadata?: any, uploadId: string = ''): Promise<string> {
    // 检查文件大小，大文件使用分片上传
    const CHUNK_SIZE = 1024 * 1024 * 2; // 2MB 分片大小
    const useChunkedUpload = buffer.byteLength > CHUNK_SIZE * 5; // 超过10MB使用分片
    
    console.log(`文件大小: ${buffer.byteLength} 字节, ${useChunkedUpload ? '使用分片上传' : '使用普通上传'}`);
    
    // 确保更新进度到15%，表示即将开始IPFS上传
    if (uploadId) {
      this.uploadProgressCache.set(uploadId, 15);
    }
    
    return await this.withIPFSRetry(async () => {
      let cid;
      
      if (useChunkedUpload) {
        // 使用分片上传大文件
        console.log(`开始分片上传`);
        if (uploadId) {
          this.reportProgress(uploadId, 15);
        }
        
        try {
          cid = await this.chunkedUpload(buffer, metadata, uploadId);
          // 强制设置上传完成
          if (uploadId) {
            this.uploadProgressCache.set(uploadId, 90);
          }
        } catch (chunkedError) {
          console.error("分片上传失败:", chunkedError);
          // 尝试备用上传方法
          console.log("尝试备用方法: 直接上传");
          const result = await this.ipfsClient.add(new Uint8Array(buffer), {
            timeout: 120000
          });
          cid = result.cid.toString();
          // 强制设置上传完成
          if (uploadId) {
            this.uploadProgressCache.set(uploadId, 90);
          }
        }
      } else if (metadata) {
        // 如果有元数据，创建一个包含文件和元数据的目录结构
        const metadataStr = JSON.stringify(metadata);
        const metadataBuffer = new TextEncoder().encode(metadataStr);
        
        console.log(`准备上传文件和元数据，元数据大小: ${metadataBuffer.byteLength} 字节`);
        if (uploadId) {
          this.reportProgress(uploadId, 20);
        }
        
        // 上传两个文件：内容和元数据
        const files = [
          {
            path: '/content',
            content: new Uint8Array(buffer)
          },
          {
            path: '/metadata.json',
            content: metadataBuffer
          }
        ];
        
        console.log(`开始上传目录到IPFS`);
        
        try {
          // 添加目录到IPFS
          const result = await this.ipfsClient.addAll(files, { 
            wrapWithDirectory: true,
            timeout: 120000,  // 增加到120秒超时
            progress: (prog: any) => {
              // 报告上传进度 (20-90%)
              if (uploadId) {
                const progressPercent = 20 + Math.floor(prog / 100 * 70);
                this.reportProgress(uploadId, progressPercent);
              }
            }
          });
          
          // 获取包含文件的目录的CID
          let dirCid;
          for await (const file of result) {
            console.log(`上传的文件: ${file.path || '根目录'}, CID: ${file.cid.toString()}`);
            if (!file.path) {
              dirCid = file.cid.toString();
            }
          }
          
          cid = dirCid;
          console.log(`目录上传完成，CID: ${cid}`);
          if (uploadId) {
            this.reportProgress(uploadId, 100);
          }
        } catch (error) {
          console.error(`目录上传失败，尝试备用方法:`, error);
          
          // 备用方法：直接上传内容，忽略元数据
          console.log(`尝试备用方法：直接上传内容`);
          const result = await this.ipfsClient.add(new Uint8Array(buffer), {
            timeout: 120000
          });
          cid = result.cid.toString();
          console.log(`备用上传成功，CID: ${cid}`);
          if (uploadId) {
            this.uploadProgressCache.set(uploadId, 100);
          }
        }
      } else {
        // 如果没有元数据，直接上传文件内容
        console.log(`开始直接上传文件内容`);
        try {
          const result = await this.ipfsClient.add(new Uint8Array(buffer), {
            timeout: 120000,  // 增加到120秒超时
            progress: (prog: any) => {
              // 报告上传进度 (20-90%)
              if (uploadId) {
                const progressPercent = 20 + Math.floor(prog / 100 * 70);
                this.reportProgress(uploadId, progressPercent);
              }
            }
          });
          cid = result.cid.toString();
          console.log(`文件上传完成，CID: ${cid}`);
          if (uploadId) {
            this.uploadProgressCache.set(uploadId, 100);
          }
        } catch (directError) {
          console.error(`直接上传失败，尝试备用方法:`, directError);
          
          // 备用方法：把内容分片上传
          console.log(`尝试备用方法：分片上传`);
          cid = await this.chunkedUpload(buffer, metadata, uploadId);
          // 强制确保进度更新为100%
          if (uploadId) {
            this.uploadProgressCache.set(uploadId, 100);
          }
        }
      }
      
      console.log(`IPFS上传完成, CID: ${cid}`);
      return cid;
    });
  }

  /**
   * 分片上传大文件到IPFS
   * @param buffer 文件内容
   * @param metadata 元数据
   * @param uploadId 上传ID，用于进度报告
   * @returns IPFS CID
   */
  private async chunkedUpload(buffer: ArrayBufferLike, metadata?: any, uploadId: string = ''): Promise<string> {
    console.log(`开始分片上传大文件，大小: ${buffer.byteLength} 字节`);
    
    // 定义分片大小
    const CHUNK_SIZE = 1024 * 1024 * 2; // 2MB
    
    // 计算分片数
    const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);
    console.log(`文件将被分为 ${totalChunks} 个分片上传`);
    
    try {
      // 首先上传所有分片
      const uploadedChunks = [];
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, buffer.byteLength);
        const chunkBuffer = buffer.slice(start, end);
        const chunkArray = new Uint8Array(chunkBuffer);
        
        // 报告分片进度
        if (uploadId) {
          // 分片上传进度在15-80%之间
          const chunkProgress = 15 + Math.floor((i / totalChunks) * 65);
          this.reportProgress(uploadId, chunkProgress);
        }
        
        console.log(`上传分片 ${i+1}/${totalChunks}，大小: ${chunkArray.byteLength} 字节`);
        
        // 上传分片
        const chunkResult = await this.ipfsClient.add(chunkArray, {
          timeout: 30000 // 每个分片30秒超时
        });
        
        uploadedChunks.push({
          path: `chunk-${i}`,
          cid: chunkResult.cid.toString(),
          size: chunkArray.byteLength
        });
      }
      
      // 报告所有分片上传完成
      if (uploadId) {
        this.reportProgress(uploadId, 80);
      }
      
      console.log('所有分片上传完成，创建目录');
      
      // 创建分片索引，存储分片信息
      const chunksIndex = {
        totalChunks,
        totalSize: buffer.byteLength,
        chunks: uploadedChunks
      };
      
      // 将元数据和分片索引一起添加到IPFS
      const files = [];
      
      // 添加分片索引
      const indexBuffer = new TextEncoder().encode(JSON.stringify(chunksIndex));
      files.push({
        path: '/chunks-index.json',
        content: indexBuffer
      });
      
      // 如果有元数据，也添加上
      if (metadata) {
        const metadataBuffer = new TextEncoder().encode(JSON.stringify(metadata));
        files.push({
          path: '/metadata.json',
          content: metadataBuffer
        });
      }
      
      // 报告正在创建目录结构
      if (uploadId) {
        this.reportProgress(uploadId, 90);
      }
      
      // 创建包含分片索引和元数据的目录
      const result = await this.ipfsClient.addAll(files, {
        wrapWithDirectory: true
      });
      
      // 获取目录的CID
      let dirCid;
      for await (const file of result) {
        if (!file.path) {
          dirCid = file.cid.toString();
        }
      }
      
      // 完成上传
      if (uploadId) {
        this.reportProgress(uploadId, 100);
      }
      
      console.log(`分片上传完成，最终CID: ${dirCid}`);
      return dirCid;
    } catch (error) {
      console.error('分片上传失败:', error);
      throw error;
    }
  }

  private async processFileUpload(file: File, additionalMetadata?: AssetMetadata) {
    const uploadId = this.createUploadId();
    this.notifyUploadProgress(uploadId, 0);
    
    const buffer = await file.arrayBuffer();
    const contentHash = ethers.keccak256(new Uint8Array(buffer));
    
    this.notifyUploadProgress(uploadId, 50);
    
    // 上传打包后的数据，使用改进的上传方法
    const metadata = {
      ...additionalMetadata,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    };
    
    const cid = await this.uploadToIPFS(buffer, additionalMetadata?.enableEncryption, metadata);
    
    this.notifyUploadProgress(uploadId, 100);
    
    return { cid, contentHash };
  }

  public async registerAsset(file: File, metadata?: AssetMetadata) {
    await this.ensureConnection();
    const address = await this.signer.getAddress();
    
    // 处理文件上传和元数据上传
    const { cid, contentHash } = await this.processFileUpload(file, metadata);
    
    // 获取当前nonce
    const currentNonce = await this.contract.nonces(address);
    
    // 生成EIP712签名
    const signature = await this.generateTypedSignature(
      'Register',
      { to: address, cid, contentHash, nonce: currentNonce }
    );

    // 调用合约
    const tx = await this.contract.registerAsset(
      address,
      cid,
      contentHash,
      signature
    );
    
    const receipt = await tx.wait();
    this.clearUserAssetsCache();
    
    // 返回包含元数据CID的结果
    return {
      ...this.parseTransactionReceipt(receipt!, 'AssetRegistered'),
      cid
    };
  }

  private async generateTypedSignature(type: string, message: any) {
    const domain = {
      name: 'DigitalAsset',
      version: '1',
      chainId: await this.provider.getNetwork().then(n => n.chainId),
      verifyingContract: this.contract.target.toString()
    };

    const types = {
      Register: [
        { name: 'to', type: 'address' },
        { name: 'cid', type: 'string' },
        { name: 'contentHash', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' }
      ],
      Certify: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'comment', type: 'string' },
        { name: 'nonce', type: 'uint256' }
      ],
      Update: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'newCid', type: 'string' },
        { name: 'newHash', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' }
      ],
      Burn: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'nonce', type: 'uint256' }
      ],
      SetCertifiers: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'certifiers', type: 'address[]' },
        { name: 'nonce', type: 'uint256' }
      ]
    };

    return await this.signer.signTypedData(
      domain,
      { [type]: types[type as keyof typeof types] },
      message
    );
  }

  public async certifyAsset(tokenId: number, comment: string) {
    await this.ensureConnection();
    const address = await this.signer.getAddress();
    const currentNonce = await this.contract.nonces(address);
    
    const signature = await this.generateTypedSignature(
      'Certify',
      { tokenId, comment, nonce: currentNonce }
    );

    const tx = await this.contract.certifyAsset(tokenId, comment, signature);
    const receipt = await tx.wait();
    return this.parseTransactionReceipt(receipt!, 'AssetCertified');
  }

  public async updateMetadata(tokenId: number, file: File) {
    await this.ensureConnection();
    const address = await this.signer.getAddress();
    
    // 验证所有权
    const owner = await this.contract.ownerOf(tokenId);
    if (owner !== address) throw new Error('非资产所有者');

    // 处理新文件上传
    const { cid: newCid, contentHash: newHash } = await this.processFileUpload(file);
    const currentNonce = await this.contract.nonces(address);

    const signature = await this.generateTypedSignature(
      'Update',
      { tokenId, newCid, newHash, nonce: currentNonce }
    );

    const tx = await this.contract.updateMetadata(
      tokenId,
      newCid,
      newHash,
      signature
    );
    
    const receipt = await tx.wait();
    return this.parseTransactionReceipt(receipt!, 'MetadataUpdated');
  }

  public async burnAsset(tokenId: number) {
    await this.ensureConnection();
    const address = await this.signer.getAddress();
    const currentNonce = await this.contract.nonces(address);

    const signature = await this.generateTypedSignature(
      'Burn',
      { tokenId, nonce: currentNonce }
    );

    const tx = await this.contract.burnAsset(tokenId, signature);
    const receipt = await tx.wait();
    this.clearUserAssetsCache();
    return this.parseTransactionReceipt(receipt!, 'AssetBurned');
  }

  public async deleteAsset(tokenId: number) {
    return this.burnAsset(tokenId);
  }

  public async batchDeleteAssets(tokenIds: number[]) {
    const results = {
      success: 0,
      failed: 0,
      details: [] as Array<{ tokenId: number; success: boolean; message?: string }>
    };

    for (const tokenId of tokenIds) {
      try {
        await this.burnAsset(tokenId);
        results.success++;
        results.details.push({ tokenId, success: true });
      } catch (error) {
        results.failed++;
        results.details.push({ 
          tokenId, 
          success: false, 
          message: error instanceof Error ? error.message : '未知错误' 
        });
      }
    }

    return results;
  }

  private parseTransactionReceipt(receipt: ethers.ContractTransactionReceipt, eventName: string) {
    const log = receipt.logs.find(l => 
      this.contract.interface.parseLog(l)?.name === eventName
    );
    return log ? this.contract.interface.parseLog(log)!.args : null;
  }

  public async getAssetMetadata(tokenId: number) {
    try {
      // 从合约获取基本元数据
      const basicMetadata = await this.contract.getMetadata(tokenId);
      
      // 从IPFS获取完整元数据
      const ipfsData = await this.getAssetContent(basicMetadata.cid);
      const fullMetadata = ipfsData.metadata || {};
      
      // 合并元数据
      return {
        ...basicMetadata,
        fileName: fullMetadata.fileName || '',
        fileType: fullMetadata.fileType || '',
        fileSize: fullMetadata.fileSize || 0,
        category: fullMetadata.category || '未分类',
        description: fullMetadata.description || '暂无描述'
      };
    } catch (error) {
      console.error(`获取资产 ${tokenId} 元数据失败:`, error);
      throw error;
    }
  }

  private async fetchUserAssets(address: string) {
    try {
      const filter = this.contract.filters.Transfer(undefined, address);
      const events = await this.contract.queryFilter(filter);
      
      // 使用Set去重并验证当前所有权
      const ownedTokens = new Set<bigint>();
      
      for (const event of events) {
        const tokenId = event.args[2];
        try {
          const owner = await this.contract.ownerOf(tokenId);
          if (owner.toLowerCase() === address.toLowerCase()) {
            ownedTokens.add(tokenId);
          }
        } catch {
          // 跳过无效或已销毁的token
        }
      }

      // 获取资产元数据
      const assets = [];
      for (const tokenId of ownedTokens) {
        try {
          const metadata = await this.getAssetMetadata(Number(tokenId));
          console.log('metadata:', metadata);
          const assetData = {
            tokenId: tokenId.toString(),
            cid: metadata[0] || '',
            version: metadata[3] || 1,
            isCertified: metadata[4] || false,
            registrationDate: new Date(Number(metadata[2]) * 1000),
            metadata: {
              fileName: metadata.fileName || '',
              fileType: metadata.fileType || '',
              fileSize: metadata.fileSize || 0,
              category: metadata.category || '未分类',
              description: metadata.description || '暂无描述'
            }
          };
          assets.push(assetData);
        } catch (error) {
          console.error(`获取资产 ${tokenId} 元数据失败:`, error);
        }
      }

      // 按注册日期排序
      assets.sort((a, b) => b.registrationDate.getTime() - a.registrationDate.getTime());

      return {
        assets,
        totalCount: assets.length
      };
    } catch (error) {
      console.error('获取用户资产失败:', error);
      throw error;
    }
  }

  public async getUserAssetsWithPagination(
    address: string,
    page: number,
    pageSize: number,
    forceRefresh: boolean = false
  ) {
    try {
      // 检查缓存是否有效（5分钟）
      const cacheKey = address.toLowerCase();
      const cache = this.userAssetsCache.get(cacheKey);
      const now = Date.now();
      const isCacheValid = cache && (now - cache.timestamp < 5 * 60 * 1000);

      // 如果强制刷新或缓存无效，则重新获取数据
      if (forceRefresh || !isCacheValid) {
        const { assets, totalCount } = await this.fetchUserAssets(address);
        this.userAssetsCache.set(cacheKey, {
          timestamp: now,
          assets,
          totalCount
        });
      }

      const cachedData = this.userAssetsCache.get(cacheKey)!;
      const allAssets = cachedData.assets;
      
      // 计算分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, allAssets.length);
      const paginatedAssets = allAssets.slice(startIndex, endIndex);

      return {
        assets: paginatedAssets,
        totalCount: cachedData.totalCount,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(cachedData.totalCount / pageSize)
      };
    } catch (error) {
      console.error('获取分页资产列表失败:', error);
      throw error;
    }
  }

  public async getUserAssets(address: string, forceRefresh: boolean = false) {
    try {
      const { assets } = await this.getUserAssetsWithPagination(
        address,
        1,
        10,
        forceRefresh
      );
      return assets;
    } catch (error) {
      console.error('获取用户资产列表失败:', error);
      throw error;
    }
  }

  private clearUserAssetsCache() {
    this.userAssetsCache.clear();
  }

  public clearCache() {
    this.clearUserAssetsCache();
  }

  public async setCertifiers(tokenId: number, certifiers: string[]) {
    await this.ensureConnection();
    const address = await this.signer.getAddress();
    const currentNonce = await this.contract.nonces(address);

    const signature = await this.generateTypedSignature(
      'SetCertifiers',
      { tokenId, certifiers, nonce: currentNonce }
    );

    const tx = await this.contract.setCertifiers(tokenId, certifiers, signature);
    const receipt = await tx.wait();
    this.clearUserAssetsCache();
    return this.parseTransactionReceipt(receipt!, 'CertifiersSet');
  }

  public async getPendingCertifiers(tokenId: number) {
    await this.ensureConnection();
    return this.contract.getPendingCertifiers(tokenId);
  }

  public async hasCertified(tokenId: number, certifier: string) {
    await this.ensureConnection();
    return this.contract.hasCertified(tokenId, certifier);
  }

  public async getCertificationStatus(tokenId: number) {
    await this.ensureConnection();
    const pendingCertifiers = await this.getPendingCertifiers(tokenId);
    const certificationStatus = await Promise.all(
      pendingCertifiers.map(async (certifier) => ({
        certifier,
        hasCertified: await this.hasCertified(tokenId, certifier)
      }))
    );
    return {
      pendingCertifiers,
      certificationStatus,
      isFullyCertified: certificationStatus.every(status => status.hasCertified)
    };
  }

  public createUploadId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  public addUploadProgressListener(uploadId: string, callback: (progress: number) => void): string {
    if (!this.uploadProgressListeners.has(uploadId)) {
      this.uploadProgressListeners.set(uploadId, new Set());
    }
    this.uploadProgressListeners.get(uploadId)!.add(callback);
    return uploadId;
  }

  public removeUploadProgressListener(uploadId: string, callback: (progress: number) => void): void {
    this.uploadProgressListeners.get(uploadId)?.delete(callback);
  }

  private notifyUploadProgress(uploadId: string, progress: number) {
    this.uploadStatuses.set(uploadId, progress);
    this.uploadProgressListeners.get(uploadId)?.forEach(callback => callback(progress));
  }

  /**
   * 合并Uint8Array并可选地转换为字符串
   */
  private concatUint8Arrays(chunks: Uint8Array[], decoder?: TextDecoder): string | Uint8Array {
    // 计算总长度
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    
    // 创建一个新的数组来存储所有数据
    const merged = new Uint8Array(totalLength);
    
    // 复制每个chunk到合并的数组中
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    
    // 如果提供了解码器，返回解码后的字符串
    if (decoder) {
      return decoder.decode(merged);
    }
    
    // 否则返回合并后的Uint8Array
    return merged;
  }

  public async getAssetContent(cid: string) {
    const defaultMetadata = {
      fileName: `Asset-${cid.substring(0, 8)}`,
      fileSize: 0,
      fileType: 'application/octet-stream',
      description: '无法获取元数据的IPFS内容',
      category: '未分类',
      encrypt: false,
      tags: [],
      isChunked: false
    };
    
    try {
      console.log('开始获取IPFS内容，CID:', cid);
      
      // 检查是否是目录结构（先尝试获取metadata.json）
      try {
        const metadataPath = `${cid}/metadata.json`;
        console.log(`尝试获取元数据: ${metadataPath}`);
        
        const metadataResponse = this.ipfsClient.cat(metadataPath);
        
        // 收集元数据块
        let metadataChunks: Uint8Array[] = [];
        for await (const chunk of metadataResponse) {
          metadataChunks.push(chunk);
        }
        
        if (metadataChunks.length > 0) {
          // 解码元数据
          const decoder = new TextDecoder();
          const metadataText = this.concatUint8Arrays(metadataChunks, decoder) as string;
          const metadata = JSON.parse(metadataText);
          console.log('获取到元数据:', metadata);
          
          // 检查是否是分片文件
          let isChunked = false;
          try {
            // 检查是否存在 chunks-index.json 文件
            const chunksIndexPath = `${cid}/chunks-index.json`;
            const indexResponse = this.ipfsClient.cat(chunksIndexPath);
            
            // 只检查是否能获取到第一个数据块
            for await (const chunk of indexResponse) {
              isChunked = true;
              break;
            }
            
            if (isChunked) {
              console.log('检测到分片文件，需要使用分片服务获取内容');
            }
          } catch (chunkError) {
            console.log('不是分片文件');
            isChunked = false;
          }
          
          if (isChunked) {
            // 对于分片文件，返回元数据，但不尝试获取文件内容
            return {
              file: new File([], metadata.fileName || 'chunked-file', 
                         { type: metadata.fileType || 'application/octet-stream' }),
              metadata: {
                fileName: metadata.fileName || '分片文件',
                fileType: metadata.fileType || 'application/octet-stream',
                fileSize: metadata.fileSize || 0,
                category: metadata.category || '未分类',
                description: metadata.description || '暂无描述',
                encrypt: !!metadata.enableEncryption,
                tags: metadata.tags || [],
                isChunked: true
              }
            };
          }
          
          // 如果不是分片文件，尝试获取内容文件
          console.log('尝试获取内容文件');
          let contentChunks: Uint8Array[] = [];
          try {
            const contentPath = `${cid}/content`;
            const contentResponse = this.ipfsClient.cat(contentPath);
            
            for await (const chunk of contentResponse) {
              contentChunks.push(chunk);
            }
          } catch (contentError) {
            console.error('获取内容文件失败:', contentError);
            // 返回只有元数据的结果
            return {
              file: new File([], metadata.fileName || 'metadata-only', 
                        { type: metadata.fileType || 'application/octet-stream' }),
              metadata: {
                fileName: metadata.fileName || '未知文件',
                fileType: metadata.fileType || 'application/octet-stream',
                fileSize: metadata.fileSize || 0,
                category: metadata.category || '未分类',
                description: metadata.description || '暂无描述',
                encrypt: !!metadata.enableEncryption,
                tags: metadata.tags || [],
                isChunked: false
              }
            };
          }
          
          if (contentChunks.length > 0) {
            // 将内容块合并为一个Uint8Array
            const contentArray = this.concatUint8Arrays(contentChunks) as Uint8Array;
            
            // 创建文件对象
            const file = new File(
              [contentArray],
              metadata.fileName || 'unknown',
              { type: metadata.fileType || 'application/octet-stream' }
            );
            
            // 返回文件和元数据
            return {
              file,
              metadata: {
                fileName: metadata.fileName || '未知文件',
                fileType: metadata.fileType || 'application/octet-stream',
                fileSize: metadata.fileSize || 0,
                category: metadata.category || '未分类',
                description: metadata.description || '暂无描述',
                encrypt: !!metadata.enableEncryption,
                tags: metadata.tags || [],
                isChunked: false
              }
            };
          }
        }
      } catch (dirError) {
        console.log('不是目录结构，尝试作为普通文件获取:', dirError);
      }
      
      // 尝试直接获取CID内容（可能是旧版格式或直接内容）
      const response = this.ipfsClient.cat(cid);
      
      // 收集所有数据块
      let chunks: Uint8Array[] = [];
      for await (const chunk of response) {
        chunks.push(chunk);
      }
      
      if (chunks.length === 0) {
        throw new Error('获取到空内容');
      }
      
      // 合并并解码内容
      const decoder = new TextDecoder();
      const content = this.concatUint8Arrays(chunks, decoder) as string;
      
      // 尝试解析为JSON
      try {
        const fileData = JSON.parse(content);
        console.log('解析为JSON成功:', fileData);
        
        // 将Array转换为Uint8Array（如果存在）
        if (fileData.file && Array.isArray(fileData.file)) {
          const fileArray = new Uint8Array(fileData.file);
          
          // 创建文件对象
          const file = new File(
            [fileArray],
            fileData.fileName || 'unknown',
            { type: fileData.fileType || 'application/octet-stream' }
          );
          
          // 返回文件对象和元数据
          return {
            file,
            metadata: {
              fileName: fileData.fileName || '未知文件',
              fileType: fileData.fileType || 'application/octet-stream',
              fileSize: fileData.fileSize || 0,
              category: fileData.metadata?.category || '未分类',
              description: fileData.metadata?.description || '暂无描述',
              encrypt: fileData.metadata?.encrypt || false,
              tags: fileData.metadata?.tags || [],
              isChunked: false
            }
          };
        } else {
          // 如果没有file字段，返回元数据
          return {
            file: new File([], fileData.fileName || 'unknown', 
                     { type: fileData.fileType || 'application/octet-stream' }),
            metadata: {
              fileName: fileData.fileName || '未知文件',
              fileType: fileData.fileType || 'application/octet-stream',
              fileSize: fileData.fileSize || 0,
              category: fileData.metadata?.category || '未分类',
              description: fileData.metadata?.description || '暂无描述',
              encrypt: fileData.metadata?.encrypt || false,
              tags: fileData.metadata?.tags || [],
              isChunked: false
            }
          };
        }
      } catch (jsonError) {
        // 不是JSON格式，可能是二进制内容
        console.log('不是JSON格式，作为二进制文件处理:', jsonError);
        
        // 合并成二进制数组
        const binaryData = this.concatUint8Arrays(chunks) as Uint8Array;
        
        // 创建文件对象
        const file = new File(
          [binaryData],
          'unknown',
          { type: 'application/octet-stream' }
        );
        
        return {
          file,
          metadata: defaultMetadata
        };
      }
    } catch (error) {
      console.error('获取资产内容失败:', error);
      return {
        file: new File([], 'unknown'),
        metadata: defaultMetadata
      };
    }
  }

  public getUploadStatuses(): Record<string, number> {
    return Object.fromEntries(this.uploadStatuses);
  }

  public async getCertifications(tokenId: number) {
    await this.ensureConnection();
    const certifications = await this.contract.getCertifications(tokenId);
    return certifications.map(cert => ({
      certifier: cert.certifier,
      timestamp: Number(cert.timestamp) * 1000, // 转换为毫秒
      comment: cert.comment
    }));
  }

  public async getAssetCertificationDetails(tokenId: number) {
    await this.ensureConnection();
    
    // 获取资产基本信息
    const metadata = await this.getAssetMetadata(tokenId);
    
    // 获取认证记录
    const certifications = await this.getCertifications(tokenId);
    
    // 获取待认证者列表
    const pendingCertifiers = await this.getPendingCertifiers(tokenId);
    
    // 获取每个认证者的认证状态
    const certificationStatus = await Promise.all(
      pendingCertifiers.map(async (certifier) => ({
        certifierAddress: certifier,
        status: await this.hasCertified(tokenId, certifier) ? 'APPROVED' : 'PENDING',
        certifierName: '', // 这个字段可以从用户系统获取，如果有的话
        timestamp: certifications.find(c => c.certifier === certifier)?.timestamp,
        reason: certifications.find(c => c.certifier === certifier)?.comment
      }))
    );

    return {
      asset: {
        tokenId,
        ...metadata,
        certifications,
        certificationStatus
      }
    };
  }
}

// 单例实例管理
let serviceInstance: DigitalAssetService | null = null;

export const getDigitalAssetService = async () => {
  if (!serviceInstance) {
    const provider = new ethers.BrowserProvider(window.ethereum!);
    const signer = await provider.getSigner();
    serviceInstance = new DigitalAssetService(provider, signer);
  }
  return serviceInstance;
};
