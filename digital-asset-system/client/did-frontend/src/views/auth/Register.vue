<template>
  <div class="register-container">
    <!-- 动态二进制背景 -->
    <div class="binary-background">
      <div v-for="i in 80" :key="i" class="binary-bit" :style="{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`
      }">{{ Math.round(Math.random()) }}</div>
    </div>
    
    <div class="register-content">
      <div class="glitch-container">
        <h1 class="glitch-text" data-text="企业账户注册">企业账户注册</h1>
      </div>
      
      <div class="card-container">
        <el-card class="register-card">
          <div class="form-container">
            <el-form 
              ref="registerFormRef"
              :model="registerForm"
              :rules="rules"
              label-position="top"
              @submit.prevent
            >
              <!-- 公司名称字段 -->
              <el-form-item prop="companyName">
                <template #label>
                  <div class="neon-label">公司名称</div>
                </template>
                <el-input 
                  v-model="registerForm.companyName"
                  placeholder="请输入营业执照上的公司全称"
                  clearable
                >
                  <template #prefix>
                    <el-icon class="input-icon"><OfficeBuilding /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 邮箱字段 -->
              <el-form-item prop="email">
                <template #label>
                  <div class="neon-label">企业邮箱</div>
                </template>
                <el-input 
                  v-model="registerForm.email"
                  placeholder="请输入企业邮箱"
                  clearable
                  @blur="handleEmailBlur"
                >
                  <template #prefix>
                    <el-icon class="input-icon"><Message /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 密码字段 -->
              <el-form-item prop="password">
                <template #label>
                  <div class="neon-label">登录密码</div>
                </template>
                <el-input
                  v-model="registerForm.password"
                  type="password"
                  show-password
                  placeholder="8-20位字符"
                  clearable
                >
                  <template #prefix>
                    <el-icon class="input-icon"><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 确认密码 -->
              <el-form-item prop="confirmPassword">
                <template #label>
                  <div class="neon-label">确认密码</div>
                </template>
                <el-input
                  v-model="registerForm.confirmPassword"
                  type="password"
                  show-password
                  placeholder="请再次输入密码"
                  clearable
                >
                  <template #prefix>
                    <el-icon class="input-icon"><Key /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 验证码字段 -->
              <el-form-item prop="verificationCode" class="verification-group">
                <template #label>
                  <div class="neon-label">验证码</div>
                </template>
                <div class="verification-input-group">
                  <el-input
                    v-model="registerForm.verificationCode"
                    placeholder="请输入邮箱收到的验证码"
                    clearable
                  >
                    <template #prefix>
                      <el-icon class="input-icon"><VerificationCode /></el-icon>
                    </template>
                  </el-input>
                  <button 
                    class="verify-button"
                    :disabled="!isEmailValid || isSending"
                    :class="{ 'sending': isSending }"
                    @click="sendVerificationEmail"
                  >
                    {{ sentEmail ? '重新发送' : '获取验证码' }}
                  </button>
                </div>
                
                <transition name="el-fade-in">
                  <div v-if="sentEmail" class="email-tip">
                    <el-icon><Message /></el-icon>
                    <span>验证邮件已发送至 {{ registerForm.email }}</span>
                  </div>
                </transition>
              </el-form-item>

              <!-- 用户协议 -->
              <el-form-item label=" " prop="agreeProtocol">
                <el-checkbox v-model="registerForm.agreeProtocol" class="cyber-checkbox">
                  我已阅读并同意
                  <a class="cyber-link" @click="showProtocolDialog">《服务协议》</a>
                </el-checkbox>
              </el-form-item>

              <!-- 注册按钮 -->
              <div class="button-container">
                <button 
                  class="cyber-button"
                  :class="{ 'loading': isSubmitting }"
                  @click="handleRegister"
                >
                  <span class="cyber-button-text">{{ isSubmitting ? '注册中...' : '完成注册' }}</span>
                  <span class="cyber-button-glitch"></span>
                </button>
              </div>
              
              <!-- 登录链接 -->
              <div class="login-link">
                <span>已有账户？</span>
                <a @click="goToLogin" class="cyber-link">立即登录</a>
              </div>
            </el-form>
          </div>
        </el-card>
      </div>
    </div>
    
    <!-- 协议弹窗 -->
    <el-dialog 
      v-model="protocolVisible" 
      title="用户协议" 
      width="70%"
      class="cyber-dialog"
    >
      <div v-html="protocolContent" class="protocol-content" />
      <template #footer>
        <button class="cyber-button small" @click="protocolVisible = false">
          我已阅读并同意
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Message, Lock, Key } from '@element-plus/icons-vue'
import axios from 'axios'
import { KeyManagementService } from '@/services/keyManagement'

// 自定义图标组件 - 使用 h 函数创建
const VerificationCode = () => h('svg', {
  viewBox: '0 0 24 24',
  width: '1em',
  height: '1em'
}, [
  h('path', {
    fill: 'currentColor',
    d: 'M4,17V9H2V7H6V17H4M22,15C22,16.11 21.11,17 20,17H16V15H20V13H18V11H20V9H16V7H20A2,2 0 0,1 22,9V10.5A1.5,1.5 0 0,1 20.5,12A1.5,1.5 0 0,1 22,13.5V15M14,15V17H8V13C8,11.89 8.89,11 10,11H12V9H8V7H12A2,2 0 0,1 14,9V11C14,12.11 13.11,13 12,13H10V15H14Z'
  })
])

// 自定义办公楼图标 - 使用 h 函数创建
const OfficeBuilding = () => h('svg', {
  viewBox: '0 0 24 24',
  width: '1em',
  height: '1em'
}, [
  h('path', {
    fill: 'currentColor',
    d: 'M5,3V21H11V17.5H13V21H19V3H5M7,5H9V7H7V5M11,5H13V7H11V5M15,5H17V7H15V5M7,9H9V11H7V9M11,9H13V11H11V9M15,9H17V11H15V9M7,13H9V15H7V13M11,13H13V15H11V13M15,13H17V15H15V13M7,17H9V19H7V17M15,17H17V19H15V17Z'
  })
])

const router = useRouter()

// 表单实例
const registerFormRef = ref<FormInstance>()

// 表单数据
const registerForm = ref({
  companyName: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
  agreeProtocol: false
})

// 状态管理
const isSubmitting = ref(false)
const isSending = ref(false)
const sentEmail = ref(false)
const protocolVisible = ref(false)

// 协议内容（示例）
const protocolContent = ref(`
  <h3>用户服务协议</h3>
  <p>请仔细阅读并同意我们的服务条款...</p>
`)

// 验证规则
const rules = {
  companyName: [
    { required: true, message: '请输入公司名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入企业邮箱', trigger: 'blur' },
    { 
      type: 'email', 
      message: '请输入有效的邮箱地址', 
      trigger: ['blur', 'change'] 
    },
    {
      validator: async (rule: any, value: string, callback: any) => {
        if (!value) return callback()
        try {
          const encodedEmail = encodeURIComponent(value);
          const { data } = await axios.get(`/api/public/check-email/${encodedEmail}`);
          if (data === '该邮箱已被注册') {
            callback(new Error('该邮箱已被注册'))
          } else {
            callback()
          }
        } catch (error) {
          callback(new Error('邮箱验证失败'))
        }
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { 
      min: 8, 
      max: 20, 
      message: '密码长度需在8到20位之间', 
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ],
  agreeProtocol: [
    { 
      validator: (_rule: any, value: boolean, callback: any) => {
        if (!value) {
          callback(new Error('请阅读并同意用户协议'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 邮箱有效性检查
const isEmailValid = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.value.email)
})

// 处理邮箱失焦
const handleEmailBlur = async () => {
  if (!isEmailValid.value) return
  try {
    await registerFormRef.value?.validateField('email')
  } catch (error) {
    console.log('邮箱验证失败:', error)
  }
}

// 发送验证邮件
const sendVerificationEmail = async () => {
  if (!isEmailValid.value) return
  
  isSending.value = true
  try {
    const { data } = await axios.post('/api/public/send-verification-code', {
      email: registerForm.value.email}
    )
    
    if (data.success) {
      sentEmail.value = true
      ElMessage({
        message: '验证邮件已发送，请查看邮箱',
        type: 'success',
        customClass: 'cyber-message'
      })
      // 60秒后才能重新发送
      setTimeout(() => {
        isSending.value = false
      }, 60000)
    } else {
      ElMessage.error(data)
      isSending.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '发送失败')
    isSending.value = false
  }
}

// 在script setup中添加
const keyService = KeyManagementService.getInstance()

// 修改handleRegister函数
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    // 表单验证
    const valid = await registerFormRef.value.validate()
    if (!valid) return
    
    isSubmitting.value = true

    // 生成密钥对
    const { privateKey, publicKey, address } = await keyService.generateKeyPair()
    
    const { data } = await axios.post('/api/public/register', {
      username: registerForm.value.companyName,
      password: registerForm.value.password,
      email: registerForm.value.email,
      phone: '',
      verificationCode: registerForm.value.verificationCode,
      publicKey: publicKey, // 添加公钥
      address: address // 添加地址
    });

    if (data.success) {
      // 显示私钥保存提示
      ElMessageBox.alert(
        `请妥善保管您的私钥，它将用于后续的身份验证和签名操作：<br/><br/>
        <code style="word-break: break-all;">${privateKey}</code><br/><br/>
        <strong>重要提示：</strong><br/>
        1. 请将私钥安全保存，不要泄露给他人<br/>
        2. 建议将私钥备份到安全的地方<br/>
        3. 私钥丢失将无法找回<br/>
        4. 您可以使用此私钥导入到MetaMask钱包`,
        '保存私钥',
        {
          confirmButtonText: '我已安全保存',
          dangerouslyUseHTMLString: true,
          customClass: 'key-alert-dialog'
        }
      ).then(() => {
        ElMessage({
          message: data.message,
          type: 'success',
          duration: 3000
        });
        router.push({
          path: '/login',
          query: { email: registerForm.value.email }
        });
      })
    } else {
      ElMessage.error(data.message);
    }
  } catch (error: any) {
    ElMessage.error({
      message: error.response?.data?.message || '注册失败',
      duration: 3000
    })
  } finally {
    isSubmitting.value = false
  }
}

// 显示协议弹窗
const showProtocolDialog = () => {
  protocolVisible.value = true
}

// 跳转登录页
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #ffffff;
  color: #000000;
  overflow: hidden;
  position: relative;
  padding: 2rem 0;
}

/* 二进制背景 */
.binary-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  opacity: 0.1;
}

.binary-bit {
  position: absolute;
  font-family: monospace;
  font-size: 1.2rem;
  color: #333333;
  animation: fadeInOut 8s infinite;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.register-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  z-index: 1;
  padding: 1rem;
}

.glitch-container {
  margin-bottom: 2rem;
  text-align: center;
}

.glitch-text {
  font-size: 2.5rem;
  font-weight: 800;
  color: #000000;
  position: relative;
  text-shadow: 0.05em 0 0 rgba(0, 0, 0, 0.75),
              -0.025em -0.05em 0 rgba(0, 0, 0, 0.75),
              0.025em 0.05em 0 rgba(0, 0, 0, 0.75);
  animation: glitch 500ms infinite;
}

.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glitch-text::before {
  left: 2px;
  text-shadow: -2px 0 #333333;
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim 5s infinite linear alternate-reverse;
}

.glitch-text::after {
  left: -2px;
  text-shadow: -2px 0 #666666, 2px 2px #333333;
  animation: glitch-anim2 1s infinite linear alternate-reverse;
}

@keyframes glitch-anim {
  0% { clip: rect(31px, 9999px, 94px, 0); }
  5% { clip: rect(70px, 9999px, 71px, 0); }
  10% { clip: rect(29px, 9999px, 43px, 0); }
  15% { clip: rect(15px, 9999px, 13px, 0); }
  20% { clip: rect(76px, 9999px, 91px, 0); }
  25% { clip: rect(91px, 9999px, 43px, 0); }
  30% { clip: rect(85px, 9999px, 41px, 0); }
  35% { clip: rect(93px, 9999px, 90px, 0); }
  40% { clip: rect(75px, 9999px, 30px, 0); }
  45% { clip: rect(48px, 9999px, 29px, 0); }
  50% { clip: rect(83px, 9999px, 76px, 0); }
  55% { clip: rect(66px, 9999px, 78px, 0); }
  60% { clip: rect(14px, 9999px, 97px, 0); }
  65% { clip: rect(70px, 9999px, 46px, 0); }
  70% { clip: rect(49px, 9999px, 92px, 0); }
  75% { clip: rect(66px, 9999px, 65px, 0); }
  80% { clip: rect(44px, 9999px, 25px, 0); }
  85% { clip: rect(23px, 9999px, 48px, 0); }
  90% { clip: rect(82px, 9999px, 64px, 0); }
  95% { clip: rect(38px, 9999px, 18px, 0); }
  100% { clip: rect(65px, 9999px, 89px, 0); }
}

@keyframes glitch-anim2 {
  0% { clip: rect(65px, 9999px, 65px, 0); }
  5% { clip: rect(16px, 9999px, 98px, 0); }
  10% { clip: rect(51px, 9999px, 35px, 0); }
  15% { clip: rect(98px, 9999px, 95px, 0); }
  20% { clip: rect(51px, 9999px, 50px, 0); }
  25% { clip: rect(38px, 9999px, 56px, 0); }
  30% { clip: rect(35px, 9999px, 31px, 0); }
  35% { clip: rect(94px, 9999px, 28px, 0); }
  40% { clip: rect(52px, 9999px, 31px, 0); }
  45% { clip: rect(37px, 9999px, 56px, 0); }
  50% { clip: rect(81px, 9999px, 82px, 0); }
  55% { clip: rect(51px, 9999px, 23px, 0); }
  60% { clip: rect(72px, 9999px, 25px, 0); }
  65% { clip: rect(36px, 9999px, 100px, 0); }
  70% { clip: rect(48px, 9999px, 42px, 0); }
  75% { clip: rect(81px, 9999px, 84px, 0); }
  80% { clip: rect(72px, 9999px, 46px, 0); }
  85% { clip: rect(15px, 9999px, 30px, 0); }
  90% { clip: rect(86px, 9999px, 92px, 0); }
  95% { clip: rect(57px, 9999px, 92px, 0); }
  100% { clip: rect(30px, 9999px, 95px, 0); }
}

.card-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  perspective: 1000px;
}

.register-card {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.8);
  padding: 40px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
  transform-style: preserve-3d;
  backdrop-filter: blur(10px);
}

.register-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.form-container {
  margin-top: 1rem;
}

.neon-label {
  color: #000000;
  font-weight: 600;
  text-shadow: none;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.input-icon {
  color: #333333;
}

:deep(.el-input__wrapper) {
  background: rgba(245, 245, 245, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: none;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
  border-color: #000000;
}

:deep(.el-input__inner) {
  color: #000000;
}

.verification-input-group {
  display: flex;
  gap: 10px;
}

.verification-input-group .el-input {
  flex: 1;
}

.verify-button {
  min-width: 100px;
  background: transparent;
  border: 1px solid #000000;
  color: #000000;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.verify-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.1);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.verify-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #666666;
  color: #666666;
}

.verify-button.sending {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.email-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  color: #000000;
  font-size: 0.85rem;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #000000;
  border-color: #000000;
}

:deep(.el-checkbox__inner) {
  background-color: rgba(245, 245, 245, 0.8);
  border-color: rgba(0, 0, 0, 0.5);
}

:deep(.el-checkbox__label) {
  color: #333333;
}

.cyber-checkbox {
  margin-top: 1rem;
}

.button-container {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.cyber-button {
  position: relative;
  width: 100%;
  height: 50px;
  background: transparent;
  border: 2px solid #000000;
  color: #000000;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.cyber-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.4), transparent);
  transition: all 0.6s ease;
}

.cyber-button:hover::before {
  left: 100%;
}

.cyber-button:hover {
  background: rgba(0, 0, 0, 0.1);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
}

.cyber-button.loading {
  opacity: 0.8;
  pointer-events: none;
}

.cyber-button.small {
  height: 40px;
  font-size: 0.85rem;
  width: auto;
  padding: 0 20px;
}

.cyber-button-text {
  position: relative;
  z-index: 1;
}

.login-link {
  text-align: center;
  margin-top: 2rem;
  color: #333333;
}

.cyber-link {
  color: #000000;
  margin-left: 0.5rem;
  cursor: pointer;
  position: relative;
  text-decoration: none;
  transition: all 0.3s ease;
}

.cyber-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: #000000;
  transition: width 0.3s ease;
}

.cyber-link:hover {
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
}

.cyber-link:hover::after {
  width: 100%;
}

/* 协议弹窗样式 */
:deep(.cyber-dialog .el-dialog) {
  background: #ffffff;
  border: 1px solid #000000;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

:deep(.cyber-dialog .el-dialog__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  color: #000000;
  text-shadow: none;
  padding: 20px;
}

:deep(.cyber-dialog .el-dialog__title) {
  color: #000000;
  font-weight: 600;
}

:deep(.cyber-dialog .el-dialog__body) {
  color: #000000;
  padding: 30px;
}

:deep(.cyber-dialog .el-dialog__footer) {
  border-top: 1px solid rgba(0, 0, 0, 0.3);
  padding: 15px;
}

.protocol-content {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.protocol-content::-webkit-scrollbar {
  width: 5px;
}

.protocol-content::-webkit-scrollbar-track {
  background: rgba(245, 245, 245, 0.8);
}

.protocol-content::-webkit-scrollbar-thumb {
  background: #666666;
  border-radius: 10px;
}

@media (max-width: 768px) {
  .glitch-text {
    font-size: 1.8rem;
  }
  
  .register-card {
    padding: 30px 20px;
  }
  
  .verification-input-group {
    flex-direction: column;
  }
  
  .verify-button {
    height: 40px;
    width: 100%;
  }
}

:global(.key-alert-dialog) {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  
  .el-message-box__title {
    color: #000000;
  }
  
  .el-message-box__content {
    color: #000000;
    
    code {
      display: block;
      padding: 10px;
      background: rgba(245, 245, 245, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      color: #000000;
      font-family: monospace;
    }
    
    strong {
      color: #000000;
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
</style>