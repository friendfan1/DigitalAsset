package com.wpf.DigitalAsset.dto;

import lombok.Data;

@Data
public class UpdateDatabaseDTO {
    private Long tokenId;
    private String txHash;
    private String certifierAddress;


}
