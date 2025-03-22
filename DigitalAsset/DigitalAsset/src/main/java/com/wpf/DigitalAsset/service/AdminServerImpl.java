package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.dao.Admin;
import com.wpf.DigitalAsset.dao.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Optional;
import java.util.logging.Logger;

@Service
public class AdminServerImpl implements AdminServer{
    @Autowired
    private AdminRepository adminRepository;
    private static final Logger logger = Logger.getLogger(AdminServerImpl.class.getName());
    @Override
    public Optional<Admin> findByAdminName(String AdminName) {
        logger.info("用户名："+adminRepository.findById(AdminName).get().getAdminName());
        return adminRepository.findById(AdminName);
    }

    @Override
    public boolean checkPassword(String password, String actualPassword) {
        logger.info("输入："+password + "数据库:"+actualPassword);
        logger.info(String.valueOf(Objects.equals(password, actualPassword)));
        return Objects.equals(password, actualPassword);
    }


}
