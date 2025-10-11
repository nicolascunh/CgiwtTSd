import React from 'react';
import { Modal, Descriptions, Tag, Space, Typography, Row, Col, Statistic, Timeline, Button } from 'antd';
import { 
  CarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  ThunderboltOutlined,
  PhoneOutlined,
  UserOutlined,
  InfoCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { Device, Position } from '../types';

const { Title, Text } = Typography;

interface VehicleDetailsModalProps {
  visible: boolean;
  device: Device | null;
  position: Position | null;
  onClose: () => void;
  onCenterMap: () => void;
}

export const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({
  visible,
  device,
  position,
  onClose,
  onCenterMap
}) => {
  if (!device || !position) return null;

  const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
  const lastUpdate = new Date(position.deviceTime);
  const speedKmh = Math.round(position.speed * 3.6);

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

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('pt-BR');
  };

  return (
    <Modal
      title={
        <Space>
          <CarOutlined style={{ color: '#1890ff' }} />
          <span>Detalhes do Veículo</span>
          <Tag color={getStatusColor()} icon={<ThunderboltOutlined />}>
            {getStatusText()}
          </Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="center" type="primary" onClick={onCenterMap} icon={<EnvironmentOutlined />}>
          Centralizar no Mapa
        </Button>,
        <Button key="close" onClick={onClose}>
          Fechar
        </Button>
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Informações básicas do dispositivo */}
        <div>
          <Title level={4} style={{ marginBottom: '16px' }}>
            {device.name}
          </Title>
          
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ID Único" span={1}>
              <Text code>{device.uniqueId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <Tag color={getStatusColor()}>{getStatusText()}</Tag>
            </Descriptions.Item>
            
            {device.phone && (
              <Descriptions.Item label="Telefone" span={1}>
                <Space>
                  <PhoneOutlined />
                  {device.phone}
                </Space>
              </Descriptions.Item>
            )}
            
            {device.contact && (
              <Descriptions.Item label="Contato" span={1}>
                <Space>
                  <UserOutlined />
                  {device.contact}
                </Space>
              </Descriptions.Item>
            )}
            
            {device.model && (
              <Descriptions.Item label="Modelo" span={1}>
                <Space>
                  <CarOutlined />
                  {device.model}
                </Space>
              </Descriptions.Item>
            )}
            
            {device.category && (
              <Descriptions.Item label="Categoria" span={1}>
                {device.category}
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>

        {/* Posição atual */}
        <div>
          <Title level={5}>Posição Atual</Title>
          
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Velocidade"
                value={speedKmh}
                suffix="km/h"
                valueStyle={{ color: speedKmh > 80 ? '#ff4d4f' : '#52c41a' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Curso"
                value={position.course}
                suffix="°"
              />
            </Col>
          </Row>
          
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={8}>
              <Statistic
                title="Latitude"
                value={position.latitude}
                precision={6}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Longitude"
                value={position.longitude}
                precision={6}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Altitude"
                value={Math.round(position.altitude)}
                suffix="m"
              />
            </Col>
          </Row>

          {position.address && (
            <div style={{ marginTop: '16px' }}>
              <Text strong>Endereço:</Text>
              <br />
              <Text>{position.address}</Text>
            </div>
          )}

          {position.accuracy && (
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">
                Precisão: ±{Math.round(position.accuracy)}m
              </Text>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div>
          <Title level={5}>Informações de Tempo</Title>
          
          <Timeline>
            <Timeline.Item 
              dot={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              color="blue"
            >
              <Text strong>Dispositivo:</Text> {formatTime(position.deviceTime)}
            </Timeline.Item>
            <Timeline.Item 
              dot={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
              color="green"
            >
              <Text strong>Fix GPS:</Text> {formatTime(position.fixTime)}
            </Timeline.Item>
            <Timeline.Item 
              dot={<HistoryOutlined style={{ color: '#fa8c16' }} />}
              color="orange"
            >
              <Text strong>Servidor:</Text> {formatTime(position.serverTime)}
            </Timeline.Item>
          </Timeline>
        </div>

        {/* Informações técnicas */}
        <div>
          <Title level={5}>Informações Técnicas</Title>
          
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Protocolo" span={1}>
              {position.protocol}
            </Descriptions.Item>
            <Descriptions.Item label="Válido" span={1}>
              <Tag color={position.valid ? 'success' : 'error'}>
                {position.valid ? 'Sim' : 'Não'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Desatualizado" span={1}>
              <Tag color={position.outdated ? 'warning' : 'success'}>
                {position.outdated ? 'Sim' : 'Não'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Desabilitado" span={1}>
              <Tag color={device.disabled ? 'error' : 'success'}>
                {device.disabled ? 'Sim' : 'Não'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Atributos adicionais */}
        {(device.attributes && Object.keys(device.attributes).length > 0) && (
          <div>
            <Title level={5}>Atributos do Dispositivo</Title>
            <Descriptions bordered column={1} size="small">
              {Object.entries(device.attributes).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  {String(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}

        {(position.attributes && Object.keys(position.attributes).length > 0) && (
          <div>
            <Title level={5}>Atributos da Posição</Title>
            <Descriptions bordered column={1} size="small">
              {Object.entries(position.attributes).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  {String(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}
      </Space>
    </Modal>
  );
};
