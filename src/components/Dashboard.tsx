import React, { useState } from 'react';
import { Layout, Menu, Typography, Card, Avatar, Button, Tag, Space, Input, Row, Col, Tabs, Divider } from 'antd';
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

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface DashboardProps {
  children?: React.ReactNode;
}

export const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Mock data for vehicles
  const vehicles = [
    {
      id: '1',
      name: 'VOLVO XV - 837472845',
      status: 'On route',
      locations: [
        'GRU airport Guarulhos - SP 07190-100 Brazil',
        'Distribution MGC-356 Belvedere Belo Horizonte - MG 30320-765 Brazil',
        'Port of Rio de Janeiro - Avenida Rodrigues Alves, 10 Saúde Rio de Janeiro RJ 20081-250 Brazil'
      ]
    },
    {
      id: '2',
      name: 'VOLVO XV - 837472846',
      status: 'On route',
      locations: [
        'São Paulo - SP Brazil',
        'Campinas - SP Brazil'
      ]
    }
  ];

  const selectedVehicle = vehicles[0];

  // Check if we're on the main dashboard page
  const isMainDashboard = location.pathname === '/' || location.pathname === '/dashboard';

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
            {collapsed ? 'FMS' : 'Fleet Management'}
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
                    />
                  </div>

                  {/* Filter tabs */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Space>
                      <Button type="text">All 7</Button>
                      <Button type="text">Active 4</Button>
                      <Button type="text">Inactive 3</Button>
                    </Space>
                    <Space>
                      <Button icon={<BarsOutlined />} />
                      <Button icon={<AppstoreOutlined />} />
                    </Space>
                  </div>

                  {/* Vehicle cards */}
                  <Row gutter={[16, 16]}>
                    {vehicles.map((vehicle) => (
                      <Col span={12} key={vehicle.id}>
                        <Card 
                          hoverable
                          style={{ borderRadius: '8px' }}
                          bodyStyle={{ padding: '16px' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <Title level={5} style={{ margin: 0 }}>{vehicle.name}</Title>
                              <Tag color="green" style={{ marginTop: '4px' }}>
                                {vehicle.status}
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
                            {vehicle.locations.map((location, index) => (
                              <div key={index} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                marginBottom: '8px',
                                fontSize: '12px',
                                color: '#666'
                              }}>
                                <EnvironmentOutlined style={{ marginRight: '8px' }} />
                                {location}
                              </div>
                            ))}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>

              {/* Vehicle Details Section */}
              <Col span={8}>
                <Card style={{ borderRadius: '12px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <Title level={4} style={{ margin: 0 }}>{selectedVehicle.name}</Title>
                    <Tag color="green">{selectedVehicle.status}</Tag>
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
                            <Text type="secondary">Brand:</Text>
                          </Col>
                          <Col span={12}>
                            <Text strong>Volvo</Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Vehicle ID:</Text>
                          </Col>
                          <Col span={12}>
                            <Text strong>837473845</Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Location:</Text>
                          </Col>
                          <Col span={12}>
                            <Text strong>40.7128° N, 74.0060° W</Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Status:</Text>
                          </Col>
                          <Col span={12}>
                            <Tag color="green">Moving</Tag>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Speed:</Text>
                          </Col>
                          <Col span={12}>
                            <Text strong>6.2 MPG (2.6 km/l)</Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Odometer:</Text>
                          </Col>
                          <Col span={12}>
                            <Text strong>95,432 miles (153,596 km)</Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Engine Information:</Text>
                          </Col>
                          <Col span={12}>
                            <Text strong>Temperature: Normal</Text>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">Fuel Consumption:</Text>
                          </Col>
                          <Col span={12}>
                            <Text strong>6.2 MPG (2.6 km/l)</Text>
                          </Col>
                        </Row>
                      </div>

                      <Divider />

                      <div>
                        <Title level={5}>DRIVER</Title>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                          <Avatar size={48} icon={<UserOutlined />} style={{ marginRight: '12px' }} />
                          <div>
                            <div><Text strong>Sebastian Bennett</Text></div>
                            <div><Text type="secondary">#8304-3512</Text></div>
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
