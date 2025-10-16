import React from 'react';
import { Card, Progress, Typography, Space, Alert, Button } from 'antd';
import { 
  DatabaseOutlined, 
  ClockCircleOutlined, 
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface LargeScaleLoaderProps {
  isVisible: boolean;
  totalDevices: number;
  processedDevices: number;
  currentBatch: number;
  totalBatches: number;
  currentOperation: string;
  estimatedTimeRemaining?: number;
  errors: string[];
  onRetry?: () => void;
  onCancel?: () => void;
}

export const LargeScaleLoader: React.FC<LargeScaleLoaderProps> = ({
  isVisible,
  totalDevices,
  processedDevices,
  currentBatch,
  totalBatches,
  currentOperation,
  estimatedTimeRemaining,
  errors,
  onRetry,
  onCancel
}) => {
  if (!isVisible) return null;

  const progress = totalDevices > 0 ? Math.round((processedDevices / totalDevices) * 100) : 0;
  const batchProgress = totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : 0;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        title={
          <Space>
            <DatabaseOutlined />
            <span>Processando Grande Escala</span>
          </Space>
        }
        extra={
          <Space>
            {onRetry && (
              <Button 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={onRetry}
              >
                Tentar Novamente
              </Button>
            )}
            {onCancel && (
              <Button 
                size="small" 
                danger
                onClick={onCancel}
              >
                Cancelar
              </Button>
            )}
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Informações Gerais */}
          <div>
            <Title level={4}>
              🚨 Grande Escala Detectada: {totalDevices.toLocaleString()} Dispositivos
            </Title>
            <Text type="secondary">
              O sistema está processando uma grande quantidade de dispositivos. 
              Isso pode levar alguns minutos para completar.
            </Text>
          </div>

          {/* Progresso Principal */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text strong>Progresso Geral</Text>
              <Text>{processedDevices.toLocaleString()} / {totalDevices.toLocaleString()} dispositivos</Text>
            </div>
            <Progress 
              percent={progress} 
              status={progress === 100 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>

          {/* Progresso dos Lotes */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text strong>Lotes Processados</Text>
              <Text>{currentBatch} / {totalBatches} lotes</Text>
            </div>
            <Progress 
              percent={batchProgress} 
              size="small"
              strokeColor="#52c41a"
            />
          </div>

          {/* Operação Atual */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '6px',
            border: '1px solid #91d5ff'
          }}>
            <Space>
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              <Text strong>Operação Atual:</Text>
              <Text>{currentOperation}</Text>
            </Space>
          </div>

          {/* Tempo Estimado */}
          {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#fff7e6', 
              borderRadius: '6px',
              border: '1px solid #ffd591'
            }}>
              <Space>
                <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                <Text strong>Tempo Estimado Restante:</Text>
                <Text>{formatTime(estimatedTimeRemaining)}</Text>
              </Space>
            </div>
          )}

          {/* Dicas de Performance */}
          <Alert
            message="Dicas para Melhor Performance"
            description={
              <div>
                <p>• Mantenha esta janela aberta durante o processamento</p>
                <p>• Evite abrir outras abas que consumam recursos</p>
                <p>• O sistema está otimizado para grandes escalas com delays automáticos</p>
                <p>• Em caso de erro, use "Tentar Novamente" para continuar</p>
              </div>
            }
            type="info"
            showIcon
            icon={<WarningOutlined />}
          />

          {/* Erros */}
          {errors.length > 0 && (
            <Alert
              message={`${errors.length} Erro(s) Durante o Processamento`}
              description={
                <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                  {errors.slice(-5).map((error, index) => (
                    <div key={index} style={{ 
                      fontSize: '12px', 
                      color: '#ff4d4f',
                      marginBottom: '4px'
                    }}>
                      • {error}
                    </div>
                  ))}
                  {errors.length > 5 && (
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      ... e mais {errors.length - 5} erro(s)
                    </div>
                  )}
                </div>
              }
              type="warning"
              showIcon
            />
          )}

          {/* Status Final */}
          {progress === 100 && (
            <Alert
              message="Processamento Concluído!"
              description="Todos os dispositivos foram processados com sucesso."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}
        </Space>
      </Card>
    </div>
  );
};
