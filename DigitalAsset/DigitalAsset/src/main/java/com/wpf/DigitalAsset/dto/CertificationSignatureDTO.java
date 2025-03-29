package com.wpf.DigitalAsset.dto;

import jdk.jshell.MethodSnippet;
import lombok.Builder;
import lombok.Data;

import java.sql.Timestamp;
@Builder
@Data
public class CertificationSignatureDTO {
    private String certifierAddress;
    private String signature;
    private Timestamp timestamp;

}
