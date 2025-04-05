package com.wpf.DigitalAsset.dao;

import com.wpf.DigitalAsset.util.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByWeb3Address(String web3address);
    List<User> findByVerificationStatusAndWeb3AddressIsNotNull(VerificationStatus status);
}