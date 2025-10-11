import React, { useState, useEffect } from 'react';
import { Card, Typography, List, Switch, Button, Divider, Space, Avatar, Row, Col, Select, Radio, Alert } from 'antd';
import { 
  UserOutlined, 
  BellOutlined, 
  SecurityScanOutlined, 
  GlobalOutlined,
  LogoutOutlined,
  SettingOutlined,
  BulbOutlined,
  DashboardOutlined,
  MonitorOutlined
} from '@ant-design/icons';
import { useLogout, useGetIdentity } from '@refinedev/core';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useTheme, Theme } from '../contexts/ThemeContext';

const { Title, Text } = Typography;
const { Option } = Select;

export const SettingsPage: React.FC = () => {
  const { mutate: logout } = useLogout();
  const { data: identity } = useGetIdentity<{ id: string; name?: string; username?: string }>();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, toggleTheme } = useTheme();
  
  // Estados para configurações de performance
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(() => {
    return localStorage.getItem('trackmax-show-performance-monitor') === 'true';
  });
  const [showLoadingMetrics, setShowLoadingMetrics] = useState(() => {
    return localStorage.getItem('trackmax-show-loading-metrics') === 'true';
  });
  const [autoOptimizePerformance, setAutoOptimizePerformance] = useState(() => {
    return localStorage.getItem('trackmax-auto-optimize-performance') === 'true';
  });

  const handleLogout = () => {
    logout();
  };

  // Funções para salvar configurações de performance
  const handlePerformanceMonitorChange = (checked: boolean) => {
    setShowPerformanceMonitor(checked);
    localStorage.setItem('trackmax-show-performance-monitor', checked.toString());
  };

  const handleLoadingMetricsChange = (checked: boolean) => {
    setShowLoadingMetrics(checked);
    localStorage.setItem('trackmax-show-loading-metrics', checked.toString());
  };

  const handleAutoOptimizeChange = (checked: boolean) => {
    setAutoOptimizePerformance(checked);
    localStorage.setItem('trackmax-auto-optimize-performance', checked.toString());
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
          label: t('toggle_theme'),
          component: (
            <Button 
              size="small" 
              icon={<BulbOutlined />} 
              onClick={toggleTheme}
            >
              {theme === 'light' ? t('switch_to_dark') : t('switch_to_light')}
            </Button>
          )
        },
        {
          label: t('theme_mode'),
          component: (
            <Radio.Group 
              value={theme} 
              onChange={(e) => setTheme(e.target.value)}
              size="small"
            >
              <Radio.Button value="light">{t('theme_light')}</Radio.Button>
              <Radio.Button value="dark">{t('theme_dark')}</Radio.Button>
            </Radio.Group>
          )
        }
      ]
    },
    {
      title: t('performance'),
      description: t('performance_settings'),
      icon: <MonitorOutlined />,
      actions: [
        {
          label: t('performance_monitor'),
          component: (
            <Switch 
              checked={showPerformanceMonitor}
              onChange={handlePerformanceMonitorChange}
            />
          )
        },
        {
          label: t('loading_metrics'),
          component: (
            <Switch 
              checked={showLoadingMetrics}
              onChange={handleLoadingMetricsChange}
            />
          )
        },
        {
          label: t('auto_optimization'),
          component: (
            <Switch 
              checked={autoOptimizePerformance}
              onChange={handleAutoOptimizeChange}
            />
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
            <Title level={4} style={{ margin: 0 }}>
              {identity?.name || identity?.username || t('current_user_unknown')}
            </Title>
            <Text type="secondary">{t('manage_personal_info')}</Text>
          </Col>
          <Col>
            <Button type="primary">{t('edit_profile')}</Button>
          </Col>
        </Row>
      </Card>

      {/* Performance Info Alert */}
      {showPerformanceMonitor && (
        <Alert
          message="Configurações de Performance Ativas"
          description="O monitor de performance está ativo e ajudará a otimizar o uso de recursos do seu notebook. As configurações são salvas automaticamente."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

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
