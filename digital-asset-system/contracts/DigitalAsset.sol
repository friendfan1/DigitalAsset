// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./RBAC.sol"; // 导入 RBAC 合约

/**
 * @title DigitalAsset
 * @dev 数字资产管理合约，支持资产注册、认证、元数据更新等功能。
 */
contract DigitalAsset is ERC721, ERC721Burnable, ReentrancyGuard {
    using ECDSA for bytes32;

    // RBAC 合约实例
    RBAC public rbac;

    // 资产元数据结构
    struct AssetMetadata {
        string cid;                // IPFS内容标识符
        bytes32 contentHash;       // 内容哈希
        address registrant;        // 注册人
        uint256 registrationDate; // 注册时间
        bool isCertified;         // 是否认证
        string encryptedKey;      // 加密密钥
        uint256 version;          // 版本号
    }

    // 认证记录结构
    struct Certification {
        address certifier;        // 认证人
        uint256 timestamp;        // 时间戳
        string comment;           // 认证评论
    }

    // 状态变量
    uint256 private _tokenIdCounter; // Token ID 计数器
    mapping(uint256 => AssetMetadata) private _metadata; // Token ID 到元数据的映射
    mapping(uint256 => Certification[]) private _certificationHistory; // Token ID 到认证历史的映射
    mapping(string => bool) private _cidRegistry; // CID 是否已注册的映射

    // 事件定义
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

    /**
     * @dev 构造函数
     * @param rbacAddress RBAC合约地址
     */
    constructor(address rbacAddress) ERC721("EnterpriseDigitalAsset", "EDA") {
        require(rbacAddress != address(0), "Invalid RBAC address");
        rbac = RBAC(rbacAddress);
    }

    /**
     * @dev 检查调用者是否有注册员角色
     */
    modifier onlyRegistrar() {
        require(
            rbac.hasRole(rbac.REGISTRAR_ROLE(), msg.sender),
            "Caller is not a registrar"
        );
        _;
    }

    /**
     * @dev 检查调用者是否有认证员角色
     */
    modifier onlyCertifier() {
        require(
            rbac.hasRole(rbac.CERTIFIER_ROLE(), msg.sender),
            "Caller is not a certifier"
        );
        _;
    }

    /**
     * @dev 注册新资产
     * @param to 接收者地址
     * @param cid IPFS内容标识符
     * @param contentHash 内容哈希
     * @param encryptedKey 加密密钥
     * @param signature 签名
     */
    function registerAsset(
        address to,
        string memory cid,
        bytes32 contentHash,
        string memory encryptedKey,
        bytes memory signature
    ) external nonReentrant onlyRegistrar returns (uint256) {
        require(!_cidRegistry[cid], "CID already registered");

        // 构造 EIP-712 消息哈希
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

        // 验证签名
        address recovered = ECDSA.recover(messageHash, signature);
        require(recovered == to, "Invalid signature");

        // 分配 Token ID 并铸造 NFT
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);

        // 存储元数据
        _metadata[tokenId] = AssetMetadata({
            cid: cid,
            contentHash: contentHash,
            registrant: to,
            registrationDate: block.timestamp,
            isCertified: false,
            encryptedKey: encryptedKey,
            version: 1
        });

        // 标记 CID 为已注册
        _cidRegistry[cid] = true;

        // 触发事件
        emit AssetRegistered(tokenId, to, cid, block.timestamp);
        return tokenId;
    }

    /**
     * @dev 认证资产
     * @param tokenId 资产 ID
     * @param comment 认证评论
     * @param signatures 认证人签名数组
     */
    function certifyAsset(
        uint256 tokenId,
        string memory comment,
        bytes[] memory signatures
    ) external onlyCertifier {
        require(_exists(tokenId), "Asset not exist");
        require(signatures.length >= 2, "Requires multi-sig");

        // 构造消息哈希
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(tokenId, comment))
            )
        );

        // 验证签名
        address[] memory signers = new address[](signatures.length);
        for (uint i = 0; i < signatures.length; i++) {
            signers[i] = ECDSA.recover(messageHash, signatures[i]);
            require(
                rbac.hasRole(rbac.CERTIFIER_ROLE(), signers[i]),
                "Invalid certifier"
            );

            // 检查签名者是否重复
            for (uint j = 0; j < i; j++) {
                require(signers[i] != signers[j], "Duplicate signer");
            }
        }

        // 更新资产认证状态
        _metadata[tokenId].isCertified = true;

        // 添加认证记录
        _certificationHistory[tokenId].push(Certification({
            certifier: msg.sender,
            timestamp: block.timestamp,
            comment: comment
        }));

        // 触发事件
        emit AssetCertified(tokenId, msg.sender, comment, block.timestamp);
    }

    /**
     * @dev 更新资产元数据
     * @param tokenId 资产 ID
     * @param newCid 新的 CID
     * @param newHash 新的内容哈希
     * @param newKey 新的加密密钥
     */
    function updateMetadata(
        uint256 tokenId,
        string memory newCid,
        bytes32 newHash,
        string memory newKey
    ) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not asset owner"); // 检查调用者是否为资产所有者
        require(!_cidRegistry[newCid], "CID already exists");       // 检查新 CID 是否已注册

        // 更新元数据
        AssetMetadata storage meta = _metadata[tokenId];
        _cidRegistry[meta.cid] = false; // 释放旧 CID
        meta.cid = newCid;
        meta.contentHash = newHash;
        meta.encryptedKey = newKey;
        meta.version++;
        _cidRegistry[newCid] = true; // 标记新 CID 为已注册

        // 触发事件
        emit MetadataUpdated(tokenId, newCid, meta.version, block.timestamp);
    }

    /**
     * @dev 获取资产元数据
     * @param tokenId 资产 ID
     */
    function getAssetMetadata(uint256 tokenId) 
        external 
        view 
        returns (AssetMetadata memory) 
    {
        require(_exists(tokenId), "Asset not exist"); // 检查资产是否存在
        return _metadata[tokenId];
    }

    /**
     * @dev 获取认证历史
     * @param tokenId 资产 ID
     */
    function getCertificationHistory(uint256 tokenId)
        external
        view
        returns (Certification[] memory)
    {
        require(_exists(tokenId), "Asset not exist"); // 检查资产是否存在
        return _certificationHistory[tokenId];
    }

    /**
     * @dev 验证资产完整性
     * @param tokenId 资产 ID
     * @param hash 内容哈希
     */
    function verifyIntegrity(uint256 tokenId, bytes32 hash) 
        external 
        view 
        returns (bool) 
    {
        require(_exists(tokenId), "Asset not exist"); // 检查资产是否存在
        return _metadata[tokenId].contentHash == hash;
    }

    /**
     * @dev 支持接口实现
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // 为私有映射提供内部方法
    function _setCIDRegistry(string memory cid, bool value) internal {
        _cidRegistry[cid] = value;
    }

    function _deleteMetadata(uint256 tokenId) internal {
        delete _metadata[tokenId];
    }

    function _deleteCertificationHistory(uint256 tokenId) internal {
        delete _certificationHistory[tokenId];
    }

    /**
     * @dev 销毁资产 - 仅限资产所有者或已授权地址
     * @param tokenId 要销毁的资产ID
     */
    function burnAsset(uint256 tokenId) external {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Caller is not owner or approved");
        
        // 保存资产CID以释放
        string memory cid = _metadata[tokenId].cid;
        
        // 清理CID注册表
        _setCIDRegistry(cid, false);
        
        // 清理元数据和认证历史
        _deleteMetadata(tokenId);
        _deleteCertificationHistory(tokenId);
        
        // 销毁NFT (使用ERC721的_burn方法)
        _burn(tokenId);
        
        // 触发事件
        emit AssetBurned(tokenId, _msgSender(), block.timestamp);
    }
}