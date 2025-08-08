import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '../firebase.js'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signOut 
} from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const loading = ref(false)
  const currentProvider = ref(null)
  
  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userDisplayName = computed(() => user.value?.displayName || '使用者')
  const userInitial = computed(() => (user.value?.displayName || 'U').charAt(0))
  const userPhotoURL = computed(() => user.value?.photoURL)
  
  // Helper function to create provider instance
  const createProvider = (providerId) => {
    switch (providerId) {
      case 'google':
        return new GoogleAuthProvider()
      case 'facebook':
        return new FacebookAuthProvider()
      case 'twitter':
        return new TwitterAuthProvider()
      case 'github':
        return new GithubAuthProvider()
      case 'microsoft':
        return new OAuthProvider('microsoft.com')
      case 'apple':
        return new OAuthProvider('apple.com')
      case 'yahoo':
        return new OAuthProvider('yahoo.com')
      default:
        throw new Error(`不支援的認證提供商: ${providerId}`)
    }
  }
  
  // Generic sign in with any provider
  const signInWithProvider = async (providerId) => {
    loading.value = true
    try {
      const provider = createProvider(providerId)
      
      // 設定額外的範圍或參數
      if (providerId === 'google') {
        provider.addScope('profile')
        provider.addScope('email')
      } else if (providerId === 'facebook') {
        provider.addScope('email')
        provider.addScope('public_profile')
      } else if (providerId === 'github') {
        provider.addScope('user:email')
      }
      
      const result = await signInWithPopup(auth, provider)
      user.value = result.user
      currentProvider.value = providerId
      
      // 獲取額外的認證信息
      const credential = getCredentialFromResult(result, providerId)
      
      console.log(`${providerId} 登入成功:`, {
        user: result.user.displayName,
        email: result.user.email,
        provider: providerId
      })
      
      return {
        user: result.user,
        credential,
        provider: providerId
      }
    } catch (error) {
      console.error(`${providerId} 登入失敗:`, error)
      
      // 處理不同的錯誤類型
      let errorMessage = '登入失敗，請再試一次'
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = '登入視窗被關閉'
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = '彈出視窗被阻擋，請允許彈出視窗'
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = '登入請求被取消'
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = '此網域未獲授權，請聯繫管理員'
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = `${getProviderDisplayName(providerId)} 登入尚未啟用`
      }
      
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }
  
  // Helper function to get credential from result
  const getCredentialFromResult = (result, providerId) => {
    try {
      switch (providerId) {
        case 'google':
          return GoogleAuthProvider.credentialFromResult(result)
        case 'facebook':
          return FacebookAuthProvider.credentialFromResult(result)
        case 'twitter':
          return TwitterAuthProvider.credentialFromResult(result)
        case 'github':
          return GithubAuthProvider.credentialFromResult(result)
        case 'microsoft':
        case 'apple':
        case 'yahoo':
          return OAuthProvider.credentialFromResult(result)
        default:
          return null
      }
    } catch (error) {
      console.warn('無法獲取認證憑據:', error)
      return null
    }
  }
  
  // Helper function to get provider display name
  const getProviderDisplayName = (providerId) => {
    const names = {
      google: 'Google',
      facebook: 'Facebook',
      twitter: 'Twitter',
      github: 'GitHub',
      microsoft: 'Microsoft',
      apple: 'Apple',
      yahoo: 'Yahoo'
    }
    return names[providerId] || providerId
  }
  
  // Legacy method for backward compatibility
  const signInWithGoogle = async () => {
    return await signInWithProvider('google')
  }
  
  // Mock 登入 (僅開發模式)
  const mockSignIn = async () => {
    if (import.meta.env.PROD) {
      throw new Error('Mock 登入僅限開發環境使用')
    }
    
    loading.value = true
    
    try {
      // 創建 Mock 用戶物件
      const mockUser = {
        uid: 'mock-user-' + Date.now(),
        email: 'dev@example.com',
        displayName: '開發測試用戶',
        photoURL: 'https://via.placeholder.com/150?text=DEV',
        emailVerified: true,
        metadata: {
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        }
      }
      
      user.value = mockUser
      currentProvider.value = 'mock'
      
      console.log('Mock 登入成功:', mockUser)
      
      return {
        user: mockUser,
        credential: null,
        provider: 'mock'
      }
    } catch (error) {
      console.error('Mock 登入失敗:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      // 如果是 Mock 用戶，直接清除
      if (currentProvider.value === 'mock') {
        user.value = null
        currentProvider.value = null
        return
      }
      
      await signOut(auth)
      user.value = null
      currentProvider.value = null
    } catch (error) {
      console.error('登出失敗:', error)
      throw error
    }
  }
  
  const setUser = (newUser) => {
    user.value = newUser
  }
  
  return {
    // State
    user,
    loading,
    currentProvider,
    // Getters
    isAuthenticated,
    userDisplayName,
    userInitial,
    userPhotoURL,
    // Actions
    signInWithProvider,
    signInWithGoogle, // 保持向後相容
    mockSignIn, // Mock 登入
    logout,
    setUser,
    // Helper functions
    getProviderDisplayName
  }
})