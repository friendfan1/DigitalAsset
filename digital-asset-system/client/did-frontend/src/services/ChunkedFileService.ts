/**
 * 分片文件服务
 * 用于处理大文件的分片流式传输
 */
import axios from 'axios';

export interface ChunkInfo {
  index: number;
  size: number;
  hash: string;
}

export interface ChunksIndexFile {
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
  chunks: ChunkInfo[];
}

export class ChunkedFileService {
  private ipfsGateway: string;
  private apiBaseUrl: string;

  constructor(ipfsGateway: string = 'http://localhost:8081/ipfs/', apiBaseUrl: string = '/api/public') {
    this.ipfsGateway = ipfsGateway;
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * 获取分片索引文件
   */
  async getChunksIndex(cid: string): Promise<ChunksIndexFile | null> {
    try {
      const response = await axios.get(`${this.ipfsGateway}${cid}/chunks-index.json`);
      return response.data;
    } catch (error) {
      console.error('获取分片索引失败:', error);
      return null;
    }
  }

  /**
   * 检查是否为分片文件
   */
  async isChunkedFile(cid: string): Promise<boolean> {
    try {
      const response = await axios.head(`${this.ipfsGateway}${cid}/chunks-index.json`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取分片内容
   * 注意：这个函数主要用于小分片或测试，大分片应直接使用流服务
   */
  async getChunkContent(cid: string, hash: string): Promise<ArrayBuffer | null> {
    try {
      const response = await axios.get(`${this.ipfsGateway}${cid}/chunks/${hash}`, {
        responseType: 'arraybuffer'
      });
      return response.data;
    } catch (error) {
      console.error('获取分片内容失败:', error);
      return null;
    }
  }

  /**
   * 读取元数据文件
   */
  async getMetadata(cid: string): Promise<any | null> {
    try {
      const response = await axios.get(`${this.ipfsGateway}${cid}/metadata.json`);
      return response.data;
    } catch (error) {
      console.error('获取元数据失败:', error);
      return null;
    }
  }

  /**
   * 创建分片文件的视频流URL
   */
  getStreamUrl(cid: string, type: string = ''): string {
    return `${this.apiBaseUrl}/stream/${cid}?type=${encodeURIComponent(type)}`;
  }

  /**
   * 创建分片文件的下载URL
   */
  getDownloadUrl(cid: string, filename: string = ''): string {
    return `${this.apiBaseUrl}/download/${cid}?filename=${encodeURIComponent(filename)}`;
  }

  /**
   * 检测文件类型是否支持直接流式播放/预览
   */
  isStreamableType(fileType: string): boolean {
    return (
      fileType.startsWith('video/') || 
      fileType.startsWith('audio/') ||
      fileType === 'application/pdf'
    );
  }

  /**
   * 根据文件类型获取合适的预览方式
   */
  getPreviewMode(fileType: string): 'stream' | 'image' | 'download' {
    if (fileType.startsWith('video/') || fileType.startsWith('audio/')) {
      return 'stream';
    } else if (fileType.startsWith('image/') || fileType === 'application/pdf') {
      return 'image';
    } else {
      return 'download';
    }
  }
}

// 创建单例实例
let _instance: ChunkedFileService | null = null;

/**
 * 获取分片文件服务实例
 */
export const getChunkedFileService = (ipfsGateway?: string, apiBaseUrl?: string): ChunkedFileService => {
  if (!_instance) {
    const gateway = ipfsGateway || window.ipfsGateway || 'http://localhost:8081/ipfs/';
    const apiBase = apiBaseUrl || '/api/public';
    _instance = new ChunkedFileService(gateway, apiBase);
  }
  return _instance;
}; 