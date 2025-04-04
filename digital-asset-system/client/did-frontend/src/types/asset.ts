export interface AssetMetadata {
  fileName: string
  fileSize: number
  fileType: string
  uploadTime: number
  description?: string
  [key: string]: any
}

export interface Asset {
  tokenId: number
  owner: string
  cid: string
  metadata: AssetMetadata
  isCertified: boolean
  pendingCertifiers?: string[]
}

export interface CertificationStatus {
  certifierAddress: string
  status: 'PENDING' | 'APPROVED'
  certifierName?: string
  timestamp?: number
  reason?: string
  isCurrentUser?: boolean
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