import React, { useState, useEffect } from 'react';
import { Layout, Typography, Alert, Spin, Button } from 'antd';
import { GoogleMapsLiveMap } from '../components/GoogleMapsLiveMap';
import { useTrackmaxApi } from '../hooks/useTrackmaxApi';
import type { Device, Position } from '../types';
import '../styles/dashboard.css';
import '../styles/themes.css';
import '../styles/responsive.css';

const { Header, Content } = Layout;
const { Title } = Typography;

export const VehicleTrackingPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchDevices, fetchPositions, loading: apiLoading, error: apiError } = useTrackmaxApi();

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar dispositivos
        console.log('🔍 Iniciando busca de dispositivos...');
        const devicesResult = await fetchDevices(1, 50);
        console.log('📱 Dispositivos carregados:', devicesResult.devices.length, devicesResult.devices);
        setDevices(devicesResult.devices);

        if (devicesResult.devices.length > 0) {
          // Buscar posições para os dispositivos
          const deviceIds = devicesResult.devices.map((d: Device) => d.id);
          console.log('🔍 Buscando posições para deviceIds:', deviceIds);
          const positionsData = await fetchPositions(deviceIds, 1000);
          console.log('📍 Posições carregadas:', positionsData.length, positionsData);
          
          // Debug: verificar se as posições têm dados válidos
          if (positionsData.length > 0) {
            console.log('🔍 Primeira posição:', positionsData[0]);
            console.log('🔍 Posições com coordenadas válidas:', 
              positionsData.filter((p: Position) => p.latitude && p.longitude).length
            );
          } else {
            console.warn('⚠️ Nenhuma posição encontrada para os dispositivos');
          }
          
          setPositions(positionsData);
        } else {
          console.warn('⚠️ Nenhum dispositivo encontrado');
          setError('Nenhum dispositivo encontrado. Verifique se você tem permissão para acessar dispositivos.');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar dados:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Atualizar dados a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      if (devices.length > 0) {
        try {
          const deviceIds = devices.map(d => d.id);
          const positionsData = await fetchPositions(deviceIds, 1000);
          setPositions(positionsData);
        } catch (err) {
          console.error('Erro ao atualizar posições:', err);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [devices]);

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1f1f1f',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <Spin size="large" />
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <div>Carregando dados do sistema...</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '8px' }}>
            Conectando com a API do Trackmax
          </div>
        </div>
      </div>
    );
  }

  if (error || apiError) {
    const isAuthError = error?.includes('autenticado') || apiError?.includes('401') || apiError?.includes('Unauthorized');
    
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1f1f1f',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '500px', width: '100%' }}>
          <Alert
            message={isAuthError ? "Erro de Autenticação" : "Erro ao carregar dados"}
            description={
              <div>
                <div style={{ marginBottom: '16px' }}>
                  {isAuthError 
                    ? "Você precisa fazer login para acessar os dados do sistema."
                    : error || apiError
                  }
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  {isAuthError ? (
                    <Button type="primary" onClick={handleLogin}>
                      Fazer Login
                    </Button>
                  ) : (
                    <Button type="primary" onClick={handleRetry}>
                      Tentar Novamente
                    </Button>
                  )}
                </div>
              </div>
            }
            type="error"
            showIcon
            style={{ 
              background: '#2a2a2a',
              border: '1px solid #ff4d4f',
              color: '#fff'
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <Layout style={{ height: '100vh', background: '#1f1f1f' }}>
      <Header style={{ 
        background: '#1f1f1f', 
        borderBottom: '1px solid #303030',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          🚗 Rastreamento de Veículos
        </Title>
        <div style={{ marginLeft: 'auto', color: '#8c8c8c' }}>
          {devices.length} veículos • {positions.length} posições
        </div>
      </Header>
      
      <Content style={{ 
        background: '#1f1f1f',
        padding: 0,
        height: 'calc(100vh - 64px)'
      }}>
        <GoogleMapsLiveMap
          devices={devices}
          positions={positions}
          selectedDevice={selectedDevice}
          onDeviceSelect={handleDeviceSelect}
        />
      </Content>
    </Layout>
  );
};
