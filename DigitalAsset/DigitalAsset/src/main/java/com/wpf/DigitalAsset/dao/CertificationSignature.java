package com.wpf.DigitalAsset.dao;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certification_signatures")
public class CertificationSignature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long requestId;

    @Column(nullable = false)
    private String certifierAddress;

    @Column(nullable = false, length = 1000)
    private String signature;

    @Column(nullable = false)
    private LocalDateTime signTime;

    public CertificationSignature() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public String getCertifierAddress() {
        return certifierAddress;
    }

    public void setCertifierAddress(String certifierAddress) {
        this.certifierAddress = certifierAddress;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public LocalDateTime getSignTime() {
        return signTime;
    }

    public void setSignTime(LocalDateTime signTime) {
        this.signTime = signTime;
    }
} 