import { ref, onMounted } from 'vue'
import { auth } from '../firebase.js'
import { fetchSignInMethodsForEmail, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, GithubAuthProvider, OAuthProvider } from 'firebase/auth'

export function useAuthProviders() {
  const availableProviders = ref([])
  const loading = ref(true)
  const error = ref(null)

  // 定義所有可能的認證提供商
  const providerConfigs = {
    'google.com': {
      id: 'google',
      name: 'Google',
      icon: '🔍',
      provider: GoogleAuthProvider,
      color: '#4285f4',
      textColor: '#ffffff'
    },
    'facebook.com': {
      id: 'facebook',
      name: 'Facebook', 
      icon: '📘',
      provider: FacebookAuthProvider,
      color: '#1877f2',
      textColor: '#ffffff'
    },
    'twitter.com': {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      provider: TwitterAuthProvider,
      color: '#1da1f2',
      textColor: '#ffffff'
    },
    'github.com': {
      id: 'github',
      name: 'GitHub',
      icon: '🐱',
      provider: GithubAuthProvider,
      color: '#333333',
      textColor: '#ffffff'
    },
    'microsoft.com': {
      id: 'microsoft',
      name: 'Microsoft',
      icon: '🏢',
      provider: () => new OAuthProvider('microsoft.com'),
      color: '#00a1f1',
      textColor: '#ffffff'
    },
    'apple.com': {
      id: 'apple',
      name: 'Apple',
      icon: '🍎',
      provider: () => new OAuthProvider('apple.com'),
      color: '#000000',
      textColor: '#ffffff'
    },
    'yahoo.com': {
      id: 'yahoo',
      name: 'Yahoo',
      icon: '💜',
      provider: () => new OAuthProvider('yahoo.com'),
      color: '#6001d2',
      textColor: '#ffffff'
    },
    'password': {
      id: 'email',
      name: 'Email',
      icon: '📧',
      provider: null, // 需要特殊處理
      color: '#34a853',
      textColor: '#ffffff'
    },
    'phone': {
      id: 'phone',
      name: '手機號碼',
      icon: '📱',
      provider: null, // 需要特殊處理
      color: '#ff6d01',
      textColor: '#ffffff'
    }
  }

  // 檢測可用的認證提供商
  const detectAvailableProviders = async () => {
    try {
      loading.value = true
      error.value = null

      // 方法1: 嘗試檢測已配置的提供商（需要一個測試email）
      // 注意：這個方法需要一個真實的email來檢測，但可能不是最好的方法
      
      // 方法2: 基於常見配置檢測（推薦方法）
      // 我們使用一個更實用的方法：根據專案設定檢測
      const detectedProviders = []
      
      // 檢測 Google (最常用)
      try {
        const googleProvider = new GoogleAuthProvider()
        if (googleProvider) {
          detectedProviders.push(providerConfigs['google.com'])
        }
      } catch (e) {
        console.log('Google provider not available')
      }

      // 檢測 Facebook
      try {
        const facebookProvider = new FacebookAuthProvider()
        if (facebookProvider) {
          detectedProviders.push(providerConfigs['facebook.com'])
        }
      } catch (e) {
        console.log('Facebook provider not available')
      }

      // 檢測 GitHub
      try {
        const githubProvider = new GithubAuthProvider()
        if (githubProvider) {
          detectedProviders.push(providerConfigs['github.com'])
        }
      } catch (e) {
        console.log('GitHub provider not available')
      }

      // 檢測 Twitter
      try {
        const twitterProvider = new TwitterAuthProvider()
        if (twitterProvider) {
          detectedProviders.push(providerConfigs['twitter.com'])
        }
      } catch (e) {
        console.log('Twitter provider not available')
      }

      // 如果沒有檢測到任何提供商，至少提供 Google 作為預設
      if (detectedProviders.length === 0) {
        detectedProviders.push(providerConfigs['google.com'])
      }

      availableProviders.value = detectedProviders
      
    } catch (err) {
      console.error('檢測認證提供商時發生錯誤:', err)
      error.value = err.message
      // 發生錯誤時，使用預設的 Google 登入
      availableProviders.value = [providerConfigs['google.com']]
    } finally {
      loading.value = false
    }
  }

  // 更精確的檢測方法：通過測試 email 檢測可用提供商
  const detectProvidersForEmail = async (testEmail = 'test@example.com') => {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, testEmail)
      const detectedProviders = []

      signInMethods.forEach(method => {
        if (providerConfigs[method]) {
          detectedProviders.push(providerConfigs[method])
        }
      })

      // 如果通過 email 檢測沒有結果，使用預設檢測
      if (detectedProviders.length === 0) {
        await detectAvailableProviders()
      } else {
        availableProviders.value = detectedProviders
      }
    } catch (err) {
      console.log('無法通過 email 檢測提供商，使用預設檢測')
      await detectAvailableProviders()
    }
  }

  // 手動添加提供商（用於管理員手動配置）
  const addProvider = (providerId) => {
    if (providerConfigs[providerId] && !availableProviders.value.find(p => p.id === providerId)) {
      availableProviders.value.push(providerConfigs[providerId])
    }
  }

  // 移除提供商
  const removeProvider = (providerId) => {
    availableProviders.value = availableProviders.value.filter(p => p.id !== providerId)
  }

  // 根據環境變數或配置檔案設置提供商
  const initProvidersFromConfig = () => {
    loading.value = true
    error.value = null
    
    try {
      const configuredProviders = []
      
      // 檢查環境變數或配置，使用簡單的字符串檢查避免 import.meta 問題
      const envVars = {
        google: import.meta?.env?.VITE_ENABLE_GOOGLE_AUTH,
        facebook: import.meta?.env?.VITE_ENABLE_FACEBOOK_AUTH,
        github: import.meta?.env?.VITE_ENABLE_GITHUB_AUTH,
        twitter: import.meta?.env?.VITE_ENABLE_TWITTER_AUTH,
        microsoft: import.meta?.env?.VITE_ENABLE_MICROSOFT_AUTH,
        apple: import.meta?.env?.VITE_ENABLE_APPLE_AUTH,
        yahoo: import.meta?.env?.VITE_ENABLE_YAHOO_AUTH
      }
      
      // Google 預設啟用（除非明確設為 false）
      if (envVars.google !== 'false') {
        configuredProviders.push(providerConfigs['google.com'])
      }
      
      // 其他提供商需要明確啟用
      if (envVars.facebook === 'true') {
        configuredProviders.push(providerConfigs['facebook.com'])
      }
      
      if (envVars.github === 'true') {
        configuredProviders.push(providerConfigs['github.com'])
      }
      
      if (envVars.twitter === 'true') {
        configuredProviders.push(providerConfigs['twitter.com'])
      }
      
      if (envVars.microsoft === 'true') {
        configuredProviders.push(providerConfigs['microsoft.com'])
      }
      
      if (envVars.apple === 'true') {
        configuredProviders.push(providerConfigs['apple.com'])
      }
      
      if (envVars.yahoo === 'true') {
        configuredProviders.push(providerConfigs['yahoo.com'])
      }

      // 如果沒有配置任何提供商，使用 Google 作為預設
      if (configuredProviders.length === 0) {
        configuredProviders.push(providerConfigs['google.com'])
      }

      availableProviders.value = configuredProviders
      console.log('已載入認證提供商:', configuredProviders.map(p => p.name))
      
    } catch (err) {
      console.error('配置認證提供商時發生錯誤:', err)
      // 發生錯誤時使用 Google 作為預設
      availableProviders.value = [providerConfigs['google.com']]
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // 立即執行初始化，不等待 onMounted
  const initialize = () => {
    try {
      initProvidersFromConfig()
    } catch (error) {
      console.error('初始化認證提供商失敗:', error)
      // 發生錯誤時使用預設 Google 登入
      availableProviders.value = [providerConfigs['google.com']]
      loading.value = false
      error.value = null
    }
  }
  
  // 立即初始化
  initialize()
  
  onMounted(() => {
    // 如果還在載入中，再次嘗試初始化
    if (loading.value) {
      initialize()
    }
  })

  return {
    availableProviders,
    loading,
    error,
    detectAvailableProviders,
    detectProvidersForEmail,
    addProvider,
    removeProvider,
    providerConfigs
  }
}