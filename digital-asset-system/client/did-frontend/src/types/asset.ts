export interface AssetMetadata {
  fileName: string
  fileSize: number
  fileType: string
  uploadTime: number
  description?: string
  [key: string]: any
}

export interface FileResource {
  fileId: string;
  fileName: string;
  contentType: string;
  accessUrl: string;
  expireTime: number;
}

export interface CertificationStatus {
  certifierAddress: string
  status: 'PENDING' | 'APPROVED'
  certifierName?: string
  timestamp?: number
  reason?: string
  isCurrentUser?: boolean
  filePaths?: string[]
  fileResources: FileResource[]
}

export interface CertificationFile {
  file: Blob
  fileName: string
}

export interface CertificationRequestDTO {
  requestId: number;
  tokenId: number;
  reason: string;
  requester: string;
  certifierAddress: string;
  requestTime: string;
  status: string;
  fileResources: FileResource[];
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
  description?: string;
  chainStatus?: string;
  certificationTime?: number | null;
  chainComment?: string;
  cid?: string;
}

export interface Asset {
  tokenId: string
  cid: string
  metadata: {
    fileName: string
    fileSize: number
    fileType: string
    category?: string
    description?: string
    uploadTime?: string
  }
  isCertified: boolean
  registrationDate?: string
  version?: string
  pendingCertifiers?: string[]
  certificationStatus?: CertificationStatus[]
  certificationRequest?: CertificationRequestDTO
}

export interface AssetCertificationDetails {
  asset: {
    tokenId: number
    metadata: AssetMetadata
    certifications: Array<{
      certifier: string
      timestamp: number
      comment: string
    }>
    certificationStatus: CertificationStatus[]
  }
} 