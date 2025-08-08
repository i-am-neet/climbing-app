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
  increment, 
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuthStore } from './auth.js'

export const useClimbingStore = defineStore('climbing', () => {
  // State
  const userStats = ref({
    points: 0,
    tickets: 0,
    routes: []
  })
  
  const globalStats = ref({
    totalMembers: 0,
    totalPoints: 0,
    totalTickets: 0
  })
  
  const leaderboard = ref([])
  const loading = ref(false)
  
  // Constants
  const POINTS_PER_TICKET = 10
  
  const gradeOptions = [
    { grade: 'VB-V1', points: 2 },
    { grade: 'V2-V3', points: 3 },
    { grade: 'V4-V5', points: 5 },
    { grade: 'V6+', points: 8 }
  ]
  
  const extraPointsOptions = [
    { id: 'photo', label: '拍攝他人抱石瞬間', points: 1 },
    { id: 'share', label: '分享心得或技巧', points: 1 },
    { id: 'help', label: '協助其他社員', points: 1 },
    { id: 'clean', label: '清潔岩點/整理裝備', points: 1 },
    { id: 'social', label: '社群打卡分享', points: 1 },
    { id: 'team', label: '團體挑戰完成', points: 3 }
  ]
  
  // Getters
  const userTickets = computed(() => Math.floor(userStats.value.points / POINTS_PER_TICKET))
  
  // Actions
  const loadUserData = async () => {
    const authStore = useAuthStore()
    if (!authStore.user) return
    
    try {
      const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        userStats.value = {
          points: userData.points || 0,
          tickets: Math.floor((userData.points || 0) / POINTS_PER_TICKET),
          routes: userData.routes || []
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
        userStats.value = { points: 0, tickets: 0, routes: [] }
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
      
      const totalTickets = Math.floor(totalPoints / POINTS_PER_TICKET)
      
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
      
      snapshot.forEach(doc => {
        const userData = doc.data()
        if (userData.points > 0) {
          users.push(userData)
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
        ticketsEarned: Math.floor(totalPoints / POINTS_PER_TICKET)
      }
      
    } catch (error) {
      console.error('提交失敗:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  return {
    // State
    userStats,
    globalStats,
    leaderboard,
    loading,
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
    submitRoute
  }
})