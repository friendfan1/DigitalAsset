<template>
  <div class="login-container">
    <!-- 动态二进制背景 -->
    <div class="binary-background">
      <div v-for="i in 80" :key="i" class="binary-bit" :style="{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`
      }">{{ Math.round(Math.random()) }}</div>
    </div>
    
    <div class="login-content">
      <div class="glitch-container">
        <h1 class="glitch-text" data-text="数字资产系统登录">数字资产系统登录</h1>
      </div>
      
      <div class="card-container">
        <el-card class="login-card">
          <div class="form-container">
            <el-form 
              ref="loginFormRef"
              :model="loginForm"
              :rules="rules"
              label-position="top"
              @submit.prevent
            >
              <!-- 用户名/邮箱字段 -->
              <el-form-item prop="username">
                <template #label>
                  <div class="neon-label">公司名称</div>
                </template>
                <el-input 
                  v-model="loginForm.username"
                  placeholder="请输入注册的公司名称或邮箱"
                  clearable
                  @blur="handleAccountBlur"
                >
                  <template #prefix>
                    <el-icon class="input-icon"><UserFilled /></el-icon>
                  </template>
                </el-input>
              </el-form-item>

              <!-- 密码字段 -->
              <el-form-item prop="password">
                <template #label>
                  <div class="neon-label">密码</div>
                </template>
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  show-password
                  placeholder="请输入登录密码"
                  clearable
                >
                  <template #prefix>
                    <el-icon class="input-icon"><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item>
                <el-checkbox v-model="loginForm.isAdmin" class="cyber-checkbox">
                  管理员账户登录
                </el-checkbox>
              </el-form-item>

              <!-- 登录按钮 -->
              <div class="button-container">
                <button 
                  class="cyber-button"
                  :class="{ 'loading': isLoading }"
                  @click="handleLogin"
                >
                  <span class="cyber-button-text">{{ isLoading ? '登录中...' : '登录系统' }}</span>
                  <span class="cyber-button-glitch"></span>
                </button>
              </div>
              
              <!-- 注册链接 -->
              <div class="register-link">
                <span>没有账号？</span>
                <a @click="handleBackRegister" class="cyber-link">立即注册</a>
              </div>
            </el-form>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { UserFilled, Lock } from '@element-plus/icons-vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()

onMounted(() => {
  // 重置表单
  userStore.initialize()
})

// 表单数据
const loginForm = ref({
  username: '',
  password: '',
  isAdmin: false
})

// 状态管理
const isLoading = ref(false)
const isCheckingAccount = ref(false)

// 动态验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度需在8到20位之间', trigger: 'blur' }
  ]
}

// 处理账户失焦验证
const handleAccountBlur = async () => {
  if (!loginForm.value.username) return
  try {
    isCheckingAccount.value = true
    await loginFormRef.value?.validateField('username')
  } catch (error) {
    console.log('账户验证未通过')
  } finally {
    isCheckingAccount.value = false
  }
}

// 登录逻辑
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    isLoading.value = true

    // 表单验证
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    const { data } = await axios.post('/api/public/login', {
      account: loginForm.value.username,
      password: loginForm.value.password,
      isAdmin: loginForm.value.isAdmin
    })
    if (data.success) {
      userStore.setAuthData(data.userInfo)
      ElMessage.success({
        message: '登录成功',
        duration: 1000
      })
      router.push('/')
    }
  } catch (error: any) {
    ElMessage.error({
      message: error.response?.data?.message || error.message || '登录失败',
      duration: 3000
    })
  } finally {
    isLoading.value = false
  }
}

// 其他操作
const handleBackRegister = () => router.push('/register')
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #0a192f;
  color: #e6f1ff;
  overflow: hidden;
  position: relative;
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
  color: #64ffda;
  animation: fadeInOut 8s infinite;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.login-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  z-index: 1;
  padding: 2rem;
}

.glitch-container {
  margin-bottom: 2rem;
  text-align: center;
}

.glitch-text {
  font-size: 2.5rem;
  font-weight: 800;
  color: #ccd6f6;
  position: relative;
  text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75),
              -0.025em -0.05em 0 rgba(0, 255, 0, 0.75),
              0.025em 0.05em 0 rgba(0, 0, 255, 0.75);
  animation: glitch 2s infinite;
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
  text-shadow: -2px 0 #ff00c1;
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim 5s infinite linear alternate-reverse;
}

.glitch-text::after {
  left: -2px;
  text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
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
  max-width: 500px;
  margin: 0 auto;
  perspective: 1000px;
}

.login-card {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(100, 255, 218, 0.3);
  background: rgba(10, 25, 47, 0.8);
  padding: 40px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 30px rgba(100, 255, 218, 0.2);
  transform-style: preserve-3d;
  backdrop-filter: blur(10px);
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(100, 255, 218, 0.3);
}

.form-container {
  margin-top: 1rem;
}

.neon-label {
  color: #64ffda;
  font-weight: 600;
  text-shadow: 0 0 5px rgba(100, 255, 218, 0.5);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.input-icon {
  color: #64ffda;
}

:deep(.el-input__wrapper) {
  background: rgba(15, 34, 58, 0.8);
  border: 1px solid rgba(100, 255, 218, 0.2);
  box-shadow: none;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(100, 255, 218, 0.5);
  border-color: #64ffda;
}

:deep(.el-input__inner) {
  color: #e6f1ff;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #64ffda;
  border-color: #64ffda;
}

:deep(.el-checkbox__label) {
  color: #a8b2d1;
}

.cyber-checkbox {
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
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
  border: 2px solid #64ffda;
  color: #64ffda;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(100, 255, 218, 0.3);
}

.cyber-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(100, 255, 218, 0.4), transparent);
  transition: all 0.6s ease;
}

.cyber-button:hover::before {
  left: 100%;
}

.cyber-button:hover {
  background: rgba(100, 255, 218, 0.1);
  box-shadow: 0 0 20px rgba(100, 255, 218, 0.5);
  transform: translateY(-2px);
}

.cyber-button.loading {
  opacity: 0.8;
  pointer-events: none;
}

.cyber-button-text {
  position: relative;
  z-index: 1;
}

.register-link {
  text-align: center;
  margin-top: 2rem;
  color: #a8b2d1;
}

.cyber-link {
  color: #64ffda;
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
  background: #64ffda;
  transition: width 0.3s ease;
}

.cyber-link:hover {
  text-shadow: 0 0 8px rgba(100, 255, 218, 0.8);
}

.cyber-link:hover::after {
  width: 100%;
}

@media (max-width: 768px) {
  .glitch-text {
    font-size: 1.8rem;
  }
  
  .login-card {
    padding: 30px 20px;
  }
}
</style>