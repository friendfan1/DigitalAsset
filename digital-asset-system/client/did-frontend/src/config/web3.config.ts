// config/web3.config.ts
import type { Web3Config } from '@/types/web3';

export const web3Config: Web3Config = {
  networks: [
    {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpc: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      explorer: 'https://etherscan.io'
    },
    {
      chainId: 137,
      name: 'Polygon Mainnet',
      rpc: 'https://polygon-rpc.com',
      explorer: 'https://polygonscan.com'
    },
    {
      chainId: 56,
      name: 'BNB Chain',
      rpc: 'https://bsc-dataseed.binance.org',
      explorer: 'https://bscscan.com'
    },
    {
      chainId: 1337,
      name: 'Ganache',
      rpc: 'http://localhost:8545',
      explorer: ''
    },
    {
      chainId: 80001,
      name: 'Polygon Mumbai',
      rpc: 'https://rpc-mumbai.maticvigil.com',
      explorer: 'https://mumbai.polygonscan.com'
    },
    {
      chainId: 97,
      name: 'BNB Testnet',
      rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      explorer: 'https://testnet.bscscan.com'
    },
    {
      chainId: 43114,
      name: 'Avalanche C-Chain',
      rpc: 'https://api.avax.network/ext/bc/C/rpc',
      explorer: 'https://snowtrace.io'
    },
    {
      chainId: 42161,
      name: 'Arbitrum One',
      rpc: 'https://arb1.arbitrum.io/rpc',
      explorer: 'https://arbiscan.io'
    },
    {
      chainId: 10,
      name: 'Optimism',
      rpc: 'https://mainnet.optimism.io',
      explorer: 'https://optimistic.etherscan.io'
    },
    {
      chainId: 5,
      name: 'Goerli',
      rpc: 'https://goerli.infura.io/v3/your-api-key',
      explorer: 'https://goerli.etherscan.io'
    },
    {
      chainId: 11155111,
      name: 'Sepolia',
      rpc: 'https://sepolia.infura.io/v3/your-api-key',
      explorer: 'https://sepolia.etherscan.io'
    }
  ],
  ipfs: {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    timeout: 30000
  },
  retry: {
    attempts: 3,
    delay: 1000
  },
  files: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'image/*', 
      'application/pdf', 
      'video/*', 
      'audio/*', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  }
};