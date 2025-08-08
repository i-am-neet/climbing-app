import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, storage } from '../firebase.js'
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  arrayUnion,
  arrayRemove, 
  increment, 
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuthStore } from './auth.js'
import { remoteConfig, initRemoteConfig } from '../firebase.js'
import { getValue } from "firebase/remote-config"

export const useClimbingStore = defineStore('climbing', () => {
  // State
  const userStats = ref({
    points: 0,
    tickets: 0,
    routes: [],
    lotteryWins: 0
  })
  
  const globalStats = ref({
    totalMembers: 0,
    totalPoints: 0,
    totalTickets: 0
  })
  
  const leaderboard = ref([])
  const loading = ref(false)
  const configLoaded = ref(false)
  
  // Reactive constants that update when Remote Config is loaded
  const POINTS_PER_TICKET = computed(() => {
    if (!configLoaded.value) return 20
    try {
      return getValue(remoteConfig, "POINTS_PER_TICKET").asNumber() || 20
    } catch (error) {
      console.warn('無法載入 POINTS_PER_TICKET 設定，使用預設值:', error)
      return 10
    }
  })
  
  const gradeOptions = computed(() => {
    if (!configLoaded.value) {
      return [
        { grade: 'VB-V1', points: 2 },
        { grade: 'V2-V3', points: 3 },
        { grade: 'V4-V5', points: 5 },
        { grade: 'V6+', points: 8 }
      ]
    }
    
    try {
      const valScoreBoard = getValue(remoteConfig, "SCORE_BOARD").asString()
      if (valScoreBoard && valScoreBoard.trim()) {
        return JSON.parse(valScoreBoard)
      } else {
        throw new Error('SCORE_BOARD 設定為空')
      }
    } catch (err) {
      console.warn("無法載入 SCORE_BOARD 設定，使用預設值:", err)
      return [
        { grade: 'VB-V1', points: 2 },
        { grade: 'V2-V3', points: 3 },
        { grade: 'V4-V5', points: 5 },
        { grade: 'V6+', points: 8 }
      ]
    }
  })
  
  // Initialize Remote Config
  const initializeConfig = async () => {
    try {
      await initRemoteConfig()
      configLoaded.value = true
      console.log('Remote Config 初始化完成')
    } catch (error) {
      console.warn('Remote Config 初始化失敗:', error)
      configLoaded.value = true // 仍然設為 true 以使用預設值
    }
  }
  
  const extraPointsOptions = [
    // { id: 'photo', label: '拍攝他人抱石瞬間', points: 1 },
    // { id: 'share', label: '分享心得或技巧', points: 1 },
    // { id: 'help', label: '協助其他社員', points: 1 },
    // { id: 'clean', label: '清潔岩點/整理裝備', points: 1 },
    // { id: 'social', label: '社群打卡分享', points: 1 },
    // { id: 'team', label: '團體挑戰完成', points: 3 }
  ]
  
  // Getters
  const userTickets = computed(() => Math.floor(userStats.value.points / POINTS_PER_TICKET.value))
  
  // Actions
  const loadUserData = async () => {
    const authStore = useAuthStore()
    if (!authStore.user) return
    
    try {
      const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        
        // 從新的 lotteryWins 集合查詢中獎次數
        const lotteryWinCount = await getLotteryWinCount(authStore.user.uid)
        
        userStats.value = {
          points: userData.points || 0,
          tickets: Math.floor((userData.points || 0) / POINTS_PER_TICKET.value),
          routes: userData.routes || [],
          lotteryWins: lotteryWinCount
        }
      } else {
        // 初次登入，建立使用者資料
        await setDoc(doc(db, 'users', authStore.user.uid), {
          name: authStore.user.displayName,
          email: authStore.user.email,
          points: 0,
          routes: [],
          createdAt: serverTimestamp()
        })
        userStats.value = { points: 0, tickets: 0, routes: [], lotteryWins: 0 }
      }
      
      await loadGlobalStats()
    } catch (error) {
      console.error('載入使用者資料失敗:', error)
      throw error
    }
  }
  
  const loadGlobalStats = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const users = []
      let totalPoints = 0
      
      snapshot.forEach(doc => {
        const userData = doc.data()
        users.push(userData)
        totalPoints += userData.points || 0
      })
      
      const totalTickets = Math.floor(totalPoints / POINTS_PER_TICKET.value)
      
      globalStats.value = {
        totalMembers: users.length,
        totalPoints,
        totalTickets
      }
    } catch (error) {
      console.error('載入全域統計失敗:', error)
      throw error
    }
  }
  
  const loadLeaderboard = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('points', 'desc'))
      const snapshot = await getDocs(q)
      const users = []
      
      // 同時獲取所有用戶的中獎統計
      const allLotteryWins = await getAllLotteryWinCounts()
      
      snapshot.forEach(doc => {
        const userData = doc.data()
        if (userData.points > 0) {
          // 合併用戶資料和中獎統計
          const userWithWins = {
            ...userData,
            lotteryWins: allLotteryWins[doc.id]?.count || 0
          }
          users.push(userWithWins)
        }
      })
      
      leaderboard.value = users
    } catch (error) {
      console.error('載入排行榜失敗:', error)
      throw error
    }
  }
  
  const uploadPhoto = async (file) => {
    const authStore = useAuthStore()
    if (!file || !authStore.user) return null
    
    try {
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const photoStorageRef = storageRef(storage, `users/${authStore.user.uid}/routes/${fileName}`)
      
      const snapshot = await uploadBytes(photoStorageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return downloadURL
    } catch (error) {
      console.error('照片上傳失敗:', error)
      throw error
    }
  }
  
  const submitRoute = async (routeData) => {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('請先登入')
    
    loading.value = true
    
    try {
      let photoURL = null
      if (routeData.photo) {
        // 驗證照片
        if (routeData.photo.size > 5 * 1024 * 1024) {
          throw new Error('照片檔案過大，請選擇小於 5MB 的圖片')
        }
        if (!routeData.photo.type.startsWith('image/')) {
          throw new Error('請選擇有效的圖片檔案')
        }
        
        photoURL = await uploadPhoto(routeData.photo)
      }
      
      // 計算積分
      let totalPoints = routeData.gradePoints
      const extraDetails = []
      
      if (routeData.extraPoints) {
        routeData.extraPoints.forEach(pointId => {
          const option = extraPointsOptions.find(opt => opt.id === pointId)
          if (option) {
            totalPoints += option.points
            extraDetails.push(option.label)
          }
        })
      }
      
      // 建立路線記錄
      const routeRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        grade: routeData.grade,
        routeName: routeData.routeName || '未命名路線',
        gradePoints: routeData.gradePoints,
        extraPoints: totalPoints - routeData.gradePoints,
        totalPoints,
        extraDetails,
        photoURL,
        userId: authStore.user.uid,
        userEmail: authStore.user.email
      }
      
      // 更新 Firestore
      const userRef = doc(db, 'users', authStore.user.uid)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          name: authStore.user.displayName,
          email: authStore.user.email,
          points: totalPoints,
          routes: [routeRecord],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      } else {
        await updateDoc(userRef, {
          points: increment(totalPoints),
          routes: arrayUnion(routeRecord),
          updatedAt: serverTimestamp()
        })
      }
      
      // 重新載入資料
      await loadUserData()
      
      return {
        success: true,
        routeRecord,
        totalPoints,
        ticketsEarned: Math.floor(totalPoints / POINTS_PER_TICKET.value)
      }
      
    } catch (error) {
      console.error('提交失敗:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const deleteRoute = async (routeId) => {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('請先登入')
    
    loading.value = true
    
    try {
      // 找到要刪除的路線
      const routeToDelete = userStats.value.routes.find(route => route.id === routeId)
      if (!routeToDelete) {
        throw new Error('找不到該路線記錄')
      }
      
      // 從 Firestore 更新使用者資料
      const userRef = doc(db, 'users', authStore.user.uid)
      
      // 扣除積分並移除路線記錄
      await updateDoc(userRef, {
        points: increment(-routeToDelete.totalPoints),
        routes: arrayRemove(routeToDelete),
        updatedAt: serverTimestamp()
      })
      
      // 重新載入資料
      await loadUserData()
      
      return { success: true, deletedPoints: routeToDelete.totalPoints }
      
    } catch (error) {
      console.error('刪除路線失敗:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // 查詢使用者的抽獎中獎次數
  const getLotteryWinCount = async (userId) => {
    try {
      const q = query(
        collection(db, 'lotteryWins'),
        orderBy('timestampMs', 'desc')
      )
      const snapshot = await getDocs(q)
      
      let userWinCount = 0
      snapshot.forEach(doc => {
        const winData = doc.data()
        if (winData.userId === userId || winData.userEmail === userId) {
          userWinCount++
        }
      })
      
      console.log(`使用者 ${userId} 的中獎次數: ${userWinCount}`)
      return userWinCount
    } catch (error) {
      console.error('查詢中獎次數失敗:', error)
      return 0
    }
  }

  // 獲取所有使用者的中獎次數統計
  const getAllLotteryWinCounts = async () => {
    try {
      const q = query(
        collection(db, 'lotteryWins'),
        orderBy('timestampMs', 'desc')
      )
      const snapshot = await getDocs(q)
      
      const winCounts = {}
      snapshot.forEach(doc => {
        const winData = doc.data()
        const userId = winData.userId
        const userEmail = winData.userEmail
        const userName = winData.userName
        
        if (!winCounts[userId]) {
          winCounts[userId] = {
            count: 0,
            email: userEmail,
            name: userName
          }
        }
        winCounts[userId].count++
      })
      
      console.log('所有使用者中獎統計:', winCounts)
      return winCounts
    } catch (error) {
      console.error('查詢所有中獎統計失敗:', error)
      return {}
    }
  }

  const consumeTicket = async (userId, ticketsToConsume = 1, contestDetails = {}) => {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('請先登入')
    
    try {
      // 檢查是否為 Mock 用戶
      if (authStore.currentProvider === 'mock') {
        console.log('Mock 用戶模擬扣除票券，不更新 Firebase')
        return { success: true, pointsDeducted: ticketsToConsume * POINTS_PER_TICKET.value }
      }
      
      // 計算需要扣除的積分
      const pointsToDeduct = ticketsToConsume * POINTS_PER_TICKET.value
      
      console.log(`準備扣除票券: userId=${userId}, tickets=${ticketsToConsume}, points=${pointsToDeduct}`)
      
      // 先載入所有使用者資料找到對應的使用者
      const users = await getDocs(collection(db, 'users'))
      let targetUserRef = null
      let targetUserData = null
      
      users.forEach(userDoc => {
        const userData = userDoc.data()
        const userIdMatch = userData.email === userId || userData.name === userId || userDoc.id === userId
        
        if (userIdMatch) {
          targetUserRef = userDoc.ref
          targetUserData = userData
          console.log('找到目標使用者:', userData.name || userData.email)
        }
      })
      
      if (!targetUserRef) {
        throw new Error(`找不到使用者: ${userId}`)
      }
      
      // 檢查使用者是否有足夠積分
      if ((targetUserData.points || 0) < pointsToDeduct) {
        throw new Error(`積分不足: 需要 ${pointsToDeduct} 分，僅有 ${targetUserData.points || 0} 分`)
      }
      
      // 更新 Firestore - 只更新積分和基本資料
      await updateDoc(targetUserRef, {
        points: increment(-pointsToDeduct),
        updatedAt: serverTimestamp()
      })
      
      // 在獨立的 lotteryWins 集合中記錄中獎
      const lotteryWinRecord = {
        userId: targetUserRef.id,
        userEmail: targetUserData.email,
        userName: targetUserData.name,
        timestamp: serverTimestamp(),
        timestampMs: Date.now(), // 用於排序和顯示
        pointsConsumed: pointsToDeduct,
        ticketsUsed: ticketsToConsume,
        winType: 'wheel_lottery',
        details: {
          totalParticipants: contestDetails.totalParticipants || 0,
          totalTickets: contestDetails.totalTickets || 0,
          participantsList: contestDetails.participantsList || []
        }
      }
      
      // 添加到 lotteryWins 集合
      const lotteryWinRef = doc(collection(db, 'lotteryWins'))
      await setDoc(lotteryWinRef, lotteryWinRecord)
      
      console.log('中獎記錄已寫入 lotteryWins 集合:', lotteryWinRecord)
      
      // 如果是當前使用者，同步更新本地狀態
      if (authStore.user && (authStore.user.uid === targetUserRef.id || authStore.user.email === userId || authStore.user.email === targetUserData.email)) {
        userStats.value.points = Math.max(0, userStats.value.points - pointsToDeduct)
        userStats.value.tickets = Math.floor(userStats.value.points / POINTS_PER_TICKET.value)
        // 注意：不再更新本地 lotteryWins，改從資料庫查詢
        console.log('已同步更新當前使用者本地狀態 (點數和票券)')
      }
      
      console.log(`成功扣除 ${ticketsToConsume} 張抽獎券 (${pointsToDeduct} 積分)`)
      return { success: true, pointsDeducted: pointsToDeduct }
      
    } catch (error) {
      console.error('扣除抽獎券失敗:', error)
      throw error
    }
  }
  
  return {
    // State
    userStats,
    globalStats,
    leaderboard,
    loading,
    configLoaded,
    // Constants
    gradeOptions,
    extraPointsOptions,
    POINTS_PER_TICKET,
    // Getters
    userTickets,
    // Actions
    loadUserData,
    loadGlobalStats,
    loadLeaderboard,
    submitRoute,
    deleteRoute,
    consumeTicket,
    initializeConfig,
    // Lottery functions
    getLotteryWinCount,
    getAllLotteryWinCounts
  }
})