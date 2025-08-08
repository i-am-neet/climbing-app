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
          :disabled="isSpinning || participants.length === 0 || totalTickets === 0"
        >
          {{ isSpinning ? '抽獎中...' : (totalTickets === 0 ? '無可用票券' : '開始抽獎') }}
        </button>
      </div>
    </div>

    <!-- 參與者列表 -->
    <div class="participants-section">
      <h4>參與者列表</h4>
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>載入中...</p>
      </div>
      <div v-else-if="participants.length === 0" class="empty-state">
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
            <span v-if="participant.lotteryWins > 0" class="participant-wins">
              🏆 {{ participant.lotteryWins }} 次
            </span>
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
      <div class="winner-details">
        消耗 1 張抽獎券，轉盤比例已更新
      </div>
    </div>

    <!-- 抽獎歷史記錄 -->
    <div v-if="lotteryHistory.length > 0" class="lottery-history">
      <h4>🏆 抽獎記錄</h4>
      <div class="history-list">
        <div 
          v-for="record in lotteryHistory.slice(0, 10)" 
          :key="record.id"
          class="history-item"
        >
          <div class="history-info">
            <span class="winner-name">{{ record.winnerName }}</span>
            <span class="history-time">{{ formatHistoryTime(record.timestamp) }}</span>
          </div>
          <div class="tickets-used">-{{ record.ticketsUsed }}券</div>
        </div>
      </div>
    </div>

    <!-- 重新整理按鈕 -->
    <button class="btn btn-secondary refresh-btn" @click="refreshData">
      🔄 重新整理資料
    </button>
    
    <!-- 開發模式測試按鈕 -->
    <div v-if="isDevelopmentMode" class="dev-controls">
      <button class="btn btn-secondary" @click="testLottery(10)">
        🧪 測試抽獎 10 次
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useClimbingStore } from '../stores/climbing.js'

const climbingStore = useClimbingStore()

// 響應式數據
const wheelCanvas = ref(null)
const canvasSize = 300
const rotation = ref(0)
const isSpinning = ref(false)
const lastWinner = ref(null)
const participants = ref([])
const loading = ref(false)
const lotteryHistory = ref([])

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
  loading.value = true
  try {
    console.log('開始載入參與者資料...')
    
    // 確保 Remote Config 已載入
    await climbingStore.initializeConfig()
    
    // 等待 Remote Config 完全載入
    let retryCount = 0
    while ((!climbingStore.configLoaded || !climbingStore.POINTS_PER_TICKET.value || climbingStore.POINTS_PER_TICKET.value === 0) && retryCount < 10) {
      console.log(`等待 Remote Config 載入... (${retryCount + 1}/10)`)
      console.log('Config loaded:', climbingStore.configLoaded)
      console.log('Points per ticket:', climbingStore.POINTS_PER_TICKET.value)
      await new Promise(resolve => setTimeout(resolve, 300))
      retryCount++
    }
    
    // 取得積分門檻，如果還是沒有就使用預設值
    const pointsPerTicket = climbingStore.POINTS_PER_TICKET.value || 10
    console.log('最終每張抽獎券所需積分:', pointsPerTicket)
    console.log('Config 載入狀態:', climbingStore.configLoaded)
    
    // 載入排行榜資料
    await climbingStore.loadLeaderboard()
    console.log('排行榜資料:', climbingStore.leaderboard)
    
    if (climbingStore.leaderboard.length === 0) {
      console.warn('排行榜為空，嘗試載入全域統計...')
      await climbingStore.loadGlobalStats()
    }
    
    participants.value = climbingStore.leaderboard
      .map(user => {
        // 確保 pointsPerTicket 不是 0 或 undefined
        const validPointsPerTicket = pointsPerTicket > 0 ? pointsPerTicket : 10
        const tickets = Math.floor((user.points || 0) / validPointsPerTicket)
        const lotteryWins = user.lotteryWins || 0
        console.log(`使用者 ${user.name}: ${user.points} 分 ÷ ${validPointsPerTicket} = ${tickets} 券 (已中獎 ${lotteryWins} 次)`)
        return {
          userId: user.email || user.name || `user_${Date.now()}_${Math.random()}`,
          name: user.name || user.email || '匿名使用者',
          points: user.points || 0,
          tickets: tickets,
          lotteryWins: lotteryWins
        }
      })
      .filter(p => p.tickets > 0) // 只顯示有抽獎券的人
      .sort((a, b) => b.tickets - a.tickets) // 按抽獎券數量排序
      
    console.log('參與者資料:', participants.value)
    console.log('總抽獎券數:', totalTickets.value)
    
  } catch (error) {
    console.error('載入參與者資料失敗:', error)
  } finally {
    loading.value = false
  }
}

// 繪製轉盤
const drawWheel = () => {
  const canvas = wheelCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2
  const radius = canvasSize / 2 - 10
  
  ctx.clearRect(0, 0, canvasSize, canvasSize)
  
  if (participants.value.length === 0) {
    // 繪製空轉盤
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#f0f0f0'
    ctx.fill()
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 顯示提示文字
    ctx.fillStyle = '#666'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('暫無參與者', centerX, centerY - 10)
    ctx.font = '12px Arial'
    ctx.fillText('請先累積積分', centerX, centerY + 10)
    return
  }
  
  let currentAngle = 0
  
  console.log('轉盤繪製順序:')
  
  participants.value.forEach((participant, index) => {
    const sliceAngle = (participant.tickets / totalTickets.value) * 2 * Math.PI
    const angleDegrees = (sliceAngle * 180) / Math.PI
    const startDegrees = (currentAngle * 180) / Math.PI
    
    console.log(`${index}: ${participant.name} - ${startDegrees.toFixed(1)}° 到 ${(startDegrees + angleDegrees).toFixed(1)}° (${angleDegrees.toFixed(1)}°)`)
    
    // 繪製扇形
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.lineTo(centerX, centerY)
    ctx.fillStyle = colors[index % colors.length]
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 繪製文字（只在扇形夠大時顯示）
    if (sliceAngle > 0.2) { // 約 11.5 度以上才顯示文字
      const textAngle = currentAngle + sliceAngle / 2
      const textRadius = radius * 0.7
      const textX = centerX + Math.cos(textAngle) * textRadius
      const textY = centerY + Math.sin(textAngle) * textRadius
      
      ctx.save()
      ctx.translate(textX, textY)
      ctx.rotate(textAngle + Math.PI / 2)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(participant.name, 0, -5)
      ctx.font = '8px Arial'
      ctx.fillText(`${participant.tickets}券`, 0, 8)
      ctx.restore()
    }
    
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
  
  console.log('抽獎隨機數:', randomNum, '/ 總票券:', totalTickets.value)
  console.log('參與者票券分布:', participants.value.map(p => `${p.name}: ${p.tickets}券`))
  
  for (let i = 0; i < participants.value.length; i++) {
    const previousAccumulator = accumulator
    accumulator += participants.value[i].tickets
    console.log(`${participants.value[i].name}: 範圍 ${previousAccumulator} - ${accumulator}`)
    
    if (randomNum < accumulator) {  // 改為 < 而不是 <=
      winnerIndex = i
      console.log(`中獎者: ${participants.value[i].name} (隨機數 ${randomNum} 落在範圍 ${previousAccumulator} - ${accumulator})`)
      break
    }
  }
  
  // 計算目標角度
  // Canvas 從右邊（0°）開始，但指針在頂部，需要補償 -90°
  let accumulatedAngle = 0
  
  // 計算前面所有參與者的角度總和
  for (let i = 0; i < winnerIndex; i++) {
    accumulatedAngle += (participants.value[i].tickets / totalTickets.value) * 360
  }
  
  // 加上中獎者扇形的一半，讓指針指向扇形中心
  const winnerSliceAngle = (participants.value[winnerIndex].tickets / totalTickets.value) * 360
  accumulatedAngle += winnerSliceAngle / 2
  
  // 轉換：Canvas 的 0° 在右邊，但指針在頂部（相當於 -90°）
  // 所以需要轉盤逆時鐘旋轉 (270° - accumulatedAngle) 讓中獎者對準指針
  const targetAngle = 270 - accumulatedAngle
  
  console.log(`中獎者 ${participants.value[winnerIndex].name}:`)
  console.log(`- 扇形角度: ${winnerSliceAngle.toFixed(1)}°`)
  console.log(`- 累積角度: ${accumulatedAngle.toFixed(1)}°`)
  console.log(`- 目標角度: ${targetAngle.toFixed(1)}°`)
  
  // 加上隨機轉數，確保轉盤有足夠的旋轉
  const spins = 10 + Math.random() * 3 // 10-13圈
  const finalRotation = targetAngle + spins * 360
  
  console.log(`- 最終旋轉角度: ${finalRotation.toFixed(1)}°`)
  
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
      rotation.value = finalRotation // 確保最終角度精確
      isSpinning.value = false
      lastWinner.value = participants.value[winnerIndex].userId
      
      // 記錄抽獎結果
      recordLotteryWin(participants.value[winnerIndex])
      
      // 顯示中獎提示
      setTimeout(() => {
        alert(`🎉 恭喜 ${participants.value[winnerIndex].name} 中獎！🎉\n消耗 1 張抽獎券`)
      }, 500)
    }
  }
  
  requestAnimationFrame(animate)
}

// 記錄抽獎結果
const recordLotteryWin = async (winner) => {
  try {
    // 記錄到本地歷史
    const lotteryRecord = {
      id: Date.now(),
      winnerId: winner.userId,
      winnerName: winner.name,
      timestamp: new Date().toISOString(),
      ticketsUsed: 1
    }
    
    lotteryHistory.value.unshift(lotteryRecord)
    
    console.log('抽獎記錄已儲存:', lotteryRecord)
    
    // 1. 立即更新本地參與者資料
    console.log('抽獎前總票券:', totalTickets.value)
    console.log('抽獎前參與者:', participants.value.map(p => `${p.name}: ${p.tickets}券`))
    
    const winnerIndex = participants.value.findIndex(p => p.userId === winner.userId)
    if (winnerIndex !== -1) {
      const originalTickets = participants.value[winnerIndex].tickets
      participants.value[winnerIndex].tickets = Math.max(0, participants.value[winnerIndex].tickets - 1)
      participants.value[winnerIndex].points = participants.value[winnerIndex].tickets * (climbingStore.POINTS_PER_TICKET.value || 10)
      
      console.log(`${winner.name}: ${originalTickets} → ${participants.value[winnerIndex].tickets} 券`)
      
      // 如果該參與者沒有票券了，從列表中移除
      if (participants.value[winnerIndex].tickets === 0) {
        console.log(`${winner.name} 票券用完，從轉盤移除`)
        participants.value.splice(winnerIndex, 1)
      }
    }
    
    console.log('抽獎後總票券:', totalTickets.value)
    console.log('抽獎後參與者:', participants.value.map(p => `${p.name}: ${p.tickets}券`))
    
    // 2. 立即重新繪製轉盤
    await nextTick()
    drawWheel()
    
    // 3. 背景更新 Firebase 資料
    try {
      console.log('開始更新 Firebase 資料...')
      
      // 準備競賽詳細資訊
      const contestDetails = {
        totalParticipants: participants.value.length,
        totalTickets: totalTickets.value,
        participantsList: participants.value.map(p => ({
          userId: p.userId,
          name: p.name,
          tickets: p.tickets,
          percentage: Math.round((p.tickets / totalTickets.value) * 100)
        }))
      }
      
      await climbingStore.consumeTicket(winner.userId, 1, contestDetails)
      console.log('Firebase 更新成功')
    } catch (error) {
      console.error('Firebase 更新失敗:', error)
      // 如果 Firebase 更新失敗，恢復本地狀態
      if (winnerIndex !== -1 && participants.value[winnerIndex]) {
        participants.value[winnerIndex].tickets += 1
        console.log('已恢復本地狀態')
      }
      alert('扣除票券失敗：' + error.message)
      return
    }
    
    // 4. 延遲完整重新載入以確保資料同步（縮短為 2 秒）
    setTimeout(async () => {
      try {
        console.log('執行延遲重新載入...')
        await loadParticipants()
        await nextTick()
        drawWheel()
        console.log('延遲重新載入完成')
      } catch (error) {
        console.warn('延遲重新載入失敗:', error)
      }
    }, 2000)
    
  } catch (error) {
    console.error('記錄抽獎結果失敗:', error)
  }
}

// 獲取中獎者姓名
const getWinnerName = () => {
  const winner = participants.value.find(p => p.userId === lastWinner.value)
  return winner ? winner.name : ''
}

// 格式化歷史記錄時間
const formatHistoryTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分鐘內
    return '剛才'
  } else if (diff < 3600000) { // 1小時內
    return `${Math.floor(diff / 60000)}分鐘前`
  } else if (diff < 86400000) { // 1天內
    return `${Math.floor(diff / 3600000)}小時前`
  } else {
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
  }
}

// 開發模式檢查
const isDevelopmentMode = computed(() => import.meta.env.DEV)

// 測試抽獎函數 (僅開發模式)
const testLottery = (times) => {
  if (!isDevelopmentMode.value) return
  
  const results = {}
  for (let i = 0; i < times; i++) {
    const randomNum = Math.random() * totalTickets.value
    let accumulator = 0
    
    for (let j = 0; j < participants.value.length; j++) {
      accumulator += participants.value[j].tickets
      if (randomNum < accumulator) {
        const name = participants.value[j].name
        results[name] = (results[name] || 0) + 1
        break
      }
    }
  }
  
  console.log(`抽獎測試結果 (${times} 次):`, results)
  console.log('理論機率:', participants.value.map(p => 
    `${p.name}: ${((p.tickets / totalTickets.value) * 100).toFixed(1)}%`
  ))
}

// 重新整理資料
const refreshData = async () => {
  lastWinner.value = null
  await loadParticipants()
  await nextTick()
  drawWheel()
}

// 生命週期
onMounted(async () => {
  console.log('LotteryWheel 組件已掛載')
  try {
    await loadParticipants()
    await nextTick()
    drawWheel()
  } catch (error) {
    console.error('初始化失敗:', error)
  }
})

// 監聽參與者變化並重新繪製轉盤
watch(participants, async () => {
  console.log('參與者資料變更，重新繪製轉盤')
  await nextTick()
  drawWheel()
}, { deep: true })
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

.loading-state {
  text-align: center;
  padding: 20px;
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

.participant-wins {
  font-size: 0.8em;
  color: #ffc107;
  font-weight: bold;
  margin-left: 5px;
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

.winner-details {
  font-size: 0.8em;
  margin-top: 8px;
  opacity: 0.9;
  font-weight: normal;
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

/* 抽獎歷史記錄 */
.lottery-history {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #ffc107;
}

.lottery-history h4 {
  text-align: center;
  margin-bottom: 15px;
  color: #333;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.history-item:hover {
  border-color: #ffc107;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.15);
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.winner-name {
  font-weight: bold;
  color: #333;
}

.history-time {
  font-size: 0.8em;
  color: #666;
}

.tickets-used {
  background: linear-gradient(45deg, #dc3545, #e74c3c);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
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