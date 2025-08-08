<template>
  <div class="stats">
    <div class="stat-item">
      <div class="stat-number">{{ climbingStore.globalStats.totalMembers }}</div>
      <div class="stat-label">參與人數</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">{{ climbingStore.globalStats.totalPoints }}</div>
      <div class="stat-label">總積分</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">{{ climbingStore.globalStats.totalTickets }}</div>
      <div class="stat-label">總抽獎券</div>
    </div>
  </div>
</template>

<script setup>
import { useClimbingStore } from '../stores/climbing.js'

const climbingStore = useClimbingStore()
</script>

<style scoped>
.stats {
  display: flex;
  justify-content: space-between;
  background: #f8f9fa;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 1.8em;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  font-size: 0.8em;
  color: #666;
  margin-top: 2px;
}

@media (max-width: 480px) {
  .stats {
    flex-direction: column;
    gap: 10px;
  }
}
</style>