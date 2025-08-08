import { ref } from 'vue'

export function useAuthProviders() {
  const availableProviders = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 定義所有可能的認證提供商
  const providerConfigs = {
    'google.com': {
      id: 'google',
      name: 'Google',
      icon: '🔍',
      color: '#4285f4',
      textColor: '#ffffff'
    },
    'facebook.com': {
      id: 'facebook',
      name: 'Facebook', 
      icon: '📘',
      color: '#1877f2',
      textColor: '#ffffff'
    },
    'github.com': {
      id: 'github',
      name: 'GitHub',
      icon: '🐱',
      color: '#333333',
      textColor: '#ffffff'
    },
    'twitter.com': {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: '#1da1f2',
      textColor: '#ffffff'
    }
  }

  // 立即設置預設提供商
  const initializeProviders = () => {
    console.log('初始化認證提供商...')
    
    // 預設只啟用 Google
    const defaultProviders = [providerConfigs['google.com']]
    
    // 檢查環境變數
    try {
      const configuredProviders = []
      
      // Google (預設啟用)
      configuredProviders.push(providerConfigs['google.com'])
      
      // 根據環境變數添加其他提供商
      if (import.meta?.env?.VITE_ENABLE_FACEBOOK_AUTH === 'true') {
        configuredProviders.push(providerConfigs['facebook.com'])
      }
      
      if (import.meta?.env?.VITE_ENABLE_GITHUB_AUTH === 'true') {
        configuredProviders.push(providerConfigs['github.com'])
      }
      
      if (import.meta?.env?.VITE_ENABLE_TWITTER_AUTH === 'true') {
        configuredProviders.push(providerConfigs['twitter.com'])
      }
      
      availableProviders.value = configuredProviders
      console.log('認證提供商已設置:', configuredProviders.map(p => p.name))
      
    } catch (err) {
      console.warn('讀取環境變數失敗，使用預設設定:', err)
      availableProviders.value = defaultProviders
    }
    
    loading.value = false
    error.value = null
  }

  // 手動添加提供商（開發模式使用）
  const addProvider = (providerId) => {
    const providerKey = Object.keys(providerConfigs).find(key => 
      providerConfigs[key].id === providerId
    )
    
    if (providerKey && !availableProviders.value.find(p => p.id === providerId)) {
      availableProviders.value.push(providerConfigs[providerKey])
    }
  }

  // 移除提供商
  const removeProvider = (providerId) => {
    availableProviders.value = availableProviders.value.filter(p => p.id !== providerId)
  }

  // 立即初始化
  initializeProviders()

  return {
    availableProviders,
    loading,
    error,
    addProvider,
    removeProvider,
    providerConfigs
  }
}