package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.dao.AssetCertificationRequest;
import com.wpf.DigitalAsset.dao.CertificationRecord;
import com.wpf.DigitalAsset.dto.CertificationActionDTO;
import com.wpf.DigitalAsset.dto.CertificationRequestDTO;
import com.wpf.DigitalAsset.dto.CertifierDTO;

import java.util.List;
import java.util.Optional;

/**
 * 认证服务接口，定义资产认证相关的业务方法
 */
public interface CertificationService {

    /**
     * 创建认证请求
     * @param requestDTO 认证请求数据
     * @return 创建的认证请求
     */
    AssetCertificationRequest createRequest(CertificationRequestDTO requestDTO);

    /**
     * 获取用户的认证请求列表
     * @param requesterAddress 请求者地址
     * @param status 状态筛选（可选）
     * @return 认证请求列表
     */
    List<AssetCertificationRequest> getUserRequests(String requesterAddress, String status);

    /**
     * 获取待认证列表
     * @return 待认证的请求列表
     */
    List<AssetCertificationRequest> getPendingRequests();

    /**
     * 批准认证请求
     * @param requestId 请求ID
     * @param actionDTO 认证决定数据
     * @return 认证记录
     */
    CertificationRecord approveRequest(Long requestId, CertificationActionDTO actionDTO);

    /**
     * 拒绝认证请求
     * @param requestId 请求ID
     * @param actionDTO 拒绝决定数据
     */
    void rejectRequest(Long requestId, CertificationActionDTO actionDTO);

    /**
     * 获取资产的认证记录
     * @param tokenId 资产ID
     * @return 认证记录（如果存在）
     */
    Optional<CertificationRecord> getAssetCertification(Long tokenId);

    /**
     * 检查资产是否已认证
     * @param tokenId 资产ID
     * @return 是否已认证
     */
    boolean isAssetCertified(Long tokenId);

    /**
     * 获取认证者的所有认证记录
     * @param certifierAddress 认证者地址
     * @return 认证记录列表
     */
    List<CertificationRecord> getCertifierRecords(String certifierAddress);

    List<CertifierDTO> getAllCertifiers();

    void saveCertificationRequest(CertificationRequestDTO requestDTO);

    List<CertificationRequestDTO> getPendingCertificationRequests(String certifierAddress);

    void saveCertificationRequest(Long requestId, Object certifier, String signature);
}