// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DIDRegistry
 * @dev 去中心化身份(DID)注册合约
 */
contract DIDRegistry is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // DID结构体定义
    struct DID {
        address owner;          // DID拥有者
        bytes32 docHash;        // 文档哈希
        uint256 created;        // 创建时间
        uint256 reputation;     // 声誉值
        bool active;            // 是否激活
    }

    // 声誉变更记录结构体
    struct ReputationChange {
        address operator;       // 操作者
        int256 delta;          // 变更值
        uint256 timestamp;     // 时间戳
        string reason;         // 变更原因
    }

    // 常量定义
    uint256 public constant STAKE_AMOUNT = 0.01 ether;
    uint256 public constant MAX_REPUTATION = 1000;
    uint256 public constant MIN_REPUTATION = 0;
    uint256 public constant INITIAL_REPUTATION = 100;

    // 状态变量
    mapping(address => DID) public dids;
    mapping(bytes32 => address) private hashToOwner;
    mapping(address => ReputationChange[]) public reputationHistory;
    
    // 事件定义
    event DIDCreated(address indexed user, bytes32 docHash, uint256 timestamp);
    event DIDUpdated(address indexed user, bytes32 newDocHash, uint256 timestamp);
    event DIDDeactivated(address indexed user, uint256 timestamp);
    event ReputationUpdated(
        address indexed user,
        uint256 newScore,
        int256 delta,
        string reason,
        uint256 timestamp
    );
    event StakeWithdrawn(address indexed user, uint256 amount, uint256 timestamp);

    // 修饰器
    modifier onlyActiveDID() {
        require(dids[msg.sender].active, "DID not active");
        _;
    }

    modifier validReputationChange(int256 delta) {
        require(delta != 0, "Delta cannot be zero");
        _;
    }

    /**
     * @dev 检查DID是否存在且激活
     * @param user 用户地址
     */
    function isDIDActive(address user) public view returns (bool) {
        return dids[user].active;
    }

    /**
     * @dev 获取DID详细信息
     * @param user 用户地址
     */
    function getDIDDetails(address user) 
        external 
        view 
        returns (
            address owner,
            bytes32 docHash,
            uint256 created,
            uint256 reputation,
            bool active
        ) 
    {
        DID storage did = dids[user];
        return (
            did.owner,
            did.docHash,
            did.created,
            did.reputation,
            did.active
        );
    }

    /**
     * @dev 创建DID
     * @param docHash 文档哈希
     */
    function createDID(bytes32 docHash) external payable nonReentrant {
        require(msg.value == STAKE_AMOUNT, "Incorrect stake");
        require(hashToOwner[docHash] == address(0), "Hash already used");
        require(!isDIDActive(msg.sender), "DID already exists");

        hashToOwner[docHash] = msg.sender;
        dids[msg.sender] = DID({
            owner: msg.sender,
            docHash: docHash,
            created: block.timestamp,
            reputation: INITIAL_REPUTATION,
            active: true
        });
        
        emit DIDCreated(msg.sender, docHash, block.timestamp);
    }

    /**
     * @dev 更新DID文档
     * @param newDocHash 新的文档哈希
     */
    function updateDID(bytes32 newDocHash) external onlyActiveDID {
        DID storage did = dids[msg.sender];
        require(hashToOwner[newDocHash] == address(0), "Hash already used");
        
        hashToOwner[did.docHash] = address(0);
        did.docHash = newDocHash;
        hashToOwner[newDocHash] = msg.sender;
        
        emit DIDUpdated(msg.sender, newDocHash, block.timestamp);
    }

    /**
     * @dev 提取质押金额
     */
    function withdrawStake() external onlyActiveDID nonReentrant {
        DID storage did = dids[msg.sender];
        require(did.reputation >= 50, "Reputation too low");
        
        did.active = false;
        hashToOwner[did.docHash] = address(0);
        
        uint256 amount = STAKE_AMOUNT;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit StakeWithdrawn(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev 更新声誉值
     * @param user 目标用户
     * @param delta 声誉变化值
     * @param reason 变更原因
     */
    function updateReputation(
        address user,
        int256 delta,
        string calldata reason
    ) external validReputationChange(delta) {
        require(
            msg.sender == owner() || dids[msg.sender].reputation > 200,
            "Insufficient privileges"
        );
        require(isDIDActive(user), "Target DID not active");
        
        DID storage did = dids[user];
        int256 newScore = int256(did.reputation) + delta;
        uint256 finalScore = uint256(
            newScore > int256(MAX_REPUTATION) 
                ? int256(MAX_REPUTATION) 
                : newScore < int256(MIN_REPUTATION) 
                    ? int256(MIN_REPUTATION) 
                    : newScore
        );
        
        did.reputation = finalScore;
        reputationHistory[user].push(ReputationChange(
            msg.sender,
            delta,
            block.timestamp,
            reason
        ));
        
        emit ReputationUpdated(user, finalScore, delta, reason, block.timestamp);
    }

    /**
     * @dev 验证DID文档
     * @param user 用户地址
     * @param hash 文档哈希
     */
    function verifyDID(address user, bytes32 hash) 
        external 
        view 
        returns(bool) 
    {
        return isDIDActive(user) && dids[user].docHash == hash;
    }

    /**
     * @dev 获取声誉变更历史
     * @param user 用户地址
     */
    function getReputationHistory(address user) 
        external 
        view 
        returns (ReputationChange[] memory) 
    {
        return reputationHistory[user];
    }
    
    /**
    * @dev 获取DID
    * @param docHash 文档哈希
    */
    function getDID(bytes32 docHash) external view returns (address) {
        return hashToOwner[docHash];
    }
}
