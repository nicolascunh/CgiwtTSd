import { useState, useEffect, useCallback } from 'react';
import { useTrackmaxApi } from './useTrackmaxApi';

interface ProgressiveLoadingState {
  devices: boolean;
  maintenances: boolean;
  drivers: boolean;
}

interface ProgressiveLoadingProgress {
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  estimatedTimeRemaining: number;
}

export const useProgressiveLoading = () => {
  const [loadingStates, setLoadingStates] = useState<ProgressiveLoadingState>({
    devices: false,
    maintenances: false,
    drivers: false,
  });

  const [progress, setProgress] = useState<ProgressiveLoadingProgress>({
    currentStep: '',
    totalSteps: 3,
    completedSteps: 0,
    percentage: 0,
    estimatedTimeRemaining: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const { fetchDevices, fetchPositions, fetchEvents, fetchTrips, fetchDrivers } = useTrackmaxApi();

  const updateLoadingState = useCallback((key: keyof ProgressiveLoadingState, value: boolean) => {
    setLoadingStates(prev => {
      const newState = { ...prev, [key]: value };
      
      // Calcular progresso
      const completedSteps = Object.values(newState).filter(Boolean).length;
      const percentage = Math.round((completedSteps / progress.totalSteps) * 100);
      
      // Estimar tempo restante
      const elapsed = Date.now() - startTime;
      const estimatedTotal = elapsed / (completedSteps / progress.totalSteps);
      const estimatedRemaining = Math.max(0, estimatedTotal - elapsed);
      
      setProgress(prevProgress => ({
        ...prevProgress,
        completedSteps,
        percentage,
        estimatedTimeRemaining: Math.round(estimatedRemaining / 1000), // em segundos
      }));
      
      return newState;
    });
  }, [progress.totalSteps, startTime]);

  const updateCurrentStep = useCallback((step: string) => {
    setProgress(prev => ({ ...prev, currentStep: step }));
  }, []);

  const loadDataProgressively = useCallback(async (
    deviceIds: number[],
    rangeStart: Date,
    rangeEnd: Date
  ) => {
    setIsLoading(true);
    setStartTime(Date.now());
    
    // Reset states
    setLoadingStates({
      devices: false,
      maintenances: false,
      drivers: false,
    });

    setProgress({
      currentStep: 'Iniciando carregamento...',
      totalSteps: 3,
      completedSteps: 0,
      percentage: 0,
      estimatedTimeRemaining: 0,
    });

    try {
      // Passo 1: Carregar dispositivos (já carregados)
      updateCurrentStep('Dispositivos carregados');
      updateLoadingState('devices', true);

            // Passo 2: Carregar manutenções (simulado)
            updateCurrentStep('Carregando manutenções...');
            const maintenancesPromise = Promise.resolve([]);

      // Passo 3: Carregar motoristas
      updateCurrentStep('Carregando motoristas...');
      const driversPromise = fetchDrivers();

      // Aguardar todos os dados paralelos
      const [maintenanceData, driversData] = await Promise.all([
        maintenancesPromise,
        driversPromise,
      ]);

      // Marcar todos como carregados
      updateLoadingState('maintenances', true);
      updateLoadingState('drivers', true);

      updateCurrentStep('Carregamento concluído!');

            return {
              maintenances: [],
              drivers: driversData,
            };

    } catch (error) {
      console.error('Erro no carregamento progressivo:', error);
      updateCurrentStep('Erro no carregamento');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchDevices, fetchPositions, fetchEvents, fetchTrips, fetchDrivers, updateLoadingState, updateCurrentStep]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);
  const allLoaded = Object.values(loadingStates).every(Boolean);

  return {
    loadingStates,
    progress,
    isLoading,
    isAnyLoading,
    allLoaded,
    loadDataProgressively,
    updateLoadingState,
    updateCurrentStep,
  };
};
