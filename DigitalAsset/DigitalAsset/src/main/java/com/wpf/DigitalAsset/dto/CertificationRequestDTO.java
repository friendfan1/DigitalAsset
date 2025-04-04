package com.wpf.DigitalAsset.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

/**
 * 认证请求DTO，用于接收前端提交的认证请求
 */
@Data
public class CertificationRequestDTO {
    private Long requestId;
    private Long tokenId;
    private String reason;
    private String requester;
    private String certifierAddress;
    private LocalDateTime requestTime;
    private String status;
    private List<MultipartFile> files;
    private List<String> filePaths;
    private List<FileResourceDTO> fileResources;

    public List<String> getFilePaths() {
        return filePaths;
    }

    public void setFilePaths(List<String> filePaths) {
        this.filePaths = filePaths;
    }
}