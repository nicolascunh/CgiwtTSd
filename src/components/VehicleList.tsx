import React from 'react';
import { Card, Avatar, Tag, Space, Typography, Row, Col, Spin, Button } from 'antd';
import { 
  CarOutlined, 
  EnvironmentOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { Device, Position } from '../types';

const { Text, Title } = Typography;

interface VehicleListProps {
  devices: Device[];
  positions: Position[];
  addressCache: Map<string, string>;
  loadingAddresses: Set<number>;
  onVehicleSelect: (device: Device) => void;
  selectedDevice: Device | null;
}

export const VehicleList: React.FC<VehicleListProps> = ({
  devices,
  positions,
  addressCache,
  loadingAddresses,
  onVehicleSelect,
  selectedDevice
}) => {
  console.log('🚗 VehicleList renderizado:', {
    devicesCount: devices.length,
    positionsCount: positions.length,
    addressCacheSize: addressCache.size,
    loadingAddressesSize: loadingAddresses.size
  });
  // Criar mapa de posições para acesso rápido
  const positionMap = new Map<number, Position>();
  positions.forEach(pos => {
    positionMap.set(pos.deviceId, pos);
  });

  // Filtrar dispositivos com posições
  const devicesWithPositions = devices
    .map(device => {
      const position = positionMap.get(device.id);
      return position ? { device, position } : null;
    })
    .filter(Boolean) as Array<{ device: Device; position: Position }>;

  const getAddressForPosition = (position: Position): string => {
    if (position.address) {
      console.log('📍 Endereço direto da posição:', position.address);
      return position.address;
    }
    
    const cacheKey = `${position.latitude.toFixed(4)},${position.longitude.toFixed(4)}`;
    const cachedAddress = addressCache.get(cacheKey);
    console.log('📍 Endereço do cache:', cachedAddress, 'para chave:', cacheKey);
    return cachedAddress || 'Carregando endereço...';
  };

  const isAddressLoading = (position: Position): boolean => {
    return loadingAddresses.has(position.id);
  };

  const getStatusColor = (position: Position) => {
    const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
    if (isOnline) return '#52c41a';
    if (position.outdated) return '#fa8c16';
    return '#ff4d4f';
  };

  const getStatusText = (position: Position) => {
    const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
    if (isOnline) return 'Online';
    if (position.outdated) return 'Desatualizado';
    return 'Offline';
  };

  if (devicesWithPositions.length === 0) {
    return (
      <div style={{
        width: '350px',
        height: '100%',
        background: '#1f1f1f',
        borderRight: '1px solid #303030',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#8c8c8c',
        padding: '20px'
      }}>
        <CarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
        <Text>Nenhum veículo com posição disponível</Text>
      </div>
    );
  }

  return (
    <div style={{
      width: '350px',
      height: '100%',
      background: '#1f1f1f',
      borderRight: '1px solid #303030',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid #303030',
        background: '#262626'
      }}>
        <Title level={4} style={{ color: '#fff', margin: 0, marginBottom: '8px' }}>
          🚗 Veículos ({devicesWithPositions.length})
        </Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Clique em um veículo para ver detalhes
        </Text>
      </div>

      {/* Lista de veículos */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '12px'
      }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {devicesWithPositions.map(({ device, position }) => {
            const isSelected = selectedDevice?.id === device.id;
            const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
            const speedKmh = Math.round(position.speed * 3.6);
            const lastUpdate = new Date(position.deviceTime);
            const address = getAddressForPosition(position);
            const isLoadingAddress = isAddressLoading(position);

            return (
              <Card
                key={device.id}
                size="small"
                hoverable
                onClick={() => onVehicleSelect(device)}
                style={{
                  background: isSelected ? '#1890ff' : '#2a2a2a',
                  border: isSelected ? '2px solid #1890ff' : '1px solid #404040',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                styles={{ body: { padding: '12px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* Avatar do veículo */}
                  <Avatar 
                    size={40} 
                    icon={<CarOutlined />}
                    style={{ 
                      background: isSelected ? '#fff' : '#1890ff',
                      color: isSelected ? '#1890ff' : '#fff',
                      flexShrink: 0
                    }}
                  />

                  {/* Informações do veículo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Nome e status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Text 
                        strong 
                        style={{ 
                          color: isSelected ? '#fff' : '#fff',
                          fontSize: '13px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {device.name}
                      </Text>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: getStatusColor(position),
                        flexShrink: 0
                      }} />
                    </div>

                    {/* Endereço */}
                    <div style={{ marginBottom: '4px' }}>
                      <Row align="middle" gutter={4}>
                        <Col>
                          <EnvironmentOutlined style={{ 
                            color: isSelected ? '#fff' : '#8c8c8c', 
                            fontSize: '10px' 
                          }} />
                        </Col>
                        <Col flex={1}>
                          <Text 
                            style={{ 
                              color: isSelected ? '#fff' : '#d9d9d9',
                              fontSize: '11px',
                              lineHeight: '1.2'
                            }}
                          >
                            {isLoadingAddress ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Spin size="small" />
                                Carregando...
                              </span>
                            ) : (
                              address.length > 50 ? `${address.substring(0, 50)}...` : address
                            )}
                          </Text>
                        </Col>
                      </Row>
                    </div>

                    {/* Informações adicionais */}
                    <Row gutter={8} style={{ fontSize: '10px' }}>
                      <Col>
                        <Row align="middle" gutter={2}>
                          <Col>
                            <ThunderboltOutlined style={{ 
                              color: isSelected ? '#fff' : '#52c41a', 
                              fontSize: '9px' 
                            }} />
                          </Col>
                          <Col>
                            <Text style={{ 
                              color: isSelected ? '#fff' : '#52c41a',
                              fontSize: '10px'
                            }}>
                              {speedKmh} km/h
                            </Text>
                          </Col>
                        </Row>
                      </Col>
                      <Col>
                        <Row align="middle" gutter={2}>
                          <Col>
                            <ClockCircleOutlined style={{ 
                              color: isSelected ? '#fff' : '#fa8c16', 
                              fontSize: '9px' 
                            }} />
                          </Col>
                          <Col>
                            <Text style={{ 
                              color: isSelected ? '#fff' : '#fa8c16',
                              fontSize: '10px'
                            }}>
                              {Math.round((Date.now() - lastUpdate.getTime()) / 60000)}m
                            </Text>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </div>

                  {/* Botão de visualizar */}
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    style={{
                      color: isSelected ? '#fff' : '#1890ff',
                      padding: '4px',
                      minWidth: 'auto',
                      height: 'auto'
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </Space>
      </div>
    </div>
  );
};

