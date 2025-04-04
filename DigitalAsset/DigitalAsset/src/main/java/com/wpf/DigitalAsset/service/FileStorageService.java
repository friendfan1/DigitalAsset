package com.wpf.DigitalAsset.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private Path fileStorageLocation;
    private final FileAccessService fileAccessService;

    @Value("${app.certification.upload.dir}")
    private String uploadDir;
    
    @Autowired
    public FileStorageService(FileAccessService fileAccessService) {
        this.fileAccessService = fileAccessService;
    }
    
    @PostConstruct
    public void init() {
        try {
            this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(this.fileStorageLocation)) {
                Files.createDirectories(this.fileStorageLocation);
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

    public Resource loadFileAsResource(String fileId) throws IOException {
        try {
            // 解密fileId获取实际文件路径
            String filePath = fileAccessService.getFilePathFromId(fileId);
            Path path = Paths.get(filePath).normalize();
            
            // 安全检查：确保文件路径在允许的目录内
            if (!path.toAbsolutePath().startsWith(this.fileStorageLocation.toAbsolutePath())) {
                throw new FileNotFoundException("无效的文件路径");
            }

            Resource resource = new UrlResource(path.toUri());
            if(resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileNotFoundException("文件不存在或无法读取: " + fileId);
            }
        } catch (MalformedURLException ex) {
            throw new FileNotFoundException("文件不存在: " + fileId);
        }
    }
} 