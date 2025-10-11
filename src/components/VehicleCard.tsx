import React from 'react';
import { Card, Tag, Space, Typography, Button, Row, Col, Statistic, Tooltip } from 'antd';
import { 
  CarOutlined, 
  ClockCircleOutlined, 
  EnvironmentOutlined, 
  ThunderboltOutlined,
  PhoneOutlined,
  UserOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import type { Device, Position } from '../types';

const { Title, Text } = Typography;

interface VehicleCardProps {
  device: Device;
  position: Position;
  onClose: () => void;
  onSelect: () => void;
  onViewDetails: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  device,
  position,
  onClose,
  onSelect,
  onViewDetails
}) => {
  const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
  const lastUpdate = new Date(position.deviceTime);
  const speedKmh = Math.round(position.speed * 3.6); // Converter m/s para km/h

  const getStatusColor = () => {
    if (isOnline) return 'success';
    if (position.outdated) return 'warning';
    return 'error';
  };

  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (position.outdated) return 'Desatualizado';
    return 'Offline';
  };

  const formatAddress = (address: string) => {
    if (!address) return 'Endereço não disponível';
    return address.length > 50 ? `${address.substring(0, 50)}...` : address;
  };

  return (
    <Card
      size="small"
      style={{
        width: 320,
        maxHeight: 400,
        overflow: 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '12px',
        border: 'none'
      }}
      bodyStyle={{ padding: '16px' }}
      actions={[
        <Button 
          key="select" 
          type="primary" 
          size="small" 
          onClick={onSelect}
          icon={<CarOutlined />}
        >
          Selecionar
        </Button>,
        <Button 
          key="details" 
          size="small" 
          onClick={onViewDetails}
          icon={<InfoCircleOutlined />}
        >
          Detalhes
        </Button>,
        <Button 
          key="close" 
          size="small" 
          onClick={onClose}
          type="text"
        >
          ✕
        </Button>
      ]}
    >
      {/* Header com nome e status */}
      <div style={{ marginBottom: '12px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
              {device.name}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {device.uniqueId}
            </Text>
          </Col>
          <Col>
            <Tag color={getStatusColor()} icon={<ThunderboltOutlined />}>
              {getStatusText()}
            </Tag>
          </Col>
        </Row>
      </div>

      {/* Informações principais */}
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Localização */}
        <div>
          <Row align="middle" gutter={8}>
            <Col>
              <EnvironmentOutlined style={{ color: '#52c41a' }} />
            </Col>
            <Col flex={1}>
              <Text style={{ fontSize: '12px' }}>
                {formatAddress(position.address)}
              </Text>
            </Col>
          </Row>
        </div>

        {/* Coordenadas */}
        <div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Lat: {position.latitude.toFixed(6)}, Lng: {position.longitude.toFixed(6)}
          </Text>
        </div>

        {/* Estatísticas em linha */}
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Velocidade"
              value={speedKmh}
              suffix="km/h"
              valueStyle={{ fontSize: '14px', color: speedKmh > 80 ? '#ff4d4f' : '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Curso"
              value={position.course}
              suffix="°"
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Altitude"
              value={Math.round(position.altitude)}
              suffix="m"
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
        </Row>

        {/* Informações do dispositivo */}
        <div style={{ 
          padding: '8px', 
          background: '#f5f5f5', 
          borderRadius: '6px',
          marginTop: '8px'
        }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {device.phone && (
              <Row align="middle" gutter={8}>
                <Col>
                  <PhoneOutlined style={{ color: '#1890ff' }} />
                </Col>
                <Col>
                  <Text style={{ fontSize: '12px' }}>{device.phone}</Text>
                </Col>
              </Row>
            )}
            
            {device.contact && (
              <Row align="middle" gutter={8}>
                <Col>
                  <UserOutlined style={{ color: '#722ed1' }} />
                </Col>
                <Col>
                  <Text style={{ fontSize: '12px' }}>{device.contact}</Text>
                </Col>
              </Row>
            )}

            {device.model && (
              <Row align="middle" gutter={8}>
                <Col>
                  <CarOutlined style={{ color: '#fa8c16' }} />
                </Col>
                <Col>
                  <Text style={{ fontSize: '12px' }}>{device.model}</Text>
                </Col>
              </Row>
            )}
          </Space>
        </div>

        {/* Última atualização */}
        <div>
          <Row align="middle" gutter={8}>
            <Col>
              <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
            </Col>
            <Col>
              <Tooltip title={lastUpdate.toLocaleString()}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  Atualizado há {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min
                </Text>
              </Tooltip>
            </Col>
          </Row>
        </div>

        {/* Informações adicionais */}
        {position.accuracy && (
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Precisão: ±{Math.round(position.accuracy)}m
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};
