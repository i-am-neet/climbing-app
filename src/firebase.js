import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getRemoteConfig, fetchAndActivate } from "firebase/remote-config"

const firebaseConfig = {
  apiKey: "AIzaSyDdagVzU1epsKnQ1wobHE75Ybvivp0V6tQ",
  authDomain: "climbing-points-system.firebaseapp.com",
  projectId: "climbing-points-system",
  storageBucket: "climbing-points-system.firebasestorage.app",
  messagingSenderId: "582299728579",
  appId: "1:582299728579:web:d384b6e0906aa801cc4076",
  measurementId: "G-L01F0018ET"
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)

// 導出 Firebase 服務
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)
export const remoteConfig = getRemoteConfig(app)
export default app

// Remote Config 設定
remoteConfig.settings.minimumFetchIntervalMillis = 0

// 設定預設值
remoteConfig.defaultConfig = {
  "POINTS_PER_TICKET": 10,
  "SCORE_BOARD": JSON.stringify([
    { grade: 'VB-V1', points: 2 },
    { grade: 'V2-V3', points: 3 },
    { grade: 'V4-V5', points: 5 },
    { grade: 'V6+', points: 8 }
  ])
}

// 初始化 Remote Config 並嘗試 fetch
export const initRemoteConfig = async () => {
  try {
    console.log('開始 fetch Remote Config...')
    console.log('Remote Config 預設值:', remoteConfig.defaultConfig)
    
    const success = await fetchAndActivate(remoteConfig)
    console.log('Remote Config fetch 結果:', success)
    
    // 測試讀取值
    const testValue = remoteConfig.getValue("POINTS_PER_TICKET")
    console.log('測試讀取 POINTS_PER_TICKET:', testValue)
    console.log('Value source:', testValue.getSource())
    console.log('Value as number:', testValue.asNumber())
    
    console.log('Remote Config fetch 成功')
    return true
  } catch (error) {
    console.warn('Remote Config fetch 失敗，使用預設值:', error)
    console.log('嘗試使用預設值...')
    
    // 即使 fetch 失敗，預設值應該還是可以用
    const defaultValue = remoteConfig.getValue("POINTS_PER_TICKET")
    console.log('預設值測試:', defaultValue.asNumber())
    
    return false
  }
}