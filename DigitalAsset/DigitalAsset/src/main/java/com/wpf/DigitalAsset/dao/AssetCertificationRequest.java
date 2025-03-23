package com.wpf.DigitalAsset.dao;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 资产认证请求实体类
 */
@Entity
@Table(name = "asset_certification_request")
@Data
public class AssetCertificationRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "token_id", nullable = false)
    private Long tokenId;
    
    @Column(name = "requester_address", nullable = false, length = 42)
    private String requesterAddress;
    
    @Column(name = "request_time", nullable = false)
    private LocalDateTime requestTime;
    
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED
    
    @Column(name = "certifier_address", length = 42)
    private String certifierAddress;
    
    @Column(name = "certification_time")
    private LocalDateTime certificationTime;
    
    @Column(name = "certificate_cid", length = 100)
    private String certificateCid;
    
    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;
    
    // 默认构造函数
    public AssetCertificationRequest() {
        this.requestTime = LocalDateTime.now();
    }
    
    // 初始化请求时的快捷构造函数
    public AssetCertificationRequest(Long tokenId, String requesterAddress, String reason) {
        this.tokenId = tokenId;
        this.requesterAddress = requesterAddress;
        this.reason = reason;
        this.requestTime = LocalDateTime.now();
        this.status = "PENDING";
    }
} 