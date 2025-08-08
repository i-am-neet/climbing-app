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
          <span class="route-grade">{{ route.grade }}</span>
          <span class="route-points">+{{ route.totalPoints }}分</span>
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