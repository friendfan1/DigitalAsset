package com.wpf.DigitalAsset.dto;

import lombok.Data;

/**
 * 认证请求DTO，用于接收前端提交的认证请求
 */
@Data
public class CertificationRequestDTO {
    
    private Long tokenId;         // 资产的tokenId
    private String reason;        // 申请认证的理由
    private String requesterAddress; // 申请者钱包地址
    private String additionalInfo; // 其他补充信息
} 