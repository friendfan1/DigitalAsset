package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.controller.UserController;
import com.wpf.DigitalAsset.dao.User;
import com.wpf.DigitalAsset.dao.UserRepository;
import com.wpf.DigitalAsset.util.CodeUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;
    @Autowired
    private final PasswordEncoder passwordEncoder;
    @Autowired
    public UserServiceImpl(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }


    @Override
    public boolean registerUser(User user, String verificationCode) {
        if (userRepository.existsByUsername(user.getUsername()) || userRepository.existsByEmail(user.getEmail())) {
            return false;
        }
        String cachedCode = stringRedisTemplate.opsForValue().get(user.getEmail());
        if (cachedCode == null || !verificationCode.equals(cachedCode)) {
            // 验证码验证失败，清理缓存
            stringRedisTemplate.delete(user.getEmail());
            return false;
        }
        user.setRegistrationDate(new Date());
        userRepository.save(user);
        // 注册成功，清理缓存
        stringRedisTemplate.delete(user.getEmail());
        return true;
    }

    @Override
    public boolean sendVerificationCode(String email) {
        if (userRepository.existsByEmail(email)) {
            return false;
        }
        String verificationCode = CodeUtil.generateCode();
        // 将验证码存入 Redis
        stringRedisTemplate.opsForValue().set(email, verificationCode, CodeUtil.EXPIRATION, TimeUnit.MINUTES);
        sendEmail(email, verificationCode);
        return true;
    }

    @Override
    public boolean verifyVerificationCode(String email, String code) {
        String cachedCode = stringRedisTemplate.opsForValue().get(email);
        return cachedCode != null && code.equals(cachedCode);
    }

    @Override
    public boolean checkEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean isEmailRegistered(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public Optional<User> findByUsernameOrEmail(String account) {
        // 优先查询用户名
        Optional<User> user = userRepository.findByUsername(account);
        final Logger logger = Logger.getLogger(UserController.class.getName());
        if (user.isEmpty()) {
            user = userRepository.findByEmail(account);
        }
        return user;
    }

    @Override
    public boolean validatePassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    @Override
    public String generateAuthToken(User user) {
        return UUID.randomUUID().toString();
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public boolean checkUsernameExists(String newName) {
        return userRepository.existsByUsername(newName);
    }

    @Override
    public boolean updateUsername(Integer userId, String newName) {
        if (checkUsernameExists(newName)) {
            return false;
        }
        // 根据用户 ID 查找用户
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // 更新用户名
            user.setUsername(newName);
            // 保存更新后的用户信息
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Override
    public void bindWallet(String username, String address) throws Exception {
        if (address == null || !address.matches("^0x[a-fA-F0-9]{40}$")) {
            throw new Exception("无效的Web3地址格式");
        }
        userRepository.findByWeb3Address(address)
                .ifPresent(actualUser -> {
                    if (!actualUser.getUsername().equals(username)) {
                        try {
                            throw new Exception("该地址已被其他用户绑定");
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    }
                });
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new Exception("用户不存在"));
        user.setWeb3address(address);
        userRepository.save(user);
    }

    @Override
    public void unbindWallet(String username) throws Exception {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new Exception("用户不存在"));
        
        if (user.getWeb3address() == null) {
            throw new Exception("当前用户未绑定钱包");
        }
        
        user.setWeb3address(null);
        userRepository.save(user);
    }

    @Override
    public void updatePassword(String username, String newEncodedPassword) throws Exception {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new Exception("用户不存在"));
        
        user.setPassword(newEncodedPassword);
        userRepository.save(user);
    }

    private void sendEmail(String email, String verificationCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("digitalasset2025@163.com");
        message.setTo(email);
        message.setSubject("验证码");
        message.setText("[数字资产登记系统]：您的注册验证码是：" + verificationCode + "，有效期为 "+ CodeUtil.EXPIRATION + "分钟。");
        javaMailSender.send(message);
    }
}