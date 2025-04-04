package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.dao.AssetCertificationRequest;
import com.wpf.DigitalAsset.dao.AssetCertificationRequestRepository;
import com.wpf.DigitalAsset.dao.CertificationRecord;
import com.wpf.DigitalAsset.dto.*;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 认证服务接口，定义资产认证相关的业务方法
 */
public interface CertificationService {

    /**
     * 创建认证请求
     * @param requestDTO 认证请求数据
     * @return 创建的认证请求
     */
    public AssetCertificationRequest createRequest(CertificationRequestDTO requestDTO);

    /**
     * 获取用户的认证请求列表
     * @param requesterAddress 请求者地址
     * @param status 状态筛选（可选）
     * @return 认证请求列表
     */
    public List<AssetCertificationRequest> getUserRequests(String requesterAddress, String status);

    /**
     * 获取待认证列表
     * @return 待认证的请求列表
     */
    public List<AssetCertificationRequest> getPendingRequests();

    /**
     * 拒绝认证请求
     * @param requestId 请求ID
     * @param actionDTO 拒绝决定数据
     */
    public void rejectRequest(Long requestId, CertificationActionDTO actionDTO);

    /**
     * 获取资产的认证记录
     * @param tokenId 资产ID
     * @return 认证记录（如果存在）
     */
    public Optional<CertificationRecord> getAssetCertification(Long tokenId);

    /**
     * 检查资产是否已认证
     * @param tokenId 资产ID
     * @return 是否已认证
     */
    public boolean isAssetCertified(Long tokenId);

    /**
     * 获取认证者的所有认证记录
     * @param certifierAddress 认证者地址
     * @return 认证记录列表
     */
    public List<CertificationRecord> getCertifierRecords(String certifierAddress);

    public List<CertifierDTO> getAllCertifiers();

    public void saveCertificationRequest(CertificationActionDTO requestDTO);

    @Transactional(readOnly = true)
    public List<CertificationRequestDTO> getPendingCertificationRequests(String certifierAddress);

    public List<CertificationStatusDTO> getCertificationStatus(Long tokenId);

    public List<CertificationSignatureDTO> getCertificationSignature(Long tokenId);

    public Void updateCertification(UpdateDatabaseDTO updateDatabaseDTO);
    public Void updateCertification(CertificationActionDTO updateDatabaseDTO);
}