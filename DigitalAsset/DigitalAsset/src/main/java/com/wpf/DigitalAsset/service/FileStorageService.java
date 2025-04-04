package com.wpf.DigitalAsset.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.certification.upload.dir}")
    private String uploadDir;
    
    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("无法创建上传目录！", e);
        }
    }

    public List<String> storeFiles(List<MultipartFile> files, Long tokenId) throws IOException {
        if (files == null || files.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<String> storedFilePaths = new ArrayList<>();
        
        // 创建tokenId对应的目录
        Path tokenDir = Paths.get(uploadDir, String.valueOf(tokenId));
        if (!Files.exists(tokenDir)) {
            Files.createDirectories(tokenDir);
        }
        
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            
            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isEmpty()) {
                originalFilename = "unknown_file";
            }
            
            String extension = "";
            int lastDotIndex = originalFilename.lastIndexOf(".");
            if (lastDotIndex > 0) {
                extension = originalFilename.substring(lastDotIndex);
            }
            
            String filename = UUID.randomUUID().toString() + extension;
            
            // 存储文件
            Path filePath = tokenDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            
            // 添加到结果列表
            storedFilePaths.add(filePath.toString());
        }
        
        return storedFilePaths;
    }
    
    public void deleteFiles(List<String> filePaths) {
        if (filePaths == null || filePaths.isEmpty()) {
            return;
        }
        
        for (String filePath : filePaths) {
            try {
                if (filePath != null && !filePath.isEmpty()) {
                    Path path = Paths.get(filePath);
                    Files.deleteIfExists(path);
                }
            } catch (IOException e) {
                // 记录错误但继续删除其他文件
                e.printStackTrace();
            }
        }
    }
} 