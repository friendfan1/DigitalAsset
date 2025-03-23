   // src/utils/permission.ts
   import { Web3RoleService } from '@/services/Web3RoleService';
   import { useUserStore } from '@/stores/user';
   

   export async function hasBlockchainRole(roleName: string): Promise<boolean> {
     const userStore = useUserStore();
     const walletAddress = userStore.profile?.walletAddress;
     
     if (!walletAddress) return false;
     
     try {
       const response = await Web3RoleService.checkUserRole(walletAddress, roleName);
       return response.data.success && response.data.data === true;
     } catch (error) {
       console.error('角色检查失败', error);
       return false;
     }
   }
   
   // 综合检查用户权限（系统角色和区块链角色）
   export async function hasPermission(requiredRole: string): Promise<boolean> {
     const userStore = useUserStore();
     
     // 检查系统角色
     if (requiredRole === 'admin' && userStore.isAdmin) {
       return true;
     }
     
     // 检查区块链角色
     if (['REGISTRAR_ROLE', 'CERTIFIER_ROLE', 'ADMIN_ROLE'].includes(requiredRole)) {
       return await hasBlockchainRole(requiredRole);
     }
     
     return false;
   }