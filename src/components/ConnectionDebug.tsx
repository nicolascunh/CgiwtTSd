import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bug
} from 'lucide-react';
import { useTrackmaxApi } from '../hooks/useTrackmaxApi';
import { getApiUrl } from '../config/api';

export const ConnectionDebug: React.FC = () => {
  const { testConnection } = useTrackmaxApi();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    direct: boolean | null;
    cloudflare: boolean | null;
    netlify: boolean | null;
  }>({
    direct: null,
    cloudflare: null,
    netlify: null
  });

  const testDirectConnection = async () => {
    try {
      const credentials = localStorage.getItem('auth-credentials');
      if (!credentials) {
        console.error('❌ Nenhuma credencial encontrada');
        return false;
      }

      const response = await fetch('http://35.230.168.225:8082/api/server', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      console.log('🧪 Teste direto - Status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('🧪 Erro no teste direto:', error);
      return false;
    }
  };

  const testCloudflareConnection = async () => {
    try {
      const credentials = localStorage.getItem('auth-credentials');
      if (!credentials) {
        console.error('❌ Nenhuma credencial encontrada');
        return false;
      }

      const response = await fetch('https://trackmax-proxy.trackmax-proxy.workers.dev/api/server', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      console.log('🧪 Teste Cloudflare - Status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('🧪 Erro no teste Cloudflare:', error);
      return false;
    }
  };

  const testNetlifyConnection = async () => {
    try {
      const credentials = localStorage.getItem('auth-credentials');
      if (!credentials) {
        console.error('❌ Nenhuma credencial encontrada');
        return false;
      }

      const response = await fetch('https://dashboard-trackmax.netlify.app/.netlify/functions/proxy/server', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      console.log('🧪 Teste Netlify - Status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('🧪 Erro no teste Netlify:', error);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setTestResults({ direct: null, cloudflare: null, netlify: null });

    try {
      console.log('🧪 Iniciando testes de conectividade...');
      
      const [direct, cloudflare, netlify] = await Promise.all([
        testDirectConnection(),
        testCloudflareConnection(),
        testNetlifyConnection()
      ]);

      setTestResults({ direct, cloudflare, netlify });
      console.log('🧪 Resultados dos testes:', { direct, cloudflare, netlify });
    } catch (error) {
      console.error('🧪 Erro nos testes:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <RefreshCw className="w-4 h-4 animate-spin" />;
    return status ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusVariant = (status: boolean | null) => {
    if (status === null) return 'secondary';
    return status ? 'default' : 'destructive';
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Testando...';
    return status ? 'Conectado' : 'Falhou';
  };

  return (
    <Card className="my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Debug de Conectividade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Informações do Ambiente */}
        <div>
          <h5 className="text-lg font-semibold mb-2">Informações do Ambiente</h5>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">URL Atual:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">{getApiUrl()}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Hostname:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">{window.location.hostname}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Protocolo:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">{window.location.protocol}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Credenciais:</span>
              <Badge variant={localStorage.getItem('auth-credentials') ? 'default' : 'destructive'}>
                {localStorage.getItem('auth-credentials') ? 'Presentes' : 'Ausentes'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Testes de Conectividade */}
        <div>
          <h5 className="text-lg font-semibold mb-3">Testes de Conectividade</h5>
          <div className="space-y-3">
            
            {/* Teste Direto */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(testResults.direct)}
                <div>
                  <div className="font-medium">Conexão Direta</div>
                  <div className="text-sm text-gray-500">http://35.230.168.225:8082/api</div>
                </div>
              </div>
              <Badge variant={getStatusVariant(testResults.direct)}>
                {getStatusText(testResults.direct)}
              </Badge>
            </div>

            {/* Teste Cloudflare */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(testResults.cloudflare)}
                <div>
                  <div className="font-medium">Cloudflare Worker</div>
                  <div className="text-sm text-gray-500">trackmax-proxy.workers.dev</div>
                </div>
              </div>
              <Badge variant={getStatusVariant(testResults.cloudflare)}>
                {getStatusText(testResults.cloudflare)}
              </Badge>
            </div>

            {/* Teste Netlify */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(testResults.netlify)}
                <div>
                  <div className="font-medium">Netlify Functions</div>
                  <div className="text-sm text-gray-500">dashboard-trackmax.netlify.app</div>
                </div>
              </div>
              <Badge variant={getStatusVariant(testResults.netlify)}>
                {getStatusText(testResults.netlify)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
            {isTesting ? 'Testando...' : 'Testar Todas as Conexões'}
          </Button>
          
          <Button 
            onClick={() => testConnection()} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Bug className="w-4 h-4" />
            Testar Conexão Atual
          </Button>
        </div>

        {/* Instruções */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h6 className="font-semibold text-blue-800 mb-2">Como interpretar os resultados</h6>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>Verde:</strong> Conexão funcionando corretamente</p>
            <p>• <strong>Vermelho:</strong> Falha na conexão (verificar logs do console)</p>
            <p>• <strong>Teste Direto:</strong> Conecta diretamente ao servidor Traccar</p>
            <p>• <strong>Cloudflare/Netlify:</strong> Testa através dos proxies</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
