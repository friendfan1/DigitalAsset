package com.wpf.DigitalAsset.dao;

import jakarta.persistence.*;

@Entity
@Table(name = "certifiers")
public class Certifier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String address;

    @Column
    private String name;

    @Column
    private String organization;

    public Certifier() {}

    public Certifier(String address, String name, String organization) {
        this.address = address;
        this.name = name;
        this.organization = organization;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getOrganization() {
        return organization;
    }

    public void setOrganization(String organization) {
        this.organization = organization;
    }
} 