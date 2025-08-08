<template>
  <div class="container">
    <AppHeader />
    
    <LoginSection v-if="!authStore.isAuthenticated" />
    
    <template v-else>
      <UserInfo />
      <MainContent />
    </template>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { useAuthStore } from './stores/auth.js'
import { useClimbingStore } from './stores/climbing.js'
import { auth } from './firebase.js'

import AppHeader from './components/AppHeader.vue'
import LoginSection from './components/LoginSection.vue'
import UserInfo from './components/UserInfo.vue'
import MainContent from './components/MainContent.vue'

const authStore = useAuthStore()
const climbingStore = useClimbingStore()

onMounted(() => {
  // 監聽身份驗證狀態變化
  onAuthStateChanged(auth, async (user) => {
    authStore.setUser(user)
    if (user) {
      await climbingStore.loadUserData()
    }
  })
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 10px;
}

.container {
  max-width: 500px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  overflow: hidden;
}

.btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(45deg, #28a745, #20c997);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
}

.btn:active {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: linear-gradient(45deg, #6c757d, #495057);
}

.btn-secondary:hover {
  box-shadow: 0 5px 15px rgba(108, 117, 125, 0.4);
}

.btn-google {
  background: #4285f4;
}

.btn-google:hover {
  background: #3367d6;
  box-shadow: 0 5px 15px rgba(66, 133, 244, 0.4);
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

input, select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1em;
  transition: border-color 0.3s;
}

input:focus, select:focus {
  outline: none;
  border-color: #667eea;
}

.section-title {
  font-size: 1.2em;
  margin-bottom: 15px;
  color: #333;
  border-left: 4px solid #FF6B35;
  padding-left: 10px;
}

.hidden {
  display: none;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

@media (max-width: 480px) {
  .container {
    margin: 0 5px;
  }
}
</style>