import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Card, Avatar, Button, Tag, Space, Input, Row, Col, Tabs, Divider, Spin, Alert } from 'antd';
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
  DashboardOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import { useTrackmaxApi } from '../hooks/useTrackmaxApi';
import type { Device, Position } from '../types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface DashboardProps {
  children?: React.ReactNode;
}

export const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchDevices, fetchPositions, loading, error } = useTrackmaxApi();

  // Debug log
  useEffect(() => {
    console.log('Dashboard rendered, location:', location.pathname);
    console.log('Children:', children);
  }, [location.pathname, children]);

  // Carregar dados quando o componente montar
  useEffect(() => {
    const loadData = async () => {
      try {
        const devicesData = await fetchDevices();
        setDevices(devicesData);
        
        if (devicesData.length > 0) {
          setSelectedDevice(devicesData[0]);
          
          // Buscar posições para o primeiro dispositivo
          const positionsData = await fetchPositions(devicesData[0].id);
          setPositions(positionsData);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };

    loadData();
  }, []);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/')
    },
    {
      key: 'vehicles',
      icon: <CarOutlined />,
      label: 'Vehicles',
      onClick: () => navigate('/devices')
    },
    {
      key: 'drivers',
      icon: <UserOutlined />,
      label: 'Drivers',
      onClick: () => navigate('/drivers')
    },
    {
      key: 'reports',
      icon: <AppstoreOutlined />,
      label: 'Reports',
      onClick: () => navigate('/route-reports')
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      onClick: () => navigate('/notifications')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings')
    }
  ];

  // Filtrar dispositivos baseado no termo de busca
  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.uniqueId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Contadores
  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => !d.disabled && d.status === 'online').length;
  const inactiveDevices = totalDevices - activeDevices;

  // Check if we're on the main dashboard page
  const isMainDashboard = location.pathname === '/' || location.pathname === '/dashboard';

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px' }}>
          <Alert
            message="Erro ao carregar dados"
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
            {collapsed ? 'FMS' : 'TrackMax'}
          </Title>
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
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
                    <Title level={4} style={{ margin: 0 }}>Vehicles</Title>
                    <Input 
                      placeholder="Search vehicles..." 
                      prefix={<SearchOutlined />}
                      style={{ width: 250 }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Filter tabs */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Space>
                      <Button type="text">All {totalDevices}</Button>
                      <Button type="text">Active {activeDevices}</Button>
                      <Button type="text">Inactive {inactiveDevices}</Button>
                    </Space>
                    <Space>
                      <Button icon={<BarsOutlined />} />
                      <Button icon={<AppstoreOutlined />} />
                    </Space>
                  </div>

                  {/* Vehicle cards */}
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: '16px' }}>Carregando dispositivos...</div>
                    </div>
                  ) : (
                    <Row gutter={[16, 16]}>
                      {filteredDevices.map((device) => {
                        const devicePosition = positions.find(p => p.deviceId === device.id);
                        const isOnline = device.status === 'online' && !device.disabled;
                        
                        return (
                          <Col span={12} key={device.id}>
                            <Card 
                              hoverable
                              style={{ borderRadius: '8px' }}
                              bodyStyle={{ padding: '16px' }}
                              onClick={() => setSelectedDevice(device)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                  <Title level={5} style={{ margin: 0 }}>{device.name}</Title>
                                  <Tag color={isOnline ? "green" : "red"} style={{ marginTop: '4px' }}>
                                    {isOnline ? 'Online' : 'Offline'}
                                  </Tag>
                                </div>
                                <Button 
                                  type="primary" 
                                  icon={<CameraOutlined />}
                                  size="small"
                                  style={{ background: '#722ed1', borderColor: '#722ed1' }}
                                >
                                  Live câmera
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
                                    Sem dados de localização
                                  </div>
                                )}
                                
                                <div style={{ 
                                  fontSize: '12px',
                                  color: '#666',
                                  marginTop: '8px'
                                }}>
                                  <div>ID: {device.uniqueId}</div>
                                  <div>Modelo: {device.model || 'N/A'}</div>
                                  <div>Última atualização: {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'N/A'}</div>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
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
                          {selectedDevice.status === 'online' && !selectedDevice.disabled ? 'Online' : 'Offline'}
                        </Tag>
                      </div>

                      <Tabs defaultActiveKey="vehicle-info">
                        <TabPane tab="Vehicle info" key="vehicle-info">
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
                            <Title level={5}>INFORMATIONS</Title>
                            <Row gutter={[0, 8]}>
                              <Col span={12}>
                                <Text type="secondary">ID:</Text>
                              </Col>
                              <Col span={12}>
                                <Text strong>{selectedDevice.uniqueId}</Text>
                              </Col>
                              <Col span={12}>
                                <Text type="secondary">Model:</Text>
                              </Col>
                              <Col span={12}>
                                <Text strong>{selectedDevice.model || 'N/A'}</Text>
                              </Col>
                              <Col span={12}>
                                <Text type="secondary">Status:</Text>
                              </Col>
                              <Col span={12}>
                                <Tag color={selectedDevice.status === 'online' ? "green" : "red"}>
                                  {selectedDevice.status}
                                </Tag>
                              </Col>
                              <Col span={12}>
                                <Text type="secondary">Phone:</Text>
                              </Col>
                              <Col span={12}>
                                <Text strong>{selectedDevice.phone || 'N/A'}</Text>
                              </Col>
                              <Col span={12}>
                                <Text type="secondary">Contact:</Text>
                              </Col>
                              <Col span={12}>
                                <Text strong>{selectedDevice.contact || 'N/A'}</Text>
                              </Col>
                              <Col span={12}>
                                <Text type="secondary">Category:</Text>
                              </Col>
                              <Col span={12}>
                                <Text strong>{selectedDevice.category || 'N/A'}</Text>
                              </Col>
                              <Col span={12}>
                                <Text type="secondary">Last Update:</Text>
                              </Col>
                              <Col span={12}>
                                <Text strong>
                                  {selectedDevice.lastUpdate ? new Date(selectedDevice.lastUpdate).toLocaleString() : 'N/A'}
                                </Text>
                              </Col>
                            </Row>
                          </div>

                          <Divider />

                          <div>
                            <Title level={5}>DRIVER</Title>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                              <Avatar size={48} icon={<UserOutlined />} style={{ marginRight: '12px' }} />
                              <div>
                                <div><Text strong>N/A</Text></div>
                                <div><Text type="secondary">Driver information not available</Text></div>
                              </div>
                            </div>
                            <Button 
                              type="primary" 
                              icon={<PhoneOutlined />}
                              style={{ background: '#722ed1', borderColor: '#722ed1' }}
                            >
                              Contact
                            </Button>
                          </div>
                        </TabPane>
                        <TabPane tab="Actions" key="actions">
                          <p>Actions content</p>
                        </TabPane>
                        <TabPane tab="Reports" key="reports">
                          <p>Reports content</p>
                        </TabPane>
                        <TabPane tab="Company" key="company">
                          <p>Company content</p>
                        </TabPane>
                      </Tabs>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Text type="secondary">Selecione um dispositivo para ver os detalhes</Text>
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
    </Layout>
  );
};
