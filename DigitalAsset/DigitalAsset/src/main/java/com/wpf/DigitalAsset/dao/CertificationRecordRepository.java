package com.wpf.DigitalAsset.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 认证记录仓库接口
 */
@Repository
public interface CertificationRecordRepository extends JpaRepository<CertificationRecord, Long> {
    
    /**
     * 根据资产TokenID查询认证记录
     */
    Optional<CertificationRecord> findByTokenId(Long tokenId);
    
    /**
     * 根据认证者地址查询认证记录
     */
    List<CertificationRecord> findByCertifierAddress(String certifierAddress);
    
    /**
     * 检查指定资产是否已认证
     */
    boolean existsByTokenId(Long tokenId);
} 