const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const DigitalAsset = artifacts.require('DigitalAsset');
const { toBuffer, bufferToHex } = require('ethereumjs-util');
const { signTypedData } = require('@metamask/eth-sig-util');

contract('DigitalAsset', (accounts) => {
    let digitalAsset;
    const [admin, registrar, certifier1, certifier2, user] = accounts;

    before(async () => {
        digitalAsset = await DigitalAsset.new({ from: admin });

        // 授予角色
        await digitalAsset.grantRole(await digitalAsset.REGISTRAR_ROLE(), registrar, { from: admin });
        await digitalAsset.grantRole(await digitalAsset.CERTIFIER_ROLE(), certifier1, { from: admin });
        await digitalAsset.grantRole(await digitalAsset.CERTIFIER_ROLE(), certifier2, { from: admin });
    });

    it('should register a new asset', async () => {
        const cid = 'QmExampleCID';
        const contentHash = web3.utils.keccak256('example content');
        const encryptedKey = 'encryptedKey';

        // 构造 EIP-712 消息
        const domain = {
            name: 'DigitalAsset',
            version: '1',
            chainId: await web3.eth.getChainId(),
            verifyingContract: digitalAsset.address,
        };
        const types = {
            Register: [
                { name: 'to', type: 'address' },
                { name: 'cid', type: 'string' },
                { name: 'contentHash', type: 'bytes32' },
            ],
        };
        const value = {
            to: user,
            cid: cid,
            contentHash: contentHash,
        };

        // 生成签名
        const privateKey = '';
        const signature = signTypedData({ privateKey, data: { domain, types, value } });

        const result = await digitalAsset.registerAsset(user, cid, contentHash, encryptedKey, signature, { from: registrar });

        truffleAssert.eventEmitted(result, 'AssetRegistered', (ev) => {
            return ev.tokenId.toString() === '0' && ev.registrant === user && ev.cid === cid;
        });

        const metadata = await digitalAsset.getAssetMetadata(0);
        assert.equal(metadata.cid, cid, 'CID should match');
        assert.equal(metadata.contentHash, contentHash, 'Content hash should match');
        assert.equal(metadata.registrant, user, 'Registrant should match');
        assert.equal(metadata.isCertified, false, 'Asset should not be certified initially');
    });

    it('should certify an asset', async () => {
        const tokenId = 0;
        const comment = 'Certified by multiple certifiers';
        const messageHash = web3.utils.soliditySha3(tokenId, comment);

        // 生成签名
        const signature1 = await web3.eth.sign(messageHash, certifier1);
        const signature2 = await web3.eth.sign(messageHash, certifier2);

        const result = await digitalAsset.certifyAsset(tokenId, comment, [signature1, signature2], { from: certifier1 });

        truffleAssert.eventEmitted(result, 'AssetCertified', (ev) => {
            return ev.tokenId.toString() === tokenId.toString() && ev.certifier === certifier1 && ev.comment === comment;
        });

        const metadata = await digitalAsset.getAssetMetadata(tokenId);
        assert.equal(metadata.isCertified, true, 'Asset should be certified');

        const certificationHistory = await digitalAsset.getCertificationHistory(tokenId);
        assert.equal(certificationHistory.length, 1, 'Certification history should have one entry');
        assert.equal(certificationHistory[0].certifier, certifier1, 'Certifier should match');
        assert.equal(certificationHistory[0].comment, comment, 'Comment should match');
    });

    it('should update asset metadata', async () => {
        const tokenId = 0;
        const newCid = 'QmNewCID';
        const newHash = web3.utils.keccak256('new content');
        const newKey = 'newEncryptedKey';

        const result = await digitalAsset.updateMetadata(tokenId, newCid, newHash, newKey, { from: user });

        truffleAssert.eventEmitted(result, 'MetadataUpdated', (ev) => {
            return ev.tokenId.toString() === tokenId.toString() && ev.newCid === newCid && ev.newVersion.toString() === '2';
        });

        const metadata = await digitalAsset.getAssetMetadata(tokenId);
        assert.equal(metadata.cid, newCid, 'CID should be updated');
        assert.equal(metadata.contentHash, newHash, 'Content hash should be updated');
        assert.equal(metadata.encryptedKey, newKey, 'Encrypted key should be updated');
        assert.equal(metadata.version, 2, 'Version should be incremented');
    });

    it('should verify asset integrity', async () => {
        const tokenId = 0;
        const contentHash = web3.utils.keccak256('new content');

        const isIntegrityValid = await digitalAsset.verifyIntegrity(tokenId, contentHash);
        assert.equal(isIntegrityValid, true, 'Integrity should be valid');
    });

    it('should revert if unauthorized user tries to register asset', async () => {
        const cid = 'QmUnauthorizedCID';
        const contentHash = web3.utils.keccak256('unauthorized content');
        const encryptedKey = 'unauthorizedKey';
        const signature = await web3.eth.sign(web3.utils.soliditySha3(user, cid, contentHash), user);

        await truffleAssert.reverts(
            digitalAsset.registerAsset(user, cid, contentHash, encryptedKey, signature, { from: user }),
            'Unauthorized'
        );
    });

    it('should revert if CID is already registered', async () => {
        const cid = 'QmExampleCID';
        const contentHash = web3.utils.keccak256('duplicate content');
        const encryptedKey = 'duplicateKey';

        // 构造 EIP-712 消息并生成签名
        const domain = {
            name: 'DigitalAsset',
            version: '1',
            chainId: await web3.eth.getChainId(),
            verifyingContract: digitalAsset.address,
        };
        const types = {
            Register: [
                { name: 'to', type: 'address' },
                { name: 'cid', type: 'string' },
                { name: 'contentHash', type: 'bytes32' },
            ],
        };
        const value = {
            to: user,
            cid: cid,
            contentHash: contentHash,
        };
        const privateKey = '0x...'; // 替换为用户的私钥
        const signature = signTypedData({ privateKey, data: { domain, types, value } });

        await truffleAssert.reverts(
            digitalAsset.registerAsset(user, cid, contentHash, encryptedKey, signature, { from: registrar }),
            'CID already registered'
        );
    });
});