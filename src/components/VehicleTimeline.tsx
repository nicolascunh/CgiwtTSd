import React from 'react';
import { Timeline, Tag, Space, Typography, Button, Card, Row, Col } from 'antd';
import { 
  CarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import type { Position } from '../types';

const { Text, Title } = Typography;

interface TimelineEvent {
  id: string;
  type: 'driving' | 'stopped' | 'started' | 'warning';
  time: string;
  location: string;
  details?: string;
  duration?: string;
  distance?: string;
  speed?: number;
}

interface VehicleTimelineProps {
  positions: Position[];
  selectedDeviceId?: number;
  onRefresh?: () => void;
}

export const VehicleTimeline: React.FC<VehicleTimelineProps> = ({
  positions,
  selectedDeviceId,
  onRefresh
}) => {
  // Gerar eventos da timeline baseado nas posições
  const generateTimelineEvents = (): TimelineEvent[] => {
    if (!positions.length) return [];

    const events: TimelineEvent[] = [];
    const sortedPositions = [...positions].sort((a, b) => 
      new Date(b.deviceTime).getTime() - new Date(a.deviceTime).getTime()
    );

    sortedPositions.forEach((position, index) => {
      const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
      const speedKmh = Math.round(position.speed * 3.6);
      
      let eventType: TimelineEvent['type'] = 'driving';
      let details = `${speedKmh} km/h`;
      
      if (speedKmh < 5) {
        eventType = 'stopped';
        details = 'Parado';
      } else if (index === sortedPositions.length - 1 && isOnline) {
        eventType = 'started';
        details = `${speedKmh} km/h`;
      }

      // Adicionar duração e distância se disponível
      if (index < sortedPositions.length - 1) {
        const nextPosition = sortedPositions[index + 1];
        const timeDiff = new Date(position.deviceTime).getTime() - new Date(nextPosition.deviceTime).getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0 || minutes > 0) {
          details += ` ${hours}h ${minutes}min`;
        }
      }

      events.push({
        id: `event-${position.id}`,
        type: eventType,
        time: new Date(position.deviceTime).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        location: position.address || `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`,
        details,
        speed: speedKmh
      });
    });

    return events.slice(0, 10); // Limitar a 10 eventos mais recentes
  };

  const events = generateTimelineEvents();
  const lastUpdate = positions.length > 0 ? new Date(positions[0].deviceTime) : new Date();

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'driving':
        return <CarOutlined style={{ color: '#52c41a' }} />;
      case 'stopped':
        return <PauseCircleOutlined style={{ color: '#fa8c16' }} />;
      case 'started':
        return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <EnvironmentOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'driving':
        return 'green';
      case 'stopped':
        return 'orange';
      case 'started':
        return 'blue';
      case 'warning':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getEventText = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'driving':
        return 'Dirigindo';
      case 'stopped':
        return 'Parado';
      case 'started':
        return 'Iniciou viagem';
      case 'warning':
        return 'Alerta';
      default:
        return 'Atividade';
    }
  };

  return (
    <Card 
      size="small" 
      style={{ 
        height: '100%',
        background: '#1f1f1f',
        border: '1px solid #303030'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={5} style={{ color: '#fff', margin: 0 }}>
              Timeline
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Atualizado há {Math.round((Date.now() - lastUpdate.getTime()) / 60000)} min
            </Text>
          </Col>
          <Col>
            <Button 
              size="small" 
              type="text" 
              onClick={onRefresh}
              style={{ color: '#1890ff' }}
            >
              Atualizar
            </Button>
          </Col>
        </Row>
      </div>

      <Timeline
        style={{ marginTop: '16px' }}
        items={events.map((event, index) => ({
          dot: getEventIcon(event.type),
          color: getEventColor(event.type),
          children: (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '4px' }}>
                <Space>
                  <Text strong style={{ color: '#fff' }}>
                    {event.time}
                  </Text>
                  <Tag color={getEventColor(event.type)}>
                    {getEventText(event.type)}
                  </Tag>
                </Space>
              </div>
              
              <div style={{ marginBottom: '4px' }}>
                <Text style={{ color: '#d9d9d9', fontSize: '13px' }}>
                  {event.location}
                </Text>
              </div>
              
              {event.details && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {event.details}
                  </Text>
                </div>
              )}
            </div>
          )
        }))}
      />

      {events.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#8c8c8c'
        }}>
          <ClockCircleOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
          <div>Nenhuma atividade recente</div>
        </div>
      )}
    </Card>
  );
};
