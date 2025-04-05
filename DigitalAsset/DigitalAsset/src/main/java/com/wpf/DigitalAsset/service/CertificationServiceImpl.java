package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.dao.*;
import com.wpf.DigitalAsset.dto.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * 认证服务实现类
 */
@Service
public class CertificationServiceImpl implements CertificationService {

    private static final Logger logger = Logger.getLogger(CertificationServiceImpl.class.getName());

    @Autowired
    private AssetCertificationRequestRepository requestRepository;
    @Autowired
    private CertificationRecordRepository recordRepository;
    @Autowired
    private UserWeb3RoleRepository userWeb3RoleRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AdminRepository adminRepository;
    @Autowired
    private CertificationSignatureRepository certificationSignatureRepository;
    @Autowired
    private FileAccessService fileAccessService;

    @Override
    @Transactional
    public AssetCertificationRequest createRequest(CertificationRequestDTO requestDTO) {
        logger.info("创建认证请求: " + requestDTO.getTokenId());
        logger.info("请求人地址" + requestDTO.getRequester());

        // 检查资产是否已认证
        if (recordRepository.existsByTokenId(requestDTO.getTokenId())) {
            logger.warning("资产已认证: " + requestDTO.getTokenId());
            throw new IllegalStateException("该资产已经认证");
        }
        if(requestRepository.existsByTokenIdAndCertifierAddress(requestDTO.getTokenId(), requestDTO.getRequester())){
            logger.warning("请求已提交: " + requestDTO.getTokenId());
            throw new IllegalStateException("该资产认证请求已经提交，请等待认证");
        }

        // 创建新的认证请求
        AssetCertificationRequest request = new AssetCertificationRequest();
        request.setTokenId(requestDTO.getTokenId());
        request.setRequester(requestDTO.getRequester());
        request.setReason(requestDTO.getReason());
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        request.setStatus(AssetCertificationRequest.RequestStatus.PENDING);
        request.setCertifierAddress(requestDTO.getCertifierAddress());
        request.setFilePaths(requestDTO.getFilePaths());
        requestRepository.save(request);

        return request;
    }

    @Override
    public List<AssetCertificationRequest> getUserRequests(String requesterAddress, String status) {
        logger.info("获取用户认证请求: " + requesterAddress + ", 状态: " + status);

        if (status != null && !status.isEmpty()) {
            return requestRepository.findByRequesterAndStatus(requesterAddress, status);
        } else {
            return requestRepository.findByRequester(requesterAddress);
        }
    }

    @Override
    public List<AssetCertificationRequest> getPendingRequests() {
        logger.info("获取所有待处理的认证请求");
        return requestRepository.findByStatus(AssetCertificationRequest.RequestStatus.PENDING);
    }


    @Override
    @Transactional
    public void rejectRequest(Long requestId, CertificationActionDTO actionDTO) {
        logger.info("拒绝认证请求: " + requestId);

        // 获取请求
        AssetCertificationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("找不到ID为 " + requestId + " 的认证请求"));

        // 检查请求状态
        if (!AssetCertificationRequest.RequestStatus.PENDING.equals(request.getStatus())) {
            throw new IllegalStateException("只能拒绝待处理的请求");
        }

        // 更新请求状态
        request.setStatus(AssetCertificationRequest.RequestStatus.REJECTED);
        request.setCertifierAddress(actionDTO.getCertifierAddress());
        request.setCertificationTime(LocalDateTime.now());

        requestRepository.save(request);
    }

    @Override
    public Optional<CertificationRecord> getAssetCertification(Long tokenId) {
        logger.info("获取资产认证记录: " + tokenId);
        return recordRepository.findByTokenId(tokenId);
    }

    @Override
    public boolean isAssetCertified(Long tokenId) {
        logger.info("检查资产是否已认证: " + tokenId);
        return recordRepository.existsByTokenId(tokenId);
    }

    @Override
    public List<CertificationRecord> getCertifierRecords(String certifierAddress) {
        logger.info("获取认证者的认证记录: " + certifierAddress);
        return recordRepository.findByCertifierAddress(certifierAddress);
    }

    @Override
    public List<CertifierDTO> getAllCertifiers() {
        List<CertifierDTO> response = new ArrayList<>();
        List<UserWeb3Role> userWeb3RoleList = userWeb3RoleRepository.findByRoleName("CERTIFIER_ROLE");
        for (UserWeb3Role userWeb3Role:userWeb3RoleList){
            if(userRepository.findByWeb3Address(userWeb3Role.getWalletAddress()).isPresent()){
                CertifierDTO certifierDTO = new CertifierDTO(userWeb3Role.getWalletAddress(),userRepository.findByWeb3Address(userWeb3Role.getWalletAddress()).get().getUsername(),true);
                response.add(certifierDTO);
                logger.info("地址:"+certifierDTO.getAddress());
            }
            if(adminRepository.findByWalletAddress(userWeb3Role.getWalletAddress()).isPresent()){
                CertifierDTO certifierDTO = new CertifierDTO(userWeb3Role.getWalletAddress(),adminRepository.findByWalletAddress(userWeb3Role.getWalletAddress()).get().getUsername(),true);
                response.add(certifierDTO);
                logger.info("地址:"+certifierDTO.getAddress());
            }

        }
        return response;
    }

    @Override
    public void saveCertificationRequest(CertificationActionDTO requestDTO) {

    }

//    @Override
//    public void saveCertificationRequest(CertificationActionDTO requestDTO) {
//        AssetCertificationRequest assetCertificationRequest = requestRepository
//                .findByTokenIdAndCertifierAddress(requestDTO.getTokenId(), requestDTO.getCertifierAddress());
//        assetCertificationRequest.setReason(requestDTO.getReason());
//        assetCertificationRequest.setCertificationTime(requestDTO.getTimestamp().toLocalDateTime());
//        assetCertificationRequest.setStatus(AssetCertificationRequest.RequestStatus.APPROVED);
//        requestRepository.save(assetCertificationRequest);
//        CertificationSignature certificationSignature = new CertificationSignature();
//        certificationSignature.setRequestId(assetCertificationRequest.getId());
//        certificationSignature.setCertifierAddress(requestDTO.getCertifierAddress());
//        certificationSignature.setMessageToSign(requestDTO.getMessageToSign());
//        certificationSignature.setMessageHash(requestDTO.getMessageHash());
//        certificationSignature.setReasonHash(requestDTO.getReasonHash());
//        certificationSignature.setSignature(requestDTO.getSignature());
//        certificationSignature.setComment(requestDTO.getReason());
//        certificationSignature.setTimeStamp(requestDTO.getTimestamp());
//        certificationSignatureRepository.save(certificationSignature);
//    }

    @Override
    @Transactional(readOnly = true)
    public List<CertificationRequestDTO> getPendingCertificationRequests(String certifierAddress) {
        List<AssetCertificationRequest> assetCertificationRequestList = requestRepository.findByCertifierAddressAndStatus(
            certifierAddress, 
            AssetCertificationRequest.RequestStatus.PENDING
        );

        // 确保 filePaths 被加载
        assetCertificationRequestList.forEach(request -> {
            logger.info("Request ID: " + request.getId() + ", FilePaths size: " + request.getFilePaths().size());
            logger.info("FilePaths content: " + request.getFilePaths());
        });



        return assetCertificationRequestList.stream()
                .map(this::convertToDTO)
                .toList();
    }


    @Override
    public List<CertificationStatusDTO> getCertificationStatus(Long tokenId) {
        List<AssetCertificationRequest> requests = requestRepository.findByTokenId(tokenId);
        List<CertificationStatusDTO> certificationStatusDTOList = new ArrayList<>();
        for(AssetCertificationRequest request:requests){
            CertificationStatusDTO certificationStatusDTO = new CertificationStatusDTO();
            certificationStatusDTO.setCertifierAddress(request.getCertifierAddress());
            Optional<User> user = userRepository.findByWeb3Address(request.getCertifierAddress());
            Optional<Admin> admin = adminRepository.findByWalletAddress(request.getCertifierAddress());
            if(user.isPresent()){
                certificationStatusDTO.setCertifierName(user.get().getUsername());
            }
            else admin.ifPresent(value -> certificationStatusDTO.setCertifierName(value.getAdminName()));
            certificationStatusDTO.setStatus(request.getStatus());
            certificationStatusDTOList.add(certificationStatusDTO);
        }
        return certificationStatusDTOList;
    }

    @Override
    public List<CertificationSignatureDTO> getCertificationSignature(Long tokenId) {
        return requestRepository.findByTokenId(tokenId)
                .stream()
                .map(AssetCertificationRequest::getId)
                .map(requestId -> certificationSignatureRepository.findByRequestId(requestId))
                .filter(Objects::nonNull)
                .map(signature -> CertificationSignatureDTO.builder()
                        .signature(signature.getSignature())
                        .certifierAddress(signature.getCertifierAddress())
                        .timestamp(signature.getTimeStamp())
                        .messageToSign(signature.getMessageToSign())
                        .messageHash(signature.getMessageHash())
                        .reasonHash(signature.getReasonHash())
                        .comment(requestRepository.findByTokenIdAndCertifierAddress(tokenId, signature.getCertifierAddress())
                                .getReason())
                        .build())
                .collect(Collectors.toList());
    }
    @Override
    public Void updateCertification(UpdateDatabaseDTO updateDatabaseDTO) {
        List<AssetCertificationRequest> assetCertificationRequestList = requestRepository
                .findByTokenId(updateDatabaseDTO.getTokenId())
                .stream()
                .peek(request -> {
                    request.setStatus(AssetCertificationRequest.RequestStatus.COMPLETED);
                    request.setUpdatedAt(LocalDateTime.now());
                })
                .toList();
        requestRepository.saveAll(assetCertificationRequestList);
        CertificationRecord certificationRecord = new CertificationRecord(updateDatabaseDTO);
        recordRepository.save(certificationRecord);
        return null;
    }

    @Override
    @Transactional
    public Void updateCertification(CertificationActionDTO updateDatabaseDTO) {
        AssetCertificationRequest request = requestRepository
                .findByTokenIdAndCertifierAddress(
                        updateDatabaseDTO.getTokenId(),
                        updateDatabaseDTO.getCertifierAddress()
                );
        request.setStatus(AssetCertificationRequest.RequestStatus.APPROVED);
        request.setUpdatedAt(LocalDateTime.now());
        requestRepository.save(request);
        return null;
    }

    private CertificationRequestDTO convertToDTO(AssetCertificationRequest request) {
        CertificationRequestDTO dto = new CertificationRequestDTO();
        dto.setRequestId(request.getId());
        dto.setTokenId(request.getTokenId());
        dto.setReason(request.getReason());
        dto.setRequester(request.getRequester());
        dto.setRequestTime(request.getCreatedAt());
        dto.setStatus(String.valueOf(request.getStatus()));
        dto.setCertifierAddress(request.getCertifierAddress());
        dto.setFilePaths(request.getFilePaths());
        if (request.getFilePaths() != null && !request.getFilePaths().isEmpty()) {
            List<FileResourceDTO> fileResources = request.getFilePaths().stream()
                    .map(filePath -> {
                        FileResourceDTO resource = new FileResourceDTO();
                        resource.setFileId(fileAccessService.generateFileId(filePath));  // 生成文件ID
                        resource.setFileName(fileAccessService.getOriginalFileName(filePath));
                        resource.setContentType(fileAccessService.getContentType(filePath));
                        resource.setAccessUrl(fileAccessService.generateFileAccessUrl(filePath));  // 生成带签名的访问URL
                        resource.setExpireTime(System.currentTimeMillis() + 3600000); // 1小时后过期
                        return resource;
                    })
                    .collect(Collectors.toList());
            dto.setFileResources(fileResources);
        }
        return dto;
    }
}