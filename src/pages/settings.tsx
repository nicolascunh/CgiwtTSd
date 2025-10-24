import React from 'react';
import { Card, Typography, List, Button, Space, Row, Col, Select } from 'antd';
import { 
  BellOutlined, 
  GlobalOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useLogout, useGetIdentity } from '@refinedev/core';
import { useLanguage } from '../contexts/LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

export const SettingsPage: React.FC = () => {
  const { mutate: logout } = useLogout();
  const { data: identity } = useGetIdentity<{ id: string; name?: string; username?: string }>();
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = () => {
    logout();
  };

  const settingsData = [
    {
      title: 'Notificações',
      description: 'Configure alertas e notificações',
      icon: <BellOutlined />,
      actions: [
        {
          label: <strong>Notificações por e-mail</strong>,
          component: <Text type="secondary" style={{ fontSize: '12px' }}>Em breve</Text>
        }
      ]
    },
    {
      title: t('preferences'),
      description: 'Preferências do sistema',
      icon: <SettingOutlined />,
      actions: [
        {
          label: <span>{t('language')}</span>,
          component: (
            <Select 
              value={language} 
              onChange={setLanguage}
              style={{ width: 140 }}
              size="small"
            >
              <Option value="pt-BR">Português</Option>
              <Option value="en-US">English</Option>
              <Option value="es-ES">Español</Option>
            </Select>
          )
        }
      ]
    }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>{t('settings')}</Title>
        <Text type="secondary">
          Gerencie suas preferências e configurações do sistema
        </Text>
      </div>


      {/* Settings Sections */}
      {settingsData.map((section, index) => (
        <Card 
          key={index} 
          style={{ marginBottom: '16px' }}
          title={
            <Space>
              {section.icon}
              <span>{section.title}</span>
            </Space>
          }
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            {section.description}
          </Text>
          
          <List
            dataSource={section.actions}
            renderItem={(item) => (
              <List.Item
                actions={[item.component]}
                style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
              >
                <List.Item.Meta
                  title={item.label}
                  style={{ margin: 0 }}
                />
              </List.Item>
            )}
          />
        </Card>
      ))}

      {/* Logout Section */}
      <Card style={{ marginTop: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <LogoutOutlined style={{ color: '#ff4d4f' }} />
              <div>
                <Title level={5} style={{ margin: 0, color: '#ff4d4f' }}>{t('logout_system')}</Title>
                <Text type="secondary">{t('end_current_session')}</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Button 
              danger 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              {t('logout')}
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
