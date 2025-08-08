<template>
  <div class="main-content">
    <StatsSection />
    <RouteForm />
    <RouteHistory v-show="showRouteHistory" />
    <Leaderboard v-show="showLeaderboard" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { provide } from 'vue'

import StatsSection from './StatsSection.vue'
import RouteForm from './RouteForm.vue'
import RouteHistory from './RouteHistory.vue'
import Leaderboard from './Leaderboard.vue'

// 控制顯示狀態
const showRouteHistory = ref(false)
const showLeaderboard = ref(false)

const toggleRouteHistory = () => {
  showRouteHistory.value = !showRouteHistory.value
  showLeaderboard.value = false
}

const toggleLeaderboard = () => {
  showLeaderboard.value = !showLeaderboard.value
  showRouteHistory.value = false
}

// 提供給子組件使用
provide('toggleRouteHistory', toggleRouteHistory)
provide('toggleLeaderboard', toggleLeaderboard)
</script>

<style scoped>
.main-content {
  /* 主要內容無需特殊樣式 */
}
</style>