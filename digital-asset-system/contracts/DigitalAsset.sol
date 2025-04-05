// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./RBAC.sol";

contract DigitalAsset is ERC721, ERC721Burnable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    RBAC public immutable rbac;
    
    struct AssetMetadata {
        string cid;
        bytes32 contentHash;
        uint256 registrationDate;
        uint256 version;
        bool isCertified;
        address[] pendingCertifiers;
        mapping(address => bool) hasCertified;
    }

    struct Certification {
        address certifier;
        uint256 timestamp;
        string comment;
    }

    struct AssetMetadataView {
        string cid;
        bytes32 contentHash;
        uint256 registrationDate;
        uint256 version;
        bool isCertified;
        address[] pendingCertifiers;
    }

    struct CertificationWithTokenId {
        uint256 tokenId;
        address certifier;
        uint256 timestamp;
        string comment;
    }

    uint256 private _tokenIdCounter;
    mapping(uint256 => AssetMetadata) private _metadata;
    mapping(uint256 => Certification[]) private _certifications;
    mapping(string => bool) private _cidRegistry;
    mapping(address => uint256) public nonces;

    bytes32 private constant REGISTER_TYPEHASH = 
        keccak256("Register(address to,string cid,bytes32 contentHash,uint256 nonce)");
    bytes32 private constant CERTIFY_TYPEHASH = 
        keccak256("Certify(uint256 tokenId,string comment,uint256 nonce)");
    bytes32 private constant UPDATE_TYPEHASH = 
        keccak256("Update(uint256 tokenId,string newCid,bytes32 newHash,uint256 nonce)");
    bytes32 private constant BURN_TYPEHASH = 
        keccak256("Burn(uint256 tokenId,uint256 nonce)");
    bytes32 private constant SET_CERTIFIERS_TYPEHASH = 
        keccak256("SetCertifiers(uint256 tokenId,address[] certifiers,uint256 nonce)");

    event AssetRegistered(uint256 indexed tokenId, address indexed registrant, string cid);
    event AssetCertified(uint256 indexed tokenId, address indexed certifier);
    event MetadataUpdated(uint256 indexed tokenId, string newCid);
    event AssetBurned(uint256 indexed tokenId);
    event CertifiersSet(uint256 indexed tokenId, address[] certifiers);
    event AllCertified(uint256 indexed tokenId);

    constructor(address rbacAddress) 
        ERC721("DigitalAsset", "DA") 
        EIP712("DigitalAsset", "1") 
    {
        require(rbacAddress != address(0), "Invalid RBAC address");
        rbac = RBAC(rbacAddress);
    }

    // ===================== 核心功能 =====================
    function registerAsset(
        address to,
        string calldata cid,
        bytes32 contentHash,
        bytes calldata signature
    ) external nonReentrant returns (uint256) {
        require(!_cidRegistry[cid], "CID exists");
        uint256 currentNonce = nonces[to];
        _validateOperation(
            keccak256(abi.encode(
                REGISTER_TYPEHASH,
                to,
                keccak256(bytes(cid)),
                contentHash,
                currentNonce
            )),
            signature,
            rbac.REGISTRAR_ROLE()
        );

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        
        AssetMetadata storage metadata = _metadata[tokenId];
        metadata.cid = cid;
        metadata.contentHash = contentHash;
        metadata.registrationDate = block.timestamp;
        metadata.version = 1;
        metadata.isCertified = false;
        metadata.pendingCertifiers = new address[](0);
        
        _cidRegistry[cid] = true;
        emit AssetRegistered(tokenId, to, cid);
        nonces[to] = currentNonce + 1;
        return tokenId;
    }

    function setCertifiers(
        uint256 tokenId,
        address[] calldata certifiers,
        bytes calldata signature
    ) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        uint256 currentNonce = nonces[msg.sender];
        _validateOperation(
            keccak256(abi.encode(
                SET_CERTIFIERS_TYPEHASH,
                tokenId,
                keccak256(abi.encodePacked(certifiers)),
                currentNonce
            )),
            signature,
            bytes32(0)
        );

        AssetMetadata storage metadata = _metadata[tokenId];
        metadata.pendingCertifiers = certifiers;
        for (uint i = 0; i < certifiers.length; i++) {
            metadata.hasCertified[certifiers[i]] = false;
        }
        metadata.isCertified = false;
        nonces[msg.sender] = currentNonce + 1;
        emit CertifiersSet(tokenId, certifiers);
    }

    function certifyAsset(
        uint256 tokenId,
        string calldata comment,
        bytes calldata signature
    ) external nonReentrant {
        require(_exists(tokenId), "Invalid token");
        uint256 currentNonce = nonces[msg.sender];
        _validateOperation(
            keccak256(abi.encode(
                CERTIFY_TYPEHASH,
                tokenId,
                keccak256(bytes(comment)),
                currentNonce
            )),
            signature,
            rbac.CERTIFIER_ROLE()
        );

        AssetMetadata storage metadata = _metadata[tokenId];
        require(metadata.pendingCertifiers.length > 0, "No pending certifiers");
        require(!metadata.hasCertified[msg.sender], "Already certified");
        
        bool isPendingCertifier = false;
        for (uint i = 0; i < metadata.pendingCertifiers.length; i++) {
            if (metadata.pendingCertifiers[i] == msg.sender) {
                isPendingCertifier = true;
                break;
            }
        }
        require(isPendingCertifier, "Not a pending certifier");

        metadata.hasCertified[msg.sender] = true;
        _certifications[tokenId].push(Certification({
            certifier: msg.sender,
            timestamp: block.timestamp,
            comment: comment
        }));

        // 检查是否所有认证者都已完成认证
        bool allCertified = true;
        for (uint i = 0; i < metadata.pendingCertifiers.length; i++) {
            if (!metadata.hasCertified[metadata.pendingCertifiers[i]]) {
                allCertified = false;
                break;
            }
        }

        if (allCertified) {
            metadata.isCertified = true;
            emit AllCertified(tokenId);
        }

        nonces[msg.sender] = currentNonce + 1;
        emit AssetCertified(tokenId, msg.sender);
    }

    function updateMetadata(
        uint256 tokenId,
        string calldata newCid,
        bytes32 newHash,
        bytes calldata signature
    ) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(!_cidRegistry[newCid], "CID exists");
        uint256 currentNonce = nonces[msg.sender];
        _validateOperation(
            keccak256(abi.encode(
                UPDATE_TYPEHASH,
                tokenId,
                keccak256(bytes(newCid)),
                newHash,
                currentNonce
            )),
            signature,
            bytes32(0)
        );

        _cidRegistry[_metadata[tokenId].cid] = false;
        _metadata[tokenId].cid = newCid;
        _metadata[tokenId].contentHash = newHash;
        _metadata[tokenId].version++;
        _cidRegistry[newCid] = true;
        nonces[msg.sender] = currentNonce + 1;
        emit MetadataUpdated(tokenId, newCid);
    }

    function burnAsset(
        uint256 tokenId,
        bytes calldata signature
    ) external nonReentrant {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        uint256 currentNonce = nonces[msg.sender];
        _validateOperation(
            keccak256(abi.encode(
                BURN_TYPEHASH,
                tokenId,
                currentNonce
            )),
            signature,
            bytes32(0)
        );

        _cidRegistry[_metadata[tokenId].cid] = false;
        delete _metadata[tokenId];
        delete _certifications[tokenId];
        _burn(tokenId);
        nonces[msg.sender] = currentNonce + 1;
        emit AssetBurned(tokenId);
    }

    // ===================== 视图函数 =====================
    function getMetadata(uint256 tokenId) external view returns (AssetMetadataView memory) {
        require(_exists(tokenId), "Invalid token");
        AssetMetadata storage metadata = _metadata[tokenId];
        return AssetMetadataView({
            cid: metadata.cid,
            contentHash: metadata.contentHash,
            registrationDate: metadata.registrationDate,
            version: metadata.version,
            isCertified: metadata.isCertified,
            pendingCertifiers: metadata.pendingCertifiers
        });
    }

    function getCertifications(uint256 tokenId) external view returns (Certification[] memory) {
        require(_exists(tokenId), "Invalid token");
        return _certifications[tokenId];
    }

    function getPendingCertifiers(uint256 tokenId) external view returns (address[] memory) {
        require(_exists(tokenId), "Invalid token");
        return _metadata[tokenId].pendingCertifiers;
    }

    function hasCertified(uint256 tokenId, address certifier) external view returns (bool) {
        require(_exists(tokenId), "Invalid token");
        return _metadata[tokenId].hasCertified[certifier];
    }

    function getCertificationsByAddress(address certifier) external view returns (CertificationWithTokenId[] memory) {
        // 首先计算该地址的认证记录总数
        uint256 count = 0;
        uint256 currentTokenId = 0;
        
        while (currentTokenId < _tokenIdCounter) {
            if (_exists(currentTokenId)) {
                Certification[] memory certs = _certifications[currentTokenId];
                for (uint256 i = 0; i < certs.length; i++) {
                    if (certs[i].certifier == certifier) {
                        count++;
                    }
                }
            }
            currentTokenId++;
        }

        // 创建结果数组
        CertificationWithTokenId[] memory result = new CertificationWithTokenId[](count);
        uint256 resultIndex = 0;
        currentTokenId = 0;

        // 再次遍历收集认证记录
        while (currentTokenId < _tokenIdCounter) {
            if (_exists(currentTokenId)) {
                Certification[] memory certs = _certifications[currentTokenId];
                for (uint256 i = 0; i < certs.length; i++) {
                    if (certs[i].certifier == certifier) {
                        result[resultIndex] = CertificationWithTokenId({
                            tokenId: currentTokenId,
                            certifier: certs[i].certifier,
                            timestamp: certs[i].timestamp,
                            comment: certs[i].comment
                        });
                        resultIndex++;
                    }
                }
            }
            currentTokenId++;
        }

        return result;
    }

    // ===================== 内部函数 =====================
    function _validateOperation(
        bytes32 structHash,
        bytes calldata signature,
        bytes32 requiredRole
    ) internal view {
        address signer = _hashTypedDataV4(structHash).recover(signature);
        
        if(requiredRole != bytes32(0)) {
            require(rbac.hasRole(requiredRole, signer), "Unauthorized role");
        }
        
        require(signer == msg.sender, "Signer mismatch");
    }
}
