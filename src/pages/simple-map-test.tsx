import React from 'react';
import { Card, Typography, Space, Button } from 'antd';
import { SimpleMap } from '../components/SimpleMap';

const { Title } = Typography;

export const SimpleMapTestPage: React.FC = () => {
  const testDevices = [
    { id: 1, name: "Veículo 1", lat: -23.5505, lng: -46.6333 },
    { id: 2, name: "Veículo 2", lat: -23.5605, lng: -46.6433 },
    { id: 3, name: "Veículo 3", lat: -23.5405, lng: -46.6233 }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <Title level={2}>Teste Simples do Google Maps</Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>Status da API</Title>
            <div>
              <strong>Google Maps API:</strong> {typeof window !== 'undefined' && (window as any).google ? '✅ Carregada' : '❌ Não carregada'}
            </div>
            <div>
              <strong>google.maps:</strong> {typeof window !== 'undefined' && (window as any).google?.maps ? '✅ Disponível' : '❌ Não disponível'}
            </div>
          </div>

          <div>
            <Title level={4}>Teste do Mapa</Title>
            <SimpleMap devices={testDevices} />
          </div>

          <div>
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              Recarregar Página
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
};














