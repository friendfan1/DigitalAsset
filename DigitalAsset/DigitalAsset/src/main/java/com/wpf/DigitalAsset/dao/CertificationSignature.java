package com.wpf.DigitalAsset.dao;

import jakarta.persistence.*;
import lombok.Data;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "certification_signatures")
public class CertificationSignature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long requestId;

    @Column(name = "certifier_address", nullable = false)
    private String certifierAddress;

    @Column(nullable = false, length = 1000)
    private String signature;

    @Column(name = "sign_time", nullable = false)
    private Timestamp timeStamp;

    @Column(name = "message_to_sign", nullable = false)
    private  String messageToSign;


} 