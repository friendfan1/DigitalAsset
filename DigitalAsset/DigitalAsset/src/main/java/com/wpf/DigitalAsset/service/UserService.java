package com.wpf.DigitalAsset.service;


import com.wpf.DigitalAsset.dao.User;

import java.util.Optional;

public interface UserService {
    boolean registerUser(User user, String verificationCode);
    boolean sendVerificationCode(String email);
    boolean verifyVerificationCode(String email, String code);
    boolean checkEmail(String email);
    boolean isEmailRegistered(String email);
    // 根据用户名或邮箱查找用户
    Optional<User> findByUsernameOrEmail(String account);
    // 密码验证
    boolean validatePassword(String rawPassword, String encodedPassword);
    // 生成认证令牌
    String generateAuthToken(User user);
    Optional<User> findByUsername(String username);

    boolean checkUsernameExists(String newName);

    boolean updateUsername(Integer userId, String newName);

    void bindWallet(String username, String Address) throws Exception;

    void unbindWallet(String username) throws Exception;

    void updatePassword(String username, String newEncodedPassword) throws Exception;
}