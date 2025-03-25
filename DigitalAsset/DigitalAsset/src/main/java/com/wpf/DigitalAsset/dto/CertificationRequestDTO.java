package com.wpf.DigitalAsset.dto;

import lombok.Data;

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
    private String requestTime;
    private String status;
    private String certifierAddress;
    private String signature;

} 