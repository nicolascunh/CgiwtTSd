import React, { useState, useEffect } from 'react';
import { Layout, Card, Typography, Row, Col, Tabs, Button, Tag, Avatar, Space, Timeline, Statistic, Select, Divider } from 'antd';
import { 
  CarOutlined, 
  UserOutlined, 
  EnvironmentOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useTrackmaxApi } from '../../hooks/useTrackmaxApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { LiveMap } from '../../components/LiveMap';
import type { Device, Position } from '../../types';

const { Content } = Layout;
const { Title, Text } = Typography;

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('today');
  const { fetchDevices, fetchPositions, loading, error } = useTrackmaxApi();
  const { t } = useLanguage();

  // Carregar dados quando o componente montar
  useEffect(() => {
    const loadData = async () => {
      try {
        const devicesData = await fetchDevices();
        setDevices(devicesData);
        
        if (devicesData.length > 0) {
          setSelectedDevice(devicesData[0]);
          
          // Buscar posições para todos os dispositivos
          const allPositions: Position[] = [];
          for (const device of devicesData) {
            try {
              const devicePositions = await fetchPositions(device.id);
              allPositions.push(...devicePositions);
            } catch (err) {
              console.error(`Erro ao buscar posições do dispositivo ${device.id}:`, err);
            }
          }
          setPositions(allPositions);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };

    loadData();
  }, []);

  // Mock data para driver
  const mockDriver = {
    name: 'João Silva',
    id: 'DRV-001',
    phone: '+55 11 99999-9999',
    email: 'joao.silva@empresa.com',
    license: 'CNH A/B',
    status: 'Ativo'
  };

  // Mock data para timeline
  const mockTimeline = [
    {
      time: '08:00',
      event: 'Início do turno',
      location: 'Depósito Central - São Paulo'
    },
    {
      time: '09:30',
      event: 'Coleta de carga',
      location: 'Centro de Distribuição - Campinas'
    },
    {
      time: '12:00',
      event: 'Pausa para almoço',
      location: 'Posto de Combustível - Rodovia Anhanguera'
    },
    {
      time: '14:00',
      event: 'Entrega de carga',
      location: 'Cliente ABC - Ribeirão Preto'
    },
    {
      time: '16:30',
      event: 'Retorno ao depósito',
      location: 'Depósito Central - São Paulo'
    }
  ];

  // Mock data para estatísticas
  const mockStats = {
    totalDistance: 245.7,
    totalTime: 8.5,
    averageSpeed: 28.9,
    fuelConsumption: 45.2
  };

  const timeFilterOptions = [
    { value: 'today', label: t('today') },
    { value: 'week', label: t('this_week') },
    { value: 'month', label: t('this_month') },
    { value: 'year', label: t('this_year') }
  ];

  const tabItems = [
    {
      key: 'general',
      label: t('general'),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text type="secondary">{t('id')}:</Text>
              <br />
              <Text strong>{selectedDevice?.uniqueId}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('model')}:</Text>
              <br />
              <Text strong>{selectedDevice?.model || 'N/A'}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('status')}:</Text>
              <br />
              <Tag color={selectedDevice?.status === 'online' && !selectedDevice?.disabled ? "green" : "red"}>
                {selectedDevice?.status === 'online' && !selectedDevice?.disabled ? t('online') : t('offline')}
              </Tag>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('phone')}:</Text>
              <br />
              <Text strong>{selectedDevice?.phone || 'N/A'}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('contact')}:</Text>
              <br />
              <Text strong>{selectedDevice?.contact || 'N/A'}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('category')}:</Text>
              <br />
              <Text strong>{selectedDevice?.category || 'N/A'}</Text>
            </Col>
            <Col span={24}>
              <Text type="secondary">{t('last_update')}:</Text>
              <br />
              <Text strong>
                {selectedDevice?.lastUpdate ? new Date(selectedDevice.lastUpdate).toLocaleString() : 'N/A'}
              </Text>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'tracking',
      label: t('tracking'),
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Statistic
                title={t('total_distance')}
                value={mockStats.totalDistance}
                suffix="km"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('total_time')}
                value={mockStats.totalTime}
                suffix="h"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('average_speed')}
                value={mockStats.averageSpeed}
                suffix="km/h"
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('fuel_consumption')}
                value={mockStats.fuelConsumption}
                suffix="L"
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
          </Row>

          <div style={{ marginBottom: '16px' }}>
            <Text strong>{t('recent_activity')}</Text>
          </div>

          <Timeline
            items={mockTimeline.map((item, index) => ({
              key: index,
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Text strong>{item.event}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <EnvironmentOutlined style={{ marginRight: '4px' }} />
                        {item.location}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      <ClockCircleOutlined style={{ marginRight: '4px' }} />
                      {item.time}
                    </Text>
                  </div>
                </div>
              )
            }))}
          />
        </div>
      )
    },
    {
      key: 'driver',
      label: t('driver'),
      children: (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <Avatar size={64} icon={<UserOutlined />} style={{ marginRight: '16px' }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>{mockDriver.name}</Title>
              <Text type="secondary">ID: {mockDriver.id}</Text>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text type="secondary">{t('phone')}:</Text>
              <br />
              <Text strong>{mockDriver.phone}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('email')}:</Text>
              <br />
              <Text strong>{mockDriver.email}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('license')}:</Text>
              <br />
              <Text strong>{mockDriver.license}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('status')}:</Text>
              <br />
              <Tag color="green">{mockDriver.status}</Tag>
            </Col>
          </Row>

          <Divider />

          <Space>
            <Button type="primary" icon={<PhoneOutlined />}>
              {t('call_driver')}
            </Button>
            <Button icon={<MailOutlined />}>
              {t('send_message')}
            </Button>
          </Space>
        </div>
      )
    },
    {
      key: 'company',
      label: t('company'),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text type="secondary">{t('company_name')}:</Text>
              <br />
              <Text strong>TrackMax Transportes Ltda</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('cnpj')}:</Text>
              <br />
              <Text strong>12.345.678/0001-90</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('address')}:</Text>
              <br />
              <Text strong>Rua das Flores, 123 - São Paulo, SP</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">{t('phone')}:</Text>
              <br />
              <Text strong>+55 11 3333-3333</Text>
            </Col>
          </Row>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <Content style={{ padding: '24px', textAlign: 'center' }}>
        <div>Carregando dispositivos...</div>
      </Content>
    );
  }

  if (error) {
    return (
      <Content style={{ padding: '24px' }}>
        <div>Erro ao carregar dados: {error}</div>
      </Content>
    );
  }

  return (
    <Layout style={{ height: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '16px' }}>
        <Row gutter={[16, 16]} style={{ height: '100%' }}>
          {/* Painel Esquerdo - Lista de Dispositivos e Detalhes */}
          <Col span={12} style={{ height: '100%' }}>
            <Row gutter={[0, 16]} style={{ height: '100%' }}>
              {/* Lista de Dispositivos */}
              <Col span={24}>
                <Card 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{t('vehicles')}</span>
                      <Select
                        value={selectedTimeFilter}
                        onChange={setSelectedTimeFilter}
                        options={timeFilterOptions}
                        style={{ width: 120 }}
                      />
                    </div>
                  }
                  style={{ height: '300px', overflow: 'auto' }}
                >
                  {devices.map((device) => {
                    const devicePosition = positions.find(p => p.deviceId === device.id);
                    const isOnline = device.status === 'online' && !device.disabled;
                    const isSelected = selectedDevice?.id === device.id;

                    return (
                      <Card
                        key={device.id}
                        size="small"
                        style={{ 
                          marginBottom: '8px', 
                          cursor: 'pointer',
                          border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9'
                        }}
                        onClick={() => setSelectedDevice(device)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                              <CarOutlined style={{ marginRight: '8px', color: isOnline ? '#52c41a' : '#ff4d4f' }} />
                              <Text strong>{device.name}</Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              ID: {device.uniqueId}
                            </Text>
                            {devicePosition && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                <EnvironmentOutlined style={{ marginRight: '4px' }} />
                                {devicePosition.address || `${devicePosition.latitude}, ${devicePosition.longitude}`}
                              </div>
                            )}
                          </div>
                          <Tag color={isOnline ? "green" : "red"}>
                            {isOnline ? t('online') : t('offline')}
                          </Tag>
                        </div>
                      </Card>
                    );
                  })}
                </Card>
              </Col>

              {/* Detalhes do Dispositivo */}
              <Col span={24} style={{ flex: 1 }}>
                <Card 
                  title={selectedDevice ? selectedDevice.name : t('select_vehicle')}
                  style={{ height: 'calc(100vh - 400px)', overflow: 'auto' }}
                >
                  {selectedDevice ? (
                    <Tabs defaultActiveKey="general" items={tabItems} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Text type="secondary">{t('select_vehicle_details')}</Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Painel Direito - Mapa */}
          <Col span={12} style={{ height: '100%' }}>
            <Card 
              title={t('live_map')}
              style={{ height: '100%' }}
              bodyStyle={{ height: 'calc(100% - 57px)', padding: 0 }}
            >
              <LiveMap
                devices={devices}
                positions={positions}
                selectedDevice={selectedDevice}
                onDeviceSelect={setSelectedDevice}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};
