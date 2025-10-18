import { useEffect, useRef } from 'react';
import { getApiUrlSync } from '../config/api';
import type { Device, Event, Position } from '../types';

type RealtimeCallbacks = {
  enabled?: boolean;
  onPositions?: (positions: Position[]) => void;
  onDevices?: (devices: Device[]) => void;
  onEvents?: (events: Event[]) => void;
  onError?: (error: unknown) => void;
};

const buildWebSocketUrl = (apiUrl: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  let url: URL;
  try {
    if (apiUrl.startsWith('http')) {
      url = new URL(apiUrl);
    } else {
      url = new URL(apiUrl, window.location.origin);
    }
  } catch (error) {
    console.error('⚠️ Não foi possível montar a URL do WebSocket:', error);
    return null;
  }

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const base = url.toString().replace(/\/$/, '');
  return `${base}/socket`;
};

export const useTrackmaxRealtime = ({
  enabled = true,
  onPositions,
  onDevices,
  onEvents,
  onError,
}: RealtimeCallbacks) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return () => {};
    }

    const apiUrl = getApiUrlSync();
    const wsBaseUrl = buildWebSocketUrl(apiUrl);
    if (!wsBaseUrl) {
      return () => {};
    }

    const basicToken = typeof window !== "undefined" ? localStorage.getItem("auth-basic") : null;
    const wsUrl =
      basicToken && wsBaseUrl.indexOf("token=") === -1
        ? `${wsBaseUrl}${wsBaseUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(basicToken)}`
        : wsBaseUrl;
    let shouldReconnect = true;

    const connect = () => {
      if (!shouldReconnect) {
        return;
      }

      try {
        console.log('🔌 Conectando ao WebSocket Trackmax:', wsUrl);
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log('✅ WebSocket conectado');
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);

            if (payload.positions && Array.isArray(payload.positions) && onPositions) {
              onPositions(payload.positions as Position[]);
            }

            if (payload.devices && Array.isArray(payload.devices) && onDevices) {
              onDevices(payload.devices as Device[]);
            }

            if (payload.events && Array.isArray(payload.events) && onEvents) {
              onEvents(payload.events as Event[]);
            }
          } catch (error) {
            console.error('⚠️ Erro ao interpretar mensagem do WebSocket:', error);
            onError?.(error);
          }
        };

        socket.onerror = (error) => {
          console.error('❌ Erro no WebSocket:', error);
          onError?.(error);
          socket.close();
        };

        socket.onclose = () => {
          wsRef.current = null;
          if (!shouldReconnect) {
            return;
          }
          console.warn('⚠️ WebSocket desconectado. Tentando reconectar em 5s...');
          reconnectRef.current = setTimeout(connect, 5000);
        };
      } catch (error) {
        console.error('❌ Erro ao conectar WebSocket:', error);
        onError?.(error);
        reconnectRef.current = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enabled, onDevices, onEvents, onPositions, onError]);
};
