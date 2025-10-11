import React from 'react';
import { Card, Avatar, Tag, Space, Typography, Row, Col, Statistic, Button, Tabs, Divider } from 'antd';
import { 
  CarOutlined, 
  PhoneOutlined, 
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { VehicleTimeline } from './VehicleTimeline';
import type { Device, Position } from '../types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface VehicleSidebarProps {
  selectedVehicle: { device: Device; position: Position } | null;
  onBack: () => void;
  onContact: () => void;
  onRefresh: () => void;
  positions: Position[];
  addressCache?: Map<string, string>;
}

export const VehicleSidebar: React.FC<VehicleSidebarProps> = ({
  selectedVehicle,
  onBack,
  onContact,
  onRefresh,
  positions,
  addressCache = new Map()
}) => {
  if (!selectedVehicle) {
    return (
      <div style={{
        width: '400px',
        height: '100%',
        background: '#1f1f1f',
        borderRight: '1px solid #303030',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#8c8c8c'
      }}>
        <CarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
        <Text>Selecione um veículo no mapa</Text>
      </div>
    );
  }

  const { device, position } = selectedVehicle;
  const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
  const speedKmh = Math.round(position.speed * 3.6);
  const lastUpdate = new Date(position.deviceTime);

  // Função para obter endereço do cache ou da posição
  const getAddressForPosition = (pos: Position): string => {
    if (pos.address) return pos.address;
    
    const cacheKey = `${pos.latitude.toFixed(4)},${pos.longitude.toFixed(4)}`;
    return addressCache.get(cacheKey) || 'Endereço não disponível';
  };

  const getStatusColor = () => {
    if (isOnline) return '#52c41a';
    if (position.outdated) return '#fa8c16';
    return '#ff4d4f';
  };

  const getStatusText = () => {
    if (isOnline) return 'Em trânsito';
    if (position.outdated) return 'Desatualizado';
    return 'Offline';
  };

  // Calcular estatísticas básicas
  const totalDistance = positions.reduce((sum, pos, index) => {
    if (index === 0) return 0;
    // Cálculo simplificado de distância (em produção, usar fórmula de Haversine)
    const prevPos = positions[index - 1];
    const latDiff = pos.latitude - prevPos.latitude;
    const lngDiff = pos.longitude - prevPos.longitude;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Aproximação
    return sum + distance;
  }, 0);

  const totalTime = positions.length > 1 
    ? (new Date(positions[0].deviceTime).getTime() - new Date(positions[positions.length - 1].deviceTime).getTime()) / (1000 * 60 * 60)
    : 0;

  return (
    <div style={{
      width: '400px',
      height: '100%',
      background: '#1f1f1f',
      borderRight: '1px solid #303030',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #303030' }}>
        <Space style={{ marginBottom: '16px' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={onBack}
            style={{ color: '#1890ff' }}
          >
            Todos os veículos
          </Button>
        </Space>

        {/* Perfil do veículo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <Avatar 
            size={64} 
            icon={<CarOutlined />}
            style={{ 
              background: '#1890ff',
              marginRight: '16px'
            }}
          />
          <div style={{ flex: 1 }}>
            <Title level={4} style={{ color: '#fff', margin: 0, marginBottom: '4px' }}>
              {device.name}
            </Title>
            <Space>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getStatusColor()
              }} />
              <Text style={{ color: getStatusColor() }}>
                {getStatusText()}
              </Text>
            </Space>
          </div>
          <Button 
            type="primary" 
            icon={<MessageOutlined />}
            onClick={onContact}
            size="small"
          >
            Contato
          </Button>
        </div>

        {/* Informações básicas */}
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: '12px' }}>ID:</Text>
            <br />
            <Text style={{ color: '#fff', fontSize: '13px' }}>{device.uniqueId}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Seguro:</Text>
            <br />
            <Text style={{ color: '#fff', fontSize: '13px' }}>FR2753A</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Veículo:</Text>
            <br />
            <Text style={{ color: '#fff', fontSize: '13px' }}>{device.model || 'Não informado'}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Avaliação:</Text>
            <br />
            <Text style={{ color: '#fff', fontSize: '13px' }}>4.7 ⭐</Text>
          </Col>
        </Row>
      </div>

      {/* Tabs */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs 
          defaultActiveKey="tracking" 
          style={{ 
            flex: 1
          }}
          tabBarStyle={{
            background: '#1f1f1f',
            margin: 0,
            padding: '0 20px'
          }}
        >
          <TabPane tab="Informações" key="info">
            <div style={{ padding: '20px' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Estatísticas */}
                <div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Distância"
                        value={Math.round(totalDistance)}
                        suffix="km"
                        valueStyle={{ color: '#fff', fontSize: '24px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Tempo"
                        value={Math.round(totalTime)}
                        suffix="h"
                        valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                      />
                    </Col>
                  </Row>
                  <Button 
                    type="primary" 
                    style={{ marginTop: '16px', width: '100%' }}
                  >
                    Ver rota
                  </Button>
                </div>

                {/* Informações detalhadas */}
                <div>
                  <Title level={5} style={{ color: '#fff' }}>Detalhes</Title>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {device.phone && (
                      <Row align="middle" gutter={8}>
                        <Col>
                          <PhoneOutlined style={{ color: '#1890ff' }} />
                        </Col>
                        <Col>
                          <Text style={{ color: '#d9d9d9' }}>{device.phone}</Text>
                        </Col>
                      </Row>
                    )}
                    
                    {device.contact && (
                      <Row align="middle" gutter={8}>
                        <Col>
                          <UserOutlined style={{ color: '#722ed1' }} />
                        </Col>
                        <Col>
                          <Text style={{ color: '#d9d9d9' }}>{device.contact}</Text>
                        </Col>
                      </Row>
                    )}

                    <Row align="middle" gutter={8}>
                      <Col>
                        <EnvironmentOutlined style={{ color: '#52c41a' }} />
                      </Col>
                      <Col flex={1}>
                        <Text style={{ color: '#d9d9d9', fontSize: '12px' }}>
                          {getAddressForPosition(position)}
                        </Text>
                      </Col>
                    </Row>

                    <Row align="middle" gutter={8}>
                      <Col>
                        <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                      </Col>
                      <Col>
                        <Text style={{ color: '#d9d9d9', fontSize: '12px' }}>
                          Atualizado há {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min
                        </Text>
                      </Col>
                    </Row>
                  </Space>
                </div>
              </Space>
            </div>
          </TabPane>

          <TabPane tab="Rastreamento" key="tracking">
            <div style={{ padding: '0 20px 20px', height: '100%' }}>
              <VehicleTimeline 
                positions={positions}
                selectedDeviceId={device.id}
                onRefresh={onRefresh}
              />
            </div>
          </TabPane>

          <TabPane tab="Documentos" key="documents">
            <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
              <Text>Documentos em breve</Text>
            </div>
          </TabPane>

          <TabPane tab="Empresa" key="company">
            <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
              <Text>Informações da empresa em breve</Text>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};


