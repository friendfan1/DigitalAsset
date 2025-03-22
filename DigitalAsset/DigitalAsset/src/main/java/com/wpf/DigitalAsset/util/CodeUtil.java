package com.wpf.DigitalAsset.util;

public class CodeUtil {
    // 生成6位随机验证码（字母+数字）
    public static String generateCode() {
        String chars = "1234567890";
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt((int)(Math.random() * chars.length())));
        }
        return code.toString();
    }

    // 验证码有效期（5分钟）
    public static final long EXPIRATION = 5;
}
