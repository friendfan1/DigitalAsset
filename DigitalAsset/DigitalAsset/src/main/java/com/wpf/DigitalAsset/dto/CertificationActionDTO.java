package com.wpf.DigitalAsset.dto;

import lombok.Data;

import java.sql.Timestamp;
import java.time.LocalDateTime;

/**
 * 认证操作DTO，用于接收认证者的批准或拒绝操作
 */
@Data
public class CertificationActionDTO {
    private String certifierAddress; // 认证者的钱包地址
    private Long tokenId;
    private String reason;
    private String signature;
    private String messageToSign;
    private Timestamp timestamp;
} 