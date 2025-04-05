package com.wpf.DigitalAsset.dto;

import lombok.Data;

@Data
public class CompanyWithWallet {
    private Integer id;
    private String companyName;
    private String walletAddress;
} 