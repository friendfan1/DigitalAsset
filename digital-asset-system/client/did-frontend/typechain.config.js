module.exports = {
    outDir: 'src/contracts/types',
    target: 'ethers-v6',
    inputPaths: [
      'src/contracts/abis/DIDRegistry.json',
      'src/contracts/abis/DigitalAsset.json'
    ],
    alwaysGenerateOverloads: false,
    discriminateTypes: true
  };
  