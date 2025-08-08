<template>
  <div class="login-section">
    <div class="lottery-info">
      <div class="lottery-title">🎟️ 抽獎規則</div>
      <div class="lottery-desc">每{{ pointsPerTicket }}分可兌換1張抽獎券</div>
    </div>
    
    <!-- 動態登入按鈕 -->
    <div class="login-providers">
      <!-- Google 登入 (預設) -->
      <button 
        class="btn login-btn btn-google"
        style="background-color: #4285f4; color: #ffffff; border-color: #4285f4"
        @click="handleProviderLogin('google')"
        :disabled="authStore.loading"
      >
        <span class="provider-icon">🔍</span>
        <span class="provider-text">
          {{ authStore.loading ? '登入中...' : 'Google 登入' }}
        </span>
      </button>
      
      <!-- Facebook 登入 (如果啟用) -->
      <button 
        v-if="enableFacebook"
        class="btn login-btn btn-facebook"
        style="background-color: #1877f2; color: #ffffff; border-color: #1877f2"
        @click="handleProviderLogin('facebook')"
        :disabled="authStore.loading"
      >
        <span class="provider-icon">📘</span>
        <span class="provider-text">
          {{ authStore.loading ? '登入中...' : 'Facebook 登入' }}
        </span>
      </button>
      
      <!-- GitHub 登入 (如果啟用) -->
      <button 
        v-if="enableGithub"
        class="btn login-btn btn-github"
        style="background-color: #333333; color: #ffffff; border-color: #333333"
        @click="handleProviderLogin('github')"
        :disabled="authStore.loading"
      >
        <span class="provider-icon">🐱</span>
        <span class="provider-text">
          {{ authStore.loading ? '登入中...' : 'GitHub 登入' }}
        </span>
      </button>
      
      <!-- Twitter 登入 (如果啟用) -->
      <button 
        v-if="enableTwitter"
        class="btn login-btn btn-twitter"
        style="background-color: #1da1f2; color: #ffffff; border-color: #1da1f2"
        @click="handleProviderLogin('twitter')"
        :disabled="authStore.loading"
      >
        <span class="provider-icon">🐦</span>
        <span class="provider-text">
          {{ authStore.loading ? '登入中...' : 'Twitter 登入' }}
        </span>
      </button>
    </div>
    
    <!-- 登入狀態提示 -->
    <div v-if="authStore.loading" class="login-status">
      <div class="loading-spinner"></div>
      <p>正在登入，請稍候...</p>
    </div>
    
    <!-- 開發者模式資訊 -->
    <div v-if="isDevelopmentMode" class="dev-info">
      <small>
        🛠️ 開發模式 | 
        Facebook: {{ enableFacebook ? '✅' : '❌' }} | 
        GitHub: {{ enableGithub ? '✅' : '❌' }} | 
        Twitter: {{ enableTwitter ? '✅' : '❌' }}
      </small>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useClimbingStore } from '../stores/climbing.js'

const authStore = useAuthStore()
const climbingStore = useClimbingStore()

const pointsPerTicket = computed(() => climbingStore.POINTS_PER_TICKET)

onMounted(async () => {
  await climbingStore.initializeConfig()
})

// 檢查是否為開發模式
const isDevelopmentMode = computed(() => import.meta.env.DEV)

// 檢查環境變數來決定啟用哪些登入方式
const enableFacebook = computed(() => import.meta.env.VITE_ENABLE_FACEBOOK_AUTH === 'true')
const enableGithub = computed(() => import.meta.env.VITE_ENABLE_GITHUB_AUTH === 'true')
const enableTwitter = computed(() => import.meta.env.VITE_ENABLE_TWITTER_AUTH === 'true')

// 處理任何提供商的登入
const handleProviderLogin = async (providerId) => {
  try {
    console.log(`嘗試使用 ${providerId} 登入`)
    await authStore.signInWithProvider(providerId)
  } catch (error) {
    console.error('登入錯誤:', error)
    alert(error.message || '登入失敗，請再試一次')
  }
}
</script>

<style scoped>
.login-section {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.lottery-info {
  background: linear-gradient(45deg, #FF6B35, #F7931E);
  color: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  text-align: center;
}

.lottery-title {
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 5px;
}

.lottery-desc {
  font-size: 0.9em;
  opacity: 0.9;
}

/* 載入狀態 */
.loading-providers {
  padding: 20px;
  text-align: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 錯誤狀態 */
.error-state {
  padding: 20px;
  text-align: center;
  color: #dc3545;
}

.btn-retry {
  background: #dc3545 !important;
  color: white !important;
  margin-top: 10px;
}

/* 登入提供商容器 */
.login-providers {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 動態登入按鈕 */
.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 15px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1em;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.provider-icon {
  font-size: 1.2em;
  min-width: 20px;
}

.provider-text {
  font-weight: 600;
}

/* 各種提供商的特殊樣式 */
.btn-google:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(66, 133, 244, 0.3);
}

.btn-facebook:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(24, 119, 242, 0.3);
}

.btn-github:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(51, 51, 51, 0.3);
}

.btn-twitter:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(29, 161, 242, 0.3);
}

.btn-microsoft:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(0, 161, 241, 0.3);
}

.btn-apple:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.btn-yahoo:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(96, 1, 210, 0.3);
}

/* 預設登入按鈕 */
.btn-default {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

/* 登入狀態提示 */
.login-status {
  padding: 15px;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 15px;
  color: #666;
}

/* 開發者模式樣式 */
.dev-mode {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: left;
}

.dev-mode details {
  cursor: pointer;
}

.dev-mode summary {
  font-weight: bold;
  color: #667eea;
  margin-bottom: 10px;
}

.dev-controls h4 {
  color: #333;
  margin-bottom: 10px;
  font-size: 0.9em;
}

.provider-toggles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.provider-toggles label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85em;
  color: #666;
  cursor: pointer;
}

.provider-toggles input[type="checkbox"] {
  width: auto;
  margin: 0;
}

/* 響應式設計 */
@media (max-width: 480px) {
  .login-section {
    padding: 15px;
  }
  
  .login-btn {
    padding: 12px 15px;
    font-size: 0.95em;
  }
  
  .provider-toggles {
    grid-template-columns: 1fr;
  }
}

/* 載入動畫 */
.login-btn:disabled .provider-text {
  position: relative;
}

.login-btn:disabled .provider-text::after {
  content: '';
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
</style>