// migrations/2_deploy_contracts.js
const RBAC = artifacts.require("RBAC");
const DigitalAsset = artifacts.require("DigitalAsset");
const DIDRegistry = artifacts.require("DIDRegistry");
const Migrations = artifacts.require("Migrations");

module.exports = async function(deployer, network, accounts) {
  // 1. 部署 Migrations 合约（如果需要）
  await deployer.deploy(Migrations);
  console.log('Migrations deployed at:', Migrations.address);

  // 2. 部署 DIDRegistry 合约（独立合约，没有依赖）
  await deployer.deploy(DIDRegistry);
  const didRegistryInstance = await DIDRegistry.deployed();
  console.log('DIDRegistry deployed at:', didRegistryInstance.address);

  // 3. 部署 RBAC 合约
  await deployer.deploy(RBAC);
  const rbacInstance = await RBAC.deployed();
  console.log('RBAC deployed at:', rbacInstance.address);

  // 4. 使用 RBAC 地址部署 DigitalAsset 合约
  await deployer.deploy(DigitalAsset, rbacInstance.address);
  const digitalAssetInstance = await DigitalAsset.deployed();
  console.log('DigitalAsset deployed at:', digitalAssetInstance.address);

  // 5. 设置初始角色（可选）
  console.log('Setting up initial roles...');
  const ADMIN_ROLE = await rbacInstance.ADMIN_ROLE();
  const REGISTRAR_ROLE = await rbacInstance.REGISTRAR_ROLE();
  const CERTIFIER_ROLE = await rbacInstance.CERTIFIER_ROLE();
  
  // 部署者默认获得 DEFAULT_ADMIN_ROLE
  console.log('Deployer address:', accounts[0]);
};
