package com.wpf.DigitalAsset.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 用户区块链角色仓库接口
 */
@Repository
public interface UserWeb3RoleRepository extends JpaRepository<UserWeb3Role, Long> {
    
    /**
     * 根据钱包地址查询所有角色
     * @param walletAddress 钱包地址
     * @return 角色列表
     */
    List<UserWeb3Role> findByWalletAddress(String walletAddress);
    
    /**
     * 根据钱包地址和角色名查询
     * @param walletAddress 钱包地址
     * @param roleName 角色名称
     * @return 角色信息（如果存在）
     */
    Optional<UserWeb3Role> findByWalletAddressAndRoleName(String walletAddress, String roleName);
    
    /**
     * 检查用户是否拥有某角色
     * @param walletAddress 钱包地址
     * @param roleName 角色名称
     * @return 是否存在
     */
    boolean existsByWalletAddressAndRoleName(String walletAddress, String roleName);
    
    /**
     * 根据角色名查询所有用户
     * @param roleName 角色名称
     * @return 拥有该角色的用户列表
     */
    List<UserWeb3Role> findByRoleName(String roleName);
} 