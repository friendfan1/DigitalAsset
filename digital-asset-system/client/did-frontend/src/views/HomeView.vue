<template>
  <div class="digital-asset-system">
    <!-- 动态二进制背景 -->
    <div class="binary-background">
      <div v-for="i in 100" :key="i" class="binary-bit" :style="{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`
      }">{{ Math.round(Math.random()) }}</div>
    </div>

    <!-- 英雄区块 -->
    <section class="hero-section">
      <div class="glitch-container">
        <h1 class="glitch-text" data-text="区块链数字资产存证系统">区块链数字资产存证系统</h1>
      </div>
      <div class="hero-subtitle">
        <p class="subtitle typewriter">打造安全、透明、高效的数字资产管理平台</p>
      </div>
      <div class="hero-cta">
        <router-link v-if="userStore.profile?.role === 'user'" to="/access" class="cta-button">
          <span class="button-text">开始使用</span>
          <span class="button-icon">→</span>
        </router-link>
        <router-link v-else to="/verify" class="cta-button">
          <span class="button-text">开始使用</span>
          <span class="button-icon">→</span>
        </router-link>
      </div>
    </section>

    <!-- 3D旋转立方体特性展示 -->
    <section class="features-section">
      <h2 class="section-title">系统特性</h2>
      <div class="cube-container">
        <div class="cube" :style="{ transform: `rotateY(${cubeRotation}deg)` }">
          <div class="cube-face front">
            <div class="feature-content">
              <i class="fas fa-shield-alt feature-icon"></i>
              <h3>安全可信</h3>
              <p>基于区块链技术，确保数据不可篡改和永久存储</p>
            </div>
          </div>
          <div class="cube-face back">
            <div class="feature-content">
              <i class="fas fa-sync feature-icon"></i>
              <h3>实时同步</h3>
              <p>资产信息实时上链，保证数据同步及时性</p>
            </div>
          </div>
          <div class="cube-face right">
            <div class="feature-content">
              <i class="fas fa-search feature-icon"></i>
              <h3>透明可查</h3>
              <p>完整的存证记录，支持全流程追溯</p>
            </div>
          </div>
          <div class="cube-face left">
            <div class="feature-content">
              <i class="fas fa-bolt feature-icon"></i>
              <h3>高效便捷</h3>
              <p>智能合约自动化执行，提高业务处理效率</p>
            </div>
          </div>
        </div>
      </div>
      <div class="cube-controls">
        <button @click="rotateCube(-90)" class="cube-control-button">← 上一个</button>
        <button @click="rotateCube(90)" class="cube-control-button">下一个 →</button>
      </div>
    </section>

    <!-- 动态数据展示 -->
    <section class="stats-section">
      <h2 class="section-title">平台数据</h2>
      <div class="stats-container">
        <div class="stat-card" v-for="(stat, index) in stats" :key="index">
          <svg class="stat-svg" viewBox="0 0 100 100">
            <circle class="stat-circle-bg" cx="50" cy="50" r="45"></circle>
            <circle class="stat-circle" cx="50" cy="50" r="45" 
                   :style="{strokeDashoffset: `${(100 - stat.percentage) * 2.8}`}"></circle>
          </svg>
          <div class="stat-content">
            <div class="stat-number">
              <count-up :end-val="stat.value" :duration="2.5" />
              <span v-if="stat.suffix">{{ stat.suffix }}</span>
            </div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 区块链视觉化区块 -->
    <section class="blockchain-visualization">
      <h2 class="section-title">区块链技术</h2>
      <div class="blocks-container">
        <div v-for="i in 5" :key="i" class="block" 
            :class="{ 'active-block': activeBlock === i }"
            @mouseenter="activeBlock = i">
          <div class="block-header">
            <span class="block-number">#{{ 1000000 + i }}</span>
            <span class="block-hash">{{ generateShortHash() }}</span>
          </div>
          <div class="block-content">
            <div class="transaction" v-for="j in 3" :key="j">
              <span class="transaction-id">TX-{{ generateShortHash() }}</span>
            </div>
          </div>
          <div class="block-footer">
            <span class="block-timestamp">{{ generateTimestamp() }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CountUp from 'vue-countup-v3'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 3D立方体旋转控制
const cubeRotation = ref(0)
const rotateCube = (degrees: number) => {
  cubeRotation.value += degrees
}

// 自动旋转定时器
let rotationInterval: number | null = null

onMounted(() => {
  rotationInterval = window.setInterval(() => {
    cubeRotation.value += 90
  }, 5000) as unknown as number
})

onUnmounted(() => {
  if (rotationInterval) {
    clearInterval(rotationInterval)
  }
})

// 区块链可视化
const activeBlock = ref(1)
const generateShortHash = () => {
  return '0x' + Math.random().toString(16).substring(2, 10)
}
const generateTimestamp = () => {
  const date = new Date()
  date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 60))
  return date.toLocaleTimeString()
}

// 统计数据
const stats = ref([
  { value: 10000, label: '已存证资产数', percentage: 80, suffix: '' },
  { value: 5000, label: '注册用户数', percentage: 65, suffix: '' },
  { value: 99.99, label: '系统可用性', percentage: 99.99, suffix: '%' }
])
</script>

<style scoped>
/* 基础样式 - 同时适配屏幕和打印 */
.digital-asset-system {
  position: relative;
  min-height: 100vh;
  background: #f8f9fa; /* 浅灰色背景 */
  color: #2d3436;      /* 深灰色文字 */
  overflow: hidden;
  padding-bottom: 4rem;
}

/* 动态二进制背景（打印时隐藏） */
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
  color: rgba(0, 0, 0, 0.08); /* 极浅黑色 */
  animation: fadeInOut 8s infinite;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

/* 英雄区块 */
.hero-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 90vh;
  position: relative;
  z-index: 1;
  padding: 2rem;
}

.glitch-container {
  position: relative;
  margin-bottom: 2rem;
}

/* 故障文字效果（打印时转为普通文字） */
.glitch-text {
  font-size: 3.5rem;
  font-weight: 800;
  color: #2d3436;
  position: relative;
  text-shadow: 
    0.05em 0 0 rgba(0, 0, 0, 0.15),
    -0.025em -0.05em 0 rgba(0, 0, 0, 0.15),
    0.025em 0.05em 0 rgba(0, 0, 0, 0.15);
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
  text-shadow: -2px 0 rgba(0, 0, 0, 0.2);
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim 5s infinite linear alternate-reverse;
}

.glitch-text::after {
  left: -2px;
  text-shadow: -2px 0 rgba(0, 0, 0, 0.2), 2px 2px rgba(0, 0, 0, 0.2);
  animation: glitch-anim2 1s infinite linear alternate-reverse;
}

/* 打字机效果副标题 */
.hero-subtitle {
  margin-bottom: 3rem;
}

.subtitle {
  font-size: 1.5rem;
  color: #636e72; /* 中灰色 */
  overflow: hidden;
  white-space: nowrap;
  border-right: 0.15em solid #636e72;
  margin: 0 auto;
  letter-spacing: 0.15em;
  animation: typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite;
}

@keyframes typing {
  from { width: 0 }
  to { width: 100% }
}

@keyframes blink-caret {
  from, to { border-color: transparent }
  50% { border-color: #636e72 }
}

/* CTA按钮 */
.hero-cta {
  margin-top: 2rem;
}

.cta-button {
  display: inline-block;
  background-color: transparent;
  color: #2d3436;
  border: 1px solid #2d3436;
  border-radius: 4px;
  padding: 1rem 2.5rem;
  font-size: 1.25rem;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.cta-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(45, 52, 54, 0.1);
  transition: all 0.5s ease;
  z-index: -1;
}

.cta-button:hover {
  color: #f8f9fa;
  background-color: #2d3436;
}

/* 3D立方体特性 */
.features-section {
  padding: 6rem 2rem;
  position: relative;
  z-index: 1;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: #2d3436;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, transparent, #636e72, transparent);
}

.cube-container {
  perspective: 1000px;
  width: 300px;
  height: 300px;
  margin: 0 auto;
}

.cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(10deg);
  transition: transform 1s ease;
}

.cube-face {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 249, 250, 0.9);
  border: 2px solid #636e72;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  backface-visibility: visible;
  text-align: center;
  padding: 20px;
}

/* 立方体各面定位 */
.cube-face.front { transform: translateZ(150px); }
.cube-face.back { transform: rotateY(180deg) translateZ(150px); }
.cube-face.right { transform: rotateY(90deg) translateZ(150px); }
.cube-face.left { transform: rotateY(-90deg) translateZ(150px); }

.feature-icon {
  font-size: 3rem;
  color: #636e72;
  margin-bottom: 1rem;
}

.feature-content h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2d3436;
}

.feature-content p {
  font-size: 1rem;
  color: #636e72;
}

/* 统计卡片 */
.stats-section {
  padding: 6rem 2rem;
  position: relative;
  z-index: 1;
}

.stats-container {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 3rem;
  margin-top: 3rem;
}

.stat-card {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.stat-svg {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.stat-circle-bg {
  fill: none;
  stroke: rgba(99, 110, 114, 0.1);
  stroke-width: 8;
}

.stat-circle {
  fill: none;
  stroke: #636e72;
  stroke-width: 8;
  stroke-dasharray: 283;
  stroke-linecap: round;
  transition: stroke-dashoffset 2s ease;
}

.stat-content {
  position: relative;
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3436;
}

/* 区块链区块 */
.blockchain-visualization {
  padding: 6rem 2rem;
  position: relative;
  z-index: 1;
}

.blocks-container {
  display: flex;
  overflow-x: auto;
  padding: 2rem 0;
  gap: 1.5rem;
  margin: 0 auto;
  max-width: 1200px;
}

.block {
  min-width: 250px;
  background: rgba(248, 249, 250, 0.9);
  border: 1px solid #adb5bd;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.active-block {
  transform: scale(1.05);
  border-color: #2d3436;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.block-header {
  border-bottom: 1px solid #dee2e6;
}

.block-number {
  color: #2d3436;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .glitch-text { font-size: 2rem; }
  .subtitle { font-size: 1.2rem; }
  .cube-container { width: 250px; height: 250px; }
}

/* 打印专用样式 */
@media print {
  .digital-asset-system {
    background: #fff !important;
    color: #000 !important;
    padding: 1rem !important;
  }

  /* 隐藏非必要元素 */
  .binary-background,
  .cube-controls,
  .cta-button::before,
  .stat-svg,
  .feature-icon {
    display: none !important;
  }

  /* 文字优化 */
  .glitch-text {
    text-shadow: none !important;
    animation: none !important;
    color: #000 !important;
  }

  /* 布局调整 */
  .cube {
    transform: none !important;
    position: static !important;
  }

  .cube-face {
    position: static !important;
    transform: none !important;
    border: 1px solid #000 !important;
    margin: 1rem 0;
    page-break-inside: avoid;
  }

  /* 数据可视化优化 */
  .stat-card {
    width: auto !important;
    height: auto !important;
    flex-direction: row;
    gap: 1rem;
  }

  .stat-content {
    text-align: left;
  }

  /* 区块布局优化 */
  .blocks-container {
    flex-direction: column;
  }

  .block {
    min-width: auto !important;
    margin-bottom: 1rem;
    break-inside: avoid;
  }

  /* 按钮优化 */
  .cta-button {
    border: 2px solid #000 !important;
    color: #000 !important;
    background: transparent !important;
  }
}
</style>