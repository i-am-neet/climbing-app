<template>
  <div class="leaderboard">
    <h3>🏆 積分排行榜</h3>
    <div class="member-list">
      <div v-if="leaderboard.length === 0" class="empty-state">
        還沒有積分記錄
      </div>
      <div 
        v-for="(user, index) in leaderboard" 
        :key="user.email"
        class="member-item"
        :class="{ 'current-user': isCurrentUser(user) }"
      >
        <div class="member-content">
          <div class="member-info">
            <div class="member-name">
              {{ getRankDisplay(index) }} 
              {{ user.name || '使用者' }}
              {{ isCurrentUser(user) ? ' (你)' : '' }}
            </div>
            <div class="member-routes">
              路線數: {{ user.routes ? user.routes.length : 0 }}
            </div>
          </div>
          <div class="member-stats">
            <div class="member-points">{{ user.points }}分</div>
            <div class="member-tickets">{{ getTickets(user.points) }}券</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useClimbingStore } from '../stores/climbing.js'

const authStore = useAuthStore()
const climbingStore = useClimbingStore()

const leaderboard = computed(() => climbingStore.leaderboard)

const isCurrentUser = (user) => {
  return authStore.user && user.email === authStore.user.email
}

const getRankDisplay = (index) => {
  const medals = ['🥇', '🥈', '🥉']
  return index < 3 ? medals[index] : `#${index + 1}`
}

const getTickets = (points) => {
  return Math.floor(points / climbingStore.POINTS_PER_TICKET)
}

onMounted(async () => {
  await climbingStore.loadLeaderboard()
})
</script>

<style scoped>
.leaderboard {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.leaderboard h3 {
  text-align: center;
  margin-bottom: 15px;
  color: #333;
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 20px;
}

.member-item {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  border-left: 4px solid #667eea;
}

.member-item.current-user {
  border-left-color: #FF6B35;
  background: #fff3cd;
}

.member-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 500;
}

.member-routes {
  font-size: 0.8em;
  color: #666;
  margin-top: 2px;
}

.member-stats {
  text-align: right;
  font-size: 0.9em;
}

.member-points {
  background: #667eea;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: bold;
  margin-bottom: 2px;
}

.member-tickets {
  background: #FF6B35;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: bold;
}
</style>