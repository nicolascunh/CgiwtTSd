import React, { useState } from 'react';
import { Layout, Typography, Button, Space } from 'antd';
import { GoogleMapsLiveMap } from '../components/GoogleMapsLiveMap';
import type { Device, Position } from '../types';

const { Header, Content } = Layout;
const { Title } = Typography;

export const VehicleTrackingTestPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Dados mock para teste
  const mockDevices: Device[] = [
    {
      id: 1,
      name: "Veículo Teste 1",
      uniqueId: "TEST001",
      status: "online",
      disabled: false,
      lastUpdate: new Date().toISOString(),
      positionId: 1,
      groupId: 1,
      phone: "+5511999999999",
      model: "Volvo FMX",
      contact: "João Silva",
      category: "Caminhão",
      geofenceIds: [],
      attributes: {}
    },
    {
      id: 2,
      name: "Veículo Teste 2",
      uniqueId: "TEST002",
      status: "online",
      disabled: false,
      lastUpdate: new Date().toISOString(),
      positionId: 2,
      groupId: 1,
      phone: "+5511888888888",
      model: "Mercedes Sprinter",
      contact: "Maria Santos",
      category: "Van",
      geofenceIds: [],
      attributes: {}
    }
  ];

  const mockPositions: Position[] = [
    {
      id: 1,
      deviceId: 1,
      protocol: "osmand",
      deviceTime: new Date().toISOString(),
      fixTime: new Date().toISOString(),
      serverTime: new Date().toISOString(),
      outdated: false,
      valid: true,
      latitude: -23.5505,
      longitude: -46.6333,
      altitude: 760,
      speed: 15.5,
      course: 45,
      address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
      accuracy: 5,
      network: {},
      attributes: {}
    },
    {
      id: 2,
      deviceId: 2,
      protocol: "osmand",
      deviceTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutos atrás
      fixTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      serverTime: new Date().toISOString(),
      outdated: false,
      valid: true,
      latitude: -23.5605,
      longitude: -46.6433,
      altitude: 750,
      speed: 0,
      course: 90,
      address: "Rua Augusta, 500 - Consolação, São Paulo - SP",
      accuracy: 3,
      network: {},
      attributes: {}
    }
  ];

  const handleDeviceSelect = (device: Device) => {
    console.log('🎯 Dispositivo selecionado:', device);
    setSelectedDevice(device);
  };

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
          🚗 Teste de Rastreamento (Dados Mock)
        </Title>
        <div style={{ marginLeft: 'auto', color: '#8c8c8c' }}>
          {mockDevices.length} veículos • {mockPositions.length} posições
        </div>
      </Header>
      
      <Content style={{ 
        background: '#1f1f1f',
        padding: 0,
        height: 'calc(100vh - 64px)'
      }}>
        <GoogleMapsLiveMap
          devices={mockDevices}
          positions={mockPositions}
          selectedDevice={selectedDevice}
          onDeviceSelect={handleDeviceSelect}
        />
      </Content>
    </Layout>
  );
};










