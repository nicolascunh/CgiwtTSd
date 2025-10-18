import React, { useState, useEffect } from 'react';
import { Spin, Progress, Card, Typography, Space, Tag, Alert } from 'antd';
import { 
  LoadingOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  DesktopOutlined
} from '@ant-design/icons';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

const { Text, Title } = Typography;

interface PerformanceLoaderProps {
  loading: boolean;
  message?: string;
  progress?: number;
  showMetrics?: boolean;
  deviceCount?: number;
  onComplete?: () => void;
}

export const PerformanceLoader: React.FC<PerformanceLoaderProps> = ({
  loading,
  message = 'Carregando dados...',
  progress,
  showMetrics = true,
  deviceCount = 0,
  onComplete
}) => {
  const [loadingSteps, setLoadingSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const { metrics, alerts, startMonitoring, stopMonitoring, collectMetrics } = usePerformanceMonitor();

  // Simular etapas de carregamento
  useEffect(() => {
    if (loading) {
      setIsComplete(false);
      setCurrentStep(0);
      setLoadingSteps([
        'Inicializando sistema...',
        'Conectando ao servidor...',
        'Autenticando usuário...',
        'Carregando dispositivos...',
        'Buscando posições...',
        'Renderizando mapa...',
        'Finalizando...'
      ]);
      startMonitoring();
    } else {
      setCurrentStep(loadingSteps.length - 1);
      setTimeout(() => {
        setIsComplete(true);
        stopMonitoring();
        onComplete?.();
      }, 500);
    }
  }, [loading, startMonitoring, stopMonitoring, onComplete]);

  // Simular progresso das etapas
  useEffect(() => {
    if (loading && currentStep < loadingSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 800 + Math.random() * 400); // Tempo variável entre etapas

      return () => clearTimeout(timer);
    }
  }, [loading, currentStep, loadingSteps.length]);

  // Coletar métricas quando deviceCount mudar
  useEffect(() => {
    if (deviceCount > 0) {
      collectMetrics(deviceCount);
    }
  }, [deviceCount, collectMetrics]);

  if (!loading && isComplete) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px',
        minHeight: '200px'
      }}>
        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
        <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
          Carregamento Concluído!
        </Title>
        <Text type="secondary">
          {deviceCount} dispositivos carregados com sucesso
        </Text>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '40px',
      minHeight: '300px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      color: 'white'
    }}>
      {/* Loading Principal */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <LoadingOutlined style={{ fontSize: 48, marginBottom: 16 }} />
        <Title level={3} style={{ margin: 0, color: 'white' }}>
          {message}
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
          {loadingSteps[currentStep]}
        </Text>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
        <Progress
          percent={progress || ((currentStep + 1) / loadingSteps.length) * 100}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          showInfo={false}
          strokeWidth={8}
        />
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
            {Math.round((progress || ((currentStep + 1) / loadingSteps.length) * 100))}% concluído
          </Text>
        </div>
      </div>

      {/* Métricas de Performance */}
      {showMetrics && metrics && (
        <Card 
          style={{ 
            width: '100%', 
            maxWidth: 500, 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)'
          }}
          styles={{ body: { padding: 16 } }}
        >
          <Title level={5} style={{ margin: 0, marginBottom: 16, color: 'white' }}>
            <DesktopOutlined /> Monitoramento de Performance
          </Title>
          
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* Uso de Memória */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <DatabaseOutlined />
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Memória</Text>
              </Space>
              <div style={{ textAlign: 'right' }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  {metrics.memoryUsage.used}MB / {metrics.memoryUsage.total}MB
                </Text>
                <br />
                <Tag color={metrics.memoryUsage.percentage > 80 ? 'red' : metrics.memoryUsage.percentage > 60 ? 'orange' : 'green'}>
                  {metrics.memoryUsage.percentage}%
                </Tag>
              </div>
            </div>

            {/* Uso de CPU */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <ClockCircleOutlined />
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>CPU</Text>
              </Space>
              <div style={{ textAlign: 'right' }}>
                <Tag color={metrics.cpuUsage > 70 ? 'red' : metrics.cpuUsage > 50 ? 'orange' : 'green'}>
                  {metrics.cpuUsage}%
                </Tag>
              </div>
            </div>

            {/* Latência de Rede */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <GlobalOutlined />
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Rede</Text>
              </Space>
              <div style={{ textAlign: 'right' }}>
                <Tag color={metrics.networkLatency > 1000 ? 'red' : metrics.networkLatency > 500 ? 'orange' : 'green'}>
                  {metrics.networkLatency}ms
                </Tag>
              </div>
            </div>

            {/* Dispositivos */}
            {deviceCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <DatabaseOutlined />
                  <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Dispositivos</Text>
                </Space>
                <div style={{ textAlign: 'right' }}>
                  <Tag color="blue">{deviceCount} veículos</Tag>
                </div>
              </div>
            )}
          </Space>
        </Card>
      )}

      {/* Alertas de Performance */}
      {alerts.length > 0 && (
        <div style={{ width: '100%', maxWidth: 500, marginTop: 16 }}>
          {alerts.slice(-3).map((alert, index) => (
            <Alert
              key={index}
              message={alert.message}
              type={alert.type}
              showIcon
              style={{ marginBottom: 8 }}
              closable
            />
          ))}
        </div>
      )}

      {/* Dicas de Performance */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: 'rgba(255,255,255,0.1)', 
        borderRadius: 8,
        textAlign: 'center'
      }}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
          💡 <strong>Dica:</strong> Para melhor performance, feche outras abas do navegador
        </Text>
      </div>
    </div>
  );
};
