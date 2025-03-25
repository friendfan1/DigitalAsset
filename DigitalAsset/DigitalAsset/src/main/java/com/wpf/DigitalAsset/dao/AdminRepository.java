package com.wpf.DigitalAsset.dao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin,String> {
    //String getPassWord(String adminName);

    Optional<Admin> findByWalletAddress(String web3address);
}
