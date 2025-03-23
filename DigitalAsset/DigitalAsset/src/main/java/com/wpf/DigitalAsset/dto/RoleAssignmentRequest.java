package com.wpf.DigitalAsset.dto;

/**
 * 角色分配请求DTO
 */
public class RoleAssignmentRequest {
    
    /**
     * 用户钱包地址
     */
    private String walletAddress;
    
    /**
     * 角色名称
     */
    private String roleName;
    
    /**
     * 默认构造函数
     */
    public RoleAssignmentRequest() {
    }
    
    /**
     * 带参数构造函数
     * @param walletAddress 钱包地址
     * @param roleName 角色名称
     */
    public RoleAssignmentRequest(String walletAddress, String roleName) {
        this.walletAddress = walletAddress;
        this.roleName = roleName;
    }
    
    /**
     * 获取钱包地址
     * @return 钱包地址
     */
    public String getWalletAddress() {
        return walletAddress;
    }
    
    /**
     * 设置钱包地址
     * @param walletAddress 钱包地址
     */
    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }
    
    /**
     * 获取角色名称
     * @return 角色名称
     */
    public String getRoleName() {
        return roleName;
    }
    
    /**
     * 设置角色名称
     * @param roleName 角色名称
     */
    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
    
    @Override
    public String toString() {
        return "RoleAssignmentRequest{" +
               "walletAddress='" + walletAddress + '\'' +
               ", roleName='" + roleName + '\'' +
               '}';
    }
} 