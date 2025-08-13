import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  networkLatency: number;
  renderTime: number;
  deviceCount: number;
  timestamp: number;
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [renderStartTime, setRenderStartTime] = useState<number>(0);

  // Monitorar uso de memória
  const getMemoryUsage = useCallback((): PerformanceMetrics['memoryUsage'] => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / 1024 / 1024; // MB
      const total = memory.totalJSHeapSize / 1024 / 1024; // MB
      const percentage = (used / total) * 100;
      
      return { used: Math.round(used * 100) / 100, total: Math.round(total * 100) / 100, percentage: Math.round(percentage * 100) / 100 };
    }
    
    // Fallback para navegadores que não suportam performance.memory
    return { used: 0, total: 0, percentage: 0 };
  }, []);

  // Simular uso de CPU (aproximação baseada em tempo de execução)
  const getCpuUsage = useCallback((): number => {
    const start = performance.now();
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random();
    }
    const end = performance.now();
    const executionTime = end - start;
    
    // Normalizar para 0-100% (baseado em tempo de execução)
    return Math.min(100, Math.round((executionTime / 10) * 100) / 100);
  }, []);

  // Medir latência de rede
  const measureNetworkLatency = useCallback(async (): Promise<number> => {
    const start = performance.now();
    try {
      await fetch('/api/ping', { method: 'HEAD' });
    } catch {
      // Se não houver endpoint de ping, usar um teste simples
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    const end = performance.now();
    return Math.round(end - start);
  }, []);

  // Calcular tempo de renderização
  const getRenderTime = useCallback((): number => {
    if (renderStartTime > 0) {
      const renderTime = performance.now() - renderStartTime;
      setRenderStartTime(0);
      return Math.round(renderTime);
    }
    return 0;
  }, [renderStartTime]);

  // Iniciar monitoramento
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    setRenderStartTime(performance.now());
  }, []);

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Coletar métricas
  const collectMetrics = useCallback(async (deviceCount: number = 0) => {
    const memoryUsage = getMemoryUsage();
    const cpuUsage = getCpuUsage();
    const networkLatency = await measureNetworkLatency();
    const renderTime = getRenderTime();

    const newMetrics: PerformanceMetrics = {
      memoryUsage,
      cpuUsage,
      networkLatency,
      renderTime,
      deviceCount,
      timestamp: Date.now()
    };

    setMetrics(newMetrics);

    // Verificar alertas de performance
    const newAlerts: PerformanceAlert[] = [];

    if (memoryUsage.percentage > 80) {
      newAlerts.push({
        type: 'warning',
        message: `Uso de memória alto: ${memoryUsage.percentage}%`,
        timestamp: Date.now()
      });
    }

    if (memoryUsage.percentage > 90) {
      newAlerts.push({
        type: 'error',
        message: `Uso de memória crítico: ${memoryUsage.percentage}%`,
        timestamp: Date.now()
      });
    }

    if (cpuUsage > 70) {
      newAlerts.push({
        type: 'warning',
        message: `Uso de CPU alto: ${cpuUsage}%`,
        timestamp: Date.now()
      });
    }

    if (networkLatency > 1000) {
      newAlerts.push({
        type: 'warning',
        message: `Latência de rede alta: ${networkLatency}ms`,
        timestamp: Date.now()
      });
    }

    if (renderTime > 100) {
      newAlerts.push({
        type: 'info',
        message: `Tempo de renderização: ${renderTime}ms`,
        timestamp: Date.now()
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-10)); // Manter apenas os últimos 10 alertas
    }

    return newMetrics;
  }, [getMemoryUsage, getCpuUsage, measureNetworkLatency, getRenderTime]);

  // Limpar alertas antigos
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Monitoramento contínuo
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      collectMetrics();
    }, 5000); // Coletar métricas a cada 5 segundos

    return () => clearInterval(interval);
  }, [isMonitoring, collectMetrics]);

  return {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    collectMetrics,
    clearAlerts
  };
};
