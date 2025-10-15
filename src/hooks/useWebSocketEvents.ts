import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Event } from '../types';

interface UseWebSocketEventsOptions {
  enabled?: boolean;
  serverUrl?: string;
  onEvent?: (event: Event) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (connected: boolean) => void;
}

export const useWebSocketEvents = (options: UseWebSocketEventsOptions = {}) => {
  const {
    enabled = true,
    serverUrl = 'https://trackmax-websocket.railway.app', // URL do servidor WebSocket
    onEvent,
    onError,
    onStatusChange
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTraccarConnected, setIsTraccarConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  // Função para conectar
  const connect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }

    try {
      console.log('🔗 Conectando ao servidor WebSocket:', serverUrl);
      
      const newSocket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('✅ Conectado ao servidor WebSocket');
        setIsConnected(true);
        setConnectionError(null);
        onStatusChange?.(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Desconectado do servidor WebSocket:', reason);
        setIsConnected(false);
        onStatusChange?.(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Erro ao conectar:', error);
        setConnectionError(error);
        onError?.(error);
      });

      // Status da conexão Traccar
      newSocket.on('traccar-status', (status) => {
        console.log('📡 Status Traccar:', status);
        setIsTraccarConnected(status.connected);
      });

      // Eventos do Traccar
      newSocket.on('traccar-event', (event: Event) => {
        console.log('📨 Evento recebido:', event.type || 'unknown');
        
        setEvents(prev => {
          const exists = prev.some(existingEvent => existingEvent.id === event.id);
          if (!exists) {
            onEvent?.(event);
            return [event, ...prev].slice(0, 100); // Manter apenas os 100 mais recentes
          }
          return prev;
        });
      });

      // Ping/pong para manter conexão viva
      newSocket.on('pong', () => {
        console.log('🏓 Pong recebido');
      });

      setSocket(newSocket);

    } catch (error) {
      console.error('❌ Erro ao criar socket:', error);
      setConnectionError(error as Error);
      onError?.(error as Error);
    }
  }, [socket, serverUrl, onEvent, onError, onStatusChange]);

  // Função para desconectar
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setIsConnected(false);
    setIsTraccarConnected(false);
    console.log('🔌 Desconectado');
  }, [socket]);

  // Função para enviar ping
  const ping = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('ping');
    }
  }, [socket, isConnected]);

  // Efeito para gerenciar conexão
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Ping periódico para manter conexão viva
  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(ping, 30000); // Ping a cada 30 segundos
      return () => clearInterval(pingInterval);
    }
  }, [isConnected, ping]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    isTraccarConnected,
    connectionError,
    events,
    connect,
    disconnect,
    ping
  };
};
