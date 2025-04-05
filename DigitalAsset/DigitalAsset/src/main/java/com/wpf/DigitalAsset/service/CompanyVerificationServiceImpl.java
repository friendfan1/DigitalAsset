package com.wpf.DigitalAsset.service;

import com.wpf.DigitalAsset.config.FileProperties;
import com.wpf.DigitalAsset.dao.CompanyVerification;
import com.wpf.DigitalAsset.dao.CompanyVerificationRepository;
import com.wpf.DigitalAsset.dao.User;
import com.wpf.DigitalAsset.dao.UserRepository;
import com.wpf.DigitalAsset.dto.CompanyWithWallet;
import com.wpf.DigitalAsset.util.VerificationStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

@Service
public class CompanyVerificationServiceImpl implements CompanyVerificationService {

    @Autowired
    private CompanyVerificationRepository repository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private final FileProperties fileProperties;

    public CompanyVerificationServiceImpl(FileProperties fileProperties){
        this.fileProperties = fileProperties;
    }
    private static final Logger logger = Logger.getLogger(CompanyVerificationServiceImpl.class.getName());
    @Override
    public CompanyVerification submitVerification(String companyName, String creditCode, MultipartFile businessLicense) throws IOException {
        // 确保上传目录存在

        if(userRepository.findByUsername(companyName).isPresent()){
            logger.info("函数进来了");
            logger.info("路径为"+fileProperties.getUpload());
            Path rootLocation = Path.of(fileProperties.getUpload());
            logger.info("路径为"+rootLocation);
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }

            // 生成唯一的文件名
            String fileName = System.currentTimeMillis() + "_" + businessLicense.getOriginalFilename();
            logger.info("文件名"+fileName);
            // 保存文件到上传目录
            Files.copy(businessLicense.getInputStream(), rootLocation.resolve(fileName));

            // 创建并保存企业认证记录
            CompanyVerification verification = new CompanyVerification();
            verification.setCompanyName(companyName);
            verification.setCreditCode(creditCode);
            verification.setBusinessLicenseUrl(fileName);
            User user = userRepository.findByUsername(companyName).get();
            verification.setUserId(user.getUserId());
            verification.setApproved(false); // 默认未审核
            user.setVerificationStatus(VerificationStatus.PENDING_REVIEW);
            userRepository.save(user);


            return repository.save(verification);
        }
        else {
            return null;
        }
    }

    @Override
    public List<CompanyVerification> getAllVerifications() {
        return repository.findAll();
    }

    @Override
    public void approveVerification(Integer id) {
        // 查找认证记录
        CompanyVerification verification = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("认证记录未找到"));
        Optional<User> user = userRepository.findById(repository.findById(id).get().getUserId());
        if(user.isPresent()){
            User actualUser = user.get();
            actualUser.setVerificationStatus(VerificationStatus.VERIFIED);
            verification.setApproved(true);
            userRepository.save(actualUser);
            repository.save(verification);
        }

    }

    @Override
    public List<CompanyWithWallet> getCompaniesWithWallet() {
        List<User> verifiedCompanies = userRepository.findByVerificationStatusAndWeb3AddressIsNotNull(VerificationStatus.VERIFIED);
        return verifiedCompanies.stream()
            .map(verification -> {
                CompanyWithWallet companyWithWallet = new CompanyWithWallet();
                companyWithWallet.setId(verification.getUserId());
                companyWithWallet.setCompanyName(verification.getUsername());
                companyWithWallet.setWalletAddress(verification.getWeb3address());
                
                return companyWithWallet;
            })
            .toList();
    }
}