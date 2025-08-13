import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Card, Avatar, Button, Tag, Space, Input, Row, Col, Tabs, Divider, Spin, Alert, Modal } from 'antd';
import { 
  CarOutlined, 
  UserOutlined, 
  BellOutlined, 
  SettingOutlined,
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  CameraOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import { useLogout } from '@refinedev/core';
import { useTrackmaxApi } from '../hooks/useTrackmaxApi';
import { useLanguage } from '../contexts/LanguageContext';
import type { Device, Position } from '../types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface DashboardProps {
  children?: React.ReactNode;
}

type DeviceFilter = 'all' | 'online' | 'offline';

export const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: logout } = useLogout();
  const { fetchDevices, fetchPositions, loading, error } = useTrackmaxApi();
  const { t } = useLanguage();

  // Debug log
  useEffect(() => {
    console.log('Dashboard rendered, location:', location.pathname);
    console.log('Children:', children);
  }, [location.pathname, children]);

  // Carregar dados quando o componente montar
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchDevices();
        const devicesData = result.devices || [];
        setAllDevices(devicesData);
        setDevices(devicesData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    logout();
    setLogoutModalVisible(false);
  };

  const cancelLogout = () => {
    setLogoutModalVisible(false);
  };

  // Função para selecionar dispositivo e carregar posições
  const handleDeviceSelect = async (device: Device) => {
    setSelectedDevice(device);
    
    // Verificar se já temos posições para este dispositivo
    const existingPositions = positions.filter(p => p.deviceId === device.id);
    if (existingPositions.length === 0) {
      try {
        // Carregar posições do dispositivo selecionado apenas se não existirem
        const devicePositions = await fetchPositions([device.id], 10);
        setPositions(prev => [...prev.filter(p => p.deviceId !== device.id), ...devicePositions]);
      } catch (err) {
        console.error('Erro ao carregar posições do dispositivo:', err);
      }
    }
  };

  // Função para carregar mais dispositivos
  const loadMoreDevices = async () => {
    try {
      const nextPage = currentPage + 1;
      const result = await fetchDevices(nextPage, pageSize);
      const newDevices = result.devices || [];
      
      setAllDevices(prev => [...prev, ...newDevices]);
      setDevices(prev => [...prev, ...newDevices]);
      setCurrentPage(nextPage);
    } catch (err) {
      console.error('Erro ao carregar mais dispositivos:', err);
    }
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('dashboard'),
      onClick: () => navigate('/')
    },
    {
      key: 'vehicles',
      icon: <CarOutlined />,
      label: t('vehicles'),
      onClick: () => navigate('/devices')
    },
    {
      key: 'drivers',
      icon: <UserOutlined />,
      label: t('drivers'),
      onClick: () => navigate('/drivers')
    },
    {
      key: 'reports',
      icon: <AppstoreOutlined />,
      label: t('reports'),
      onClick: () => navigate('/route-reports')
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: t('notifications'),
      onClick: () => navigate('/notifications')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('settings'),
      children: [
        {
          key: 'settings-page',
          icon: <SettingOutlined />,
          label: t('settings'),
          onClick: () => navigate('/settings')
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: t('logout'),
          onClick: handleLogout
        }
      ]
    }
  ];

  // Filtrar dispositivos baseado no termo de busca e filtro
  const filteredDevices = (allDevices || []).filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.uniqueId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = (() => {
      switch (deviceFilter) {
        case 'online':
          return device.status === 'online' && !device.disabled;
        case 'offline':
          return device.status !== 'online' || device.disabled;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  // Paginar dispositivos filtrados
  const paginatedDevices = filteredDevices.slice(0, currentPage * pageSize);

  // Contadores
  const totalDevices = (allDevices || []).length;
  const activeDevices = (allDevices || []).filter(d => !d.disabled && d.status === 'online').length;
  const inactiveDevices = totalDevices - activeDevices;

  // Check if we're on the main dashboard page
  const isMainDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  // Tab items para o dashboard
  const tabItems = [
    {
      key: 'vehicle-info',
      label: t('vehicle_info'),
      children: (
        <>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '120px',
              height: '80px',
              background: '#1890ff',
              borderRadius: '8px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px'
            }}>
              🚛
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <Title level={5}>{t('information')}</Title>
            <Row gutter={[0, 8]}>
              <Col span={12}>
                <Text type="secondary">{t('id')}:</Text>
              </Col>
              <Col span={12}>
                <Text strong>{selectedDevice?.uniqueId}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">{t('model')}:</Text>
              </Col>
              <Col span={12}>
                <Text strong>{selectedDevice?.model || 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">{t('status')}:</Text>
              </Col>
              <Col span={12}>
                <Tag color={selectedDevice?.status === 'online' ? "green" : "red"}>
                  {selectedDevice?.status}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">{t('phone')}:</Text>
              </Col>
              <Col span={12}>
                <Text strong>{selectedDevice?.phone || 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">{t('contact')}:</Text>
              </Col>
              <Col span={12}>
                <Text strong>{selectedDevice?.contact || 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">{t('category')}:</Text>
              </Col>
              <Col span={12}>
                <Text strong>{selectedDevice?.category || 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">{t('last_update')}:</Text>
              </Col>
              <Col span={12}>
                <Text strong>
                  {selectedDevice?.lastUpdate ? new Date(selectedDevice.lastUpdate).toLocaleString() : 'N/A'}
                </Text>
              </Col>
            </Row>
          </div>

          <Divider />

          <div>
            <Title level={5}>{t('driver')}</Title>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <Avatar size={48} icon={<UserOutlined />} style={{ marginRight: '12px' }} />
              <div>
                <div><Text strong>N/A</Text></div>
                <div><Text type="secondary">{t('driver_info_not_available')}</Text></div>
              </div>
            </div>
            <Button 
              type="primary" 
              icon={<PhoneOutlined />}
              style={{ background: '#722ed1', borderColor: '#722ed1' }}
            >
              {t('contact')}
            </Button>
          </div>
        </>
      )
    },
    {
      key: 'actions',
      label: t('actions'),
      children: <p>Actions content</p>
    },
    {
      key: 'reports',
      label: t('reports'),
      children: <p>Reports content</p>
    },
    {
      key: 'company',
      label: t('company'),
      children: <p>Company content</p>
    }
  ];

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px' }}>
          <Alert
            message={t('error_loading_data')}
            description={error}
            type="error"
            showIcon
          />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Drawer/Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#1a1a2e',
          borderRight: '1px solid #2d2d44'
        }}
        width={280}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            {collapsed ? 'TM' : 'TrackMax'}
          </Title>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          defaultOpenKeys={['settings']}
          items={menuItems}
          style={{
            background: '#1a1a2e',
            border: 'none'
          }}
        />
      </Sider>

      <Layout>
        {/* Main Content */}
        <Content style={{ 
          margin: '0 16px',
          padding: '24px',
          background: '#f0f2f5'
        }}>
          {isMainDashboard ? (
            // Dashboard content
            <Row gutter={[24, 24]}>
              {/* Vehicle List Section */}
              <Col span={16}>
                <Card style={{ borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Title level={4} style={{ margin: 0 }}>{t('vehicles')}</Title>
                    <Input 
                      placeholder={t('search_vehicles')} 
                      prefix={<SearchOutlined />}
                      style={{ width: 250 }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Filter tabs */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px', marginRight: '8px' }}>
                        {t('view_mode')}: {viewMode === 'grid' ? t('grid_view') : t('list_view')}
                      </Text>
                    </div>
                    <Space>
                      <Button 
                        type={deviceFilter === 'all' ? 'primary' : 'text'}
                        onClick={() => setDeviceFilter('all')}
                      >
                        {t('all')} {totalDevices}
                      </Button>
                      <Button 
                        type={deviceFilter === 'online' ? 'primary' : 'text'}
                        onClick={() => setDeviceFilter('online')}
                      >
                        {t('active')} {activeDevices}
                      </Button>
                      <Button 
                        type={deviceFilter === 'offline' ? 'primary' : 'text'}
                        onClick={() => setDeviceFilter('offline')}
                      >
                        {t('inactive')} {inactiveDevices}
                      </Button>
                    </Space>
                    <Space>
                      <Button 
                        icon={<BarsOutlined />} 
                        type={viewMode === 'list' ? 'primary' : 'default'}
                        onClick={() => setViewMode('list')}
                        title={t('list_view')}
                      />
                      <Button 
                        icon={<AppstoreOutlined />} 
                        type={viewMode === 'grid' ? 'primary' : 'default'}
                        onClick={() => setViewMode('grid')}
                        title={t('grid_view')}
                      />
                    </Space>
                  </div>

                  {/* Vehicle cards */}
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: '16px' }}>{t('loading_devices')}</div>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <Row gutter={[16, 16]}>
                      {paginatedDevices.map((device) => {
                        const devicePosition = positions.find(p => p.deviceId === device.id);
                        const isOnline = device.status === 'online' && !device.disabled;
                        
                        return (
                          <Col span={12} key={device.id}>
                            <Card 
                              hoverable
                              style={{ 
                                borderRadius: '8px',
                                border: selectedDevice?.id === device.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                                boxShadow: selectedDevice?.id === device.id ? '0 4px 12px rgba(24, 144, 255, 0.15)' : 'none'
                              }}
                              styles={{ body: { padding: '16px' } }}
                              onClick={() => handleDeviceSelect(device)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                  <Title level={5} style={{ margin: 0 }}>{device.name}</Title>
                                  <Tag color={isOnline ? "green" : "red"} style={{ marginTop: '4px' }}>
                                    {isOnline ? t('online') : t('offline')}
                                  </Tag>
                                </div>
                                <Button 
                                  type="primary" 
                                  icon={<CameraOutlined />}
                                  size="small"
                                  style={{ background: '#722ed1', borderColor: '#722ed1' }}
                                >
                                  {t('live_camera')}
                                </Button>
                              </div>
                              
                              <div>
                                {devicePosition ? (
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    marginBottom: '8px',
                                    fontSize: '12px',
                                    color: '#666'
                                  }}>
                                    <EnvironmentOutlined style={{ marginRight: '8px' }} />
                                    {devicePosition.address || `${devicePosition.latitude}, ${devicePosition.longitude}`}
                                  </div>
                                ) : (
                                  <div style={{ 
                                    fontSize: '12px',
                                    color: '#999'
                                  }}>
                                    {t('no_location_data')}
                                  </div>
                                )}
                                
                                <div style={{ 
                                  fontSize: '12px',
                                  color: '#666',
                                  marginTop: '8px'
                                }}>
                                  <div>{t('id')}: {device.uniqueId}</div>
                                  <div>{t('model')}: {device.model || 'N/A'}</div>
                                  <div>{t('last_update')}: {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'N/A'}</div>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  ) : (
                    // Visualização em Lista
                    <div>
                      {paginatedDevices.map((device) => {
                        const devicePosition = positions.find(p => p.deviceId === device.id);
                        const isOnline = device.status === 'online' && !device.disabled;
                        
                        return (
                          <Card 
                            key={device.id}
                            hoverable
                            style={{ 
                              borderRadius: '8px', 
                              marginBottom: '12px',
                              cursor: 'pointer',
                              border: selectedDevice?.id === device.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                              boxShadow: selectedDevice?.id === device.id ? '0 4px 12px rgba(24, 144, 255, 0.15)' : 'none'
                            }}
                            styles={{ body: { padding: '12px' } }}
                            onClick={() => handleDeviceSelect(device)}
                          >
                            <Row align="middle" gutter={16}>
                              <Col span={2}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: isOnline ? '#52c41a' : '#ff4d4f',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '18px'
                                }}>
                                  🚛
                                </div>
                              </Col>
                              <Col span={6}>
                                <Title level={5} style={{ margin: 0 }}>{device.name}</Title>
                                <Text type="secondary">{device.uniqueId}</Text>
                              </Col>
                              <Col span={4}>
                                <Tag color={isOnline ? "green" : "red"}>
                                  {isOnline ? t('online') : t('offline')}
                                </Tag>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                  {device.model || 'N/A'}
                                </div>
                              </Col>
                              <Col span={8}>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {devicePosition ? (
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <EnvironmentOutlined style={{ marginRight: '4px' }} />
                                      <span style={{ 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        maxWidth: '200px'
                                      }}>
                                        {devicePosition.address || `${devicePosition.latitude}, ${devicePosition.longitude}`}
                                      </span>
                                    </div>
                                  ) : (
                                    <div>{t('no_location_data')}</div>
                                  )}
                                </div>
                                <div style={{ fontSize: '12px', color: '#999' }}>
                                  {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'N/A'}
                                </div>
                              </Col>
                              <Col span={4}>
                                <Button 
                                  type="primary" 
                                  icon={<CameraOutlined />}
                                  size="small"
                                  style={{ background: '#722ed1', borderColor: '#722ed1' }}
                                >
                                  {t('live_camera')}
                                </Button>
                              </Col>
                            </Row>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Botão Carregar Mais */}
                  {paginatedDevices.length < filteredDevices.length && (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                      <Button 
                        type="primary" 
                        onClick={loadMoreDevices}
                        loading={loading}
                      >
                        Carregar Mais Veículos ({paginatedDevices.length} de {filteredDevices.length})
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>

              {/* Vehicle Details Section */}
              <Col span={8}>
                <Card style={{ borderRadius: '12px' }}>
                  {selectedDevice ? (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <Title level={4} style={{ margin: 0 }}>{selectedDevice.name}</Title>
                        <Tag color={selectedDevice.status === 'online' && !selectedDevice.disabled ? "green" : "red"}>
                          {selectedDevice.status === 'online' && !selectedDevice.disabled ? t('online') : t('offline')}
                        </Tag>
                      </div>

                      <Tabs defaultActiveKey="vehicle-info" items={tabItems} />
                      
                      {/* Informações adicionais do dispositivo selecionado */}
                      {positions.length > 0 && (
                        <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                          <Title level={5} style={{ margin: '0 0 8px 0' }}>Última Posição</Title>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            <div><strong>Latitude:</strong> {positions[0].latitude}</div>
                            <div><strong>Longitude:</strong> {positions[0].longitude}</div>
                            <div><strong>Velocidade:</strong> {positions[0].speed || 0} km/h</div>
                            <div><strong>Direção:</strong> {positions[0].course || 0}°</div>
                            <div><strong>Data/Hora:</strong> {new Date(positions[0].deviceTime).toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <CarOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
                      <Title level={4} style={{ color: '#666', marginBottom: 16 }}>
                        {t('no_vehicle_selected')}
                      </Title>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {t('click_to_select_vehicle')}
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          ) : (
            // Other pages content
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px' }}>
              {children}
            </div>
          )}
        </Content>
      </Layout>

      {/* Logout Modal */}
      <Modal
        title={t('confirm_logout')}
        open={logoutModalVisible}
        onOk={confirmLogout}
        onCancel={cancelLogout}
        okText={t('logout')}
        cancelText={t('cancel')}
        okButtonProps={{ danger: true }}
      >
        <p>{t('confirm_logout_message')}</p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          {t('redirect_login')}
        </p>
      </Modal>
    </Layout>
  );
};
