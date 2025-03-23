package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.dao.CompanyVerification;
import com.wpf.DigitalAsset.dto.CompanyWithWallet;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface CompanyVerificationService {
    CompanyVerification submitVerification(String companyName, String creditCode, MultipartFile businessLicense) throws IOException;
    List<CompanyVerification> getAllVerifications();
    void approveVerification(Integer id);
    List<CompanyWithWallet> getCompaniesWithWallet();
}
