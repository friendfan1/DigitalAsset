package com.wpf.DigitalAsset.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class LoginRequest {
    private String account; // 支持用户名或邮箱
    private String password;
    private boolean admin;

    // getters and setters

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
    @JsonProperty("isAdmin")
    public boolean isAdmin() {
        return admin;
    }
    @JsonProperty("isAdmin")
    public void setAdmin(boolean admin) {
        this.admin = admin;
    }
}