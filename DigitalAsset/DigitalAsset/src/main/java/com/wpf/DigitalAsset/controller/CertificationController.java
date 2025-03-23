package com.wpf.DigitalAsset.controller;

import com.wpf.DigitalAsset.dao.AssetCertificationRequest;
import com.wpf.DigitalAsset.dao.CertificationRecord;
import com.wpf.DigitalAsset.dto.CertificationActionDTO;
import com.wpf.DigitalAsset.dto.CertificationRequestDTO;
import com.wpf.DigitalAsset.service.CertificationService;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * 资产认证控制器
 */
@RestController
@RequestMapping("/api/certification")
public class CertificationController {
    
    private static final Logger logger = Logger.getLogger(CertificationController.class.getName());
    
    @Autowired
    private CertificationService certificationService;
    
    /**
     * 提交认证请求
     */
    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> submitRequest(@RequestBody CertificationRequestDTO requestDTO) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            AssetCertificationRequest request = certificationService.createRequest(requestDTO);
            
            response.put("success", true);
            response.put("message", "认证请求提交成功");
            response.put("requestId", request.getId());
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            logger.warning("提交认证请求失败: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            logger.severe("提交认证请求发生错误: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", "提交认证请求失败: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 获取用户的认证请求
     */
    @GetMapping("/requests/{address}")
    public ResponseEntity<Map<String, Object>> getUserRequests(
            @PathVariable String address, 
            @RequestParam(required = false) String status) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<AssetCertificationRequest> requests = certificationService.getUserRequests(address, status);
            
            response.put("success", true);
            response.put("data", requests);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("获取用户认证请求失败: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", "获取认证请求失败: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 获取待认证列表（认证机构用）
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getPendingRequests() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<AssetCertificationRequest> assets = certificationService.getPendingRequests();
            
            response.put("success", true);
            response.put("data", assets);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("获取待认证列表失败: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", "获取待认证列表失败: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 批准认证
     */
    @PostMapping("/approve/{requestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> approveRequest(
            @PathVariable Long requestId, 
            @RequestBody CertificationActionDTO actionDTO) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            CertificationRecord record = certificationService.approveRequest(requestId, actionDTO);
            
            response.put("success", true);
            response.put("message", "认证已批准");
            response.put("recordId", record.getId());
            
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            logger.warning("找不到认证请求: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (IllegalStateException e) {
            logger.warning("批准认证失败: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            logger.severe("批准认证发生错误: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", "批准认证失败: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 拒绝认证
     */
    @PostMapping("/reject/{requestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> rejectRequest(
            @PathVariable Long requestId, 
            @RequestBody CertificationActionDTO actionDTO) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            certificationService.rejectRequest(requestId, actionDTO);
            
            response.put("success", true);
            response.put("message", "认证已拒绝");
            
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            logger.warning("找不到认证请求: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (IllegalStateException e) {
            logger.warning("拒绝认证失败: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            logger.severe("拒绝认证发生错误: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", "拒绝认证失败: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 获取资产认证状态 - 公开接口，无需认证
     */
    @GetMapping("/status/{tokenId}")
    public ResponseEntity<Map<String, Object>> getCertificationStatus(@PathVariable Long tokenId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean isCertified = certificationService.isAssetCertified(tokenId);
            Optional<CertificationRecord> recordOpt = certificationService.getAssetCertification(tokenId);
            
            response.put("success", true);
            response.put("isCertified", isCertified);
            
            if (isCertified && recordOpt.isPresent()) {
                response.put("certificationRecord", recordOpt.get());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("获取资产认证状态失败: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", "获取认证状态失败: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 获取认证者的认证记录
     */
    @GetMapping("/records/{certifierAddress}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getCertifierRecords(@PathVariable String certifierAddress) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<CertificationRecord> records = certificationService.getCertifierRecords(certifierAddress);
            
            response.put("success", true);
            response.put("data", records);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("获取认证者记录失败: " + e.getMessage());
            
            response.put("success", false);
            response.put("message", "获取认证记录失败: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
} 