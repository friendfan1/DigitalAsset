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
        <router-link to="/access" class="cta-button">
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
.digital-asset-system {
  position: relative;
  min-height: 100vh;
  background: #0a192f;
  color: #e6f1ff;
  overflow: hidden;
  padding-bottom: 4rem;
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

.glitch-text {
  font-size: 3.5rem;
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
  30% { clip: rect(72px, 9999px, 47px, 0); }
  35% { clip: rect(27px, 9999px, 26px, 0); }
  40% { clip: rect(65px, 9999px, 49px, 0); }
  45% { clip: rect(23px, 9999px, 17px, 0); }
  50% { clip: rect(58px, 9999px, 74px, 0); }
  55% { clip: rect(34px, 9999px, 35px, 0); }
  60% { clip: rect(57px, 9999px, 88px, 0); }
  65% { clip: rect(30px, 9999px, 16px, 0); }
  70% { clip: rect(84px, 9999px, 74px, 0); }
  75% { clip: rect(69px, 9999px, 98px, 0); }
  80% { clip: rect(36px, 9999px, 17px, 0); }
  85% { clip: rect(82px, 9999px, 95px, 0); }
  90% { clip: rect(61px, 9999px, 90px, 0); }
  95% { clip: rect(42px, 9999px, 23px, 0); }
  100% { clip: rect(12px, 9999px, 46px, 0); }
}

.hero-subtitle {
  margin-bottom: 3rem;
}

.subtitle {
  font-size: 1.5rem;
  color: #8892b0;
  overflow: hidden;
  white-space: nowrap;
  border-right: 0.15em solid #64ffda;
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
  50% { border-color: #64ffda }
}

.hero-cta {
  margin-top: 2rem;
}

.cta-button {
  display: inline-block;
  background-color: transparent;
  color: #64ffda;
  border: 1px solid #64ffda;
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
  background: rgba(100, 255, 218, 0.1);
  transition: all 0.5s ease;
  z-index: -1;
}

.cta-button:hover {
  color: #0a192f;
  background-color: #64ffda;
}

.cta-button:hover::before {
  left: 0;
}

.button-text, .button-icon {
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.cta-button:hover .button-icon {
  transform: translateX(5px);
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
  color: #ccd6f6;
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
  background: linear-gradient(90deg, transparent, #64ffda, transparent);
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
  background: rgba(10, 25, 47, 0.8);
  border: 2px solid #64ffda;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(100, 255, 218, 0.3);
  backface-visibility: visible;
  text-align: center;
  padding: 20px;
}

.cube-face.front { transform: translateZ(150px); }
.cube-face.back { transform: rotateY(180deg) translateZ(150px); }
.cube-face.right { transform: rotateY(90deg) translateZ(150px); }
.cube-face.left { transform: rotateY(-90deg) translateZ(150px); }

.feature-content {
  max-width: 90%;
}

.feature-icon {
  font-size: 3rem;
  color: #64ffda;
  margin-bottom: 1rem;
}

.feature-content h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #e6f1ff;
}

.feature-content p {
  font-size: 1rem;
  color: #8892b0;
}

.cube-controls {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  gap: 2rem;
  position: relative;
  z-index: 2;
}

.cube-control-button {
  background: transparent;
  color: #64ffda;
  border: 1px solid #64ffda;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.cube-control-button:hover {
  background: rgba(100, 255, 218, 0.1);
}

/* 统计数据 */
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
  stroke: rgba(100, 255, 218, 0.1);
  stroke-width: 8;
}

.stat-circle {
  fill: none;
  stroke: #64ffda;
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
  color: #e6f1ff;
  display: flex;
  justify-content: center;
  gap: 5px;
}

.stat-number span {
  font-size: 1.5rem;
  align-self: flex-start;
}

.stat-label {
  font-size: 1rem;
  color: #8892b0;
  margin-top: 0.5rem;
}

/* 区块链可视化 */
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
  justify-content: center;
  flex-wrap: wrap;
}

.block {
  min-width: 250px;
  background: rgba(10, 25, 47, 0.8);
  border: 1px solid #233554;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
  transform-origin: center;
  position: relative;
}

.block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, #64ffda, #0a192f);
  z-index: -1;
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.block::after {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  background: linear-gradient(45deg, #64ffda, #0a192f);
  z-index: -2;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: blur(10px);
}

.active-block {
  transform: scale(1.05) translateY(-10px);
  box-shadow: 0 10px 30px rgba(100, 255, 218, 0.2);
  border-color: #64ffda;
}

.active-block::before,
.active-block::after {
  opacity: 0.3;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #233554;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.block-number {
  font-weight: bold;
  color: #64ffda;
}

.block-hash {
  font-family: monospace;
  font-size: 0.8rem;
  color: #8892b0;
}

.block-content {
  min-height: 100px;
}

.transaction {
  padding: 0.5rem;
  border-bottom: 1px dashed #233554;
  font-family: monospace;
  font-size: 0.8rem;
  color: #ccd6f6;
}

.block-footer {
  margin-top: 1rem;
  text-align: right;
  font-size: 0.8rem;
  color: #8892b0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .glitch-text {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1.2rem;
  }
  
  .cube-container {
    width: 250px;
    height: 250px;
  }
  
  .stats-container {
    gap: 2rem;
  }
  
  .stat-card {
    width: 150px;
    height: 150px;
  }
  
  .stat-number {
    font-size: 1.8rem;
  }
  
  .block {
    min-width: 200px;
  }
}
</style>
