import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

export class KeyManagementService {
  private static instance: KeyManagementService;
  private wallet: ethers.BaseWallet | null = null;
  private encryptedPrivateKey: string | null = null;

  private constructor() {}

  public static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }

  // 添加超时机制的辅助方法
  private async withTimeout<T>(promise: Promise<T>, timeout: number, errorMessage: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeout))
    ]);
  }

  // 生成新的密钥对
  public async generateKeyPair(): Promise<{ privateKey: string; publicKey: string; address: string; pemContent: string }> {
    try {
      return await this.withTimeout(
        (async () => {
          // 使用ethers.js生成随机钱包
          const randomWallet = ethers.Wallet.createRandom();
          this.wallet = randomWallet;

          // 获取十六进制格式的私钥
          const hexPrivateKey = randomWallet.privateKey;

          // 加密私钥
          const encryptedPrivateKey = this.encryptPrivateKey(hexPrivateKey);
          this.encryptedPrivateKey = encryptedPrivateKey;

          // 获取公钥
          const publicKey = ethers.SigningKey.computePublicKey(hexPrivateKey);

          // 生成PEM格式的私钥
          const pemContent = this.generatePEMContent(hexPrivateKey);

          return {
            privateKey: hexPrivateKey,
            publicKey: publicKey,
            address: randomWallet.address,
            pemContent: pemContent
          };
        })(),
        5000, // 超时时间 5 秒
        '生成密钥对超时，请稍后重试'
      );
    } catch (error) {
      console.error('生成密钥对失败: 可能是由于随机钱包生成失败或加密过程出错', error);
      throw new Error('生成密钥对失败，请检查日志获取更多信息');
    }
  }

  // 从PEM文件导入私钥
  public async importFromPEM(pemContent: string): Promise<void> {
    try {
      await this.withTimeout(
        (async () => {
          const privateKey = this.extractPrivateKeyFromPEM(pemContent);
          await this.importFromPrivateKey(privateKey);
        })(),
        5000,
        '从PEM文件导入私钥超时，请稍后重试'
      );
    } catch (error) {
      console.error('从PEM文件导入私钥失败: 可能是PEM格式无效或私钥解析失败', error);
      throw new Error('从PEM文件导入私钥失败，请检查日志获取更多信息');
    }
  }

  // 从私钥导入钱包
  public async importFromPrivateKey(privateKey: string): Promise<void> {
    try {
      await this.withTimeout(
        (async () => {
          // 验证私钥格式
          if (!ethers.isHexString(privateKey, 32)) {
            throw new Error('无效的私钥格式，请确保是64位十六进制字符串');
          }

          // 创建钱包
          this.wallet = new ethers.Wallet(privateKey);

          // 加密私钥
          this.encryptedPrivateKey = this.encryptPrivateKey(privateKey);
        })(),
        5000,
        '从私钥导入钱包超时，请稍后重试'
      );
    } catch (error) {
      console.error('导入私钥失败: 可能是私钥格式无效或钱包创建失败', error);
      throw new Error('导入私钥失败，请检查日志获取更多信息');
    }
  }

  // 将十六进制字符串转换为 Base64
  private hexToBase64(hexString: string): string {
    const bytes = new Uint8Array(hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
  }

  // 将 Base64 转换为十六进制字符串
  private base64ToHex(base64String: string): string {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 生成PEM格式的私钥内容
  private generatePEMContent(privateKey: string): string {
    const header = '-----BEGIN PRIVATE KEY-----\n';
    const footer = '\n-----END PRIVATE KEY-----';
    
    // 将私钥转换为Base64格式
    const base64Key = this.hexToBase64(privateKey.slice(2)); // 移除0x前缀
    
    // 每64个字符添加一个换行符
    const formattedKey = base64Key.match(/.{1,64}/g)?.join('\n') || base64Key;
    
    return header + formattedKey + footer;
  }

  // 从PEM内容中提取私钥
  private extractPrivateKeyFromPEM(pemContent: string): string {
    try {
      // 移除PEM头部和尾部
      const base64Content = pemContent
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '');

      // 将Base64转换回十六进制
      return '0x' + this.base64ToHex(base64Content);
    } catch (error) {
      console.error('从PEM内容提取私钥失败: 可能是PEM格式无效或Base64解析失败', error);
      throw new Error('无效的PEM文件格式，请检查内容是否正确');
    }
  }

  // 签名数据
  public async signData(data: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('签名数据失败: 当前没有可用的钱包，请先生成或导入密钥对');
    }

    try {
      return await this.withTimeout(
        this.wallet.signMessage(data),
        5000,
        '签名数据超时，请稍后重试'
      );
    } catch (error) {
      console.error('签名数据失败: 可能是签名过程出错或数据格式无效', error);
      throw new Error('签名数据失败，请检查日志获取更多信息');
    }
  }

  // 验证签名
  public async verifySignature(data: string, signature: string, publicKey: string): Promise<boolean> {
    try {
      return await this.withTimeout(
        (async () => {
          const recoveredAddress = ethers.verifyMessage(data, signature);
          return recoveredAddress.toLowerCase() === publicKey.toLowerCase();
        })(),
        5000,
        '验证签名超时，请稍后重试'
      );
    } catch (error) {
      console.error('验证签名失败: 可能是签名格式无效或公钥不匹配', error);
      throw new Error('验证签名失败，请检查日志获取更多信息');
    }
  }

  // 获取当前钱包的公钥
  public getPublicKey(): string | null {
    if (!this.wallet) return null;
    return ethers.SigningKey.computePublicKey(this.wallet.privateKey);
  }

  // 获取当前钱包的地址
  public getAddress(): string | null {
    return this.wallet?.address || null;
  }

  // 获取PEM文件内容
  public async getPEMContent(): Promise<string | null> {
    if (!this.wallet) return null;
    return this.generatePEMContent(this.wallet.privateKey);
  }

  // 获取私钥
  public async getPrivateKey(): Promise<string | null> {
    if (!this.wallet) return null;
    return this.wallet.privateKey;
  }

  // 清除当前钱包
  public clearWallet(): void {
    this.wallet = null;
    this.encryptedPrivateKey = null;
  }

  // 加密私钥
  private encryptPrivateKey(privateKey: string): string {
    const secretKey = this.generateSecretKey(); // 在实际应用中，这个密钥应该从安全的地方获取
    return CryptoJS.AES.encrypt(privateKey, secretKey).toString();
  }

  // 解密私钥
  private decryptPrivateKey(encryptedPrivateKey: string): string {
    try {
      const secretKey = this.generateSecretKey(); // 在实际应用中，这个密钥应该从安全的地方获取
      const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('解密私钥失败: 可能是加密密钥无效或解密过程出错', error);
      throw new Error('解密私钥失败，请检查日志获取更多信息');
    }
  }

  // 生成加密密钥（实际应用中应该使用更安全的方式）
  private generateSecretKey(): string {
    const secretKey = import.meta.env.VITE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('未找到加密密钥，请确保已设置环境变量 VITE_SECRET_KEY');
    }
    return secretKey;
  }
}