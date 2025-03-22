package com.wpf.DigitalAsset.dao;

import com.wpf.DigitalAsset.util.VerificationStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.Date;

@Data
@Entity(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;
    @Column(name = "username")
    private String username;
    @Column(name = "password_hash")
    private String password;
    @Column(name = "email")
    private String email;
    @Column(name = "USCC")
    private String USCC;
    @Column(name = "registration_date")
    private Date registrationDate;
    @Column(name = "verification_code")
    private String verificationCode;
    @Column(name = "verification_code_expiry")
    private Date verificationCodeExpiry;
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    private VerificationStatus verificationStatus;
    @Column(name = "web3address")
    private String web3Address;

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getWeb3address() {
        return web3Address;
    }

    public void setWeb3address(String web3address) {
        this.web3Address = web3address;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 返回用户的权限列表
        return Collections.emptyList();
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUSCC() {
        return USCC;
    }

    public void setUSCC(String USCC) {
        this.USCC = USCC;
    }

    public Date getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(Date registrationDate) {
        this.registrationDate = registrationDate;
    }

    public String getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }

    public Date getVerificationCodeExpiry() {
        return verificationCodeExpiry;
    }

    public void setVerificationCodeExpiry(Date verificationCodeExpiry) {
        this.verificationCodeExpiry = verificationCodeExpiry;
    }
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

}