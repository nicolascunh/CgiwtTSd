import React from 'react';
import { Card, Typography, List, Switch, Button, Divider, Space, Avatar, Row, Col, Select, Radio } from 'antd';
import { 
  UserOutlined, 
  BellOutlined, 
  SecurityScanOutlined, 
  GlobalOutlined,
  LogoutOutlined,
  SettingOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useLogout } from '@refinedev/core';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useTheme, Theme } from '../contexts/ThemeContext';

const { Title, Text } = Typography;
const { Option } = Select;

export const SettingsPage: React.FC = () => {
  const { mutate: logout } = useLogout();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
  };

  const settingsData = [
    {
      title: t('notifications_settings'),
      description: t('configure_alerts'),
      icon: <BellOutlined />,
      actions: [
        {
          label: t('email_notifications'),
          component: <Switch defaultChecked />
        },
        {
          label: t('push_notifications'),
          component: <Switch defaultChecked />
        },
        {
          label: t('device_alerts'),
          component: <Switch defaultChecked />
        }
      ]
    },
    {
      title: t('security'),
      description: t('account_security'),
      icon: <SecurityScanOutlined />,
      actions: [
        {
          label: t('two_factor_auth'),
          component: <Switch />
        },
        {
          label: t('active_sessions'),
          component: <Button type="link" size="small">{t('view_sessions')}</Button>
        }
      ]
    },
    {
      title: t('preferences'),
      description: t('general_settings'),
      icon: <SettingOutlined />,
      actions: [
        {
          label: t('language'),
          component: (
            <Select 
              value={language} 
              onChange={setLanguage}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="pt-BR">Português</Option>
              <Option value="en-US">English</Option>
              <Option value="es-ES">Español</Option>
            </Select>
          )
        },
        {
          label: t('timezone'),
          component: <Button type="link" size="small">America/Sao_Paulo</Button>
        },
        {
          label: t('date_format'),
          component: <Button type="link" size="small">DD/MM/YYYY</Button>
        }
      ]
    },
    {
      title: 'Tema',
      description: 'Escolha entre tema claro ou escuro',
      icon: <BulbOutlined />,
      actions: [
        {
          label: 'Modo Escuro',
          component: (
            <Radio.Group 
              value={theme} 
              onChange={(e) => setTheme(e.target.value)}
              size="small"
            >
              <Radio.Button value="light">Claro</Radio.Button>
              <Radio.Button value="dark">Escuro</Radio.Button>
            </Radio.Group>
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

      {/* User Profile Section */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" gutter={16}>
          <Col>
            <Avatar size={64} icon={<UserOutlined />} />
          </Col>
          <Col flex="1">
            <Title level={4} style={{ margin: 0 }}>{t('current_user')}</Title>
            <Text type="secondary">{t('manage_personal_info')}</Text>
          </Col>
          <Col>
            <Button type="primary">{t('edit_profile')}</Button>
          </Col>
        </Row>
      </Card>

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
