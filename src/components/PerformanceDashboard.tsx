import React, { useState, useEffect } from 'react';
import { Card, Typography, Progress, Space, Button, Tag, Alert, Collapse, Statistic, Row, Col } from 'antd';
import { 
  DesktopOutlined, 
  DatabaseOutlined, 
  GlobalOutlined, 
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface PerformanceDashboardProps {
  deviceCount?: number;
  isVisible?: boolean;
  onToggle?: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  deviceCount = 0,
  isVisible = false,
  onToggle
}) => {
  const { 
    metrics, 
    alerts, 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring, 
    collectMetrics,
    clearAlerts 
  } = usePerformanceMonitor();

  const [isMinimized, setIsMinimized] = useState(false);

  // Iniciar monitoramento automaticamente
  useEffect(() => {
    if (!isMonitoring) {
      startMonitoring();
    }
  }, [isMonitoring, startMonitoring]);

  // Coletar métricas quando deviceCount mudar
  useEffect(() => {
    if (deviceCount > 0) {
      collectMetrics(deviceCount);
    }
  }, [deviceCount, collectMetrics]);

  if (!isVisible) return null;

  const getPerformanceStatus = () => {
    if (!metrics) return 'unknown';
    
    const { memoryUsage, cpuUsage, networkLatency } = metrics;
    
    if (memoryUsage.percentage > 90 || cpuUsage > 80 || networkLatency > 2000) {
      return 'critical';
    } else if (memoryUsage.percentage > 70 || cpuUsage > 60 || networkLatency > 1000) {
      return 'warning';
    } else {
      return 'good';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'good': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <ExclamationCircleOutlined />;
      case 'warning': return <WarningOutlined />;
      case 'good': return <CheckCircleOutlined />;
      default: return <DesktopOutlined />;
    }
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: isMinimized ? '60px' : '350px',
      zIndex: 1000,
      transition: 'all 0.3s ease'
    }}>
      {/* Botão Minimizado */}
      {isMinimized && (
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<DesktopOutlined />}
          onClick={() => setIsMinimized(false)}
          style={{
            background: getStatusColor(performanceStatus),
            borderColor: getStatusColor(performanceStatus),
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        />
      )}

      {/* Dashboard Completo */}
      {!isMinimized && (
        <Card
          title={
            <Space>
              {getStatusIcon(performanceStatus)}
              <span>Monitor de Performance</span>
              <Tag color={performanceStatus === 'critical' ? 'red' : performanceStatus === 'warning' ? 'orange' : 'green'}>
                {performanceStatus.toUpperCase()}
              </Tag>
            </Space>
          }
          extra={
            <Space>
              <Button
                type="text"
                size="small"
                icon={isMonitoring ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
              />
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => collectMetrics(deviceCount)}
              />
              <Button
                type="text"
                size="small"
                onClick={() => setIsMinimized(true)}
              >
                −
              </Button>
            </Space>
          }
          size="small"
          style={{
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: `2px solid ${getStatusColor(performanceStatus)}`
          }}
        >
          {metrics && (
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* Métricas Principais */}
              <Row gutter={[8, 8]}>
                <Col span={8}>
                  <Statistic
                    title="Memória"
                    value={metrics.memoryUsage.percentage}
                    suffix="%"
                    valueStyle={{ 
                      color: metrics.memoryUsage.percentage > 80 ? '#ff4d4f' : 
                              metrics.memoryUsage.percentage > 60 ? '#faad14' : '#52c41a',
                      fontSize: '16px'
                    }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="CPU"
                    value={metrics.cpuUsage}
                    suffix="%"
                    valueStyle={{ 
                      color: metrics.cpuUsage > 70 ? '#ff4d4f' : 
                              metrics.cpuUsage > 50 ? '#faad14' : '#52c41a',
                      fontSize: '16px'
                    }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Rede"
                    value={metrics.networkLatency}
                    suffix="ms"
                    valueStyle={{ 
                      color: metrics.networkLatency > 1000 ? '#ff4d4f' : 
                              metrics.networkLatency > 500 ? '#faad14' : '#52c41a',
                      fontSize: '16px'
                    }}
                  />
                </Col>
              </Row>

              {/* Barras de Progresso */}
              <div>
                <Text strong>Uso de Memória</Text>
                <Progress
                  percent={metrics.memoryUsage.percentage}
                  strokeColor={metrics.memoryUsage.percentage > 80 ? '#ff4d4f' : 
                               metrics.memoryUsage.percentage > 60 ? '#faad14' : '#52c41a'}
                  showInfo={false}
                  size="small"
                />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {metrics.memoryUsage.used}MB / {metrics.memoryUsage.total}MB
                </Text>
              </div>

              <div>
                <Text strong>Uso de CPU</Text>
                <Progress
                  percent={metrics.cpuUsage}
                  strokeColor={metrics.cpuUsage > 70 ? '#ff4d4f' : 
                               metrics.cpuUsage > 50 ? '#faad14' : '#52c41a'}
                  showInfo={false}
                  size="small"
                />
              </div>

              {/* Informações do Sistema */}
              <div style={{ 
                padding: '8px', 
                background: '#f5f5f5', 
                borderRadius: '4px',
                fontSize: '11px'
              }}>
                <Row gutter={[8, 4]}>
                  <Col span={12}>
                    <Text type="secondary">Dispositivos:</Text>
                    <br />
                    <Text strong>{deviceCount}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Tempo de Renderização:</Text>
                    <br />
                    <Text strong>{metrics.renderTime}ms</Text>
                  </Col>
                </Row>
              </div>

              {/* Alertas */}
              {alerts.length > 0 && (
                <Collapse size="small" ghost>
                  <Panel 
                    header={
                      <Space>
                        <WarningOutlined style={{ color: '#faad14' }} />
                        <Text>Alertas ({alerts.length})</Text>
                      </Space>
                    } 
                    key="alerts"
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {alerts.slice(-3).map((alert, index) => (
                        <Alert
                          key={index}
                          message={alert.message}
                          type={alert.type}
                          showIcon
                          closable
                        />
                      ))}
                      <Button 
                        size="small" 
                        type="link" 
                        onClick={clearAlerts}
                        style={{ padding: 0 }}
                      >
                        Limpar alertas
                      </Button>
                    </Space>
                  </Panel>
                </Collapse>
              )}

              {/* Dicas de Performance */}
              <div style={{ 
                padding: '8px', 
                background: '#e6f7ff', 
                borderRadius: '4px',
                border: '1px solid #91d5ff'
              }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  💡 <strong>Dicas:</strong>
                  <br />
                  • Feche abas desnecessárias
                  <br />
                  • Use modo escuro para economizar bateria
                  <br />
                  • Mantenha o navegador atualizado
                </Text>
              </div>
            </Space>
          )}

          {!metrics && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text type="secondary">Iniciando monitoramento...</Text>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
