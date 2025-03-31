package com.wpf.DigitalAsset.dto;

import lombok.Data;

import java.sql.Timestamp;
import java.time.LocalDateTime;


@Data
public class CertificationActionDTO {
    private String certifierAddress; // 认证者的钱包地址
    private Long tokenId;
    private String reason;
    private String reasonHash; // 评论的哈希值
    private String signature;
    private String messageToSign;
    private String messageHash; // 消息哈希
    private Timestamp timestamp;
} 