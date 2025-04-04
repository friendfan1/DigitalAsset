// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract RBAC is AccessControlEnumerable, EIP712 {
    using ECDSA for bytes32;
    
    // 类型哈希
    bytes32 public constant ROLE_GRANT_TYPEHASH = 
        keccak256("RoleGrant(bytes32 role,address account,uint256 nonce,uint256 deadline)");
    bytes32 public constant ROLE_REVOKE_TYPEHASH = 
        keccak256("RoleRevoke(bytes32 role,address account,uint256 nonce,uint256 deadline)");

    // 预定义角色
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR");
    bytes32 public constant CERTIFIER_ROLE = keccak256("CERTIFIER");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant DID_MANAGER_ROLE = keccak256("DID_MANAGER");
    bytes32 public constant KEY_MANAGER_ROLE = keccak256("KEY_MANAGER");

    // 签名nonce跟踪（按签名者地址）
    mapping(address => uint256) public nonces;

    constructor() EIP712("RBACSystem", "1") {
        _setupRoleHierarchy();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ===================== 核心功能 =====================
    function grantRoleWithSignature(
        bytes32 role,
        address account,
        uint256 deadline,
        bytes calldata signature
    ) external {
        _validateRoleOperation(role, account, deadline, signature, ROLE_GRANT_TYPEHASH);
        _grantRole(role, account);
    }

    function revokeRoleWithSignature(
        bytes32 role,
        address account,
        uint256 deadline,
        bytes calldata signature
    ) external {
        _validateRoleOperation(role, account, deadline, signature, ROLE_REVOKE_TYPEHASH);
        _revokeRole(role, account);
    }

    // ===================== 工具函数 =====================
    function hasAnyRole(
        address account,
        bytes32[] calldata roles
    ) external view returns (bool) {
        for (uint256 i = 0; i < roles.length; i++) {
            if (hasRole(roles[i], account)) {
                return true;
            }
        }
        return false;
    }

    // ===================== 管理员功能 =====================
    function grantDIDManager(address account) external onlyAdmin {
        _grantRole(DID_MANAGER_ROLE, account);
    }

    function revokeDIDManager(address account) external onlyAdmin {
        _revokeRole(DID_MANAGER_ROLE, account);
    }

    function grantKeyManager(address account) external onlyAdmin {
        _grantRole(KEY_MANAGER_ROLE, account);
    }

    function revokeKeyManager(address account) external onlyAdmin {
        _revokeRole(KEY_MANAGER_ROLE, account);
    }

    // ===================== 内部函数 =====================
    function _validateRoleOperation(
        bytes32 role,
        address account,
        uint256 deadline,
        bytes calldata signature,
        bytes32 typeHash
    ) internal {
        require(block.timestamp <= deadline, "RBAC: Expired");
        require(role != DEFAULT_ADMIN_ROLE, "RBAC: Admin role protected");

        // 获取签名者地址
        uint256 currentNonce = nonces[account];
        address signer = _recoverSigner(
            keccak256(abi.encode(
                typeHash,
                role,
                account,
                currentNonce,
                deadline
            ))
        , signature);

        // 验证签名者权限
        require(
            account == signer ||
            hasRole(getRoleAdmin(role), signer) ||
            hasRole(DEFAULT_ADMIN_ROLE, signer),
            "RBAC: Unauthorized"
        );
        nonces[account] = currentNonce + 1;
    }

    function _recoverSigner(
        bytes32 structHash,
        bytes calldata signature
    ) internal view returns (address) {
        return _hashTypedDataV4(structHash).recover(signature);
    }

    function _setupRoleHierarchy() private {
        _setRoleAdmin(REGISTRAR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(CERTIFIER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(DID_MANAGER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(KEY_MANAGER_ROLE, ADMIN_ROLE);
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender) || 
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
                "RBAC: Requires admin");
        _;
    }
}
