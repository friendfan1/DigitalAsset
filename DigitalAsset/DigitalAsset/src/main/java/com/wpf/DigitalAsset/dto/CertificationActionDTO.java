package com.wpf.DigitalAsset.dto;

import lombok.Data;

/**
 * 认证操作DTO，用于接收认证者的批准或拒绝操作
 */
@Data
public class CertificationActionDTO {
    
    private String certifierAddress; // 认证者的钱包地址
    private String comments;        // 认证评论或拒绝理由
    private String certificateCid;  // 证书的IPFS CID (如有)
} 