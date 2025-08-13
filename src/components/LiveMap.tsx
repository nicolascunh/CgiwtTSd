import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Device, Position } from '../types';

// Fix para ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LiveMapProps {
  devices: Device[];
  positions: Position[];
  selectedDevice: Device | null;
  onDeviceSelect: (device: Device) => void;
}

// Configurações de performance
const MAX_MARKERS_VISIBLE = 500; // Limite de marcadores visíveis

// Criar ícone personalizado para veículos
const createVehicleIcon = (isOnline: boolean, isSelected: boolean) => {
  const size = isSelected ? 20 : 16;
  const color = isOnline ? '#52c41a' : '#ff4d4f';
  const borderColor = isSelected ? '#1890ff' : '#fff';
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        <div style="
          width: ${size - 8}px;
          height: ${size - 8}px;
          background-color: ${color};
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'custom-vehicle-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Componente para atualizar o mapa automaticamente
const MapUpdater: React.FC<{
  devices: Device[];
  positions: Position[];
  selectedDevice: Device | null;
}> = ({ devices, positions, selectedDevice }) => {
  const map = useMap();

  useEffect(() => {
    if (devices.length === 0) return;

    // Se há um dispositivo selecionado, centralizar nele
    if (selectedDevice) {
      const position = positions.find(p => p.deviceId === selectedDevice.id);
      if (position) {
        map.setView([position.latitude, position.longitude], map.getZoom());
      }
    } else {
      // Caso contrário, ajustar para mostrar todos os marcadores
      const bounds = L.latLngBounds([]);
      positions.forEach(pos => {
        bounds.extend([pos.latitude, pos.longitude]);
      });
      
      if (bounds.getNorthEast() && bounds.getSouthWest()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [devices, positions, selectedDevice, map]);

  return null;
};

export const LiveMap: React.FC<LiveMapProps> = ({
  devices,
  positions,
  selectedDevice,
  onDeviceSelect
}) => {
  // Filtrar e limitar marcadores para performance
  const visibleMarkers = useMemo(() => {
    if (devices.length === 0 || positions.length === 0) return [];

    // Criar mapa de posições para acesso rápido
    const positionMap = new Map<number, Position>();
    positions.forEach(pos => {
      positionMap.set(pos.deviceId, pos);
    });

    // Filtrar dispositivos com posições
    const markersWithPositions = devices
      .map(device => {
        const position = positionMap.get(device.id);
        return position ? { device, position } : null;
      })
      .filter(Boolean) as Array<{ device: Device; position: Position }>;

    // Limitar número de marcadores para performance
    return markersWithPositions.slice(0, MAX_MARKERS_VISIBLE);
  }, [devices, positions]);

  // Expor função para seleção via popup
  useEffect(() => {
    (window as any).selectDevice = (deviceId: number) => {
      const device = devices.find(d => d.id === deviceId);
      if (device) {
        onDeviceSelect(device);
      }
    };

    return () => {
      delete (window as any).selectDevice;
    };
  }, [devices, onDeviceSelect]);

  // Calcular centro do mapa
  const mapCenter = useMemo(() => {
    if (selectedDevice) {
      const position = positions.find(p => p.deviceId === selectedDevice.id);
      if (position) {
        return [position.latitude, position.longitude] as [number, number];
      }
    }

    if (positions.length > 0) {
      const avgLat = positions.reduce((sum, p) => sum + p.latitude, 0) / positions.length;
      const avgLng = positions.reduce((sum, p) => sum + p.longitude, 0) / positions.length;
      return [avgLat, avgLng] as [number, number];
    }

    return [-23.5505, -46.6333] as [number, number]; // São Paulo como fallback
  }, [positions, selectedDevice]);

  if (devices.length === 0) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
          <div style={{ color: '#666' }}>Nenhum dispositivo disponível</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapUpdater
          devices={devices}
          positions={positions}
          selectedDevice={selectedDevice}
        />
        
        {/* Renderizar marcadores */}
        {visibleMarkers.map(({ device, position }) => {
          const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
          const isSelected = selectedDevice?.id === device.id;
          
          return (
            <Marker
              key={`${device.id}-${position.id}`}
              position={[position.latitude, position.longitude]}
              icon={createVehicleIcon(isOnline, isSelected)}
              eventHandlers={{
                click: () => onDeviceSelect(device),
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: isOnline ? '#52c41a' : '#ff4d4f' }}>
                    {device.name}
                  </h4>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    <strong>ID:</strong> {device.uniqueId}
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    <strong>Status:</strong> 
                    <span style={{ 
                      color: isOnline ? '#52c41a' : '#ff4d4f',
                      marginLeft: '4px'
                    }}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </p>
                  {position.address && (
                    <p style={{ margin: '4px 0', fontSize: '12px' }}>
                      <strong>Endereço:</strong> {position.address}
                    </p>
                  )}
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    <strong>Última atualização:</strong> {new Date(position.deviceTime).toLocaleString()}
                  </p>
                  <button 
                    onClick={() => onDeviceSelect(device)}
                    style={{
                      background: '#1890ff',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: '8px',
                      fontSize: '12px'
                    }}
                  >
                    Selecionar
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Indicador de performance */}
      {devices.length > MAX_MARKERS_VISIBLE && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          Mostrando {visibleMarkers.length} de {devices.length} veículos
        </div>
      )}
    </div>
  );
};
