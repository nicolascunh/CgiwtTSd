import { useState, useEffect, useCallback } from 'react';
import { Event } from '../types';
import { getApiUrlSync } from '../config/api';

interface UseRealtimeEventsOptions {
  enabled?: boolean;
  onEvent?: (event: Event) => void;
  onError?: (error: Error) => void;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
}

export const useRealtimeEvents = (options: UseRealtimeEventsOptions = {}) => {
  const {
    enabled = true,
    onEvent,
    onError,
    fallbackToPolling = true,
    pollingInterval = 5000
  } = options;

  const [events, setEvents] = useState<Event[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);

  // Função para buscar eventos via polling
  const fetchEvents = useCallback(async () => {
    try {
      const apiBase = getApiUrlSync();
      const url = new URL(`${apiBase.replace(/\/$/, '')}/reports/events`);
      const to = new Date();
      const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
      url.searchParams.set('pageSize', '10');
      url.searchParams.set('from', from.toISOString());
      url.searchParams.set('to', to.toISOString());

      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (typeof window !== 'undefined') {
        const basic = localStorage.getItem('auth-basic');
        if (basic) {
          headers['Authorization'] = `Basic ${basic}`;
        }
      }

      const response = await fetch(url.toString(), {
        credentials: 'include',
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setEvents(prev => {
            const newEvents = data.filter(newEvent => 
              !prev.some(existingEvent => existingEvent.id === newEvent.id)
            );
            if (newEvents.length > 0) {
              newEvents.forEach(event => onEvent?.(event));
            }
            return [...newEvents, ...prev].slice(0, 100); // Manter apenas os 100 mais recentes
          });
        }
      }
    } catch (error) {
      console.error('Erro no polling de eventos:', error);
      onError?.(error as Error);
    }
  }, [onEvent, onError]);

  // Função para iniciar polling
  const startPolling = useCallback(() => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }
    
    const timer = setInterval(fetchEvents, pollingInterval);
    setPollingTimer(timer);
    console.log('🔄 Polling iniciado com intervalo de', pollingInterval, 'ms');
  }, [fetchEvents, pollingInterval, pollingTimer]);

  // Função para parar polling
  const stopPolling = useCallback(() => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      setPollingTimer(null);
      console.log('⏹️ Polling parado');
    }
  }, [pollingTimer]);

  // Função para conectar via SSE
  const connectSSE = useCallback(() => {
    if (eventSource) {
      eventSource.close();
    }

    try {
      const apiBase = getApiUrlSync();
      const sseUrl = `${apiBase.replace(/\/api$/, '')}/sse/events`;
      const basic = typeof window !== 'undefined' ? localStorage.getItem('auth-basic') : null;
      const urlWithToken =
        basic && sseUrl.indexOf('token=') === -1
          ? `${sseUrl}${sseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(basic)}`
          : sseUrl;
      const sse = new EventSource(urlWithToken, { withCredentials: true });
      setEventSource(sse);

      sse.onopen = () => {
        console.log('🔗 SSE conectado');
        setIsConnected(true);
        setConnectionError(null);
        if (fallbackToPolling) {
          stopPolling();
        }
      };

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data === 'object') {
            const newEvent = data as Event;
            setEvents(prev => {
              const exists = prev.some(existingEvent => existingEvent.id === newEvent.id);
              if (!exists) {
                onEvent?.(newEvent);
                return [newEvent, ...prev].slice(0, 100);
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Erro ao processar evento SSE:', error);
        }
      };

      sse.onerror = (error) => {
        console.error('❌ Erro na conexão SSE:', error);
        setIsConnected(false);
        setConnectionError(new Error('Erro na conexão SSE'));
        onError?.(new Error('Erro na conexão SSE'));
        
        // Fallback para polling se habilitado
        if (fallbackToPolling) {
          console.log('🔄 Fallback para polling');
          startPolling();
        }
      };

    } catch (error) {
      console.error('Erro ao criar SSE:', error);
      setConnectionError(error as Error);
      onError?.(error as Error);
      
      if (fallbackToPolling) {
        startPolling();
      }
    }
  }, [eventSource, fallbackToPolling, onEvent, onError, startPolling, stopPolling]);

  // Função para desconectar
  const disconnect = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    stopPolling();
    setIsConnected(false);
    console.log('🔌 Desconectado');
  }, [eventSource, stopPolling]);

  // Efeito para gerenciar conexão
  useEffect(() => {
    if (enabled) {
      connectSSE();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connectSSE, disconnect]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    events,
    isConnected,
    connectionError,
    connect: connectSSE,
    disconnect,
    startPolling,
    stopPolling
  };
};
