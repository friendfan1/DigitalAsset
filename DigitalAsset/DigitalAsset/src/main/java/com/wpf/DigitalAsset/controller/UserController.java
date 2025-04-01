package com.wpf.DigitalAsset.controller;

import com.wpf.DigitalAsset.dao.Admin;
import com.wpf.DigitalAsset.dao.CompanyVerification;
import com.wpf.DigitalAsset.dao.User;
import com.wpf.DigitalAsset.dto.CompanyNameUpdateRequest;
import com.wpf.DigitalAsset.dto.LoginRequest;
import com.wpf.DigitalAsset.dto.RegisterRequest;
import com.wpf.DigitalAsset.service.AdminServer;
import com.wpf.DigitalAsset.service.CompanyVerificationService;
import com.wpf.DigitalAsset.service.UserService;
import com.wpf.DigitalAsset.service.Web3RoleService;
import com.wpf.DigitalAsset.util.TokenManager;
import com.wpf.DigitalAsset.util.VerificationStatus;
import jakarta.annotation.security.PermitAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.*;
import java.util.logging.Logger;

@RestController
public class UserController {

    @Autowired
    private UserService userService;
    @Autowired
    private TokenManager tokenManager;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private AdminServer adminServer;
    @Autowired
    private CompanyVerificationService companyVerificationService; // 注入公司认证服务
    @Autowired
    private Web3RoleService web3RoleService;
    private static final Logger logger = Logger.getLogger(UserController.class.getName());

    @GetMapping("/api/public/sendEmail")
    @PermitAll
    public void sendEmail() {
        userService.sendVerificationCode("1911826283@qq.com");
    }

    @GetMapping("/api/public/check-email/{email}")
    @PermitAll
    public String checkEmail(@PathVariable String email) {
        logger.info("Received request to check email: " + email);
        if (userService.checkEmail(email)) {
            return "该邮箱已被注册";
        } else {
            return "";
        }
    }

    @PutMapping("/api/update-company-name")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updateCompanyName(@RequestBody CompanyNameUpdateRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 从安全上下文中获取当前用户的认证信息
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            // 获取当前用户
            Optional<User> userOptional = userService.findByUsername(username);
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "用户不存在");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            User currentUser = userOptional.get();

            // 验证新名称是否有效
            if (request.getNewName() == null || request.getNewName().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "新名称不能为空");
                return ResponseEntity.badRequest().body(response);
            }

            // 检查名称是否相同
            if (currentUser.getUsername().equals(request.getNewName())) {
                response.put("success", false);
                response.put("message", "新名称与当前名称相同");
                return ResponseEntity.badRequest().body(response);
            }

            // 检查名称是否已被使用
            if (userService.checkUsernameExists(request.getNewName())) {
                response.put("success", false);
                response.put("message", "该名称已被其他公司使用");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }

            // 执行更新操作
            boolean updateResult = userService.updateUsername(currentUser.getUserId(), request.getNewName());
            if (updateResult) {
                response.put("success", true);
                response.put("message", "公司名称修改成功");
                response.put("newUsername", request.getNewName());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "更新数据库失败");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }

        } catch (Exception e) {
            logger.severe("修改公司名称异常: " + e.getMessage());
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/api/public/register")
    @PermitAll
    public ResponseEntity<Map<String, Object>> registerUser(@RequestBody RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();
        // 检查邮箱是否已存在
        if (userService.isEmailRegistered(request.getEmail())) {
            response.put("success", false);
            response.put("message", "该邮箱已被注册");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        // 验证验证码
        if (!userService.verifyVerificationCode(request.getEmail(), request.getVerificationCode())) {
            response.put("success", false);
            response.put("message", "验证码错误或已过期");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // 创建用户对象
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(encodedPassword);
        user.setEmail(request.getEmail());
        user.setVerificationStatus(VerificationStatus.NOT_SUBMITTED);

        // 注册用户
        if (userService.registerUser(user, request.getVerificationCode())) {
            response.put("success", true);
            response.put("message", "注册成功，请前往邮箱完成验证");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "注册失败，请稍后重试");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/api/public/send-verification-code")
    @PermitAll
    public ResponseEntity<Map<String, Object>> sendVerificationCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        logger.info("Received request to check email: " + email);
        Map<String, Object> response = new HashMap<>();

        if (userService.isEmailRegistered(email)) {
            response.put("success", false);
            response.put("message", "Email already registered.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        if (userService.sendVerificationCode(email)) {
            response.put("success", true);
            response.put("message", "Verification code sent successfully.");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Failed to send verification code.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/api/public/verify-verification-code")
    @PermitAll
    public String verifyVerificationCode(@RequestParam String email, @RequestParam String code) {
        if (userService.verifyVerificationCode(email, code)) {
            return "Verification code is valid";
        } else {
            return "Verification code is invalid or expired";
        }
    }

    @PostMapping("/api/public/login")
    @PermitAll
    public ResponseEntity<Map<String, Object>> loginUser(@RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();
        logger.info("请求的账户"+request.getAccount());
        logger.info("是否管理员登录"+ request.isAdmin());
        try {
            if (request.getAccount() == null || request.getAccount().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "账户不能为空");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "密码不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            if(request.isAdmin()){
                Optional<Admin> admin = adminServer.findByAdminName(request.getAccount());
                if(admin.isEmpty()){
                    response.put("success", false);
                    response.put("message", "账户不存在");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                }
                Admin actualAdmin = admin.get();
                if(!adminServer.checkPassword(request.getPassword(),actualAdmin.getAdminPassword())){
                    response.put("success", false);
                    response.put("message", "密码错误");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                }
                // 生成访问令牌
                String token = tokenManager.generateToken(actualAdmin);
                logger.info("身份是"+actualAdmin.getAuthorities());
                response.put("success", true);
                response.put("message", "登录成功");
                response.put("token", token);
                logger.info("5555555555555555555555555");
                Map<String, Object> safeInfo = new HashMap<>();
                safeInfo.put("userId", 1);
                safeInfo.put("username", actualAdmin.getUsername());
                safeInfo.put("email", "admin");
                safeInfo.put("role", "admin");
                safeInfo.put("createdAt", "2025-03-13 15:02:48");
                safeInfo.put("USCC", "admin");
                safeInfo.put("walletAddress",actualAdmin.getWalletAddress());
                safeInfo.put("token", token);
                safeInfo.put("verifications","admin");
                response.put("userInfo", safeInfo);
            }
            else {
                // 查找用户（支持用户名/邮箱登录）
                Optional<com.wpf.DigitalAsset.dao.User> user = userService.findByUsernameOrEmail(request.getAccount());
                if (user.isEmpty()) {
                    response.put("success", false);
                    response.put("message", "账户不存在");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                }

                // 验证密码
                com.wpf.DigitalAsset.dao.User actualUser = user.get();
                if (!userService.validatePassword(request.getPassword(), actualUser.getPassword())) {
                    response.put("success", false);
                    response.put("message", "密码错误");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                }

                // 生成访问令牌
                String token = tokenManager.generateToken(actualUser);

                // 返回登录成功响应
                response.put("success", true);
                response.put("message", "登录成功");
                response.put("token", token);
                response.put("userInfo", getUserSafeInfo(actualUser, token));
            }
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.severe("登录异常: " + e.getMessage());
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/api/company-verification")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> submitCompanyVerification(
            @RequestParam String companyName,
            @RequestParam String creditCode,
            @RequestParam MultipartFile businessLicense) {
        Map<String, Object> response = new HashMap<>();
        try {
            logger.info("认证进来了没有被jwt拦截");
            CompanyVerification verification = companyVerificationService.submitVerification(companyName, creditCode, businessLicense);
            response.put("success", true);
            response.put("message", "企业认证提交成功");
            response.put("verification", verification);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            logger.severe("文件上传失败: " + e.getMessage());
            response.put("success", false);
            response.put("message", "文件上传失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            logger.severe("企业认证提交失败: " + e.getMessage());
            response.put("success", false);
            response.put("message", "企业认证提交失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }


    @PostMapping("/api/bind-web3-address")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> bindWeb3Address(@RequestBody Map<String, String> request){
        logger.info("bindWeb3Address进入");
        Map<String, Object> response = new HashMap<>();
        try {
            String web3Address = request.get("address");
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            userService.bindWallet(username,web3Address);
            response.put("success", true);
            response.put("message", "地址绑定成功");
            response.put("address", request.get("address"));
            return ResponseEntity.ok(response);
        }
        catch (Exception e){
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/api/unbind-wallet")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> unbindWallet() {
        Map<String, Object> response = new HashMap<>();
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            
            userService.unbindWallet(username);
            
            response.put("success", true);
            response.put("message", "钱包解绑成功");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("钱包解绑失败: " + e.getMessage());
            response.put("success", false);
            response.put("message", "钱包解绑失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/api/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");
            
            if (oldPassword == null || newPassword == null) {
                response.put("success", false);
                response.put("message", "密码不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            // 验证旧密码
            Optional<User> userOptional = userService.findByUsername(username);
            if (userOptional.isEmpty()) {
                response.put("success", false);
                response.put("message", "用户不存在");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            User user = userOptional.get();
            if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
                response.put("success", false);
                response.put("message", "原密码错误");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            // 更新密码
            String encodedNewPassword = passwordEncoder.encode(newPassword);
            userService.updatePassword(username, encodedNewPassword);
            
            response.put("success", true);
            response.put("message", "密码修改成功");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("密码修改失败: " + e.getMessage());
            response.put("success", false);
            response.put("message", "密码修改失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    private Map<String, Object> getUserSafeInfo(User user, String token) {
        Map<String, Object> safeInfo = new HashMap<>();
        safeInfo.put("userId", user.getUserId());
        safeInfo.put("username", user.getUsername());
        safeInfo.put("email", user.getEmail());
        safeInfo.put("role", "user");
        safeInfo.put("createdAt", user.getRegistrationDate());
        safeInfo.put("USCC", user.getUSCC());
        safeInfo.put("token", token);
        safeInfo.put("verifications",user.getVerificationStatus());
        safeInfo.put("walletAddress",user.getWeb3address());
        return safeInfo;
    }

}