package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.dao.UserWeb3Role;

import java.util.List;
import java.util.Optional;

/**
 * Web3角色服务接口，处理用户区块链角色管理
 */
public interface Web3RoleService {
    
    /**
     * 添加用户角色
     * @param walletAddress 钱包地址
     * @param roleName 角色名称
     * @return 创建的角色信息
     */
    UserWeb3Role addUserRole(String walletAddress, String roleName);
    
    /**
     * 移除用户角色
     * @param walletAddress 钱包地址
     * @param roleName 角色名称
     * @return 是否成功
     */
    boolean removeUserRole(String walletAddress, String roleName);
    
    /**
     * 获取用户的所有角色
     * @param walletAddress 钱包地址
     * @return 角色列表
     */
    List<UserWeb3Role> getUserRoles(String walletAddress);
    
    /**
     * 检查用户是否拥有某角色
     * @param walletAddress 钱包地址
     * @param roleName 角色名称
     * @return 是否拥有
     */
    boolean hasRole(String walletAddress, String roleName);
    
    /**
     * 验证用户角色与区块链状态同步
     * @param walletAddress 钱包地址
     * @return 验证后的角色列表
     */
    List<UserWeb3Role> verifyUserRoles(String walletAddress);
    
    /**
     * 获取所有拥有特定角色的用户
     * @param roleName 角色名称
     * @return 用户列表
     */
    List<UserWeb3Role> getUsersByRole(String roleName);
    
    /**
     * 根据钱包地址和角色名获取角色信息
     * @param walletAddress 钱包地址
     * @param roleName 角色名称
     * @return 角色信息（如果存在）
     */
    Optional<UserWeb3Role> getUserRole(String walletAddress, String roleName);
} 