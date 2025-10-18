import { useState, useCallback, useRef } from 'react';

interface RateLimitState {
  isActive: boolean;
  lastRequestTime: number;
  requestCount: number;
  cooldownUntil: number;
}

export const useRateLimit = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isActive: false,
    lastRequestTime: 0,
    requestCount: 0,
    cooldownUntil: 0,
  });

  const requestQueue = useRef<Array<() => Promise<any>>>([]);
  const isProcessing = useRef(false);

  // Função para fazer requisições com throttling
  const throttledRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    delay: number = 1000
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          const now = Date.now();
          
          // Verificar se estamos em cooldown
          if (now < rateLimitState.cooldownUntil) {
            const waitTime = rateLimitState.cooldownUntil - now;
            console.log(`⏳ Em cooldown, aguardando ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

          // Verificar se precisamos de delay entre requisições
          const timeSinceLastRequest = now - rateLimitState.lastRequestTime;
          if (timeSinceLastRequest < delay) {
            const waitTime = delay - timeSinceLastRequest;
            console.log(`⏳ Throttling, aguardando ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }

          // Atualizar estado
          setRateLimitState(prev => ({
            ...prev,
            lastRequestTime: Date.now(),
            requestCount: prev.requestCount + 1,
          }));

          // Executar requisição
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          // Se for erro 429, ativar cooldown
          if (error instanceof Error && error.message.includes('429')) {
            const cooldownTime = 30000; // 30 segundos
            setRateLimitState(prev => ({
              ...prev,
              isActive: true,
              cooldownUntil: Date.now() + cooldownTime,
            }));
            
            // Auto-desativar após cooldown
            setTimeout(() => {
              setRateLimitState(prev => ({
                ...prev,
                isActive: false,
                cooldownUntil: 0,
              }));
            }, cooldownTime);
          }
          reject(error);
        }
      };

      requestQueue.current.push(executeRequest);
      processQueue();
    });
  }, [rateLimitState]);

  // Processar fila de requisições
  const processQueue = useCallback(async () => {
    if (isProcessing.current || requestQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;

    while (requestQueue.current.length > 0) {
      const request = requestQueue.current.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Erro na requisição da fila:', error);
        }
      }
    }

    isProcessing.current = false;
  }, []);

  // Função para resetar o rate limiting
  const resetRateLimit = useCallback(() => {
    setRateLimitState({
      isActive: false,
      lastRequestTime: 0,
      requestCount: 0,
      cooldownUntil: 0,
    });
    requestQueue.current = [];
    isProcessing.current = false;
  }, []);

  // Função para ativar rate limiting manualmente
  const activateRateLimit = useCallback((duration: number = 30000) => {
    setRateLimitState(prev => ({
      ...prev,
      isActive: true,
      cooldownUntil: Date.now() + duration,
    }));

    // Auto-desativar após duração
    setTimeout(() => {
      setRateLimitState(prev => ({
        ...prev,
        isActive: false,
        cooldownUntil: 0,
      }));
    }, duration);
  }, []);

  return {
    rateLimitState,
    throttledRequest,
    resetRateLimit,
    activateRateLimit,
    isRateLimited: rateLimitState.isActive || Date.now() < rateLimitState.cooldownUntil,
  };
};



