<template>
  <div class="key-management-container">
    <el-card class="key-card">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Key /></el-icon>
          <h2 class="card-title">密钥管理</h2>
        </div>
      </template>

      <div class="key-content">
        <!-- 密钥状态 -->
        <div class="key-status">
          <el-alert
            :title="wallet ? '已生成密钥对' : '未生成密钥对'"
            :type="wallet ? 'success' : 'warning'"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 密钥操作 -->
        <div class="key-actions">
          <el-button
            v-if="!wallet"
            type="primary"
            @click="handleGenerateKeyPair"
            :loading="generating"
          >
            <el-icon class="mr-8"><Plus /></el-icon>
            生成新密钥对
          </el-button>

          <el-button
            v-if="!wallet"
            type="primary"
            @click="handleImportKey"
            :loading="importing"
          >
            <el-icon class="mr-8"><Upload /></el-icon>
            导入私钥
          </el-button>

          <el-button
            v-if="!wallet"
            type="primary"
            @click="handleImportPEM"
            :loading="importing"
          >
            <el-icon class="mr-8"><Upload /></el-icon>
            导入PEM文件
          </el-button>

          <el-button
            v-if="wallet"
            type="danger"
            @click="handleClearWallet"
          >
            <el-icon class="mr-8"><Delete /></el-icon>
            清除密钥
          </el-button>

          <el-button
            v-if="wallet"
            type="primary"
            @click="handleDownloadPEM"
          >
            <el-icon class="mr-8"><Download /></el-icon>
            下载PEM文件
          </el-button>

          <el-button
            v-if="wallet"
            type="warning"
            @click="handleGetPrivateKey"
          >
            <el-icon class="mr-8"><Key /></el-icon>
            获取私钥
          </el-button>
        </div>

        <!-- 密钥信息 -->
        <div v-if="wallet" class="key-info">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="钱包地址">
              <el-tag type="success">{{ wallet.address }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="公钥">
              <el-tag type="info">{{ shortenAddress(wallet.publicKey) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 签名测试 -->
        <div v-if="wallet" class="sign-test">
          <h3>签名测试</h3>
          <el-input
            v-model="testMessage"
            type="textarea"
            :rows="3"
            placeholder="输入要签名的消息"
            class="mb-20"
          />
          <el-button
            type="primary"
            @click="handleSignMessage"
            :loading="signing"
          >
            签名消息
          </el-button>
          
          <div v-if="signature" class="signature-result">
            <h4>签名结果：</h4>
            <el-tag type="success" class="signature-tag">{{ signature }}</el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 导入私钥对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入私钥"
      width="500px"
    >
      <el-form
        ref="importFormRef"
        :model="importForm"
        :rules="importRules"
        label-width="100px"
      >
        <el-form-item label="私钥" prop="privateKey">
          <el-input
            v-model="importForm.privateKey"
            type="password"
            placeholder="请输入加密后的私钥"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitImport"
          :loading="importing"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 导入PEM文件对话框 -->
    <el-dialog
      v-model="importPEMDialogVisible"
      title="导入PEM文件"
      width="500px"
    >
      <el-form
        ref="importPEMFormRef"
        :model="importPEMForm"
        :rules="importPEMRules"
        label-width="100px"
      >
        <el-form-item label="PEM文件" prop="pemContent">
          <el-upload
            class="pem-uploader"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handlePEMFileChange"
            accept=".pem"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将PEM文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 .pem 文件
              </div>
            </template>
          </el-upload>

          <!-- 文件预览 -->
          <div v-if="importPEMForm.pemContent" class="pem-preview">
            <div class="preview-header">
              <el-tag type="success" size="small">文件已上传</el-tag>
              <el-button 
                type="text" 
                @click="clearPEMContent"
                class="clear-btn"
              >
                <el-icon><Delete /></el-icon>
                清除
              </el-button>
            </div>
            <div class="preview-content">
              <pre>{{ importPEMForm.pemContent }}</pre>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importPEMDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitImportPEM"
          :loading="importing"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Key, Plus, Upload, Delete, Download, UploadFilled } from '@element-plus/icons-vue';
import { KeyManagementService } from '@/services/keyManagement';
import type { FormInstance } from 'element-plus';
import { shortenAddress } from '@/utils/address';

const keyService = KeyManagementService.getInstance();
const wallet = ref<any>(null);
const generating = ref(false);
const importing = ref(false);
const signing = ref(false);
const importDialogVisible = ref(false);
const importFormRef = ref<FormInstance>();
const testMessage = ref('');
const signature = ref('');
const importPEMDialogVisible = ref(false);
const importPEMFormRef = ref<FormInstance>();
const importPEMForm = ref({
  pemContent: ''
});

const importForm = ref({
  privateKey: ''
});

const importRules = {
  privateKey: [
    { required: true, message: '请输入私钥', trigger: 'blur' }
  ]
};

const importPEMRules = {
  pemContent: [
    { required: true, message: '请输入PEM文件内容', trigger: 'blur' }
  ]
};

// 生成新密钥对
const handleGenerateKeyPair = async () => {
  try {
    generating.value = true;
    const { privateKey, publicKey, address, pemContent } = await keyService.generateKeyPair();
    wallet.value = { address, publicKey };
    
    ElMessage.success('密钥对生成成功');
    ElMessageBox.alert(
      `请妥善保管您的私钥和PEM文件：<br/><br/>
      <strong>私钥：</strong><br/>
      <code style="word-break: break-all;">${privateKey}</code><br/><br/>
      <strong>PEM文件内容：</strong><br/>
      <code style="word-break: break-all;">${pemContent}</code><br/><br/>
      <strong>重要提示：</strong><br/>
      1. 请将私钥和PEM文件安全保存，不要泄露给他人<br/>
      2. 建议将私钥和PEM文件备份到安全的地方<br/>
      3. 私钥丢失将无法找回`,
      '保存密钥信息',
      {
        confirmButtonText: '我已安全保存',
        dangerouslyUseHTMLString: true,
        customClass: 'key-alert-dialog'
      }
    );
  } catch (error: any) {
    ElMessage.error(error.message || '生成密钥对失败');
  } finally {
    generating.value = false;
  }
};

// 导入私钥
const handleImportKey = () => {
  importDialogVisible.value = true;
};

const submitImport = async () => {
  if (!importFormRef.value) return;
  
  try {
    await importFormRef.value.validate();
    importing.value = true;
    
    await keyService.importFromPrivateKey(importForm.value.privateKey);
    const publicKey = keyService.getPublicKey();
    const address = keyService.getAddress();
    
    if (publicKey && address) {
      wallet.value = { address, publicKey };
      ElMessage.success('私钥导入成功');
      importDialogVisible.value = false;
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导入私钥失败');
  } finally {
    importing.value = false;
  }
};

// 导入PEM文件
const handleImportPEM = () => {
  importPEMDialogVisible.value = true;
};

// 清除PEM内容
const clearPEMContent = () => {
  importPEMForm.value.pemContent = '';
};

// 处理PEM文件选择
const handlePEMFileChange = (file: any) => {
  if (!file) return;
  
  // 验证文件类型
  if (!file.name.endsWith('.pem')) {
    ElMessage.error('请上传.pem格式的文件');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      const content = e.target.result as string;
      // 验证PEM格式
      if (!content.includes('-----BEGIN PRIVATE KEY-----') || 
          !content.includes('-----END PRIVATE KEY-----')) {
        ElMessage.error('无效的PEM文件格式');
        return;
      }
      importPEMForm.value.pemContent = content;
      ElMessage.success('PEM文件上传成功');
    }
  };
  reader.readAsText(file.raw);
};

const submitImportPEM = async () => {
  if (!importPEMFormRef.value) return;
  
  try {
    await importPEMFormRef.value.validate();
    importing.value = true;
    
    await keyService.importFromPEM(importPEMForm.value.pemContent);
    const publicKey = keyService.getPublicKey();
    const address = keyService.getAddress();
    
    if (publicKey && address) {
      wallet.value = { address, publicKey };
      ElMessage.success('PEM文件导入成功');
      importPEMDialogVisible.value = false;
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导入PEM文件失败');
  } finally {
    importing.value = false;
  }
};

// 清除密钥
const handleClearWallet = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除当前密钥吗？此操作不可恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    keyService.clearWallet();
    wallet.value = null;
    signature.value = '';
    ElMessage.success('密钥已清除');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清除密钥失败');
    }
  }
};

// 签名消息
const handleSignMessage = async () => {
  if (!testMessage.value) {
    ElMessage.warning('请输入要签名的消息');
    return;
  }
  
  try {
    signing.value = true;
    signature.value = await keyService.signData(testMessage.value);
    ElMessage.success('签名成功');
  } catch (error: any) {
    ElMessage.error(error.message || '签名失败');
  } finally {
    signing.value = false;
  }
};

// 下载PEM文件
const handleDownloadPEM = async () => {
  try {
    const pemContent = await keyService.getPEMContent();
    if (!pemContent) {
      ElMessage.error('无法获取PEM文件内容');
      return;
    }

    // 创建Blob对象
    const blob = new Blob([pemContent], { type: 'application/x-pem-file' });
    const url = window.URL.createObjectURL(blob);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = 'private_key.pem';
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('PEM文件下载成功');
  } catch (error: any) {
    ElMessage.error(error.message || '下载PEM文件失败');
  }
};

// 获取私钥
const handleGetPrivateKey = async () => {
  try {
    await ElMessageBox.confirm(
      `<div class="private-key-warning">
        <h4>⚠️ 重要安全警告</h4>
        <p>您正在尝试查看私钥，请注意：</p>
        <ul>
          <li>私钥是您钱包的唯一凭证，请勿泄露给任何人</li>
          <li>私钥一旦泄露，您的资产将面临安全风险</li>
          <li>建议使用PEM文件方式保存私钥，而不是直接查看私钥</li>
          <li>如果您不确定是否需要查看私钥，建议取消此操作</li>
        </ul>
        <p>您确定要继续查看私钥吗？</p>
      </div>`,
      '安全警告',
      {
        confirmButtonText: '我了解风险，继续查看',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        customClass: 'private-key-warning-dialog'
      }
    );

    const privateKey = await keyService.getPrivateKey();
    if (!privateKey) {
      ElMessage.error('无法获取私钥');
      return;
    }

    // 显示私钥
    ElMessageBox.alert(
      `<div class="private-key-display">
        <h4>您的私钥：</h4>
        <code>${privateKey}</code>
        <p class="warning-text">⚠️ 请立即安全保存，不要截图或分享给他人</p>
      </div>`,
      '私钥信息',
      {
        confirmButtonText: '我已安全保存',
        dangerouslyUseHTMLString: true,
        customClass: 'private-key-display-dialog'
      }
    );
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('获取私钥失败');
    }
  }
};

onMounted(async () => {
  // 检查是否已有密钥
  const address = keyService.getAddress();
  const publicKey = keyService.getPublicKey();
  if (address && publicKey) {
    wallet.value = { address, publicKey };
  }
});
</script>

<style scoped lang="scss">
.key-management-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

.key-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #dddddd;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: #000000;
    }

    .card-title {
      margin: 0;
      font-size: 18px;
      color: #000000;
    }
  }
}

.key-content {
  .key-status {
    margin-bottom: 20px;
  }

  .key-actions {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;

    .el-button {
      background: transparent;
      border: 1px solid #000000;
      color: #000000;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
      }

      &.el-button--danger {
        border-color: #ff4d4f;
        color: #ff4d4f;

        &:hover {
          background: rgba(255, 77, 79, 0.1);
        }
      }

      &.el-button--warning {
        border-color: #faad14;
        color: #faad14;

        &:hover {
          background: rgba(250, 173, 20, 0.1);
        }
      }
    }
  }

  .key-info {
    margin-bottom: 30px;

    :deep(.el-descriptions) {
      .el-descriptions__label {
        color: #000000;
        background: rgba(245, 245, 245, 0.9) !important;
      }
      .el-descriptions__content {
        color: #333333;
        background: rgba(255, 255, 255, 0.9) !important;
      }
      .el-descriptions__table {
        border: 1px solid #dddddd;
      }
      .el-descriptions-item__cell {
        border-right: 1px solid #dddddd;
        border-bottom: 1px solid #dddddd;
      }
    }

    .el-tag {
      background: rgba(0, 0, 0, 0.05);
      border-color: #000000;
      color: #000000;

      &.el-tag--info {
        background: rgba(0, 0, 0, 0.05);
        border-color: #666666;
        color: #666666;
      }
    }
  }

  .sign-test {
    h3 {
      color: #000000;
      margin-bottom: 20px;
    }

    .signature-result {
      margin-top: 20px;

      h4 {
        color: #000000;
        margin-bottom: 10px;
      }

      .signature-tag {
        word-break: break-all;
        background: rgba(0, 0, 0, 0.05);
        border-color: #000000;
        color: #000000;
      }
    }
  }
}

.mb-20 {
  margin-bottom: 20px;
}

.mr-8 {
  margin-right: 8px;
}

:deep(.el-input__wrapper) {
  background: rgba(245, 245, 245, 0.9);
  border: 1px solid #dddddd;
  box-shadow: none;

  &:hover, &.is-focus {
    border-color: #000000;
  }
}

:deep(.el-input__inner) {
  color: #000000;
}

:deep(.el-textarea__inner) {
  background: rgba(245, 245, 245, 0.9);
  border: 1px solid #dddddd;
  color: #000000;

  &:hover, &:focus {
    border-color: #000000;
  }
}

:global(.key-alert-dialog) {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 8px;
  
  .el-message-box__title {
    color: #000000;
    font-size: 18px;
    font-weight: bold;
  }
  
  .el-message-box__content {
    color: #333333;
    font-size: 14px;
    line-height: 1.6;
    
    code {
      display: block;
      padding: 12px;
      background: rgba(245, 245, 245, 0.9);
      border: 1px solid #dddddd;
      border-radius: 4px;
      color: #000000;
      font-family: monospace;
      font-size: 13px;
      line-height: 1.5;
      margin: 8px 0;
    }
    
    strong {
      color: #000000;
      font-weight: bold;
    }
  }
  
  .el-message-box__btns {
    .el-button {
      background: transparent;
      border: 1px solid #000000;
      color: #000000;
      
      &:hover {
        background: rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.pem-uploader {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    background: rgba(245, 245, 245, 0.9);
    border: 1px dashed #dddddd;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;

    &:hover {
      border-color: #000000;
    }

    .el-icon--upload {
      font-size: 48px;
      color: #000000;
      margin-bottom: 16px;
    }

    .el-upload__text {
      color: #333333;
      font-size: 14px;
      text-align: center;

      em {
        color: #000000;
        font-style: normal;
      }
    }

    .el-upload__tip {
      color: #666666;
      font-size: 12px;
      margin-top: 8px;
    }
  }
}

.pem-preview {
  margin-top: 16px;
  background: rgba(245, 245, 245, 0.9);
  border: 1px solid #dddddd;
  border-radius: 6px;
  overflow: hidden;

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.05);
    border-bottom: 1px solid #dddddd;

    .clear-btn {
      color: #000000;
      padding: 0;
      height: auto;
      
      &:hover {
        color: #ff4d4f;
      }
    }
  }

  .preview-content {
    padding: 16px;
    max-height: 200px;
    overflow-y: auto;

    pre {
      margin: 0;
      color: #000000;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

:global(.private-key-warning-dialog) {
  background: #ffffff;
  border: 1px solid #faad14;
  border-radius: 8px;
  
  .el-message-box__title {
    color: #faad14;
    font-size: 18px;
    font-weight: bold;
  }
  
  .el-message-box__content {
    color: #333333;
    font-size: 14px;
    line-height: 1.6;
    
    .private-key-warning {
      h4 {
        color: #faad14;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: bold;
      }
      
      ul {
        margin: 12px 0;
        padding-left: 20px;
        
        li {
          color: #faad14;
          margin-bottom: 8px;
          line-height: 1.6;
        }
      }
      
      p {
        margin: 12px 0;
        color: #faad14;
        line-height: 1.6;
      }
    }
  }
  
  .el-message-box__btns {
    .el-button {
      background: transparent;
      border: 1px solid #faad14;
      color: #faad14;
      
      &:hover {
        background: rgba(250, 173, 20, 0.1);
      }
    }
  }
}

:global(.private-key-display-dialog) {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 8px;
  
  .el-message-box__title {
    color: #000000;
    font-size: 18px;
    font-weight: bold;
  }
  
  .el-message-box__content {
    color: #333333;
    font-size: 14px;
    line-height: 1.6;
    
    .private-key-display {
      h4 {
        color: #000000;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: bold;
      }
      
      code {
        display: block;
        padding: 12px;
        background: rgba(245, 245, 245, 0.9);
        border: 1px solid #dddddd;
        border-radius: 4px;
        color: #000000;
        font-family: monospace;
        font-size: 13px;
        line-height: 1.5;
        word-break: break-all;
        margin-bottom: 16px;
      }
      
      .warning-text {
        color: #faad14;
        font-size: 14px;
        text-align: center;
        font-weight: bold;
      }
    }
  }
  
  .el-message-box__btns {
    .el-button {
      background: transparent;
      border: 1px solid #000000;
      color: #000000;
      
      &:hover {
        background: rgba(0, 0, 0, 0.1);
      }
    }
  }
}

// 覆盖 Element Plus 的默认对话框样式
:global(.el-message-box) {
  background: #ffffff !important;
  border: 1px solid #dddddd !important;
  
  .el-message-box__header {
    background: rgba(245, 245, 245, 0.9);
    padding: 15px 20px;
    border-bottom: 1px solid #dddddd;
  }
  
  .el-message-box__content {
    padding: 20px;
  }
  
  .el-message-box__btns {
    padding: 15px 20px;
    border-top: 1px solid #dddddd;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .key-management-container {
    padding: 10px;
  }

  .key-actions {
    flex-direction: column;
    gap: 10px !important;

    .el-button {
      width: 100%;
    }
  }
}
</style> 