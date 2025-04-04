package com.wpf.DigitalAsset.controller;

import com.wpf.DigitalAsset.dao.*;
import com.wpf.DigitalAsset.dto.*;
import com.wpf.DigitalAsset.service.CertificationService;
import com.wpf.DigitalAsset.service.FileStorageService;
import jakarta.persistence.EntityNotFoundException;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import jakarta.persistence.criteria.Predicate;
import java.util.logging.Logger;
import java.io.IOException;

/**
 * 资产认证控制器
 */
@RestController
@RequestMapping("/api/certification")
public class CertificationController {
    
    private static final Logger logger = Logger.getLogger(CertificationController.class.getName());
    
    private final CertificationService certificationService;
    private final CertificationRecordRepository certificationRecordRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    
    @Autowired
    public CertificationController(
            CertificationService certificationService,
            CertificationRecordRepository certificationRecordRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService) {
        this.certificationService = certificationService;
        this.certificationRecordRepository = certificationRecordRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }
    
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
     * 提交认证请求 - 修改为支持文件上传
     */
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<Long>> submitRequest(
            @RequestParam("tokenId") Long tokenId,
            @RequestParam("reason") String reason,
            @RequestParam("requester") String requester,
            @RequestParam("certifierAddress") String certifierAddress,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        
        logger.info("开始处理认证请求 - 认证者地址：" + certifierAddress);
        List<String> storedFilePaths = new ArrayList<>();
        
        try {
            // 1. 验证文件
            if (files != null && !files.isEmpty()) {
                for (MultipartFile file : files) {
                    if (file == null || file.isEmpty()) {
                        continue;
                    }
                    if (file.getSize() > 10 * 1024 * 1024) { // 10MB限制
                        return ResponseEntity.badRequest()
                            .body(new ApiResponse<>(false, "文件大小不能超过10MB", null));
                    }
                }
            }
            
            // 2. 存储文件
            if (files != null && !files.isEmpty()) {
                try {
                    storedFilePaths = fileStorageService.storeFiles(files, tokenId);
                } catch (IOException e) {
                    logger.severe("文件存储失败: " + e.getMessage());
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(false, "文件存储失败: " + e.getMessage(), null));
                }
            }
            
            // 3. 创建认证请求
            CertificationRequestDTO requestDTO = new CertificationRequestDTO();
            requestDTO.setTokenId(tokenId);
            requestDTO.setReason(reason);
            requestDTO.setRequester(requester);
            requestDTO.setCertifierAddress(certifierAddress);
            requestDTO.setFilePaths(storedFilePaths);
            
            AssetCertificationRequest request = certificationService.createRequest(requestDTO);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "认证请求提交成功", request.getId()));
        } catch (IllegalStateException e) {
            // 如果创建请求失败，清理已上传的文件
            if (!storedFilePaths.isEmpty()) {
                try {
                    fileStorageService.deleteFiles(storedFilePaths);
                } catch (Exception ex) {
                    logger.severe("清理文件失败: " + ex.getMessage());
                }
            }
            logger.warning("提交认证请求失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            // 如果发生其他错误，也清理文件
            if (!storedFilePaths.isEmpty()) {
                try {
                    fileStorageService.deleteFiles(storedFilePaths);
                } catch (Exception ex) {
                    logger.severe("清理文件失败: " + ex.getMessage());
                }
            }
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
            @RequestBody CertificationActionDTO signatureDTO) {
        try {
            certificationService.saveCertificationRequest(signatureDTO);
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
     * 获取签名
     */
    @GetMapping("/signatures/{tokenId}")
    public ResponseEntity<ApiResponse<List<CertificationSignatureDTO>>> getCertificationSignatures(@PathVariable Long tokenId){
        try{
            List<CertificationSignatureDTO> certificationSignatureDTOList = certificationService.getCertificationSignature(tokenId);
            return ResponseEntity.ok(new ApiResponse<>(true, "成功获取签名", certificationSignatureDTOList));
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "获取认证签名失败: " + e.getMessage(), null));
        }
    }
    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<Void>> updateDatabase(@RequestBody UpdateDatabaseDTO request){
        try{
            certificationService.updateCertification(request);
            return ResponseEntity.ok(new ApiResponse<>(true, "成功更新数据库",null));
        }catch (Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "更新数据库失败: " + e.getMessage(), null));
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
        dto.setRequestTime(request.getCertificationTime());
        dto.setStatus(String.valueOf(request.getStatus()));
        dto.setCertifierAddress(request.getCertifierAddress());

        
        return dto;
    }

    @GetMapping("/records")
    public ResponseEntity<?> getCertificationRecords(
            @Valid CertificationRecordsQueryDTO query,
            BindingResult bindingResult) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userName = authentication.getName();
        String address = userRepository.findByUsername(userName)
                .map(User::getWeb3address)
                .orElseThrow();

        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest()
                    .body(bindingResult.getAllErrors());
        }

        if (!query.isValidDateRange()) {
            return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("message", "结束日期不能早于开始日期"));
        }

        Pageable pageable = PageRequest.of(
                query.getPage() - 1,
                query.getPageSize()
        );

        Specification<CertificationRecord> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("certifierAddress"), address));
            if (query.getStatus() != null) {
                try {
                    predicates.add(cb.equal(
                            root.get("status"),
                            query.getStatus()
                    ));
                } catch (IllegalArgumentException e) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "无效的状态参数: " + query.getStatus()
                    );
                }
            }

            if (query.getStartDate() != null && query.getEndDate() != null) {
                predicates.add( cb.between(
                        root.get("createdAt"),
                        query.getStartDate(),
                        query.getEndDate().plusDays(1)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<CertificationRecord> pageResult = certificationRecordRepository.findAll(spec, pageable);
        logger.info(pageResult.toString());
        return ResponseEntity.ok()
                .body(new PageResult<>(
                        pageResult.getContent(),
                        pageResult.getTotalElements()
                ));
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