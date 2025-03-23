package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.dao.UserWeb3Role;
import com.wpf.DigitalAsset.dao.UserWeb3RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * Web3角色服务实现
 */
@Service
public class Web3RoleServiceImpl implements Web3RoleService {
    
    private static final Logger logger = Logger.getLogger(Web3RoleServiceImpl.class.getName());
    
    // 系统支持的角色列表
    private static final List<String> SUPPORTED_ROLES = Arrays.asList(
        "REGISTRAR_ROLE", "CERTIFIER_ROLE", "ADMIN_ROLE"
    );
    
    @Autowired
    private UserWeb3RoleRepository roleRepository;
    
    @Override
    @Transactional
    public UserWeb3Role addUserRole(String walletAddress, String roleName) {
        logger.info("添加用户角色: " + walletAddress + " -> " + roleName);
        
        // 验证角色名是否合法
        if (!SUPPORTED_ROLES.contains(roleName)) {
            throw new IllegalArgumentException("不支持的角色名称: " + roleName);
        }
        
        // 检查是否已存在该角色
        Optional<UserWeb3Role> existingRole = roleRepository.findByWalletAddressAndRoleName(walletAddress, roleName);
        if (existingRole.isPresent()) {
            logger.info("用户已拥有该角色: " + walletAddress + " -> " + roleName);
            return existingRole.get();
        }
        
        // 创建新角色
        UserWeb3Role role = new UserWeb3Role(walletAddress, roleName);
        return roleRepository.save(role);
    }
    
    @Override
    @Transactional
    public boolean removeUserRole(String walletAddress, String roleName) {
        logger.info("移除用户角色: " + walletAddress + " -> " + roleName);
        
        // 查找角色
        Optional<UserWeb3Role> role = roleRepository.findByWalletAddressAndRoleName(walletAddress, roleName);
        if (role.isEmpty()) {
            logger.info("用户没有该角色: " + walletAddress + " -> " + roleName);
            return false;
        }
        
        // 删除角色
        roleRepository.delete(role.get());
        return true;
    }
    
    @Override
    public List<UserWeb3Role> getUserRoles(String walletAddress) {
        logger.info("获取用户角色: " + walletAddress);
        return roleRepository.findByWalletAddress(walletAddress);
    }
    
    @Override
    public boolean hasRole(String walletAddress, String roleName) {
        logger.info("检查用户角色: " + walletAddress + " -> " + roleName);
        return roleRepository.existsByWalletAddressAndRoleName(walletAddress, roleName);
    }
    
    @Override
    @Transactional
    public List<UserWeb3Role> verifyUserRoles(String walletAddress) {
        logger.info("验证用户角色: " + walletAddress);
        
        // 获取用户所有角色
        List<UserWeb3Role> roles = roleRepository.findByWalletAddress(walletAddress);
        
        // 在生产环境中，这里应该调用区块链接口验证角色
        // 例如通过Web3j或其他方式与区块链交互
        // 这里简化为将所有角色标记为已验证
        
        for (UserWeb3Role role : roles) {
            role.verify();
            role.setLastVerifiedAt(LocalDateTime.now());
            roleRepository.save(role);
        }
        
        return roles;
    }
    
    @Override
    public List<UserWeb3Role> getUsersByRole(String roleName) {
        logger.info("获取拥有角色的用户: " + roleName);
        return roleRepository.findByRoleName(roleName);
    }
    
    @Override
    public Optional<UserWeb3Role> getUserRole(String walletAddress, String roleName) {
        logger.info("获取用户特定角色: " + walletAddress + " -> " + roleName);
        return roleRepository.findByWalletAddressAndRoleName(walletAddress, roleName);
    }
} 