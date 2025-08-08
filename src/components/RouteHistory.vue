<template>
  <div class="route-history">
    <h3>🧗‍♂️ 我的路線記錄</h3>
    <div class="route-list">
      <div v-if="sortedRoutes.length === 0" class="empty-state">
        還沒有路線記錄
      </div>
      <div 
        v-for="route in sortedRoutes" 
        :key="route.id"
        class="route-item"
      >
        <div class="route-header">
          <div class="route-info">
            <span class="route-grade">{{ route.grade }}</span>
            <span class="route-points">+{{ route.totalPoints }}分</span>
          </div>
          <button 
            class="delete-btn"
            @click="confirmDelete(route)"
            title="刪除記錄"
          >
            🗑️
          </button>
        </div>
        <div class="route-name">{{ route.routeName }}</div>
        <div class="route-time">
          {{ formatDate(route.timestamp) }}
        </div>
        <div 
          v-if="route.extraDetails && route.extraDetails.length > 0"
          class="extra-details"
        >
          額外積分: {{ route.extraDetails.join(', ') }}
        </div>
        <div v-if="route.photoURL" class="route-photo">
          <img 
            :src="route.photoURL" 
            alt="路線照片" 
            @click="openImage(route.photoURL)"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useClimbingStore } from '../stores/climbing.js'

const climbingStore = useClimbingStore()

const sortedRoutes = computed(() => {
  return [...climbingStore.userStats.routes]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-TW')
}

const openImage = (url) => {
  window.open(url, '_blank')
}

const confirmDelete = (route) => {
  const confirmed = confirm(`確定要刪除這筆記錄嗎？\n\n等級：${route.grade}\n路線：${route.routeName}\n積分：+${route.totalPoints}分\n時間：${formatDate(route.timestamp)}\n\n※ 此操作無法復原`)
  
  if (confirmed) {
    deleteRoute(route)
  }
}

const deleteRoute = async (route) => {
  try {
    await climbingStore.deleteRoute(route.id)
    alert('記錄已刪除')
  } catch (error) {
    console.error('刪除失敗:', error)
    alert('刪除失敗，請再試一次')
  }
}
</script>

<style scoped>
.route-history {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.route-history h3 {
  text-align: center;
  margin-bottom: 15px;
  color: #333;
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 20px;
}

.route-item {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  border-left: 4px solid #667eea;
}

.route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.route-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 1.1em;
}

.delete-btn:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

.delete-btn:active {
  background-color: rgba(220, 53, 69, 0.2);
}

.route-grade {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.route-points {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.route-name {
  font-size: 0.9em;
  color: #666;
  margin-top: 3px;
}

.route-time {
  font-size: 0.8em;
  color: #999;
  margin-top: 3px;
}

.extra-details {
  font-size: 0.8em;
  color: #666;
  margin-top: 5px;
}

.route-photo {
  margin-top: 8px;
  border-radius: 6px;
  overflow: hidden;
  max-width: 150px;
}

.route-photo img {
  width: 100%;
  height: auto;
  cursor: pointer;
}
</style>