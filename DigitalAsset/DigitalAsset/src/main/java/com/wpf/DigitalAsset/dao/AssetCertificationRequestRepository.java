package com.wpf.DigitalAsset.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 资产认证请求仓库接口
 */
@Repository
public interface AssetCertificationRequestRepository extends JpaRepository<AssetCertificationRequest, Long> {

    List<AssetCertificationRequest> findByRequesterAndStatus(String requesterAddress, String status);

    List<AssetCertificationRequest> findByRequester(String requesterAddress);

    List<AssetCertificationRequest> findByStatus(AssetCertificationRequest.RequestStatus status);

    List<AssetCertificationRequest> findByTokenId(Long tokenId);

    AssetCertificationRequest findByTokenIdAndCertifierAddress(Long tokenId, String requesterAddress);

    boolean existsByTokenIdAndStatus(Long requestId, AssetCertificationRequest.RequestStatus requestStatus);

    List<AssetCertificationRequest> findByCertifierAddress(String certifierAddress);
} 