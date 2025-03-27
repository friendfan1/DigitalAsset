package com.wpf.DigitalAsset.controller;

import com.wpf.DigitalAsset.dao.AssetCertificationRequest;
import com.wpf.DigitalAsset.dao.CertificationRecord;
import com.wpf.DigitalAsset.dto.*;
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
     * 获取所有认证者列表
     */
    @GetMapping("/certifiers")
    public ResponseEntity<ApiResponse<List<CertifierDTO>>> getAllCertifiers() {

        try {
            List<CertifierDTO> certifiers = certificationService.getAllCertifiers();
            return ResponseEntity.ok(new ApiResponse<>(true, "获取认证者列表成功", certifiers));
        } catch (Exception e) {
            logger.severe("获取认证者列表失败: " + e.getMessage());
            return ResponseEntity.ok(new ApiResponse<>(false, "获取认证者列表失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 提交认证请求
     */
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<Long>> submitRequest(@RequestBody CertificationRequestDTO requestDTO) {
        logger.info("地址："+requestDTO.getCertifierAddress());
        try {
            AssetCertificationRequest request = certificationService.createRequest(requestDTO);
            return ResponseEntity.ok(new ApiResponse<>(true, "认证请求提交成功", request.getId()));
        } catch (IllegalStateException e) {
            logger.warning("提交认证请求失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            logger.severe("提交认证请求发生错误: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "提交认证请求失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 获取待处理的认证请求
     */
    @GetMapping("/pending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CertificationRequestDTO>>> getPendingRequests(
            @RequestParam(required = false) String certifierAddress) {
        logger.info("认证者地址"+certifierAddress);
        try {
            List<CertificationRequestDTO> pendingRequests;
            if (certifierAddress != null && !certifierAddress.isEmpty()) {
                pendingRequests = certificationService.getPendingCertificationRequests(certifierAddress);
            } else {
                List<AssetCertificationRequest> requests = certificationService.getPendingRequests();
                pendingRequests = requests.stream()
                    .map(this::convertToDTO)
                    .toList();
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "获取待处理认证请求成功", pendingRequests));
        } catch (Exception e) {
            logger.severe("获取待处理认证请求失败: " + e.getMessage());
            return ResponseEntity.ok(new ApiResponse<>(false, "获取待处理认证请求失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 提交认证签名
     */
    @PostMapping("/sign")
    public ResponseEntity<ApiResponse<String>> submitSignature(
            @RequestBody CertificationRequestDTO signatureDTO) {
        try {
            certificationService.saveCertificationRequest(
                signatureDTO.getRequestId(), 
                signatureDTO.getCertifierAddress(),
                signatureDTO.getSignature()
            );
            return ResponseEntity.ok(new ApiResponse<>(true, "认证签名提交成功", null));
        } catch (Exception e) {
            logger.severe("认证签名提交失败: " + e.getMessage());
            return ResponseEntity.ok(new ApiResponse<>(false, "认证签名提交失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 获取用户的认证请求
     */
    @GetMapping("/requests/{address}")
    public ResponseEntity<ApiResponse<List<CertificationRequestDTO>>> getUserRequests(
            @PathVariable String address, 
            @RequestParam(required = false) String status) {
        try {
            List<AssetCertificationRequest> requests = certificationService.getUserRequests(address, status);
            List<CertificationRequestDTO> requestDTOs = requests.stream()
                .map(this::convertToDTO)
                .toList();
            return ResponseEntity.ok(new ApiResponse<>(true, "获取用户认证请求成功", requestDTOs));
        } catch (Exception e) {
            logger.severe("获取用户认证请求失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "获取认证请求失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 批准认证
     */
    @PostMapping("/approve/{requestId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Long>> approveRequest(
            @PathVariable Long requestId, 
            @RequestBody CertificationActionDTO actionDTO) {
        try {
            CertificationRecord record = certificationService.approveRequest(requestId, actionDTO);
            return ResponseEntity.ok(new ApiResponse<>(true, "认证已批准", record.getId()));
        } catch (EntityNotFoundException e) {
            logger.warning("找不到认证请求: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (IllegalStateException e) {
            logger.warning("批准认证失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            logger.severe("批准认证发生错误: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "批准认证失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 拒绝认证
     */
    @PostMapping("/reject/{requestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @PathVariable Long requestId, 
            @RequestBody CertificationActionDTO actionDTO) {
        try {
            certificationService.rejectRequest(requestId, actionDTO);
            return ResponseEntity.ok(new ApiResponse<>(true, "认证已拒绝", null));
        } catch (EntityNotFoundException e) {
            logger.warning("找不到认证请求: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (IllegalStateException e) {
            logger.warning("拒绝认证失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            logger.severe("拒绝认证发生错误: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "拒绝认证失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 获取资产认证状态 - 公开接口，无需认证
     */
    @GetMapping("/status/{tokenId}")
    public ResponseEntity<ApiResponse<List<CertificationStatusDTO>>> getCertificationStatus(@PathVariable Long tokenId) {
        try {
            List<CertificationStatusDTO> certificationStatusDTOs = certificationService.getCertificationStatus(tokenId);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取认证状态成功", certificationStatusDTOs));
        } catch (Exception e) {
            logger.severe("获取资产认证状态失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "获取认证状态失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 获取认证者的认证记录
     */
    @GetMapping("/records/{certifierAddress}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CertificationRecord>>> getCertifierRecords(@PathVariable String certifierAddress) {
        try {
            List<CertificationRecord> records = certificationService.getCertifierRecords(certifierAddress);
            return ResponseEntity.ok(new ApiResponse<>(true, "获取认证记录成功", records));
        } catch (Exception e) {
            logger.severe("获取认证者记录失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, "获取认证记录失败: " + e.getMessage(), null));
        }
    }
    
    /**
     * 将AssetCertificationRequest转换为DTO
     */
    private CertificationRequestDTO convertToDTO(AssetCertificationRequest request) {
        CertificationRequestDTO dto = new CertificationRequestDTO();
        dto.setRequestId(request.getId());
        dto.setTokenId(request.getTokenId());
        dto.setReason(request.getReason());
        dto.setRequester(request.getRequester());
        dto.setRequestTime(request.getCertificationTime().toString());
        dto.setStatus(String.valueOf(request.getStatus()));
        dto.setCertifierAddress(request.getCertifierAddress());

        
        return dto;
    }
    
    /**
     * 认证状态内部类，用于简单返回资产认证状态
     */
    private static class CertificationStatus {
        private final boolean certified;
        
        public CertificationStatus(boolean certified) {
            this.certified = certified;
        }
        
        public boolean isCertified() {
            return certified;
        }
    }
} 