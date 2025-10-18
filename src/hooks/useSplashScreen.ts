import { useState, useCallback, useEffect, useRef } from 'react';

interface SplashScreenState {
  isVisible: boolean;
  message: string;
}

const PROGRESSIVE_MESSAGES = [
  "Inicializando sistema...",
  "Conectando ao servidor...",
  "Carregando dados dos dispositivos...",
  "Processando informações da frota...",
  "Organizando dados...",
  "Preparando dashboard...",
  "Finalizando carregamento..."
];

export const useSplashScreen = () => {
  const [splashState, setSplashState] = useState<SplashScreenState>({
    isVisible: true,
    message: PROGRESSIVE_MESSAGES[0]
  });

  // Debug
  console.log('useSplashScreen state:', splashState);

  const messageIndexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const minDisplayTimeRef = useRef<NodeJS.Timeout | null>(null);

  const startProgressiveMessages = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    messageIndexRef.current = 0;
    setSplashState(prev => ({
      ...prev,
      message: PROGRESSIVE_MESSAGES[0]
    }));

    intervalRef.current = setInterval(() => {
      messageIndexRef.current += 1;
      if (messageIndexRef.current < PROGRESSIVE_MESSAGES.length) {
        setSplashState(prev => ({
          ...prev,
          message: PROGRESSIVE_MESSAGES[messageIndexRef.current]
        }));
      }
    }, 2000); // Muda mensagem a cada 2 segundos
  }, []);

  const hideSplash = useCallback(() => {
    // Garantir que a splash screen seja visível por pelo menos 3 segundos
    const elapsedTime = Date.now() - (window as any).splashStartTime;
    const minDisplayTime = 3000; // 3 segundos
    
    if (elapsedTime < minDisplayTime) {
      const remainingTime = minDisplayTime - elapsedTime;
      minDisplayTimeRef.current = setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setSplashState(prev => ({
          ...prev,
          isVisible: false
        }));
        // Remover do DOM
        const splashElement = document.getElementById('trackmax-splash-screen');
        if (splashElement) {
          splashElement.remove();
        }
      }, remainingTime);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setSplashState(prev => ({
        ...prev,
        isVisible: false
      }));
      // Remover do DOM
      const splashElement = document.getElementById('trackmax-splash-screen');
      if (splashElement) {
        splashElement.remove();
      }
    }
  }, []);

  const showSplash = useCallback((message?: string) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSplashState(prev => ({
      ...prev,
      isVisible: true,
      message: message || PROGRESSIVE_MESSAGES[0]
    }));
    if (!message) {
      startProgressiveMessages();
    }
  }, [startProgressiveMessages]);

  useEffect(() => {
    // Marcar tempo de início da splash screen
    (window as any).splashStartTime = Date.now();
    
    // Inicia mensagens progressivas automaticamente
    startProgressiveMessages();

    // Auto-hide após 5 segundos como fallback
    const autoHideTimer = setTimeout(() => {
      hideSplash();
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (minDisplayTimeRef.current) {
        clearTimeout(minDisplayTimeRef.current);
      }
      clearTimeout(autoHideTimer);
    };
  }, [startProgressiveMessages, hideSplash]);

  return {
    splashState,
    hideSplash,
    showSplash,
    startProgressiveMessages
  };
};
