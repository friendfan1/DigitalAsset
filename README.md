
```
2025BlockAsset
├─ Code.py
├─ digital-asset-system
│  ├─ build
│  │  └─ contracts
│  │     ├─ AccessControl.json
│  │     ├─ AccessControlEnumerable.json
│  │     ├─ Address.json
│  │     ├─ Context.json
│  │     ├─ DIDRegistry.json
│  │     ├─ DigitalAsset.json
│  │     ├─ ECDSA.json
│  │     ├─ EnumerableSet.json
│  │     ├─ ERC165.json
│  │     ├─ ERC721.json
│  │     ├─ ERC721Burnable.json
│  │     ├─ IAccessControl.json
│  │     ├─ IAccessControlEnumerable.json
│  │     ├─ IERC165.json
│  │     ├─ IERC721.json
│  │     ├─ IERC721Metadata.json
│  │     ├─ IERC721Receiver.json
│  │     ├─ Math.json
│  │     ├─ Migrations.json
│  │     ├─ Ownable.json
│  │     ├─ RBAC.json
│  │     ├─ ReentrancyGuard.json
│  │     ├─ SafeMath.json
│  │     ├─ SignedMath.json
│  │     └─ Strings.json
│  ├─ client
│  │  └─ did-frontend
│  │     ├─ .editorconfig
│  │     ├─ .env
│  │     ├─ .prettierrc.json
│  │     ├─ 192.168.31.91-key.pem
│  │     ├─ 192.168.31.91.pem
│  │     ├─ e2e
│  │     │  ├─ tsconfig.json
│  │     │  └─ vue.spec.ts
│  │     ├─ env.d.ts
│  │     ├─ eslint.config.ts
│  │     ├─ index.html
│  │     ├─ package-lock.json
│  │     ├─ package.json
│  │     ├─ playwright.config.ts
│  │     ├─ public
│  │     │  └─ favicon.ico
│  │     ├─ README.md
│  │     ├─ src
│  │     │  ├─ App.vue
│  │     │  ├─ assets
│  │     │  │  ├─ base.css
│  │     │  │  ├─ default-avatar.svg
│  │     │  │  ├─ logo.png
│  │     │  │  ├─ logo.svg
│  │     │  │  ├─ main.css
│  │     │  │  └─ variables.scss
│  │     │  ├─ components
│  │     │  │  ├─ AssetDetailDialog.vue
│  │     │  │  ├─ auth
│  │     │  │  │  └─ AuthOptions.vue
│  │     │  │  ├─ common
│  │     │  │  │  ├─ AddressDisplay.vue
│  │     │  │  │  ├─ HeaderNav.vue
│  │     │  │  │  ├─ LoadingSpinner.vue
│  │     │  │  │  └─ WalletConnect.vue
│  │     │  │  ├─ icons
│  │     │  │  │  ├─ AssetRegisterIcon.vue
│  │     │  │  │  ├─ CloudUploadIcon.vue
│  │     │  │  │  ├─ IconCommunity.vue
│  │     │  │  │  ├─ IconDocumentation.vue
│  │     │  │  │  ├─ IconEcosystem.vue
│  │     │  │  │  ├─ IconSupport.vue
│  │     │  │  │  ├─ IconTooling.vue
│  │     │  │  │  ├─ TradeIcon.vue
│  │     │  │  │  └─ UserIcon.vue
│  │     │  │  ├─ upload
│  │     │  │  │  ├─ DragDropZone.vue
│  │     │  │  │  ├─ FilePreview.vue
│  │     │  │  │  ├─ FileUpload.vue
│  │     │  │  │  ├─ ProgressBar.vue
│  │     │  │  │  └─ UploadStatusMonitor.vue
│  │     │  │  ├─ user
│  │     │  │  │  └─ WalletBinding.vue
│  │     │  │  └─ __tests__
│  │     │  │     └─ HelloWorld.spec.ts
│  │     │  ├─ config
│  │     │  │  ├─ contracts.ts
│  │     │  │  ├─ ipfs.config.ts
│  │     │  │  ├─ upload.config.ts
│  │     │  │  └─ web3.config.ts
│  │     │  ├─ contracts
│  │     │  │  ├─ abis
│  │     │  │  │  ├─ DIDRegistry.json
│  │     │  │  │  ├─ DigitalAsset.json
│  │     │  │  │  └─ RBAC.json
│  │     │  │  ├─ factories
│  │     │  │  │  └─ ContractFactory.ts
│  │     │  │  └─ types
│  │     │  │     ├─ common.ts
│  │     │  │     ├─ DIDRegistry.ts
│  │     │  │     ├─ DigitalAsset.ts
│  │     │  │     ├─ factories
│  │     │  │     │  ├─ DIDRegistry__factory.ts
│  │     │  │     │  ├─ DigitalAsset__factory.ts
│  │     │  │     │  ├─ index.ts
│  │     │  │     │  └─ RBAC__factory.ts
│  │     │  │     ├─ index.ts
│  │     │  │     └─ RBAC.ts
│  │     │  ├─ main.ts
│  │     │  ├─ router
│  │     │  │  └─ index.ts
│  │     │  ├─ services
│  │     │  │  ├─ BaseWeb3Service.ts
│  │     │  │  ├─ ChunkedFileService.ts
│  │     │  │  ├─ SharingService.ts
│  │     │  │  └─ Web3RoleService.ts
│  │     │  ├─ stores
│  │     │  │  ├─ counter.ts
│  │     │  │  ├─ did.ts
│  │     │  │  ├─ user.ts
│  │     │  │  └─ wallet.ts
│  │     │  ├─ types
│  │     │  │  ├─ global.d.ts
│  │     │  │  ├─ upload.ts
│  │     │  │  ├─ uuid.d.ts
│  │     │  │  ├─ vue-shim.d.ts
│  │     │  │  └─ web3.ts
│  │     │  ├─ utils
│  │     │  │  ├─ address.ts
│  │     │  │  ├─ crypto.ts
│  │     │  │  ├─ dateFormat.ts
│  │     │  │  ├─ file.ts
│  │     │  │  ├─ hashUtils.ts
│  │     │  │  ├─ ipfs.ts
│  │     │  │  ├─ permission.ts
│  │     │  │  ├─ validation.ts
│  │     │  │  └─ web3
│  │     │  │     ├─ DIDRegistryService.ts
│  │     │  │     ├─ DigitalAssetService.ts
│  │     │  │     ├─ RBACService.ts
│  │     │  │     └─ wallet.ts
│  │     │  └─ views
│  │     │     ├─ admin
│  │     │     │  ├─ AdminCompanyVerification.vue
│  │     │     │  ├─ AdminProfile.vue
│  │     │     │  └─ AdminRoleManagement.vue
│  │     │     ├─ auth
│  │     │     │  ├─ Login.vue
│  │     │     │  └─ Register.vue
│  │     │     ├─ file
│  │     │     │  ├─ AccessManagement.vue
│  │     │     │  ├─ AssetCertification.vue
│  │     │     │  └─ FileShare.vue
│  │     │     ├─ HomeView.vue
│  │     │     └─ user
│  │     │        ├─ @
│  │     │        │  └─ styles
│  │     │        │     └─ variables.scss
│  │     │        └─ UserProfile.vue
│  │     ├─ tsconfig.app.json
│  │     ├─ tsconfig.json
│  │     ├─ tsconfig.node.json
│  │     ├─ tsconfig.vitest.json
│  │     ├─ typechain.config.js
│  │     ├─ vite.config.ts
│  │     └─ vitest.config.ts
│  ├─ contracts
│  │  ├─ DIDRegistry.sol
│  │  ├─ DigitalAsset.sol
│  │  ├─ Migrations.sol
│  │  └─ RBAC.sol
│  ├─ migrations
│  │  ├─ 1_initial_migration.js
│  │  └─ 2_deploy_contracts.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ server
│  │  └─ src
│  │     ├─ controllers
│  │     └─ routes
│  ├─ test
│  │  ├─ asset.test.js
│  │  ├─ did.test.js
│  │  └─ rbac.test.js
│  └─ truffle-config.js
├─ DigitalAsset
│  └─ DigitalAsset
│     ├─ .idea
│     │  ├─ compiler.xml
│     │  ├─ encodings.xml
│     │  ├─ jarRepositories.xml
│     │  ├─ misc.xml
│     │  ├─ uiDesigner.xml
│     │  ├─ vcs.xml
│     │  └─ workspace.xml
│     ├─ .mvn
│     │  └─ wrapper
│     │     └─ maven-wrapper.properties
│     ├─ data
│     │  └─ uploads
│     │     ├─ 1742195316949_扫描件_证件扫描_身份证_吴平凡_1.jpg
│     │     ├─ 1742361730006_Snipaste_2025-02-28_20-11-34.jpg
│     │     └─ 1742740334412_b2.png
│     ├─ generate-contract-wrappers.sh
│     ├─ HELP.md
│     ├─ mvnw
│     ├─ mvnw.cmd
│     ├─ pom.xml
│     ├─ src
│     │  ├─ main
│     │  │  ├─ java
│     │  │  │  └─ com
│     │  │  │     └─ wpf
│     │  │  │        └─ DigitalAsset
│     │  │  │           ├─ config
│     │  │  │           │  ├─ FileProperties.java
│     │  │  │           │  ├─ JwtAuthFilter.java
│     │  │  │           │  ├─ JwtProperties.java
│     │  │  │           │  ├─ SecurityConfig.java
│     │  │  │           │  └─ WebConfig.java
│     │  │  │           ├─ controller
│     │  │  │           │  ├─ CertificationController.java
│     │  │  │           │  ├─ ChunkedFileController.java
│     │  │  │           │  ├─ UserController.java
│     │  │  │           │  ├─ VerifyController.java
│     │  │  │           │  └─ Web3RoleController.java
│     │  │  │           ├─ dao
│     │  │  │           │  ├─ Admin.java
│     │  │  │           │  ├─ AdminRepository.java
│     │  │  │           │  ├─ AssetCertificationRequest.java
│     │  │  │           │  ├─ AssetCertificationRequestRepository.java
│     │  │  │           │  ├─ CertificationRecord.java
│     │  │  │           │  ├─ CertificationRecordRepository.java
│     │  │  │           │  ├─ CertificationSignature.java
│     │  │  │           │  ├─ CertificationSignatureRepository.java
│     │  │  │           │  ├─ Certifier.java
│     │  │  │           │  ├─ CompanyVerification.java
│     │  │  │           │  ├─ CompanyVerificationRepository.java
│     │  │  │           │  ├─ User.java
│     │  │  │           │  ├─ UserRepository.java
│     │  │  │           │  ├─ UserWeb3Role.java
│     │  │  │           │  └─ UserWeb3RoleRepository.java
│     │  │  │           ├─ DigitalAssetApplication.java
│     │  │  │           ├─ dto
│     │  │  │           │  ├─ ApiResponse.java
│     │  │  │           │  ├─ CertificationActionDTO.java
│     │  │  │           │  ├─ CertificationRequestDTO.java
│     │  │  │           │  ├─ CertificationStatusDTO.java
│     │  │  │           │  ├─ CertifierDTO.java
│     │  │  │           │  ├─ CompanyNameUpdateRequest.java
│     │  │  │           │  ├─ CompanyWithWallet.java
│     │  │  │           │  ├─ LoginRequest.java
│     │  │  │           │  ├─ RegisterRequest.java
│     │  │  │           │  ├─ RoleAssignmentRequest.java
│     │  │  │           │  └─ VerifyRequest.java
│     │  │  │           ├─ entity
│     │  │  │           ├─ repository
│     │  │  │           ├─ service
│     │  │  │           │  ├─ AdminServer.java
│     │  │  │           │  ├─ AdminServerImpl.java
│     │  │  │           │  ├─ CertificationService.java
│     │  │  │           │  ├─ CertificationServiceImpl.java
│     │  │  │           │  ├─ CompanyVerificationService.java
│     │  │  │           │  ├─ CompanyVerificationServiceImpl.java
│     │  │  │           │  ├─ impl
│     │  │  │           │  ├─ UserService.java
│     │  │  │           │  ├─ UserServiceImpl.java
│     │  │  │           │  ├─ Web3RoleService.java
│     │  │  │           │  └─ Web3RoleServiceImpl.java
│     │  │  │           └─ util
│     │  │  │              ├─ CodeUtil.java
│     │  │  │              ├─ TokenManager.java
│     │  │  │              └─ VerificationStatus.java
│     │  │  └─ resources
│     │  │     ├─ application.properties
│     │  │     ├─ application.yml
│     │  │     ├─ contracts
│     │  │     │  └─ DigitalAsset.sol
│     │  │     ├─ static
│     │  │     └─ templates
│     │  └─ test
│     │     └─ java
│     │        └─ com
│     │           └─ wpf
│     │              └─ DigitalAsset
│     │                 └─ DigitalAssetApplicationTests.java
│     ├─ target
│     │  ├─ classes
│     │  │  ├─ application.properties
│     │  │  ├─ application.yml
│     │  │  ├─ com
│     │  │  │  └─ wpf
│     │  │  │     └─ DigitalAsset
│     │  │  │        ├─ config
│     │  │  │        │  ├─ FileProperties.class
│     │  │  │        │  ├─ JwtAuthFilter.class
│     │  │  │        │  ├─ JwtProperties.class
│     │  │  │        │  └─ SecurityConfig.class
│     │  │  │        ├─ controller
│     │  │  │        │  ├─ CertificationController$CertificationStatus.class
│     │  │  │        │  ├─ CertificationController.class
│     │  │  │        │  ├─ ChunkedFileController.class
│     │  │  │        │  ├─ UserController.class
│     │  │  │        │  ├─ VerifyController.class
│     │  │  │        │  └─ Web3RoleController.class
│     │  │  │        ├─ dao
│     │  │  │        │  ├─ Admin.class
│     │  │  │        │  ├─ AdminRepository.class
│     │  │  │        │  ├─ AssetCertificationRequest$RequestStatus.class
│     │  │  │        │  ├─ AssetCertificationRequest.class
│     │  │  │        │  ├─ AssetCertificationRequestRepository.class
│     │  │  │        │  ├─ CertificationRecord.class
│     │  │  │        │  ├─ CertificationRecordRepository.class
│     │  │  │        │  ├─ CertificationSignature.class
│     │  │  │        │  ├─ CertificationSignatureRepository.class
│     │  │  │        │  ├─ Certifier.class
│     │  │  │        │  ├─ CompanyVerification.class
│     │  │  │        │  ├─ CompanyVerificationRepository.class
│     │  │  │        │  ├─ User.class
│     │  │  │        │  ├─ UserRepository.class
│     │  │  │        │  ├─ UserWeb3Role.class
│     │  │  │        │  └─ UserWeb3RoleRepository.class
│     │  │  │        ├─ DigitalAssetApplication.class
│     │  │  │        ├─ dto
│     │  │  │        │  ├─ ApiResponse.class
│     │  │  │        │  ├─ CertificationActionDTO.class
│     │  │  │        │  ├─ CertificationRequestDTO.class
│     │  │  │        │  ├─ CertificationStatusDTO.class
│     │  │  │        │  ├─ CertifierDTO.class
│     │  │  │        │  ├─ CompanyNameUpdateRequest.class
│     │  │  │        │  ├─ CompanyWithWallet.class
│     │  │  │        │  ├─ LoginRequest.class
│     │  │  │        │  ├─ RegisterRequest.class
│     │  │  │        │  └─ RoleAssignmentRequest.class
│     │  │  │        ├─ entity
│     │  │  │        ├─ repository
│     │  │  │        ├─ service
│     │  │  │        │  ├─ AdminServer.class
│     │  │  │        │  ├─ AdminServerImpl.class
│     │  │  │        │  ├─ CertificationService.class
│     │  │  │        │  ├─ CertificationServiceImpl.class
│     │  │  │        │  ├─ CompanyVerificationService.class
│     │  │  │        │  ├─ CompanyVerificationServiceImpl.class
│     │  │  │        │  ├─ impl
│     │  │  │        │  ├─ UserService.class
│     │  │  │        │  ├─ UserServiceImpl.class
│     │  │  │        │  ├─ Web3RoleService.class
│     │  │  │        │  └─ Web3RoleServiceImpl.class
│     │  │  │        └─ util
│     │  │  │           ├─ CodeUtil.class
│     │  │  │           ├─ TokenManager.class
│     │  │  │           └─ VerificationStatus.class
│     │  │  ├─ contracts
│     │  │  │  └─ DigitalAsset.sol
│     │  │  └─ META-INF
│     │  │     └─ spring-configuration-metadata.json
│     │  ├─ generated-sources
│     │  │  └─ annotations
│     │  ├─ generated-test-sources
│     │  │  └─ test-annotations
│     │  └─ test-classes
│     │     └─ com
│     │        └─ wpf
│     │           └─ DigitalAsset
│     │              └─ DigitalAssetApplicationTests.class
│     └─ temp
│        └─ chunked-files
├─ package-lock.json
└─ package.json

```