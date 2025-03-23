package com.wpf.DigitalAsset.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 资产认证请求仓库接口
 */
@Repository
public interface AssetCertificationRequestRepository extends JpaRepository<AssetCertificationRequest, Long> {
    
    /**
     * 根据请求者地址和状态查询请求
     */
    List<AssetCertificationRequest> findByRequesterAddressAndStatus(String requesterAddress, String status);
    
    /**
     * 根据请求者地址查询所有请求
     */
    List<AssetCertificationRequest> findByRequesterAddress(String requesterAddress);
    
    /**
     * 根据状态查询请求
     */
    List<AssetCertificationRequest> findByStatus(String status);
    
    /**
     * 根据资产TokenID查询请求
     */
    List<AssetCertificationRequest> findByTokenId(Long tokenId);
    
    /**
     * 根据资产TokenID和状态查询请求
     */
    List<AssetCertificationRequest> findByTokenIdAndStatus(Long tokenId, String status);
} 