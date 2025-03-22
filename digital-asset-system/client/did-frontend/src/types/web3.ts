// types/web3.ts
export interface DIDDocument {
    "@context": string;
    id: string;
    created: string;
    verificationMethod: Array<{
      id: string;
      type: string;
      controller: string;
      publicKeyHex: string;
    }>;
    authentication: string[];
  }
  
  export interface AssetMetadata {
    description?: string;
    category?: string;
    tags?: string[];
    created?: string;
    lastModified?: string;
    enableEncryption?: boolean;
    encrypt?: boolean;
    uploadId?: string;
  }
  
  export type NetworkConfig = {
    chainId: number;
    name: string;
    rpc: string;
    explorer: string;
  };
  
  export type Web3Config = {
    networks: NetworkConfig[];
    ipfs: {
      host: string;
      port: number;
      protocol: string;
      timeout: number;
    };
    retry: {
      attempts: number;
      delay: number;
    };
    files: {
      maxSize: number;
      allowedTypes: string[];
    };
  };