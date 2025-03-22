// SPDX-License-Identifier: MIT 
// contracts/RBAC.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol"; // 使用Enumerable扩展

contract RBAC is AccessControlEnumerable { 
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant CERTIFIER_ROLE = keccak256("CERTIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender),
            "Caller must have DEFAULT_ADMIN_ROLE or ADMIN_ROLE"
        );
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // 设置角色层级关系
        _setRoleAdmin(REGISTRAR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(CERTIFIER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function grantMultipleRoles(
        address[] calldata accounts,
        bytes32[] calldata roles
    ) external {
        require(accounts.length == roles.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            require(
                roles[i] != DEFAULT_ADMIN_ROLE,
                "Cannot grant DEFAULT_ADMIN_ROLE through this function"
            );
            // 检查调用者是否有权限授予该角色
            require(
                hasRole(getRoleAdmin(roles[i]), msg.sender),
                "Caller is not authorized to grant this role"
            );
            _grantRole(roles[i], accounts[i]);
        }
    }

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

    function getRoleHash(string memory role) public pure returns (bytes32) {
        return keccak256(bytes(role));
    }
}
