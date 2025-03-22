// import { defineStore } from 'pinia';
// import { ContractFactory } from '../contracts/factories/ContractFactory';
// import { ethers, type BrowserProvider } from 'ethers';

// export const useDIDStore = defineStore('did', {
//   state: () => ({
//     didRegistry: null as any,
//     digitalAsset: null as any
//   }),

//   actions: {
//     async initContracts(provider: BrowserProvider) {
//       const factory = new ContractFactory(provider);
      
//       try {
//         this.didRegistry = await factory.getDIDRegistry();
//         this.digitalAsset = await factory.getDigitalAsset();
//       } catch (error) {
//         console.error('合约初始化失败:', error);
//         throw new Error('无法加载智能合约');
//       }
//     },

//     async registerDID(docHash: string) {
//       if (!this.didRegistry) return;
      
//       const tx = await this.didRegistry.createDID(
//         ethers.encodeBytes32String(docHash), 
//         { value: ethers.parseEther("0.01") }
//       );
//       return tx.wait();
//     }
//   }
// });
