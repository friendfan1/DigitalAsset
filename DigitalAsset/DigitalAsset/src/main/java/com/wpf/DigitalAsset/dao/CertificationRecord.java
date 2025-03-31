package com.wpf.DigitalAsset.dao;

import com.wpf.DigitalAsset.dto.UpdateDatabaseDTO;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 资产认证记录实体类，用于存储已完成的认证
 */
@Entity
@Table(name = "certification_record")
@Data
public class CertificationRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "token_id", nullable = false, unique = true)
    private Long tokenId;
    
    @Column(name = "certifier_address", nullable = false, length = 42)
    private String certifierAddress;
    
    @Column(name = "certification_time", nullable = false)
    private LocalDateTime certificationTime;
    
    @Column(name = "transaction_hash", length = 66)
    private String transactionHash;
    
    // 默认构造函数
    public CertificationRecord() {
        this.certificationTime = LocalDateTime.now();
    }
    
    // 从认证请求创建记录的构造函数
    public CertificationRecord(UpdateDatabaseDTO request) {
        this.tokenId = request.getTokenId();
        this.certifierAddress = request.getCertifierAddress();
        this.certificationTime = LocalDateTime.now();
        this.transactionHash = request.getTxHash();
    }
} 