import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RotateCcw,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { useWebSocketEvents } from '../hooks/useWebSocketEvents';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

interface WebSocketStatusProps {
  serverUrl?: string;
  showEvents?: boolean;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  serverUrl = 'https://trackmax-websocket.railway.app',
  showEvents = true
}) => {
  // WebSocket (se servidor estiver disponível)
  const {
    isConnected: wsConnected,
    isTraccarConnected,
    connectionError: wsError,
    connect: wsConnect,
    disconnect: wsDisconnect,
    events: wsEvents
  } = useWebSocketEvents({
    enabled: false, // Desabilitado por padrão até ter servidor
    serverUrl,
    onEvent: (event) => {
      console.log('WebSocket Event:', event);
    },
    onError: (error) => {
      console.error('WebSocket Error:', error);
    }
  });

  // SSE como fallback
  const {
    isConnected: sseConnected,
    connectionError: sseError,
    connect: sseConnect,
    disconnect: sseDisconnect,
    events: sseEvents
  } = useRealtimeEvents({
    enabled: true,
    onEvent: (event) => {
      console.log('SSE Event:', event);
    },
    onError: (error) => {
      console.error('SSE Error:', error);
    }
  });

  const handleWebSocketToggle = () => {
    if (wsConnected) {
      wsDisconnect();
    } else {
      wsConnect();
    }
  };

  const handleSSEToggle = () => {
    if (sseConnected) {
      sseDisconnect();
    } else {
      sseConnect();
    }
  };

  const getStatusVariant = (connected: boolean) => {
    return connected ? 'default' : 'destructive';
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />;
  };

  return (
    <Card className="my-4">
      <CardHeader>
        <CardTitle>Status de Conexão em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* WebSocket Status */}
        <div>
          <h5 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Wifi className="w-5 h-5" /> WebSocket (Servidor Próprio)
          </h5>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant={getStatusVariant(wsConnected)} className="flex items-center gap-1">
              {getStatusIcon(wsConnected)}
              {wsConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
            {isTraccarConnected && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Traccar Conectado
              </Badge>
            )}
            <Button 
              size="sm" 
              onClick={handleWebSocketToggle}
              variant={wsConnected ? "destructive" : "default"}
            >
              {wsConnected ? (
                <>
                  <WifiOff className="w-4 h-4 mr-1" />
                  Desconectar
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-1" />
                  Conectar
                </>
              )}
            </Button>
          </div>
          {wsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Erro WebSocket</p>
              <p className="text-sm text-red-600">{wsError.message}</p>
            </div>
          )}
        </div>

        {/* SSE Status */}
        <div>
          <h5 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <RotateCcw className="w-5 h-5" /> Server-Sent Events (Fallback)
          </h5>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant={getStatusVariant(sseConnected)} className="flex items-center gap-1">
              {getStatusIcon(sseConnected)}
              {sseConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
            <Button 
              size="sm" 
              onClick={handleSSEToggle}
              variant={sseConnected ? "destructive" : "default"}
            >
              {sseConnected ? (
                <>
                  <WifiOff className="w-4 h-4 mr-1" />
                  Desconectar
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Conectar
                </>
              )}
            </Button>
          </div>
          {sseError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Erro SSE</p>
              <p className="text-sm text-red-600">{sseError.message}</p>
            </div>
          )}
        </div>

        {/* Eventos */}
        {showEvents && (
          <div>
            <h5 className="text-lg font-semibold mb-3">Eventos Recebidos</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">WebSocket:</span>
                <Badge variant="secondary">{wsEvents.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">SSE:</span>
                <Badge variant="secondary">{sseEvents.length}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Total: {wsEvents.length + sseEvents.length} eventos
              </p>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h6 className="font-semibold text-blue-800 mb-2">Como usar WebSocket</h6>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. <strong>Deploy do servidor:</strong> Use Railway, Render ou Fly.io</p>
            <p>2. <strong>Configure a URL:</strong> Atualize serverUrl no componente</p>
            <p>3. <strong>Habilite WebSocket:</strong> Mude enabled para true</p>
            <p>4. <strong>Fallback automático:</strong> SSE funciona como backup</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
