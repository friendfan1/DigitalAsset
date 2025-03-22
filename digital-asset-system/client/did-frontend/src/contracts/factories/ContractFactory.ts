// import { Contract, BrowserProvider } from 'ethers';
// import type { DIDRegistry, DigitalAsset } from '../types';
// import DIDRegistryABI from '../abis/DIDRegistry.json';
// import DigitalAssetABI from '../abis/DigitalAsset.json';

// export enum ContractType {
//   DID = 'DIDRegistry',
//   Asset = 'DigitalAsset'
// }

// type ContractConfig = {
//   [key in ContractType]: {
//     abi: any[];
//     networks: Record<number, string>;
//   };
// };

// const CONTRACT_CONFIG: ContractConfig = {
//   [ContractType.DID]: {
//     abi: DIDRegistryABI.abi,
//     networks: {
//       1: import.meta.env.VITE_DID_MAINNET_ADDRESS,
//       5: import.meta.env.VITE_DID_GOERLI_ADDRESS
//     }
//   },
//   [ContractType.Asset]: {
//     abi: DigitalAssetABI.abi,
//     networks: {
//       1: import.meta.env.VITE_ASSET_MAINNET_ADDRESS,
//       5: import.meta.env.VITE_ASSET_GOERLI_ADDRESS
//     }
//   }
// };

// export class ContractFactory {
//   private provider: BrowserProvider;

//   constructor(provider: BrowserProvider) {
//     this.provider = provider;
//   }

//   async getContract<T extends Contract>(type: ContractType): Promise<T> {
//     const network = await this.provider.getNetwork();
//     const config = CONTRACT_CONFIG[type];
    
//     if (!config.networks[network.chainId]) {
//       throw new Error(`Contract ${type} not deployed on chain ${network.chainId}`);
//     }

//     return new Contract(
//       config.networks[network.chainId],
//       config.abi,
//       this.provider
//     ) as T;
//   }

//   // 快捷访问方法
//   async getDIDRegistry(): Promise<DIDRegistry> {
//     return this.getContract(ContractType.DID);
//   }

//   async getDigitalAsset(): Promise<DigitalAsset> {
//     return this.getContract(ContractType.Asset);
//   }
// }
