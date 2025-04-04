package com.wpf.DigitalAsset.dto;

import lombok.Data;

@Data
public class FileResourceDTO {
    private String fileId;        // 文件唯一标识符
    private String fileName;      // 原始文件名
    private String contentType;   // 文件类型
    private String accessUrl;     // 临时访问URL
    private Long expireTime;      // URL过期时间
}
