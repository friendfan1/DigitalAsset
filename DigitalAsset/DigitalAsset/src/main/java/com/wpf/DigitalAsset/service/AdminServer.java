package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.dao.Admin;

import java.util.Optional;

public interface AdminServer {
    Optional<Admin> findByAdminName(String AdminName);
    boolean checkPassword(String password, String AdminName);

}
