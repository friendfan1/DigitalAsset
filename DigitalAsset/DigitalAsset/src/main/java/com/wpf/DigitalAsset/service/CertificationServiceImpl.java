package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.dao.AssetCertificationRequest;
import com.wpf.DigitalAsset.dao.AssetCertificationRequestRepository;
import com.wpf.DigitalAsset.dao.CertificationRecord;
import com.wpf.DigitalAsset.dao.CertificationRecordRepository;
import com.wpf.DigitalAsset.dto.CertificationActionDTO;
import com.wpf.DigitalAsset.dto.CertificationRequestDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    // 在实际应用中，这里还可能注入区块链服务以完成上链操作
    // @Autowired
    // private BlockchainService blockchainService;

    @Override
    @Transactional
    public AssetCertificationRequest createRequest(CertificationRequestDTO requestDTO) {
        logger.info("创建认证请求: " + requestDTO.getTokenId());

        // 检查是否已存在该资产的未决认证请求
        List<AssetCertificationRequest> existingRequests =
                requestRepository.findByTokenIdAndStatus(requestDTO.getTokenId(), "PENDING");

        if (!existingRequests.isEmpty()) {
            logger.warning("已存在待处理的认证请求: " + requestDTO.getTokenId());
            throw new IllegalStateException("该资产已有待处理的认证请求");
        }

        // 检查资产是否已认证
        if (recordRepository.existsByTokenId(requestDTO.getTokenId())) {
            logger.warning("资产已认证: " + requestDTO.getTokenId());
            throw new IllegalStateException("该资产已经认证");
        }

        // 创建新的认证请求
        AssetCertificationRequest request = new AssetCertificationRequest();
        request.setTokenId(requestDTO.getTokenId());
        request.setRequesterAddress(requestDTO.getRequesterAddress());
        request.setReason(requestDTO.getReason());
        request.setRequestTime(LocalDateTime.now());
        request.setStatus("PENDING");

        return requestRepository.save(request);
    }

    @Override
    public List<AssetCertificationRequest> getUserRequests(String requesterAddress, String status) {
        logger.info("获取用户认证请求: " + requesterAddress + ", 状态: " + status);

        if (status != null && !status.isEmpty()) {
            return requestRepository.findByRequesterAddressAndStatus(requesterAddress, status);
        } else {
            return requestRepository.findByRequesterAddress(requesterAddress);
        }
    }

    @Override
    public List<AssetCertificationRequest> getPendingRequests() {
        logger.info("获取所有待处理的认证请求");
        return requestRepository.findByStatus("PENDING");
    }

    @Override
    @Transactional
    public CertificationRecord approveRequest(Long requestId, CertificationActionDTO actionDTO) {
        logger.info("批准认证请求: " + requestId);

        // 获取请求
        AssetCertificationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("找不到ID为 " + requestId + " 的认证请求"));

        // 检查请求状态
        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalStateException("只能批准待处理的请求");
        }

        // 更新请求状态
        request.setStatus("APPROVED");
        request.setCertifierAddress(actionDTO.getCertifierAddress());
        request.setCertificationTime(LocalDateTime.now());
        request.setComments(actionDTO.getComments());
        request.setCertificateCid(actionDTO.getCertificateCid());

        requestRepository.save(request);

        // 创建认证记录
        CertificationRecord record = new CertificationRecord(request);
        record.setValidityPeriod(actionDTO.getValidityPeriod());

        // 在实际应用中，这里应该调用区块链服务将认证信息上链
        // String txHash = blockchainService.recordCertification(request.getTokenId(), actionDTO.getCertifierAddress());
        // record.setTransactionHash(txHash);

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
        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalStateException("只能拒绝待处理的请求");
        }

        // 更新请求状态
        request.setStatus("REJECTED");
        request.setCertifierAddress(actionDTO.getCertifierAddress());
        request.setCertificationTime(LocalDateTime.now());
        request.setComments(actionDTO.getComments());

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
}