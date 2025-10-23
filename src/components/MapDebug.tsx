import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

const { Title, Text } = Typography;

export const MapDebug: React.FC = () => {
  const { isLoaded, error, apiKey } = useGoogleMaps();

  return (
    <Card 
      size="small" 
      style={{ 
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        border: '1px solid #303030',
        maxWidth: '300px'
      }}
    >
      <Title level={5} style={{ color: 'white', margin: 0 }}>
        🐛 Debug do Mapa
      </Title>
      
      <Space direction="vertical" size="small" style={{ width: '100%', marginTop: '8px' }}>
        <div>
          <Text style={{ color: 'white', fontSize: '12px' }}>Google Maps API:</Text>
          <Tag color={isLoaded ? 'success' : error ? 'error' : 'processing'}>
            {isLoaded ? 'Carregada' : error ? 'Erro' : 'Carregando...'}
          </Tag>
        </div>
        
        <div>
          <Text style={{ color: 'white', fontSize: '12px' }}>Chave API:</Text>
          <Text style={{ color: 'white', fontSize: '11px' }}>
            {apiKey ? `${apiKey.substring(0, 20)}...` : 'Não configurada'}
          </Text>
        </div>
        
        <div>
          <Text style={{ color: 'white', fontSize: '12px' }}>Window.google:</Text>
          <Tag color={typeof window !== 'undefined' && (window as any).google ? 'success' : 'error'}>
            {typeof window !== 'undefined' && (window as any).google ? 'Disponível' : 'Não disponível'}
          </Tag>
        </div>
        
        <div>
          <Text style={{ color: 'white', fontSize: '12px' }}>google.maps:</Text>
          <Tag color={typeof window !== 'undefined' && (window as any).google?.maps ? 'success' : 'error'}>
            {typeof window !== 'undefined' && (window as any).google?.maps ? 'Disponível' : 'Não disponível'}
          </Tag>
        </div>
        
        {error && (
          <div>
            <Text style={{ color: '#ff4d4f', fontSize: '11px' }}>Erro: {error}</Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

















