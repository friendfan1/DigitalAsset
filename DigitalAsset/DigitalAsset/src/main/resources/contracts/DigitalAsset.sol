// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./RBAC.sol";

contract DigitalAsset is ERC721, ERC721Burnable, ReentrancyGuard {
    using ECDSA for bytes32;

    RBAC public rbac;

    struct AssetMetadata {
        string cid;
        bytes32 contentHash;
        address registrant;
        uint256 registrationDate;
        bool isCertified;
        string encryptedKey;
        uint256 version;
    }

    struct Certification {
        address certifier;
        uint256 timestamp;
        string comment;
    }

    uint256 private _tokenIdCounter;
    mapping(uint256 => AssetMetadata) private _metadata;
    mapping(uint256 => Certification[]) private _certificationHistory;
    mapping(string => bool) private _cidRegistry;

    event AssetRegistered(
        uint256 indexed tokenId,
        address indexed registrant,
        string cid,
        uint256 timestamp
    );
    event AssetCertified(
        uint256 indexed tokenId,
        address indexed certifier,
        string comment,
        uint256 timestamp
    );
    event MetadataUpdated(
        uint256 indexed tokenId,
        string newCid,
        uint256 newVersion,
        uint256 timestamp
    );
    event AssetBurned(
        uint256 indexed tokenId,
        address indexed burner,
        uint256 timestamp
    );

    constructor(address rbacAddress) ERC721("EnterpriseDigitalAsset", "EDA") {
        require(rbacAddress != address(0), "Invalid RBAC address");
        rbac = RBAC(rbacAddress);
    }

    modifier onlyRegistrar() {
        require(
            rbac.hasRole(rbac.REGISTRAR_ROLE(), msg.sender),
            "Caller is not a registrar"
        );
        _;
    }

    modifier onlyCertifier() {
        require(
            rbac.hasRole(rbac.CERTIFIER_ROLE(), msg.sender),
            "Caller is not a certifier"
        );
        _;
    }

    function registerAsset(
        address to,
        string memory cid,
        bytes32 contentHash,
        string memory encryptedKey,
        bytes memory signature
    ) external nonReentrant onlyRegistrar returns (uint256) {
        require(!_cidRegistry[cid], "CID already registered");

        bytes32 domainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("DigitalAsset")),
            keccak256(bytes("1")),
            block.chainid,
            address(this)
        ));

        bytes32 structHash = keccak256(abi.encode(
            keccak256(bytes("Register(address to,bytes32 contentHash)")),
            to,
            contentHash
        ));

        bytes32 messageHash = ECDSA.toTypedDataHash(domainSeparator, structHash);

        address recovered = ECDSA.recover(messageHash, signature);
        require(recovered == to, "Invalid signature");

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);

        _metadata[tokenId] = AssetMetadata({
            cid: cid,
            contentHash: contentHash,
            registrant: to,
            registrationDate: block.timestamp,
            isCertified: false,
            encryptedKey: encryptedKey,
            version: 1
        });

        _cidRegistry[cid] = true;

        emit AssetRegistered(tokenId, to, cid, block.timestamp);
        return tokenId;
    }

    function certifyAsset(
        uint256 tokenId,
        string memory comment,
        bytes[] memory signatures
    ) external onlyCertifier {
        require(_exists(tokenId), "Asset not exist");
        require(signatures.length >= 2, "Requires multi-sig");

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(tokenId, comment))
            )
        );

        address[] memory signers = new address[](signatures.length);
        for (uint i = 0; i < signatures.length; i++) {
            signers[i] = ECDSA.recover(messageHash, signatures[i]);
            require(
                rbac.hasRole(rbac.CERTIFIER_ROLE(), signers[i]),
                "Invalid certifier"
            );

            for (uint j = 0; j < i; j++) {
                require(signers[i] != signers[j], "Duplicate signer");
            }
        }

        _metadata[tokenId].isCertified = true;

        _certificationHistory[tokenId].push(Certification({
            certifier: msg.sender,
            timestamp: block.timestamp,
            comment: comment
        }));

        emit AssetCertified(tokenId, msg.sender, comment, block.timestamp);
    }

    function updateMetadata(
        uint256 tokenId,
        string memory newCid,
        bytes32 newHash,
        string memory newKey
    ) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not asset owner");
        require(!_cidRegistry[newCid], "CID already exists");

        AssetMetadata storage meta = _metadata[tokenId];
        _cidRegistry[meta.cid] = false;
        meta.cid = newCid;
        meta.contentHash = newHash;
        meta.encryptedKey = newKey;
        meta.version++;
        _cidRegistry[newCid] = true;

        emit MetadataUpdated(tokenId, newCid, meta.version, block.timestamp);
    }

    function getAssetMetadata(uint256 tokenId) 
        external 
        view 
        returns (AssetMetadata memory) 
    {
        require(_exists(tokenId), "Asset not exist");
        return _metadata[tokenId];
    }

    function getCertificationHistory(uint256 tokenId)
        external
        view
        returns (Certification[] memory)
    {
        require(_exists(tokenId), "Asset not exist");
        return _certificationHistory[tokenId];
    }

    function verifyIntegrity(uint256 tokenId, bytes32 hash) 
        external 
        view 
        returns (bool) 
    {
        require(_exists(tokenId), "Asset not exist");
        return _metadata[tokenId].contentHash == hash;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _setCIDRegistry(string memory cid, bool value) internal {
        _cidRegistry[cid] = value;
    }

    function _deleteMetadata(uint256 tokenId) internal {
        delete _metadata[tokenId];
    }

    function _deleteCertificationHistory(uint256 tokenId) internal {
        delete _certificationHistory[tokenId];
    }

    function burnAsset(uint256 tokenId) external {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not owner or approved");
        
        string memory cid = _metadata[tokenId].cid;
        
        _setCIDRegistry(cid, false);
        _deleteMetadata(tokenId);
        _deleteCertificationHistory(tokenId);
        
        _burn(tokenId);
        
        emit AssetBurned(tokenId, _msgSender(), block.timestamp);
    }
} 