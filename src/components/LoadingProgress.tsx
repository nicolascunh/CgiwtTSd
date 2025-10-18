import React from 'react';
import { Progress, Card, Typography, Space, Spin } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface LoadingProgressProps {
  currentStep: string;
  percentage: number;
  estimatedTimeRemaining: number;
  completedSteps: number;
  totalSteps: number;
  isLoading: boolean;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  currentStep,
  percentage,
  estimatedTimeRemaining,
  completedSteps,
  totalSteps,
  isLoading,
}) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return '#ff4d4f';
    if (percentage < 70) return '#faad14';
    return '#52c41a';
  };

  const getStepIcon = (step: number, completedSteps: number) => {
    if (step <= completedSteps) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    if (step === completedSteps + 1 && isLoading) {
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    }
    return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
  };

  const steps = [
    'Dispositivos',
    'Posições',
    'Eventos',
    'Viagens',
    'Manutenções',
    'Motoristas'
  ];

  return (
    <Card
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        minWidth: '400px',
        maxWidth: '500px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={4} style={{ margin: '0 0 8px 0' }}>
          Carregando Dados da Frota
        </Title>
        <Text type="secondary">
          {currentStep}
        </Text>
      </div>

      {/* Barra de progresso principal */}
      <div style={{ marginBottom: '24px' }}>
        <Progress
          percent={percentage}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          trailColor="#f0f0f0"
          strokeWidth={8}
          showInfo={true}
          format={(percent) => `${percent}%`}
        />
      </div>

      {/* Lista de etapas */}
      <div style={{ marginBottom: '16px' }}>
        {steps.map((step, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px',
              padding: '8px',
              borderRadius: '6px',
              background: index <= completedSteps ? 'rgba(82, 196, 26, 0.1)' : 'transparent',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ marginRight: '12px', fontSize: '16px' }}>
              {getStepIcon(index + 1, completedSteps)}
            </div>
            <Text
              style={{
                flex: 1,
                color: index <= completedSteps ? '#52c41a' : index === completedSteps ? '#1890ff' : '#8c8c8c',
                fontWeight: index <= completedSteps ? 500 : 400,
              }}
            >
              {step}
            </Text>
            {index <= completedSteps && (
              <Text type="success" style={{ fontSize: '12px' }}>
                ✓
              </Text>
            )}
          </div>
        ))}
      </div>

      {/* Informações adicionais */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '6px',
        marginTop: '16px'
      }}>
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {completedSteps}/{totalSteps} etapas
          </Text>
        </Space>
        
        {estimatedTimeRemaining > 0 && (
          <Space>
            <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ~{formatTime(estimatedTimeRemaining)} restantes
            </Text>
          </Space>
        )}
      </div>

      {/* Dica de otimização */}
      {percentage > 50 && (
        <div style={{ 
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(24, 144, 255, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(24, 144, 255, 0.2)'
        }}>
          <Text style={{ fontSize: '12px', color: '#1890ff' }}>
            💡 Dica: Para frotas grandes, os dados são carregados em lotes para melhor performance
          </Text>
        </div>
      )}
    </Card>
  );
};



