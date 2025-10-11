import React from 'react';
import { Card, Typography, Button, Space, Alert } from 'antd';
import { GoogleMapsExample } from '../components/GoogleMapsExample';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

const { Title, Text } = Typography;

export const GoogleMapsTestPage: React.FC = () => {
  const { isLoaded, error, apiKey } = useGoogleMaps();

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Title level={2}>Teste da Integração Google Maps</Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="Status da API do Google Maps"
            description={
              <div>
                <p><strong>Chave da API:</strong> {apiKey ? `${apiKey.substring(0, 20)}...` : 'Não configurada'}</p>
                <p><strong>Status:</strong> {isLoaded ? '✅ Carregada' : error ? '❌ Erro' : '⏳ Carregando...'}</p>
                {error && <p><strong>Erro:</strong> {error}</p>}
              </div>
            }
            type={isLoaded ? 'success' : error ? 'error' : 'info'}
            showIcon
          />

          <div>
            <Title level={4}>Configuração da API</Title>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify({
                apiKey: apiKey ? 'Configurada' : 'Não configurada',
                libraries: ['places', 'geometry'],
                defaultZoom: 12,
                defaultCenter: { lat: -23.5505, lng: -46.6333 }
              }, null, 2)}
            </pre>
          </div>

          <div>
            <Title level={4}>Teste do Mapa</Title>
            <Text type="secondary">
              Se a API estiver carregada corretamente, você verá um mapa do Google Maps abaixo:
            </Text>
          </div>

          <GoogleMapsExample />

          <div>
            <Title level={4}>Verificações</Title>
            <Space direction="vertical">
              <div>
                <Text strong>1. Script do Google Maps no HTML:</Text>
                <Text code>
                  {typeof window !== 'undefined' && (window as any).google ? '✅ Carregado' : '❌ Não carregado'}
                </Text>
              </div>
              <div>
                <Text strong>2. Objeto google.maps disponível:</Text>
                <Text code>
                  {typeof window !== 'undefined' && (window as any).google?.maps ? '✅ Disponível' : '❌ Não disponível'}
                </Text>
              </div>
              <div>
                <Text strong>3. Chave da API configurada:</Text>
                <Text code>
                  {apiKey ? '✅ Configurada' : '❌ Não configurada'}
                </Text>
              </div>
            </Space>
          </div>

          <div>
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
              style={{ marginRight: '10px' }}
            >
              Recarregar Página
            </Button>
            <Button onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}>
              Abrir Google Cloud Console
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
};



