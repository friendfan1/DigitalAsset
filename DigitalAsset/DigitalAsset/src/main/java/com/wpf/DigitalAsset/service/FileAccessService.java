package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.controller.CertificationController;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.logging.Logger;

@Service
public class FileAccessService {
    @Value("${app.file.access.secret}")
    private String accessSecret;

    @Value("${app.file.access.expiration}")
    private long urlExpiration;

    private static final Logger logger = Logger.getLogger(FileAccessService.class.getName());
    
    public String generateSignature(String fileId, long expireTime) {
        String message = fileId + expireTime + accessSecret;
        logger.info(message);
        return sha256Hex(message);
    }
    
    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 算法不可用", e);
        }
    }

    /**
     * 使用AES加密生成文件ID
     */
    public String generateFileId(String filePath) {
        try {
            // 使用accessSecret的前16位作为AES密钥
            byte[] keyBytes = accessSecret.getBytes(StandardCharsets.UTF_8);
            MessageDigest sha = MessageDigest.getInstance("SHA-1");
            keyBytes = sha.digest(keyBytes);
            byte[] truncatedBytes = new byte[16]; // 取前16位作为AES密钥
            System.arraycopy(keyBytes, 0, truncatedBytes, 0, 16);
            
            SecretKeySpec secretKey = new SecretKeySpec(truncatedBytes, "AES");
            Cipher cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);

            byte[] encrypted = cipher.doFinal(filePath.getBytes());
            return Base64.getUrlEncoder().withoutPadding().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("生成文件ID失败", e);
        }
    }

    /**
     * 解密文件ID获取原始路径
     */
    public String getFilePathFromId(String fileId) {
        try {
            // 使用accessSecret的前16位作为AES密钥
            byte[] keyBytes = accessSecret.getBytes(StandardCharsets.UTF_8);
            MessageDigest sha = MessageDigest.getInstance("SHA-1");
            keyBytes = sha.digest(keyBytes);
            byte[] truncatedBytes = new byte[16];
            System.arraycopy(keyBytes, 0, truncatedBytes, 0, 16);
            
            SecretKeySpec secretKey = new SecretKeySpec(truncatedBytes, "AES");
            Cipher cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);

            byte[] decrypted = cipher.doFinal(Base64.getUrlDecoder().decode(fileId));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("解析文件ID失败", e);
        }
    }

    public String getOriginalFileName(String filePath) {
        return filePath.substring(filePath.lastIndexOf('\\') + 1);
    }

    public String getContentType(String filePath) {
        String fileName = getOriginalFileName(filePath);
        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "doc", "docx" -> "application/msword";
            case "xls", "xlsx" -> "application/vnd.ms-excel";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            default -> "application/octet-stream";
        };
    }

    public String generateFileAccessUrl(String filePath) {
        String fileId = generateFileId(filePath);
        long expireTime = System.currentTimeMillis() + urlExpiration;
        String signature = generateSignature(fileId, expireTime);
        logger.info(String.format("/api/certification/files/%s?expires=%d&signature=%s",
                fileId, expireTime, signature));
        return String.format("/api/certification/files/%s?expires=%d&signature=%s",
                fileId, expireTime, signature);
    }
}