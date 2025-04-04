package com.wpf.DigitalAsset.dto;

import lombok.Data;

import java.sql.Timestamp;
import java.time.LocalDateTime;


@Data
public class CertificationActionDTO {
    private String certifierAddress; // 认证者的钱包地址
    private Long tokenId;
} 