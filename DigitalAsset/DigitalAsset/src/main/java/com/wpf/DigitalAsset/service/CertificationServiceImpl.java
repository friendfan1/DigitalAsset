package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.dao.*;
import com.wpf.DigitalAsset.dto.CertificationActionDTO;
import com.wpf.DigitalAsset.dto.CertificationRequestDTO;
import com.wpf.DigitalAsset.dto.CertificationStatusDTO;
import com.wpf.DigitalAsset.dto.CertifierDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

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

        // 创建新的认证请求
        AssetCertificationRequest request = new AssetCertificationRequest();
        request.setTokenId(requestDTO.getTokenId());
        request.setRequester(requestDTO.getRequester());
        request.setReason(requestDTO.getReason());
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        request.setStatus(AssetCertificationRequest.RequestStatus.PENDING);
        request.setCertifierAddress(requestDTO.getCertifierAddress());
        logger.info("Certifier:"+request.getCertifierAddress());

        logger.info("把东西存进去");
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
    public CertificationRecord approveRequest(Long requestId, CertificationActionDTO actionDTO) {
        logger.info("批准认证请求: " + requestId);

        // 获取请求
        AssetCertificationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("找不到ID为 " + requestId + " 的认证请求"));

        // 检查请求状态
        if (!AssetCertificationRequest.RequestStatus.PENDING.equals(request.getStatus())) {
            throw new IllegalStateException("只能批准待处理的请求");
        }

        // 更新请求状态
        request.setStatus(AssetCertificationRequest.RequestStatus.APPROVED);
        request.setCertifierAddress(actionDTO.getCertifierAddress());
        request.setCertificationTime(LocalDateTime.now());
        request.setCertificateCid(actionDTO.getCertificateCid());

        requestRepository.save(request);

        // 创建认证记录
        CertificationRecord record = new CertificationRecord(request);

        return recordRepository.save(record);
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
    public void saveCertificationRequest(CertificationRequestDTO requestDTO) {

    }

    @Override
    public List<CertificationRequestDTO> getPendingCertificationRequests(String certifierAddress) {
        List<AssetCertificationRequest> assetCertificationRequestList = requestRepository.findByCertifierAddress(certifierAddress);
        return assetCertificationRequestList.stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    public void saveCertificationRequest(Long requestId, Object certifier, String signature) {

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


    private CertificationRequestDTO convertToDTO(AssetCertificationRequest request) {
        CertificationRequestDTO dto = new CertificationRequestDTO();
        dto.setRequestId(request.getId());
        dto.setTokenId(request.getTokenId());
        dto.setReason(request.getReason());
        dto.setRequester(request.getRequester());
        dto.setRequestTime(request.getCreatedAt().toString());
        dto.setStatus(String.valueOf(request.getStatus()));
        dto.setCertifierAddress(request.getCertifierAddress());


        return dto;
    }
}