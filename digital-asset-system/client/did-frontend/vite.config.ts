import { fileURLToPath, URL } from 'node:url'
import fs from 'fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // host: '0.0.0.0', // 新增此行，允许外部访问
    port: 5173,      // 默认端口（若冲突可自定义）
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        //rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    // https: {
    //   key: fs.readFileSync('./192.168.31.91-key.pem'),
    //   cert: fs.readFileSync('./192.168.31.91.pem')
    // }
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // optimizeDeps: {
  //   exclude: ['openpgp'] // 防止 Vite 破坏 crypto 检测逻辑
  // }
})


