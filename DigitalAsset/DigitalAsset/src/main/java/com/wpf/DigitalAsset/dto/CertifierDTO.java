package com.wpf.DigitalAsset.dto;

public class CertifierDTO {
    private String address;
    private String name;

    public CertifierDTO() {}

    public CertifierDTO(String address, String name, boolean isActive) {
        this.address = address;
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

} 