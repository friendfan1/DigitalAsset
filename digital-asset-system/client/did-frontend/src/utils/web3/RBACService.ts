// utils/web3/RBACService.ts
import { ethers } from 'ethers';
import { RBAC__factory } from '@/contracts/types';
import type { RBAC } from '@/contracts/types/RBAC';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { BaseWeb3Service } from '@/services/BaseWeb3Service';
import { web3Config } from '@/config/web3.config';
import { ElMessage } from 'element-plus';
import { useWalletStore } from '@/stores/wallet';

export class RBACService extends BaseWeb3Service {
  private contract: RBAC;
  private eventListeners: Array<() => void> = [];

  constructor(provider: ethers.BrowserProvider, signer: ethers.Signer) {
    super(provider, signer, web3Config);
    this.contract = RBAC__factory.connect(
      CONTRACT_ADDRESSES.RBAC,
      signer
    );
  }

  async grantRoleWithSignature(
    address: string,
    role: string,
    deadline: number
  ) {
    await this.ensureConnection();
    
    return this.withRetry(async () => {
      try {
        // 获取角色哈希
        const roleHash = await this.getRoleHash(role);
        
        // 获取当前 nonce
        const nonce = await this.contract.nonces(address);
        
        // 构造 EIP712 域
        const domain = {
          name: 'RBACSystem',
          version: '1',
          chainId: await this.provider.getNetwork().then(n => n.chainId),
          verifyingContract: this.contract.target.toString()
        };
        
        // 构造类型
        const types = {
          RoleGrant: [
            { name: 'role', type: 'bytes32' },
            { name: 'account', type: 'address' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        };
        
        // 构造值
        const value = {
          role: roleHash,
          account: address,
          nonce: nonce,
          deadline: deadline
        };
        
        // 签名
        const signature = await this.signer.signTypedData(domain, types, value);
        
        // 调用合约
        const tx = await this.contract.grantRoleWithSignature(
          roleHash,
          address,
          deadline,
          signature
        );
        
        await this.monitorTransaction(tx, '授予角色');
        return true;
      } catch (error) {
        throw await this.handleError(error);
      }
    });
  }

  async revokeRoleWithSignature(
    address: string,
    role: string,
    deadline: number
  ) {
    await this.ensureConnection();
    
    return this.withRetry(async () => {
      try {
        // 获取角色哈希
        const roleHash = await this.getRoleHash(role);
        
        // 获取当前 nonce
        const nonce = await this.contract.nonces(address);
        
        // 构造 EIP712 域
        const domain = {
          name: 'RBACSystem',
          version: '1',
          chainId: await this.provider.getNetwork().then(n => n.chainId),
          verifyingContract: this.contract.target.toString()
        };
        
        // 构造类型
        const types = {
          RoleRevoke: [
            { name: 'role', type: 'bytes32' },
            { name: 'account', type: 'address' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        };
        
        // 构造值
        const value = {
          role: roleHash,
          account: address,
          nonce: nonce,
          deadline: deadline
        };
        
        // 签名
        const signature = await this.signer.signTypedData(domain, types, value);
        
        // 调用合约
        const tx = await this.contract.revokeRoleWithSignature(
          roleHash,
          address,
          deadline,
          signature
        );
        
        await this.monitorTransaction(tx, '撤销角色');
        return true;
      } catch (error) {
        throw await this.handleError(error);
      }
    });
  }

  // 这个私有方法现在直接从合约获取角色哈希
  private async getRoleHash(role: string): Promise<string> {
    switch(role) {
      case 'REGISTRAR_ROLE':
        return await this.contract.REGISTRAR_ROLE();
      case 'CERTIFIER_ROLE':
        return await this.contract.CERTIFIER_ROLE();
      case 'ADMIN_ROLE':
        return await this.contract.ADMIN_ROLE();
      case 'DEFAULT_ADMIN_ROLE':
        return await this.contract.DEFAULT_ADMIN_ROLE();
      default:
        throw new Error('Invalid role');
    }
  }

  async getRoles(account: string) {
    const roles = [];
    const allRoles = ['REGISTRAR_ROLE', 'CERTIFIER_ROLE', 'ADMIN_ROLE'];
    
    for (const role of allRoles) {
      const roleHash = await this.getRoleHash(role);
      if(await this.contract.hasRole(roleHash, account)) {
        roles.push(role);
      }
    }
    return roles;
  }

  async getRoleMemberCount(role: string): Promise<bigint> {
    const roleHash = await this.getRoleHash(role);
    return await this.contract.getRoleMemberCount(roleHash);
  }

  async getRoleMember(role: string, index: number): Promise<string> {
    const roleHash = await this.getRoleHash(role);
    return await this.contract.getRoleMember(roleHash, index);
  }

  async revokeRole(account: string, role: string) {
    try {
      const roleHash = await this.getRoleHash(role);
      const tx = await this.contract.revokeRole(
        roleHash,
        account
      );
      return await this.monitorTransaction(tx, '撤销角色');
    } catch (error) {
      throw await this.handleError(error);
    }
  }

  async getAllRoleMembers(): Promise<{address: string; roles: string[]}[]> {
    const allRoles = ['REGISTRAR_ROLE', 'CERTIFIER_ROLE', 'ADMIN_ROLE'];
    const addressRolesMap = new Map<string, string[]>();
    
    for (const role of allRoles) {
      const memberCount = Number(await this.getRoleMemberCount(role));
      
      for (let i = 0; i < memberCount; i++) {
        const address = await this.getRoleMember(role, i);
        
        if (!addressRolesMap.has(address)) {
          addressRolesMap.set(address, []);
        }
        addressRolesMap.get(address)?.push(role);
      }
    }
    
    return Array.from(addressRolesMap.entries()).map(([address, roles]) => ({
      address,
      roles
    }));
  }

  async hasRole(role: string, address: string): Promise<boolean> {
    try {
      // 直接从合约获取角色哈希
      let roleHash;
      switch(role) {
        case 'REGISTRAR_ROLE':
          roleHash = await this.contract.REGISTRAR_ROLE();
          break;
        case 'CERTIFIER_ROLE':
          roleHash = await this.contract.CERTIFIER_ROLE();
          break;
        case 'ADMIN_ROLE':
          roleHash = await this.contract.ADMIN_ROLE();
          break;
        case 'DID_MANAGER_ROLE':
          roleHash = await this.contract.DID_MANAGER_ROLE();
          break;
        case 'KEY_MANAGER_ROLE':
          roleHash = await this.contract.KEY_MANAGER_ROLE();
          break;
        default:
          throw new Error('无效的角色类型');
      }
      
      return await this.contract.hasRole(roleHash, address);
    } catch (error) {
      throw await this.handleError(error);
    }
  }

  protected async handleError(error: any): Promise<Error> {
    console.error('RBAC 操作失败:', error);
    
    let message = '操作失败';
    if (error.reason) {
      message = `操作失败: ${error.reason}`;
    } else if (error.message?.includes('admin')) {
      message = '没有管理员权限执行此操作';
    } else if (error.message?.includes('revert')) {
      message = '合约调用被拒绝，请检查权限';
    } else if (error.message?.includes('estimateGas')) {
      message = '交易估算失败，请检查合约状态和权限';
    }
    
    ElMessage.error(message);
    return error instanceof Error ? error : new Error(String(error));
  }

  async checkRoleMembers(role: string) {
    let roleHash;
    switch(role) {
      case 'REGISTRAR_ROLE':
        roleHash = await this.contract.REGISTRAR_ROLE();
        break;
      case 'CERTIFIER_ROLE':
        roleHash = await this.contract.CERTIFIER_ROLE();
        break;
      case 'ADMIN_ROLE':
        roleHash = await this.contract.ADMIN_ROLE();
        break;
      default:
        throw new Error('无效的角色类型');
    }
    
    const roleCount = await this.contract.getRoleMemberCount(roleHash);
    console.log(`${role} 成员数量:`, roleCount);

    for (let i = 0; i < Number(roleCount); i++) {
      const member = await this.contract.getRoleMember(roleHash, i);
      console.log(`成员 ${i}:`, member);
    }
    
    return Number(roleCount);
  }
}

// 带缓存的工厂函数
let serviceInstance: RBACService | null = null;

export const getRBACService = async () => {
  if (!serviceInstance) {
    if (!window.ethereum) throw new Error('请安装MetaMask');
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    
    const network = await provider.getNetwork();
    console.log('Current network:', network);
    
    serviceInstance = new RBACService(provider, signer);
  }
  return serviceInstance;
};

