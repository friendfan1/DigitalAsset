package com.wpf.DigitalAsset.util;

public enum VerificationStatus {
    NOT_SUBMITTED("未提交"),
    PENDING_REVIEW("待审核"),
    VERIFIED("已验证");

    private final String description;

    VerificationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}