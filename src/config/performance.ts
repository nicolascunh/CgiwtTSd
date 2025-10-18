// Configurações de Performance Otimizadas para Notebook
export const PERFORMANCE_CONFIG = {
  // Configurações de Paginação
  pagination: {
    defaultPageSize: 30, // Reduzido para notebook
    maxDevicesPerRequest: 50, // Reduzido para notebook
    infiniteScrollThreshold: 20, // Carregar mais quando restar 20 itens
  },

  // Configurações do Mapa
  map: {
    maxMarkersVisible: 200, // Reduzido para notebook
    clusterRadius: 40, // Raio menor para clusters
    markerUpdateInterval: 10000, // Atualizar marcadores a cada 10s
    enableClustering: true,
  },

  // Configurações de Cache
  cache: {
    deviceCacheTime: 30000, // 30 segundos
    positionCacheTime: 15000, // 15 segundos
    maxCachedDevices: 100, // Máximo 100 dispositivos em cache
    enableMemoryCache: true,
  },

  // Configurações de Monitoramento
  monitoring: {
    updateInterval: 5000, // Coletar métricas a cada 5s
    memoryThreshold: 70, // Alertar quando memória > 70%
    cpuThreshold: 60, // Alertar quando CPU > 60%
    networkThreshold: 800, // Alertar quando latência > 800ms
    enableAutoOptimization: true,
  },

  // Configurações de Renderização
  rendering: {
    virtualScrollThreshold: 50, // Virtualizar após 50 itens
    lazyLoadImages: true,
    debounceSearch: 300, // Debounce de busca em 300ms
    enableSkeletonLoading: true,
  },

  // Configurações de Rede
  network: {
    requestTimeout: 10000, // Timeout de 10s
    retryAttempts: 2, // Tentar 2 vezes em caso de erro
    enableRequestQueue: true,
    maxConcurrentRequests: 3, // Máximo 3 requisições simultâneas
  },

  // Configurações de UI/UX
  ui: {
    enableSmoothAnimations: false, // Desabilitar animações para melhor performance
    enableHoverEffects: false, // Desabilitar efeitos hover
    enableShadows: false, // Desabilitar sombras
    enableGradients: false, // Desabilitar gradientes
    enableBlurEffects: false, // Desabilitar efeitos blur
  },

  // Configurações de Bateria
  battery: {
    enableBatteryOptimization: true,
    reduceUpdateFrequency: true, // Reduzir frequência de atualizações
    enableDarkMode: true, // Usar modo escuro para economizar bateria
    disableBackgroundSync: true, // Desabilitar sincronização em background
  },

  // Configurações de Memória
  memory: {
    enableGarbageCollection: true,
    maxMemoryUsage: 100, // Máximo 100MB
    enableMemoryCompression: true,
    clearCacheOnLowMemory: true,
  },

  // Configurações de CPU
  cpu: {
    enableThrottling: true, // Reduzir uso de CPU
    maxCpuUsage: 50, // Máximo 50% de CPU
    enableIdleOptimization: true, // Otimizar quando inativo
    reduceAnimationFPS: true, // Reduzir FPS das animações
  },
};

// Função para detectar se está rodando em notebook
export const detectNotebook = (): boolean => {
  // Verificar se é um dispositivo móvel ou tem bateria
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasBattery = 'getBattery' in navigator;
  const hasTouchScreen = 'ontouchstart' in window;
  
  // Verificar resolução da tela (notebooks geralmente têm resolução menor)
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const isSmallScreen = screenWidth < 1920 || screenHeight < 1080;
  
  return isMobile || hasBattery || hasTouchScreen || isSmallScreen;
};

// Função para aplicar configurações baseadas no dispositivo
export const getOptimizedConfig = () => {
  const isNotebook = detectNotebook();
  
  if (isNotebook) {
    return {
      ...PERFORMANCE_CONFIG,
      pagination: {
        ...PERFORMANCE_CONFIG.pagination,
        defaultPageSize: 20, // Ainda menor para notebook
        maxDevicesPerRequest: 30,
      },
      map: {
        ...PERFORMANCE_CONFIG.map,
        maxMarkersVisible: 100, // Ainda menor para notebook
        markerUpdateInterval: 15000, // Atualizar a cada 15s
      },
      monitoring: {
        ...PERFORMANCE_CONFIG.monitoring,
        memoryThreshold: 60, // Alertar mais cedo
        cpuThreshold: 50, // Alertar mais cedo
      },
      ui: {
        ...PERFORMANCE_CONFIG.ui,
        enableSmoothAnimations: false,
        enableHoverEffects: false,
        enableShadows: false,
        enableGradients: false,
        enableBlurEffects: false,
      },
    };
  }
  
  return PERFORMANCE_CONFIG;
};

// Função para otimizar automaticamente baseado no uso de recursos
export const autoOptimize = (metrics: any) => {
  const config = getOptimizedConfig();
  
  if (metrics.memoryUsage.percentage > config.monitoring.memoryThreshold) {
    // Reduzir ainda mais o número de itens carregados
    config.pagination.defaultPageSize = Math.max(10, config.pagination.defaultPageSize - 5);
    config.map.maxMarkersVisible = Math.max(50, config.map.maxMarkersVisible - 25);
  }
  
  if (metrics.cpuUsage > config.monitoring.cpuThreshold) {
    // Desabilitar animações e efeitos
    config.ui.enableSmoothAnimations = false;
    config.ui.enableHoverEffects = false;
    config.ui.enableShadows = false;
    config.ui.enableGradients = false;
    config.ui.enableBlurEffects = false;
  }
  
  if (metrics.networkLatency > config.monitoring.networkThreshold) {
    // Aumentar cache e reduzir requisições
    config.cache.deviceCacheTime = config.cache.deviceCacheTime * 2;
    config.cache.positionCacheTime = config.cache.positionCacheTime * 2;
    config.network.maxConcurrentRequests = Math.max(1, config.network.maxConcurrentRequests - 1);
  }
  
  return config;
};

// Função para limpar cache e liberar memória
export const clearMemory = () => {
  // Limpar cache do navegador
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  // Forçar garbage collection (se disponível)
  if ('gc' in window) {
    (window as any).gc();
  }
  
  // Limpar localStorage se necessário
  const usedMemory = (performance as any).memory?.usedJSHeapSize || 0;
  const maxMemory = (performance as any).memory?.totalJSHeapSize || 0;
  
  if (usedMemory > maxMemory * 0.8) {
    // Limpar dados não essenciais do localStorage
    const essentialKeys = ['auth-user', 'trackmax-language', 'trackmax-theme'];
    Object.keys(localStorage).forEach(key => {
      if (!essentialKeys.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }
};

// Função para monitorar e otimizar performance em tempo real
export const startPerformanceOptimization = () => {
  let optimizationInterval: NodeJS.Timeout;
  
  const optimize = () => {
    // Verificar uso de memória
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usagePercentage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      
      if (usagePercentage > 80) {
        clearMemory();
      }
    }
    
    // Verificar se há muitas abas abertas
    if (window.performance.navigation.type === 0) {
      // Página carregada via navegação normal
      // Pode indicar que o usuário navegou para cá, otimizar
      const config = getOptimizedConfig();
      config.pagination.defaultPageSize = Math.max(10, config.pagination.defaultPageSize - 5);
    }
  };
  
  optimizationInterval = setInterval(optimize, 10000); // Otimizar a cada 10s
  
  return () => {
    if (optimizationInterval) {
      clearInterval(optimizationInterval);
    }
  };
};
