// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract DIDRegistry is EIP712, ReentrancyGuard, Ownable2Step {
    using ECDSA for bytes32;

    // EIP-712类型哈希
    bytes32 public constant CREATE_TYPEHASH = 
        keccak256("CreateDID(bytes32 docHash,uint256 nonce)");
    bytes32 public constant UPDATE_DID_TYPEHASH = 
        keccak256("UpdateDID(bytes32 newDocHash,uint256 nonce,uint256 deadline)");
    bytes32 public constant WITHDRAW_TYPEHASH = 
        keccak256("Withdraw(uint256 nonce,uint256 deadline)");
    bytes32 public constant REPUTATION_TYPEHASH = 
        keccak256("Reputation(address target,int256 delta,string reason,uint256 nonce,uint256 deadline)");

    // DID数据结构
    struct DID {
        bytes32 docHash;
        uint256 created;
        uint256 reputation;
        bool active;
        address controller; // 地址即公钥标识
    }

    struct ReputationChange {
        address operator;
        int256 delta;
        uint256 timestamp;
        string reason;
    }

    // 系统常量
    uint256 public constant STAKE_AMOUNT = 0.01 ether;
    uint256 public constant MAX_REPUTATION = 1000;
    uint256 public constant MIN_REPUTATION = 0;
    uint256 public constant INITIAL_REPUTATION = 100;
    uint256 public constant SIGNATURE_VALIDITY = 300;

    mapping(address => DID) private _dids;
    mapping(bytes32 => address) private _docHashToOwner;
    mapping(address => ReputationChange[]) private _reputationHistory;
    mapping(address => uint256) public nonces;

    event DIDRegistered(address indexed owner, bytes32 docHash);
    event DIDUpdated(address indexed owner, bytes32 newDocHash);
    event DIDDeactivated(address indexed owner);
    event ReputationChanged(
        address indexed target,
        address indexed operator,
        uint256 newScore,
        int256 delta
    );
    event StakeWithdrawn(address indexed owner, uint256 amount);

    modifier onlyActiveDID(address user) {
        require(_dids[user].active, "DID inactive");
        _;
    }

    constructor() EIP712("DIDRegistry", "1") {}

    // ===================== 核心功能 =====================
    function createDID(
        bytes32 docHash,
        bytes calldata signature
    ) external payable nonReentrant {
        require(msg.value == STAKE_AMOUNT, "Invalid stake");
        require(_docHashToOwner[docHash] == address(0), "DocHash exists");
        require(!_dids[msg.sender].active, "DID exists");

        // 验证创建签名
        bytes32 structHash = keccak256(abi.encode(
            CREATE_TYPEHASH,
            docHash,
            nonces[msg.sender]
        ));
        _verifySignature(structHash, signature, msg.sender);
        nonces[msg.sender]++;

        _docHashToOwner[docHash] = msg.sender;
        _dids[msg.sender] = DID({
            docHash: docHash,
            created: block.timestamp,
            reputation: INITIAL_REPUTATION,
            active: true,
            controller: msg.sender
        });

        emit DIDRegistered(msg.sender, docHash);
    }

    function updateDID(
        bytes32 newDocHash,
        uint256 deadline,
        bytes calldata signature
    ) external onlyActiveDID(msg.sender) {
        require(block.timestamp <= deadline, "Expired");
        require(_docHashToOwner[newDocHash] == address(0), "DocHash exists");

        bytes32 structHash = keccak256(abi.encode(
            UPDATE_DID_TYPEHASH,
            newDocHash,
            nonces[msg.sender],
            deadline
        ));
        _verifySignature(structHash, signature, msg.sender);
        nonces[msg.sender]++;

        DID storage did = _dids[msg.sender];
        _docHashToOwner[did.docHash] = address(0);
        did.docHash = newDocHash;
        _docHashToOwner[newDocHash] = msg.sender;

        emit DIDUpdated(msg.sender, newDocHash);
    }

    // ===================== 工具函数 =====================
    function _verifySignature(
        bytes32 structHash,
        bytes calldata signature,
        address expectedSigner
    ) internal view {
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == expectedSigner, "Invalid signature");
        require(signer != address(0), "ECDSA: invalid signature");
    }

    // ===================== 公共函数 =====================
    function getDID(address user) external view returns (
        bytes32 docHash,
        uint256 created,
        uint256 reputation,
        bool active,
        address controller
    ) {
        DID memory did = _dids[user];
        return (
            did.docHash,
            did.created,
            did.reputation,
            did.active,
            did.controller
        );
    }

    function isDIDActive(address user) external view returns (bool) {
        return _dids[user].active;
    }

    function getDocHashOwner(bytes32 docHash) external view returns (address) {
        return _docHashToOwner[docHash];
    }

    function getReputationHistory(address user) external view returns (
        address[] memory operators,
        int256[] memory deltas,
        uint256[] memory timestamps,
        string[] memory reasons
    ) {
        ReputationChange[] storage history = _reputationHistory[user];
        uint256 length = history.length;
        
        operators = new address[](length);
        deltas = new int256[](length);
        timestamps = new uint256[](length);
        reasons = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            operators[i] = history[i].operator;
            deltas[i] = history[i].delta;
            timestamps[i] = history[i].timestamp;
            reasons[i] = history[i].reason;
        }
    }
}
