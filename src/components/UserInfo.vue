<template>
  <div class="user-info">
    <div class="user-avatar">
      <img v-if="authStore.userPhotoURL" :src="authStore.userPhotoURL" :alt="authStore.userDisplayName">
      <span v-else>{{ authStore.userInitial }}</span>
    </div>
    <div class="user-details">
      <div class="user-name">{{ authStore.userDisplayName }}</div>
      <div class="user-stats">
        積分: {{ climbingStore.userStats.points }} | 
        抽獎券: {{ climbingStore.userTickets }}
      </div>
    </div>
    <button class="logout-btn" @click="handleLogout">
      登出
    </button>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth.js'
import { useClimbingStore } from '../stores/climbing.js'

const authStore = useAuthStore()
const climbingStore = useClimbingStore()

const handleLogout = async () => {
  try {
    await authStore.logout()
  } catch (error) {
    console.error('登出失敗:', error)
  }
}
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: bold;
  color: #333;
}

.user-stats {
  font-size: 0.9em;
  color: #666;
}

.logout-btn {
  padding: 5px 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
}
</style>