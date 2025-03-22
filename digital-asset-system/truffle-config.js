// truffle-config.js
module.exports = {
  networks: {
    ganache: {
     host: "127.0.0.1",
     port: 7545,
     network_id: "*",
    },
    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC, 
        `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
      ),
      network_id: 11155111,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
    }
  },
  compilers: {
    solc: {
      version: "0.8.19",  // 必须与合约pragma版本一致
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  // plugins: ["truffle-plugin-verify"],
  // resolver: {
  //   "alias": {
  //     "@openzeppelin/contracts": "./node_modules/@openzeppelin/contracts"
  //   }
  // }
};
