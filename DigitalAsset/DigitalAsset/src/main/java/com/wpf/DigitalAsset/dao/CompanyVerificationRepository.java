package com.wpf.DigitalAsset.dao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyVerificationRepository extends JpaRepository<CompanyVerification, Integer> {
    List<CompanyVerification> findByApprovedTrue();
}
