package com.wpf.DigitalAsset.controller;

import com.wpf.DigitalAsset.config.FileProperties;
import com.wpf.DigitalAsset.dao.CompanyVerification;
import com.wpf.DigitalAsset.dto.CompanyWithWallet;
import com.wpf.DigitalAsset.service.CompanyVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;


@RestController
public class VerifyController {

    @Autowired
    private CompanyVerificationService companyVerificationService;
    @Autowired
    private FileProperties fileProperties;
    private static final Map<String, MediaType> IMAGE_MIME_TYPES = new HashMap<>();

    static {
        IMAGE_MIME_TYPES.put("jpg", MediaType.IMAGE_JPEG);
        IMAGE_MIME_TYPES.put("jpeg", MediaType.IMAGE_JPEG);
        IMAGE_MIME_TYPES.put("png", MediaType.IMAGE_PNG);
        IMAGE_MIME_TYPES.put("gif", MediaType.IMAGE_GIF);
    }

    private static final Logger logger = Logger.getLogger(UserController.class.getName());


    @GetMapping("/api/admin/company-verifications")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllVerify() {
        //logger.info("getAllVerify函数已经进来了");
        Map<String, Object> response = new HashMap<>();
        //logger.info("111111111111");
        // 获取所有公司验证信息
        List<CompanyVerification> verifications = companyVerificationService.getAllVerifications();
        if (verifications != null && !verifications.isEmpty()) {
            response.put("success", true);
            response.put("data", verifications);
        } else {
            response.put("success", false);
            response.put("message", "No verifications found");
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("api/admin/get-verify-file/{filename}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(fileProperties.getUpload(), filename);
            logger.info("请求"+filePath);
            File file = filePath.toFile();
            logger.info("文件"+file.getName());

            if (!file.exists()) {
                logger.info("文件不存在"+file.getName());
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(file);

            String fileExtension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            MediaType mediaType = IMAGE_MIME_TYPES.getOrDefault(fileExtension, MediaType.APPLICATION_OCTET_STREAM);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType);
            // 对文件名进行 URL 编码
            String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8);
            headers.add("Content-Disposition", "inline; filename*=UTF-8''" + encodedFilename);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/api/admin/company-verification/approve/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> approveCompanyVerification(@PathVariable Integer id) {
        Map<String, Object> response = new HashMap<>();
        try {
            companyVerificationService.approveVerification(id);
            response.put("success", true);
            response.put("message", "企业认证审核通过");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("企业认证审核失败: " + e.getMessage());
            response.put("success", false);
            response.put("message", "企业认证审核失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/api/admin/companies/with-wallet")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCompaniesWithWallet() {
        logger.info("getCompaniesWithWallet进入");
        Map<String, Object> response = new HashMap<>();
        try {
            List<CompanyWithWallet> companies = companyVerificationService.getCompaniesWithWallet();
            response.put("success", true);
            response.put("data", companies);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("获取已绑定钱包的公司列表失败: " + e.getMessage());
            response.put("success", false);
            response.put("message", "获取公司列表失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

}
