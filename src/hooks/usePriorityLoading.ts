import { useState, useCallback } from 'react';

export type LoadingPriority = 
  | 'top-cards'      // Cards do topo (dispositivos, online, offline, etc.)
  | 'performance'    // Card de performance da frota
  | 'alerts'         // Card de alertas e notificações
  | 'status'         // Cards de status e comportamento
  | 'analytics'      // Cards de análise e relatórios
  | 'devices-list';  // Lista de dispositivos

interface PriorityLoadingState {
  'top-cards': boolean;
  'performance': boolean;
  'alerts': boolean;
  'status': boolean;
  'analytics': boolean;
  'devices-list': boolean;
}

export const usePriorityLoading = () => {
  const [loadingStates, setLoadingStates] = useState<PriorityLoadingState>({
    'top-cards': false,
    'performance': false,
    'alerts': false,
    'status': false,
    'analytics': false,
    'devices-list': false,
  });

  const [currentPriority, setCurrentPriority] = useState<LoadingPriority | null>(null);

  const updateLoadingState = useCallback((priority: LoadingPriority, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [priority]: isLoading
    }));
    
    if (isLoading) {
      setCurrentPriority(priority);
    } else {
      setCurrentPriority(null);
    }
  }, []);

  const isPriorityLoading = useCallback((priority: LoadingPriority) => {
    return loadingStates[priority];
  }, [loadingStates]);

  const getLoadingMessage = useCallback((priority: LoadingPriority) => {
    const messages = {
      'top-cards': 'Carregando métricas principais...',
      'performance': 'Carregando performance da frota...',
      'alerts': 'Carregando alertas e notificações...',
      'status': 'Carregando status dos veículos...',
      'analytics': 'Carregando análises...',
      'devices-list': 'Carregando lista de dispositivos...'
    };
    return messages[priority];
  }, []);

  const getPriorityOrder = useCallback((): LoadingPriority[] => {
    return [
      'top-cards',      // 1º - Cards do topo (mais importante)
      'performance',    // 2º - Performance da frota
      'alerts',         // 3º - Alertas e notificações
      'status',         // 4º - Status e comportamento
      'analytics',      // 5º - Análises
      'devices-list'    // 6º - Lista de dispositivos
    ];
  }, []);

  const getNextPriority = useCallback((current: LoadingPriority): LoadingPriority | null => {
    const order = getPriorityOrder();
    const currentIndex = order.indexOf(current);
    return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
  }, [getPriorityOrder]);

  const resetAllLoading = useCallback(() => {
    setLoadingStates({
      'top-cards': false,
      'performance': false,
      'alerts': false,
      'status': false,
      'analytics': false,
      'devices-list': false,
    });
    setCurrentPriority(null);
  }, []);

  return {
    loadingStates,
    currentPriority,
    updateLoadingState,
    isPriorityLoading,
    getLoadingMessage,
    getPriorityOrder,
    getNextPriority,
    resetAllLoading,
  };
};



