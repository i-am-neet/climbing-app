<template>
  <div class="lottery-wheel">
    <div class="lottery-header">
      <h3>🎯 抽獎轉盤</h3>
      <div class="lottery-info">
        <div class="total-info">
          <span>總抽獎券: {{ totalTickets }}</span>
          <span>參與人數: {{ participantCount }}</span>
        </div>
      </div>
    </div>

    <!-- 轉盤區域 -->
    <div class="wheel-container">
      <div class="wheel-wrapper">
        <canvas 
          ref="wheelCanvas" 
          :width="canvasSize" 
          :height="canvasSize"
          :style="{ transform: `rotate(${rotation}deg)` }"
        ></canvas>
        
        <!-- 指針 -->
        <div class="wheel-pointer"></div>
        
        <!-- 中心按鈕 -->
        <button 
          class="spin-button"
          @click="spin"
          :disabled="isSpinning || participants.length === 0"
        >
          {{ isSpinning ? '抽獎中...' : '開始抽獎' }}
        </button>
      </div>
    </div>

    <!-- 參與者列表 -->
    <div class="participants-section">
      <h4>參與者列表</h4>
      <div v-if="participants.length === 0" class="empty-state">
        目前沒有人有抽獎券
      </div>
      <div v-else class="participants-list">
        <div 
          v-for="participant in participants" 
          :key="participant.userId"
          class="participant-item"
          :class="{ winner: participant.userId === lastWinner }"
        >
          <div class="participant-info">
            <span class="participant-name">{{ participant.name }}</span>
            <span class="participant-tickets">{{ participant.tickets }} 券</span>
          </div>
          <div class="participant-percentage">
            {{ Math.round((participant.tickets / totalTickets) * 100) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 抽獎結果 -->
    <div v-if="lastWinner" class="winner-announcement">
      🎉 恭喜 {{ getWinnerName() }} 中獎！🎉
    </div>

    <!-- 重新整理按鈕 -->
    <button class="btn btn-secondary refresh-btn" @click="refreshData">
      🔄 重新整理資料
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useClimbingStore } from '../stores/climbing.js'

const climbingStore = useClimbingStore()

// 響應式數據
const wheelCanvas = ref(null)
const canvasSize = 300
const rotation = ref(0)
const isSpinning = ref(false)
const lastWinner = ref(null)
const participants = ref([])

// 計算屬性
const totalTickets = computed(() => {
  return participants.value.reduce((sum, p) => sum + p.tickets, 0)
})

const participantCount = computed(() => {
  return participants.value.filter(p => p.tickets > 0).length
})

// 顏色配置
const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
  '#00D2D3', '#FF9F43', '#EE5A24', '#0984e3',
  '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'
]

// 載入參與者資料
const loadParticipants = async () => {
  try {
    await climbingStore.loadGlobalStats()
    
    // 從排行榜取得所有使用者資料
    await climbingStore.loadLeaderboard()
    
    participants.value = climbingStore.leaderboard
      .map(user => ({
        userId: user.email || user.name, // 使用 email 或 name 作為 ID
        name: user.name || user.email || '匿名使用者',
        tickets: Math.floor((user.points || 0) / climbingStore.POINTS_PER_TICKET.value)
      }))
      .filter(p => p.tickets > 0) // 只顯示有抽獎券的人
      .sort((a, b) => b.tickets - a.tickets) // 按抽獎券數量排序
  } catch (error) {
    console.error('載入參與者資料失敗:', error)
  }
}

// 繪製轉盤
const drawWheel = () => {
  const canvas = wheelCanvas.value
  if (!canvas || participants.value.length === 0) return
  
  const ctx = canvas.getContext('2d')
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2
  const radius = canvasSize / 2 - 10
  
  ctx.clearRect(0, 0, canvasSize, canvasSize)
  
  let currentAngle = 0
  
  participants.value.forEach((participant, index) => {
    const sliceAngle = (participant.tickets / totalTickets.value) * 2 * Math.PI
    
    // 繪製扇形
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.lineTo(centerX, centerY)
    ctx.fillStyle = colors[index % colors.length]
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 繪製文字
    const textAngle = currentAngle + sliceAngle / 2
    const textRadius = radius * 0.7
    const textX = centerX + Math.cos(textAngle) * textRadius
    const textY = centerY + Math.sin(textAngle) * textRadius
    
    ctx.save()
    ctx.translate(textX, textY)
    ctx.rotate(textAngle + Math.PI / 2)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(participant.name, 0, 0)
    ctx.fillText(`${participant.tickets}券`, 0, 15)
    ctx.restore()
    
    currentAngle += sliceAngle
  })
}

// 轉盤抽獎
const spin = () => {
  if (isSpinning.value || participants.value.length === 0) return
  
  isSpinning.value = true
  lastWinner.value = null
  
  // 隨機選擇中獎者（基於票券比例）
  const randomNum = Math.random() * totalTickets.value
  let accumulator = 0
  let winnerIndex = 0
  
  for (let i = 0; i < participants.value.length; i++) {
    accumulator += participants.value[i].tickets
    if (randomNum <= accumulator) {
      winnerIndex = i
      break
    }
  }
  
  // 計算目標角度
  const sliceAngle = 360 / participants.value.length
  const targetAngle = -(winnerIndex * sliceAngle + sliceAngle / 2)
  const spins = 5 // 轉幾圈
  const finalRotation = targetAngle + spins * 360
  
  // 動畫
  const duration = 3000 // 3秒
  const startTime = Date.now()
  const startRotation = rotation.value
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用 easeOut 緩動函數
    const easeOut = 1 - Math.pow(1 - progress, 3)
    rotation.value = startRotation + (finalRotation - startRotation) * easeOut
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // 抽獎完成
      isSpinning.value = false
      lastWinner.value = participants.value[winnerIndex].userId
      
      // 顯示中獎提示
      setTimeout(() => {
        alert(`🎉 恭喜 ${participants.value[winnerIndex].name} 中獎！🎉`)
      }, 500)
    }
  }
  
  requestAnimationFrame(animate)
}

// 獲取中獎者姓名
const getWinnerName = () => {
  const winner = participants.value.find(p => p.userId === lastWinner.value)
  return winner ? winner.name : ''
}

// 重新整理資料
const refreshData = async () => {
  await loadParticipants()
  await nextTick()
  drawWheel()
  lastWinner.value = null
}

// 生命週期
onMounted(async () => {
  await climbingStore.initializeConfig()
  await loadParticipants()
  await nextTick()
  drawWheel()
})

// 監聽參與者變化
const unwatchParticipants = computed(() => participants.value.length)
unwatchParticipants
nextTick(() => {
  drawWheel()
})
</script>

<style scoped>
.lottery-wheel {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.lottery-header {
  text-align: center;
  margin-bottom: 30px;
}

.lottery-header h3 {
  color: #333;
  margin-bottom: 10px;
}

.lottery-info {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  padding: 15px;
  border-radius: 8px;
}

.total-info {
  display: flex;
  justify-content: space-around;
  font-weight: bold;
}

.wheel-container {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.wheel-wrapper {
  position: relative;
  display: inline-block;
}

canvas {
  border-radius: 50%;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  transition: transform 0.1s ease;
}

.wheel-pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-bottom: 30px solid #dc3545;
  z-index: 2;
}

.spin-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(45deg, #FF6B35, #F7931E);
  color: white;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  z-index: 3;
}

.spin-button:hover:not(:disabled) {
  transform: translate(-50%, -50%) scale(1.1);
}

.spin-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: translate(-50%, -50%);
}

.participants-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.participants-section h4 {
  text-align: center;
  margin-bottom: 15px;
  color: #333;
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 20px;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.participant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px 15px;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.participant-item.winner {
  border-color: #28a745;
  background: #d4edda;
  box-shadow: 0 2px 10px rgba(40, 167, 69, 0.3);
}

.participant-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.participant-name {
  font-weight: bold;
  color: #333;
}

.participant-tickets {
  font-size: 0.9em;
  color: #666;
}

.participant-percentage {
  font-weight: bold;
  color: #667eea;
  font-size: 1.1em;
}

.winner-announcement {
  background: linear-gradient(45deg, #28a745, #20c997);
  color: white;
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 20px;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.refresh-btn {
  width: 100%;
  padding: 12px;
  font-size: 1.1em;
}

/* 響應式設計 */
@media (max-width: 600px) {
  .lottery-wheel {
    padding: 15px;
  }
  
  .wheel-wrapper canvas {
    width: 250px;
    height: 250px;
  }
  
  .spin-button {
    width: 60px;
    height: 60px;
    font-size: 12px;
  }
  
  .total-info {
    flex-direction: column;
    gap: 5px;
  }
}
</style>