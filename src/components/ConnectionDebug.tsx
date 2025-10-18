import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, RefreshCw, Bug } from 'lucide-react';
import { useTrackmaxApi } from '../hooks/useTrackmaxApi';
import { getApiUrlSync } from '../config/api';

export const ConnectionDebug: React.FC = () => {
  const { testConnection } = useTrackmaxApi();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{ netlify: boolean | null }>({
    netlify: null,
  });

  const testNetlifyConnection = async () => {
    try {
      const response = await fetch(`${getApiUrlSync()}/server`, {
        method: 'GET',
        credentials: 'include',
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
    setTestResults({ netlify: null });

    try {
      console.log('🧪 Testando conectividade com Netlify...');
      const netlify = await testNetlifyConnection();
      setTestResults({ netlify });
      console.log('🧪 Resultado do teste:', { netlify });
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
              <code className="bg-gray-100 px-2 py-1 rounded">{getApiUrlSync()}</code>
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
              <span className="font-medium">Usuário em cache:</span>
              <Badge variant={localStorage.getItem('auth-user') ? 'default' : 'destructive'}>
                {localStorage.getItem('auth-user') ? localStorage.getItem('auth-user') : 'Nenhum'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Testes de Conectividade */}
        <div>
          <h5 className="text-lg font-semibold mb-3">Testes de Conectividade</h5>
          <div className="space-y-3">

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
              <CheckCircle className="w-4 h-4" />
            )}
            {isTesting ? 'Testando...' : 'Testar Conexão'}
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
            <p>• <strong>Netlify:</strong> Teste do proxy atual utilizado em produção</p>
            <p>• Caso o teste falhe, verifique se a sessão está ativa (faça login novamente).</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
