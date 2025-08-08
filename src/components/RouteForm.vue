<template>
  <div class="form-section">
    <div class="section-title">記錄抱石成果</div>
    
    <!-- 等級選擇 -->
    <div class="form-group">
      <label>選擇完成的抱石等級（單次提交）</label>
      <div class="grade-grid">
        <div 
          v-for="grade in climbingStore.gradeOptions"
          :key="grade.grade"
          class="grade-card"
          :class="{ selected: selectedGrade?.grade === grade.grade }"
          @click="selectGrade(grade)"
        >
          <div class="grade-name">{{ grade.grade }}</div>
          <div class="grade-points">{{ grade.points }}分/題</div>
        </div>
      </div>
    </div>
    
    <!-- 路線名稱 -->
    <div class="form-group">
      <label for="routeName">路線名稱/編號（選填）</label>
      <input 
        v-model="routeName"
        type="text" 
        id="routeName" 
        placeholder="例：紅色路線、#15、左側角落路線"
      >
    </div>
    
    <!-- 照片上傳 -->
    <div class="form-group">
      <label for="routePhoto">上傳路線照片（必填）<span class="required">*</span></label>
      
      <!-- 手機版照片選擇按鈕 -->
      <div class="photo-upload-options">
        <button 
          type="button" 
          class="photo-option-btn camera-btn"
          @click="selectPhotoSource('camera')"
        >
          📷 拍攝照片
        </button>
        <button 
          type="button" 
          class="photo-option-btn gallery-btn"
          @click="selectPhotoSource('gallery')"
        >
          🖼️ 選擇相片
        </button>
      </div>
      
      <!-- 隱藏的文件輸入框 -->
      <input 
        ref="cameraInput"
        type="file" 
        accept="image/*"
        capture="environment"
        required
        style="display: none"
        @change="handlePhotoUpload"
      >
      <input 
        ref="galleryInput"
        type="file" 
        accept="image/*"
        required
        style="display: none"
        @change="handlePhotoUpload"
      >
      
      <div v-if="photoPreview" class="photo-preview">
        <img :src="photoPreview" alt="照片預覽">
        <button type="button" class="remove-photo" @click="removePhoto">✕</button>
      </div>
      
      <!-- 上傳提示 -->
      <div class="upload-hint">
        📱 手機用戶：可選擇拍攝新照片或從相簿選擇現有照片
      </div>
    </div>
    
    <!-- 額外積分任務 -->
    <!--
    <div v-if="climbingStore.extraPointsOptions.length > 0" class="extra-points">
      <div class="extra-title">額外積分任務 (+1分/項)</div>
      <div class="checkbox-group">
        <div 
          v-for="option in climbingStore.extraPointsOptions"
          :key="option.id"
          class="checkbox-item"
        >
          <input 
            v-model="selectedExtraPoints"
            type="checkbox" 
            :id="option.id" 
            :value="option.id"
          >
          <label :for="option.id">
            {{ option.label }} 
            <span v-if="option.points > 1">(+{{ option.points }}分)</span>
          </label>
        </div>
      </div>
    </div>
    -->
    
    <!-- 提交按鈕 -->
    <button 
      class="btn" 
      @click="handleSubmit"
      :disabled="!selectedGrade || !photoFile || climbingStore.loading"
    >
      {{ climbingStore.loading ? submitButtonText : '提交路線' }}
    </button>
    
    <button 
      class="btn btn-secondary" 
      @click="toggleRouteHistory"
    >
      查看我的路線記錄
    </button>
    
    <button 
      class="btn btn-secondary" 
      @click="toggleLeaderboard"
    >
      查看排行榜
    </button>
    
    <button 
      class="btn btn-secondary lottery-btn" 
      @click="toggleLotteryWheel"
    >
      🎯 抽獎轉盤
    </button>
  </div>
</template>

<script setup>
import { ref, inject, computed } from 'vue'
import { useClimbingStore } from '../stores/climbing.js'

const climbingStore = useClimbingStore()

// 從父組件注入的方法
const toggleRouteHistory = inject('toggleRouteHistory')
const toggleLeaderboard = inject('toggleLeaderboard')
const toggleLotteryWheel = inject('toggleLotteryWheel')

// 表單狀態
const selectedGrade = ref(null)
const routeName = ref('')
const selectedExtraPoints = ref([])
const photoFile = ref(null)
const photoPreview = ref('')
const submitButtonText = ref('提交中...')

// 照片輸入框引用
const cameraInput = ref(null)
const galleryInput = ref(null)

// 計算屬性
const totalPoints = computed(() => {
  let points = selectedGrade.value?.points || 0
  selectedExtraPoints.value.forEach(pointId => {
    const option = climbingStore.extraPointsOptions.find(opt => opt.id === pointId)
    if (option) points += option.points
  })
  return points
})

// 方法
const selectGrade = (grade) => {
  selectedGrade.value = grade
}

const selectPhotoSource = (source) => {
  if (source === 'camera') {
    cameraInput.value.click()
  } else if (source === 'gallery') {
    galleryInput.value.click()
  }
}

const handlePhotoUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    photoFile.value = file
    
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removePhoto = () => {
  photoFile.value = null
  photoPreview.value = ''
  // 清除所有 input 的值
  if (cameraInput.value) cameraInput.value.value = ''
  if (galleryInput.value) galleryInput.value.value = ''
}

const resetForm = () => {
  selectedGrade.value = null
  routeName.value = ''
  selectedExtraPoints.value = []
  removePhoto()
}

const handleSubmit = async () => {
  if (!selectedGrade.value) {
    alert('請選擇抱石等級！')
    return
  }
  
  if (!photoFile.value) {
    alert('請上傳路線照片！')
    return
  }
  
  try {
    const routeData = {
      grade: selectedGrade.value.grade,
      gradePoints: selectedGrade.value.points,
      routeName: routeName.value.trim(),
      extraPoints: selectedExtraPoints.value,
      photo: photoFile.value
    }
    
    const result = await climbingStore.submitRoute(routeData)
    
    // 顯示成功訊息
    let message = `🎉 路線記錄成功！\n\n等級：${result.routeRecord.grade} (+${result.routeRecord.gradePoints}分)\n路線：${result.routeRecord.routeName}\n總獲得：${result.totalPoints}分`
    
    if (result.ticketsEarned > 0) {
      message += `\n🎟️ 獲得 ${result.ticketsEarned} 張抽獎券！`
    }
    
    if (result.routeRecord.extraDetails && result.routeRecord.extraDetails.length > 0) {
      message += `\n\n額外積分任務：\n${result.routeRecord.extraDetails.join('\n')}`
    }
    
    alert(message)
    
    // 重置表單
    resetForm()
    
  } catch (error) {
    let errorMessage = '提交失敗，請再試一次'
    
    if (error.message) {
      errorMessage = error.message
    } else if (error.code) {
      switch (error.code) {
        case 'permission-denied':
          errorMessage = '權限不足，請檢查 Firebase 安全規則設定'
          break
        case 'unavailable':
          errorMessage = '網路連線問題，請檢查網路後重試'
          break
        case 'quota-exceeded':
          errorMessage = '儲存空間已滿，請聯繫管理員'
          break
        default:
          errorMessage = `系統錯誤：${error.code}`
      }
    }
    
    alert(errorMessage)
  }
}
</script>

<style scoped>
.form-section {
  padding: 20px;
}

.grade-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.grade-card {
  background: #f8f9fa;
  padding: 15px 10px;
  border-radius: 8px;
  text-align: center;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
}

.grade-card:hover {
  background: #e9ecef;
}

.grade-card.selected {
  border-color: #28a745;
  background: #d4edda;
}

.grade-name {
  font-weight: bold;
  font-size: 1.1em;
  color: #333;
  margin-bottom: 5px;
}

.grade-points {
  font-size: 1.3em;
  font-weight: bold;
  color: #28a745;
}

.photo-preview {
  margin-top: 10px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e9ecef;
  max-width: 200px;
}

.photo-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.remove-photo {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(220, 53, 69, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-photo:hover {
  background: rgba(220, 53, 69, 1);
}

/* 照片上傳選項按鈕 */
.photo-upload-options {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.photo-option-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.photo-option-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.camera-btn:hover {
  border-color: #28a745;
  background: #f8fff9;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.15);
}

.gallery-btn:hover {
  border-color: #17a2b8;
  background: #f8fdff;
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.15);
}

.upload-hint {
  font-size: 0.85em;
  color: #666;
  text-align: center;
  margin-top: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.extra-points {
  background: #fff3cd;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.extra-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #856404;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-item input[type="checkbox"] {
  width: auto;
}

/* 必填欄位樣式 */
.required {
  color: #dc3545;
  font-weight: bold;
  margin-left: 3px;
}

/* 檔案輸入框樣式增強 */
input[type="file"]:required:invalid + .photo-preview::before {
  content: "⚠️ 請上傳照片";
  display: block;
  color: #dc3545;
  font-size: 0.9em;
  margin-bottom: 5px;
}

/* 抽獎按鈕特殊樣式 */
.lottery-btn {
  background: linear-gradient(45deg, #FF6B35, #F7931E) !important;
  color: white !important;
  border: none !important;
  font-weight: bold;
}

.lottery-btn:hover {
  background: linear-gradient(45deg, #FF5722, #FF8F00) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
}

@media (max-width: 480px) {
  .grade-grid {
    grid-template-columns: 1fr;
  }
  
  .photo-upload-options {
    flex-direction: column;
    gap: 8px;
  }
  
  .photo-option-btn {
    padding: 10px 12px;
    font-size: 0.95em;
  }
  
  .upload-hint {
    font-size: 0.8em;
  }
}
</style>