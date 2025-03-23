package com.wpf.DigitalAsset.controller;

import com.wpf.DigitalAsset.dao.UserWeb3Role;
import com.wpf.DigitalAsset.dto.ApiResponse;
import com.wpf.DigitalAsset.dto.RoleAssignmentRequest;
import com.wpf.DigitalAsset.service.Web3RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * Web3角色控制器
 * 用于管理用户的区块链角色
 */
@RestController
@RequestMapping("/api/web3/roles")
public class Web3RoleController {
    
    private static final Logger logger = Logger.getLogger(Web3RoleController.class.getName());
    
    @Autowired
    private Web3RoleService roleService;
    
    /**
     * 分配角色给用户
     * @param request 角色分配请求
     * @return API响应
     */
    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> assignRole(@RequestBody RoleAssignmentRequest request) {
        logger.info("角色分配请求: " + request.getWalletAddress() + " -> " + request.getRoleName());
        
        try {
            UserWeb3Role role = roleService.addUserRole(request.getWalletAddress(), request.getRoleName());
            return ResponseEntity.ok(
                new ApiResponse(true, "角色分配成功", role)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                new ApiResponse(false, e.getMessage(), null)
            );
        } catch (Exception e) {
            logger.severe("角色分配失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(
                new ApiResponse(false, "角色分配失败: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * 撤销用户角色
     * @param request 角色分配请求
     * @return API响应
     */
    @PostMapping("/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> revokeRole(@RequestBody RoleAssignmentRequest request) {
        logger.info("角色撤销请求: " + request.getWalletAddress() + " -> " + request.getRoleName());
        
        try {
            boolean result = roleService.removeUserRole(request.getWalletAddress(), request.getRoleName());
            if (result) {
                return ResponseEntity.ok(
                    new ApiResponse(true, "角色撤销成功", null)
                );
            } else {
                return ResponseEntity.ok(
                    new ApiResponse(false, "用户没有该角色", null)
                );
            }
        } catch (Exception e) {
            logger.severe("角色撤销失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(
                new ApiResponse(false, "角色撤销失败: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * 获取用户的所有角色
     * @param walletAddress 钱包地址
     * @return API响应
     */
    @GetMapping("/user/{walletAddress}")
    public ResponseEntity<ApiResponse> getUserRoles(@PathVariable String walletAddress) {
        logger.info("获取用户角色: " + walletAddress);
        
        try {
            List<UserWeb3Role> roles = roleService.getUserRoles(walletAddress);
            return ResponseEntity.ok(
                new ApiResponse(true, "获取角色成功", roles)
            );
        } catch (Exception e) {
            logger.severe("获取角色失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(
                new ApiResponse(false, "获取角色失败: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * 验证用户是否拥有特定角色
     * @param walletAddress 钱包地址
     * @param roleName 角色名称
     * @return API响应
     */
    @GetMapping("/check/{walletAddress}/{roleName}")
    public ResponseEntity<ApiResponse> checkUserRole(
            @PathVariable String walletAddress,
            @PathVariable String roleName) {
        logger.info("检查用户角色: " + walletAddress + " -> " + roleName);
        
        try {
            boolean hasRole = roleService.hasRole(walletAddress, roleName);
            return ResponseEntity.ok(
                new ApiResponse(true, "角色检查成功", hasRole)
            );
        } catch (Exception e) {
            logger.severe("角色检查失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(
                new ApiResponse(false, "角色检查失败: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * 与区块链同步验证用户角色
     * @param walletAddress 钱包地址
     * @return API响应
     */
    @PostMapping("/verify/{walletAddress}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> verifyUserRoles(@PathVariable String walletAddress) {
        logger.info("验证用户角色: " + walletAddress);
        
        try {
            List<UserWeb3Role> roles = roleService.verifyUserRoles(walletAddress);
            return ResponseEntity.ok(
                new ApiResponse(true, "角色验证成功", roles)
            );
        } catch (Exception e) {
            logger.severe("角色验证失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(
                new ApiResponse(false, "角色验证失败: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * 获取拥有特定角色的所有用户
     * @param roleName 角色名称
     * @return API响应
     */
    @GetMapping("/role/{roleName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getUsersByRole(@PathVariable String roleName) {
        logger.info("获取拥有角色的用户: " + roleName);
        
        try {
            List<UserWeb3Role> users = roleService.getUsersByRole(roleName);
            return ResponseEntity.ok(
                new ApiResponse(true, "获取用户成功", users)
            );
        } catch (Exception e) {
            logger.severe("获取用户失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(
                new ApiResponse(false, "获取用户失败: " + e.getMessage(), null)
            );
        }
    }
} 