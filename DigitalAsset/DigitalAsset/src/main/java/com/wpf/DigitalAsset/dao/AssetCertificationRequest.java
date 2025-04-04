package com.wpf.DigitalAsset.dao;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

/**
 * 资产认证请求实体类
 * 用于记录数字资产的认证请求信息
 */
@Entity
@Table(name = "asset_certification_requests")
@EntityListeners(AuditingEntityListener.class)
@Data
public class AssetCertificationRequest {

    public AssetCertificationRequest() {

    }

    /**
     * 认证请求状态枚举
     */
    public enum RequestStatus {
        PENDING("待处理"),
        APPROVED("已批准"),
        REJECTED("已拒绝"),
        COMPLETED("已完成");
        
        private final String description;
        
        RequestStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, name = "token_id")
    private Long tokenId;
    
    /**
     * 请求原因（PENDING状态）或拒绝原因（REJECTED状态）
     */
    @Column(nullable = false, length = 1000)
    private String reason;
    
    @Column(nullable = false, length = 42, name = "requester_address")
    private String requester;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;
    
    @Column(length = 1000, name = "additional_info")
    private String additionalInfo;
    
    @Column(length = 42, name = "certifier_address")
    private String certifierAddress;
    
    @Column(name = "certification_time")
    private LocalDateTime certificationTime;
    
    @Column(length = 100, name = "certificate_cid")
    private String certificateCid;
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "certification_files",
        joinColumns = @JoinColumn(name = "request_id")
    )
    @Column(name = "file_path")
    private List<String> filePaths = new ArrayList<>();

    /**
     * 检查请求是否可处理
     */
    public boolean isProcessable() {
        return status == RequestStatus.PENDING;
    }
    
    /**
     * 批准认证请求
     */
    public void approve(String certifierAddress) {
        if (!isProcessable()) {
            throw new IllegalStateException("无法处理非待处理状态的请求");
        }
        this.status = RequestStatus.APPROVED;
        this.certifierAddress = certifierAddress;
        this.certificationTime = LocalDateTime.now();
    }
    
    /**
     * 拒绝认证请求
     */
    public void reject(String certifierAddress, String reason) {
        if (!isProcessable()) {
            throw new IllegalStateException("无法处理非待处理状态的请求");
        }
        this.status = RequestStatus.REJECTED;
        this.certifierAddress = certifierAddress;
        this.reason = reason;
        this.certificationTime = LocalDateTime.now();
    }
    
    /**
     * 完成认证请求
     */
    public void complete(String certificateCid) {
        if (status != RequestStatus.APPROVED) {
            throw new IllegalStateException("只有已批准的请求才能完成");
        }
        this.status = RequestStatus.COMPLETED;
        this.certificateCid = certificateCid;
    }
    
    /**
     * 初始化请求时的构造函数
     */
    public AssetCertificationRequest(Long tokenId, String requester, String reason) {
        this.tokenId = tokenId;
        this.requester = requester;
        this.reason = reason;
        this.status = RequestStatus.PENDING;
    }

} 