import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { List, Card, Typography, Tag, Button, Space, Spin, Empty, Input } from 'antd';
import { CarOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import type { Device, Position } from '../types';

const { Text, Title } = Typography;

interface VirtualizedDeviceListProps {
  devices: Device[];
  positions: Position[];
  selectedDevice: Device | null;
  onDeviceSelect: (device: Device) => void;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  deviceFilter: 'all' | 'online' | 'offline';
}

// Componente de item da lista otimizado
const DeviceListItem: React.FC<{
  device: Device;
  position?: Position;
  isSelected: boolean;
  onSelect: (device: Device) => void;
  t: (key: string) => string;
}> = React.memo(({ device, position, isSelected, onSelect, t }) => {
  const isOnline = position && new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000; // 5 minutos
  
  return (
    <Card
      hoverable
      size="small"
      style={{
        marginBottom: 8,
        border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onClick={() => onSelect(device)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <CarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <Title level={5} style={{ margin: 0, fontSize: '14px' }}>
              {device.name}
            </Title>
          </div>
          
          <div style={{ marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {device.uniqueId}
            </Text>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <Tag color={isOnline ? 'green' : 'red'} style={{ fontSize: '11px' }}>
              {isOnline ? t('online') : t('offline')}
            </Tag>
            {device.model && (
              <Text type="secondary" style={{ fontSize: '11px', marginLeft: 8 }}>
                {device.model}
              </Text>
            )}
          </div>
          
          {position && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EnvironmentOutlined style={{ marginRight: 4, fontSize: '10px' }} />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {position.address || `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`}
              </Text>
            </div>
          )}
        </div>
        
        <div style={{ textAlign: 'right' }}>
          {position && (
            <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
              {new Date(position.deviceTime).toLocaleTimeString()}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
});

DeviceListItem.displayName = 'DeviceListItem';

export const VirtualizedDeviceList: React.FC<VirtualizedDeviceListProps> = ({
  devices,
  positions,
  selectedDevice,
  onDeviceSelect,
  loading,
  searchTerm,
  onSearchChange,
  deviceFilter
}) => {
  const { t } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(50); // Renderizar apenas 50 inicialmente

  // Filtrar dispositivos baseado no filtro e busca
  const filteredDevices = useMemo(() => {
    let filtered = devices;
    
    // Aplicar filtro de status
    if (deviceFilter !== 'all') {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      
      filtered = devices.filter(device => {
        const position = positions.find(p => p.deviceId === device.id);
        const isOnline = position && new Date(position.deviceTime).getTime() > fiveMinutesAgo;
        
        if (deviceFilter === 'online') return isOnline;
        if (deviceFilter === 'offline') return !isOnline;
        return true;
      });
    }
    
    // Aplicar busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(term) ||
        device.uniqueId.toLowerCase().includes(term) ||
        device.model?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [devices, positions, deviceFilter, searchTerm]);

  // Criar mapa de posições para acesso rápido
  const positionMap = useMemo(() => {
    const map = new Map<number, Position>();
    positions.forEach(position => {
      map.set(position.deviceId, position);
    });
    return map;
  }, [positions]);

  // Função para carregar mais itens (infinite scroll)
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 50, filteredDevices.length));
  }, [filteredDevices.length]);

  // Detectar quando o usuário está próximo do final da lista
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && visibleCount < filteredDevices.length) {
      loadMore();
    }
  }, [loadMore, visibleCount, filteredDevices.length]);

  // Resetar contagem visível quando filtros mudam
  useEffect(() => {
    setVisibleCount(50);
  }, [deviceFilter, searchTerm]);

  // Dispositivos visíveis atualmente
  const visibleDevices = filteredDevices.slice(0, visibleCount);

  if (loading && devices.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">{t('loading_devices')}</Text>
        </div>
      </div>
    );
  }

  if (filteredDevices.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Empty
          description={
            <Text type="secondary">
              {searchTerm || deviceFilter !== 'all' 
                ? 'Nenhum dispositivo encontrado com os filtros aplicados'
                : 'Nenhum dispositivo disponível'
              }
            </Text>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de busca */}
      <div style={{ padding: '0 0 16px 0' }}>
        <Input
          placeholder={t('search_vehicles')}
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          size="middle"
        />
      </div>

      {/* Lista virtualizada */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto',
          paddingRight: 8
        }}
        onScroll={handleScroll}
      >
        <List
          dataSource={visibleDevices}
          renderItem={(device) => {
            const position = positionMap.get(device.id);
            return (
              <List.Item style={{ padding: 0, border: 'none' }}>
                <DeviceListItem
                  device={device}
                  position={position}
                  isSelected={selectedDevice?.id === device.id}
                  onSelect={onDeviceSelect}
                  t={t}
                />
              </List.Item>
            );
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <Text type="secondary">
                    {searchTerm || deviceFilter !== 'all' 
                      ? 'Nenhum dispositivo encontrado com os filtros aplicados'
                      : 'Nenhum dispositivo disponível'
                    }
                  </Text>
                }
              />
            )
          }}
        />
        
        {/* Indicador de carregamento para infinite scroll */}
        {visibleCount < filteredDevices.length && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Spin size="small" />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              Carregando mais dispositivos...
            </Text>
          </div>
        )}
        
        {/* Contador de dispositivos */}
        <div style={{ textAlign: 'center', padding: '8px', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Mostrando {visibleCount} de {filteredDevices.length} dispositivos
          </Text>
        </div>
      </div>
    </div>
  );
};
