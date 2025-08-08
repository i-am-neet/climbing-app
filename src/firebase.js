import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

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
export default app