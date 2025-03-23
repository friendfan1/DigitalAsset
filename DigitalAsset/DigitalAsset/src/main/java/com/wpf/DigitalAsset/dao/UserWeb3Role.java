package com.wpf.DigitalAsset.dao;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户区块链角色实体类，用于映射用户与区块链上的角色
 */
@Entity
@Table(name = "user_web3_roles")
@Data
public class UserWeb3Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 用户钱包地址
    @Column(name = "wallet_address", nullable = false, length = 42, unique = true)
    private String walletAddress;

    // 角色：REGISTRAR_ROLE, CERTIFIER_ROLE, ADMIN_ROLE
    @Column(name = "role_name", nullable = false, length = 30)
    private String roleName;

    // 角色授予时间
    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt;

    // 是否已验证（通过链上查询确认）
    @Column(name = "verified", nullable = false)
    private boolean verified;

    // 最后验证时间
    @Column(name = "last_verified_at")
    private LocalDateTime lastVerifiedAt;

    // 默认构造函数
    public UserWeb3Role() {
        this.grantedAt = LocalDateTime.now();
        this.verified = false;
    }

    // 便捷构造函数
    public UserWeb3Role(String walletAddress, String roleName) {
        this();
        this.walletAddress = walletAddress;
        this.roleName = roleName;
    }

    // 验证角色
    public void verify() {
        this.verified = true;
        this.lastVerifiedAt = LocalDateTime.now();
    }
} 