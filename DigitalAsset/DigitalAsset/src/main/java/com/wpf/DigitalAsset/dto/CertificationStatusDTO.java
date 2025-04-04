package com.wpf.DigitalAsset.dto;

import com.wpf.DigitalAsset.dao.AssetCertificationRequest;
import lombok.Data;
import java.util.List;

@Data
public class CertificationStatusDTO {
    String certifierAddress;
    String certifierName;
    AssetCertificationRequest.RequestStatus status;
    String timestamp;
    String reason;
    List<String> filePaths;
}
