// test/DIDRegistry.test.js
const DIDRegistry = artifacts.require("DIDRegistry");
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("DIDRegistry", function (accounts) {
  const [owner, addr1, addr2, addr3] = accounts;
  const STAKE_AMOUNT = web3.utils.toWei('0.01', 'ether');

  let didRegistry;

  beforeEach(async function () {
    didRegistry = await DIDRegistry.new({ from: owner });
  });

  describe("DID Management", function () {
    it("Should create a DID with correct stake", async function () {
      const docHash = web3.utils.sha3("test-doc");
      
      const result = await didRegistry.createDID(docHash, { 
        from: addr1,
        value: STAKE_AMOUNT 
      });

      expectEvent(result, 'DIDCreated', {
        user: addr1,
        docHash: docHash
      });

      const didDetails = await didRegistry.getDIDDetails(addr1);
      assert.equal(didDetails.owner, addr1);
      assert.equal(didDetails.docHash, docHash);
      assert.equal(didDetails.reputation.toString(), '100');
      assert.equal(didDetails.active, true);
    });

    it("Should fail to create DID with incorrect stake", async function () {
      const docHash = web3.utils.sha3("test-doc");
      const wrongStake = web3.utils.toWei('0.02', 'ether');

      await expectRevert(
        didRegistry.createDID(docHash, { from: addr1, value: wrongStake }),
        "Incorrect stake"
      );
    });

    it("Should update DID document hash", async function () {
      const oldDocHash = web3.utils.sha3("old-doc");
      const newDocHash = web3.utils.sha3("new-doc");

      await didRegistry.createDID(oldDocHash, { 
        from: addr1,
        value: STAKE_AMOUNT 
      });

      const result = await didRegistry.updateDID(newDocHash, { from: addr1 });
      
      expectEvent(result, 'DIDUpdated', {
        user: addr1,
        newDocHash: newDocHash
      });

      const didDetails = await didRegistry.getDIDDetails(addr1);
      assert.equal(didDetails.docHash, newDocHash);
    });

    it("Should verify DID correctly", async function () {
      const docHash = web3.utils.sha3("test-doc");
      await didRegistry.createDID(docHash, { 
        from: addr1,
        value: STAKE_AMOUNT 
      });

      const isValid = await didRegistry.verifyDID(addr1, docHash);
      assert.equal(isValid, true);

      const wrongHash = web3.utils.sha3("wrong");
      const isInvalid = await didRegistry.verifyDID(addr1, wrongHash);
      assert.equal(isInvalid, false);
    });
  });

  describe("Reputation Management", function () {
    beforeEach(async function () {
      const docHash = web3.utils.sha3("test-doc");
      await didRegistry.createDID(docHash, { 
        from: addr1,
        value: STAKE_AMOUNT 
      });
    });

    it("Should update reputation correctly", async function () {
      const result = await didRegistry.updateReputation(addr1, 50, "Good behavior", { from: owner });
      
      expectEvent(result, 'ReputationUpdated', {
        user: addr1,
        newScore: new BN('150'),
        reason: "Good behavior"
      });

      const didDetails = await didRegistry.getDIDDetails(addr1);
      assert.equal(didDetails.reputation.toString(), '150');
    });

    it("Should not exceed maximum reputation", async function () {
      await didRegistry.updateReputation(addr1, 1000, "Excellent", { from: owner });
      
      const didDetails = await didRegistry.getDIDDetails(addr1);
      assert.equal(didDetails.reputation.toString(), '1000'); // MAX_REPUTATION
    });

    it("Should store reputation history", async function () {
      await didRegistry.updateReputation(addr1, 50, "First update", { from: owner });
      await didRegistry.updateReputation(addr1, -30, "Second update", { from: owner });

      const history = await didRegistry.getReputationHistory(addr1);
      assert.equal(history.length, 2);
      assert.equal(history[0].delta.toString(), '50');
      assert.equal(history[1].delta.toString(), '-30');
    });
  });

  describe("Stake Management", function () {
    beforeEach(async function () {
      const docHash = web3.utils.sha3("test-doc");
      await didRegistry.createDID(docHash, { 
        from: addr1,
        value: STAKE_AMOUNT 
      });
    });

    it("Should allow withdrawal with sufficient reputation", async function () {
      const initialBalance = new BN(await web3.eth.getBalance(addr1));
      
      const result = await didRegistry.withdrawStake({ from: addr1 });
      const tx = await web3.eth.getTransaction(result.tx);
      const gasUsed = new BN(result.receipt.gasUsed);
      const gasPrice = new BN(tx.gasPrice);
      const gasCost = gasPrice.mul(gasUsed);
      
      const finalBalance = new BN(await web3.eth.getBalance(addr1));
      const expectedBalance = initialBalance.add(new BN(STAKE_AMOUNT)).sub(gasCost);
      
      assert.equal(finalBalance.toString(), expectedBalance.toString());

      const didDetails = await didRegistry.getDIDDetails(addr1);
      assert.equal(didDetails.active, false);
    });

    it("Should prevent withdrawal with low reputation", async function () {
      await didRegistry.updateReputation(addr1, -60, "Bad behavior", { from: owner });
      
      await expectRevert(
        didRegistry.withdrawStake({ from: addr1 }),
        "Reputation too low"
      );
    });
  });
});

