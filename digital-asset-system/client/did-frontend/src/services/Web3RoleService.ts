   // src/services/Web3RoleService.ts
   import axios from 'axios';
   import { useUserStore } from '@/stores/user';
   
   export class Web3RoleService {
     // 获取用户的所有角色
     static async getUserRoles(walletAddress: string) {
       const userStore = useUserStore();
       return axios.get(`/api/web3/roles/user/${walletAddress}`, {
         headers: {
           Authorization: `Bearer ${userStore.profile?.token}`
         }
       });
     }
     
     // 检查特定角色
     static async checkUserRole(walletAddress: string, roleName: string) {
       return axios.get(`/api/web3/roles/check/${walletAddress}/${roleName}`);
     }
     
     // 分配角色（仅管理员）
     static async assignRole(walletAddress: string, roleName: string) {
       const userStore = useUserStore();
       return axios.post('/api/web3/roles/assign', 
         { walletAddress, roleName },
         {
           headers: {
             Authorization: `Bearer ${userStore.profile?.token}`
           }
         }
       );
     }
     
     // 撤销角色（仅管理员）
     static async revokeRole(walletAddress: string, roleName: string) {
       const userStore = useUserStore();
       return axios.post('/api/web3/roles/revoke', 
         { walletAddress, roleName },
         {
           headers: {
             Authorization: `Bearer ${userStore.profile?.token}`
           }
         }
       );
     }
     
     // 与区块链同步验证用户角色
     static async verifyUserRoles(walletAddress: string) {
       const userStore = useUserStore();
       return axios.post(`/api/web3/roles/verify/${walletAddress}`, {}, {
         headers: {
           Authorization: `Bearer ${userStore.profile?.token}`
         }
       });
     }
   }