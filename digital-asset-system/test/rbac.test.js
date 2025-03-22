// test/rbac.test.js
const RBAC = artifacts.require("RBAC");
const { expectRevert } = require('@openzeppelin/test-helpers');

contract("RBAC", (accounts) => {
  let contract;
  const [admin, user1, user2] = accounts;

  before(async () => {
    contract = await RBAC.deployed();
  });

  it("应该正确初始化管理员", async () => {
    const hasAdminRole = await contract.hasRole(await contract.ADMIN_ROLE(), admin);
    assert.isTrue(hasAdminRole);
  });

  it("管理员可以分配企业角色", async () => {
    await contract.grantMultipleRoles(
      [user1], 
      [await contract.ENTERPRISE_USER()],
      { from: admin }
    );
    
    const hasRole = await contract.hasRole(await contract.ENTERPRISE_USER(), user1);
    assert.isTrue(hasRole);
  });

  it("非管理员无法分配角色", async () => {
    await expectRevert(
      contract.grantMultipleRoles(
        [user2],
        [await contract.NORMAL_USER()],
        { from: user1 }
      ),
      "AccessControl: account"
    );
  });
});
