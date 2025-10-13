import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Card, Typography, Row, Col, Tabs, Button, Tag, Avatar, Space, Timeline, Statistic, Select, Divider, Spin, Alert, Switch } from 'antd';
import { 
  CarOutlined, 
  UserOutlined, 
  EnvironmentOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  DashboardOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useTrackmaxApi } from '../../hooks/useTrackmaxApi';
import { useLanguage } from '../../contexts/LanguageContext';
import { LiveMap } from '../../components/LiveMap';
import { VirtualizedDeviceList } from '../../components/VirtualizedDeviceList';
import { PerformanceLoader } from '../../components/PerformanceLoader';
import { PerformanceDashboard } from '../../components/PerformanceDashboard';
import type { Device, Position } from '../../types';

const { Content } = Layout;
const { Title, Text } = Typography;

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreDevices, setHasMoreDevices] = useState(true);
  const [deviceStats, setDeviceStats] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(() => {
    return localStorage.getItem('trackmax-show-performance-monitor') === 'true';
  });
  const [showLoadingMetrics, setShowLoadingMetrics] = useState(() => {
    return localStorage.getItem('trackmax-show-loading-metrics') === 'true';
  });
  
    const { 
    fetchDevices, 
    fetchPositions, 
    loading, 
    error 
  } = useTrackmaxApi();
  const { t } = useLanguage();

  // Carregar dispositivos com paginação e progresso
  const loadDevices = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setLoadingProgress(20);
      
      const result = await fetchDevices(page, 50);
      
      setLoadingProgress(60);
      
      if (append) {
        setDevices(prev => [...prev, ...result.devices]);
      } else {
        setDevices(result.devices);
      }
      
      setHasMoreDevices(result.hasMore);
      setCurrentPage(page);
      
      // Selecionar primeiro dispositivo se não houver seleção
      if (result.devices.length > 0 && !selectedDevice) {
        setSelectedDevice(result.devices[0]);
      }
      
      setLoadingProgress(80);
    } catch (err) {
      console.error('Erro ao carregar dispositivos:', err);
    }
  }, [fetchDevices, searchTerm, deviceFilter, selectedDevice]);

  // Carregar posições otimizadas
  const loadPositions = useCallback(async () => {
    try {
      setLoadingProgress(85);
      
      // Buscar posições para melhor performance
      const deviceIds = devices.map(d => d.id);
      const positionsData = await fetchPositions(deviceIds, 100);
      setPositions(positionsData);
      
      setLoadingProgress(95);
    } catch (err) {
      console.error('Erro ao carregar posições:', err);
    }
  }, [fetchPositions, devices]);

  // Carregar estatísticas do dispositivo selecionado
  const loadDeviceStats = useCallback(async (deviceId: number) => {
    if (deviceStats[deviceId]) return; // Já carregado
    
    try {
      // Simular carregamento de estatísticas
      const mockStats = {
        totalDistance: 0,
        avgSpeed: 0,
        lastUpdate: new Date().toISOString()
      };
      setDeviceStats(prev => ({
        ...prev,
        [deviceId]: mockStats
      }));
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, [deviceStats]);

  // Carregar dados iniciais
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setLoadingProgress(0);
      
      await loadDevices(1, false);
      setLoadingProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    initializeData();
  }, []);

  // Carregar posições quando dispositivos mudarem
  useEffect(() => {
    if (devices.length > 0 && !isLoading) {
      loadPositions();
    }
  }, [loadPositions, devices, isLoading]);

  // Carregar estatísticas quando dispositivo selecionado mudar
  useEffect(() => {
    if (selectedDevice) {
      loadDeviceStats(selectedDevice.id);
    }
  }, [selectedDevice, loadDeviceStats]);

  // Sincronizar configurações de performance do localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setShowPerformanceMonitor(localStorage.getItem('trackmax-show-performance-monitor') === 'true');
      setShowLoadingMetrics(localStorage.getItem('trackmax-show-loading-metrics') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Carregar mais dispositivos (infinite scroll)
  const loadMoreDevices = useCallback(() => {
    if (hasMoreDevices && !loading) {
      loadDevices(currentPage + 1, true);
    }
  }, [hasMoreDevices, loading, currentPage, loadDevices]);

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
            <Col xs={24} md={12}>
              <Text type="secondary">{t('id')}:</Text>
              <br />
              <Text strong>{selectedDevice?.uniqueId}</Text>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('model')}:</Text>
              <br />
              <Text strong>{selectedDevice?.model || 'N/A'}</Text>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('status')}:</Text>
              <br />
              <Tag color={selectedDevice?.disabled ? 'red' : 'green'}>
                {selectedDevice?.disabled ? t('offline') : t('online')}
              </Tag>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('phone')}:</Text>
              <br />
              <Text strong>{selectedDevice?.phone || 'N/A'}</Text>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('category')}:</Text>
              <br />
              <Text strong>{selectedDevice?.category || 'N/A'}</Text>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('last_update')}:</Text>
              <br />
              <Text strong>
                {selectedDevice?.lastUpdate 
                  ? new Date(selectedDevice.lastUpdate).toLocaleString()
                  : 'N/A'
                }
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
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Statistic
                title={t('total_distance')}
                value={deviceStats[selectedDevice?.id || 0]?.totalDistance || 0}
                suffix="km"
                precision={1}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title={t('total_time')}
                value={deviceStats[selectedDevice?.id || 0]?.totalTime || 0}
                suffix="h"
                precision={1}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title={t('average_speed')}
                value={deviceStats[selectedDevice?.id || 0]?.averageSpeed || 0}
                suffix="km/h"
                precision={1}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title={t('fuel_consumption')}
                value={45.2}
                suffix="L"
                precision={1}
              />
            </Col>
          </Row>
          
          <Divider />
          
          <Title level={5}>{t('recent_activity')}</Title>
          <Timeline
            items={mockTimeline.map(item => ({
              children: (
                <div>
                  <Text strong>{item.time}</Text> - {item.event}
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {item.location}
                  </Text>
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
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <Avatar size={48} icon={<UserOutlined />} style={{ marginRight: 12 }} />
            <div>
              <div><Text strong>{mockDriver.name}</Text></div>
              <div><Text type="secondary">#{mockDriver.id}</Text></div>
            </div>
          </div>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('phone')}:</Text>
              <br />
              <Text strong>{mockDriver.phone}</Text>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('email')}:</Text>
              <br />
              <Text strong>{mockDriver.email}</Text>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('license')}:</Text>
              <br />
              <Text strong>{mockDriver.license}</Text>
            </Col>
            <Col xs={24} md={12}>
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
            <Col xs={24} md={12}>
              <Text type="secondary">{t('company_name')}:</Text>
              <br />
              <Text strong>Transportadora ABC Ltda</Text>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('cnpj')}:</Text>
              <br />
              <Text strong>12.345.678/0001-90</Text>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('address')}:</Text>
              <br />
              <Text strong>Rua das Flores, 123 - São Paulo, SP</Text>
            </Col>
            <Col xs={24} md={12}>
              <Text type="secondary">{t('email')}:</Text>
              <br />
              <Text strong>contato@transportadoraabc.com</Text>
            </Col>
          </Row>
        </div>
      )
    }
  ];

  // Mostrar loading elegante
  if (isLoading) {
    return (
      <Content style={{ margin: '0 16px', padding: '24px', background: '#f0f2f5' }}>
        <PerformanceLoader
          loading={isLoading}
          message="Carregando sistema de monitoramento..."
          progress={loadingProgress}
          showMetrics={showLoadingMetrics}
          deviceCount={devices.length}
          onComplete={() => setIsLoading(false)}
        />
      </Content>
    );
  }

  return (
    <Content style={{ margin: '0 16px', padding: '24px', background: '#f0f2f5' }}>
      {/* Dashboard de Performance */}
      <PerformanceDashboard
        deviceCount={devices.length}
        isVisible={showPerformanceMonitor}
      />
      

      
      {error && (
        <Alert
          message="Erro"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Row gutter={[24, 24]} style={{ minHeight: 'calc(100vh - 120px)' }}>
        {/* Lista de Dispositivos */}
        <Col xs={24} xl={8} style={{ height: '100%' }}>
          <Card 
            title={t('vehicles')} 
            style={{ height: '100%', borderRadius: '12px' }}
            styles={{ body: { height: 'calc(100% - 57px)', padding: '16px' } }}
          >
            {/* Filtros */}
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button 
                  type={deviceFilter === 'all' ? 'primary' : 'default'}
                  onClick={() => setDeviceFilter('all')}
                >
                  {t('all')} {devices.length}
                </Button>
                <Button 
                  type={deviceFilter === 'online' ? 'primary' : 'default'}
                  onClick={() => setDeviceFilter('online')}
                >
                  {t('active')} {devices.filter(d => !d.disabled).length}
                </Button>
                <Button 
                  type={deviceFilter === 'offline' ? 'primary' : 'default'}
                  onClick={() => setDeviceFilter('offline')}
                >
                  {t('inactive')} {devices.filter(d => d.disabled).length}
                </Button>
              </Space>
            </div>

            {/* Lista Virtualizada */}
            <VirtualizedDeviceList
              devices={devices}
              positions={positions}
              selectedDevice={selectedDevice}
              onDeviceSelect={setSelectedDevice}
              loading={loading}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              deviceFilter={deviceFilter}
            />
          </Card>
        </Col>

        {/* Mapa e Detalhes */}
        <Col xs={24} xl={16} style={{ height: '100%' }}>
          <Row gutter={[0, 16]} style={{ height: '100%' }}>
            {/* Mapa */}
            <Col span={24} style={{ height: '60%' }}>
              <Card 
                title={t('live_map')} 
                style={{ height: '100%', borderRadius: '12px' }}
                styles={{ body: { height: 'calc(100% - 57px)', padding: '8px' } }}
              >
                <LiveMap
                  devices={devices}
                  positions={positions}
                  selectedDevice={selectedDevice}
                  onDeviceSelect={setSelectedDevice}
                />
              </Card>
            </Col>

            {/* Detalhes do Dispositivo */}
            <Col span={24} style={{ height: '40%' }}>
              <Card 
                title={selectedDevice ? selectedDevice.name : t('select_vehicle')}
                style={{ height: '100%', borderRadius: '12px' }}
                styles={{ body: { height: 'calc(100% - 57px)', padding: '16px' } }}
              >
                {selectedDevice ? (
                  <Tabs
                    defaultActiveKey="general"
                    items={tabItems}
                    size="small"
                    style={{ height: '100%' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <CarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                    <Text type="secondary">{t('select_vehicle_details')}</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Content>
  );
};
