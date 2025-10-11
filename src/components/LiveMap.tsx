import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Device, Position } from '../types';
import '../styles/responsive.css';

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

// Configurações de clustering por zoom level
const CLUSTER_CONFIG = {
  ZOOM_1_5: { maxMarkers: 100, clusterRadius: 80, showClusters: true },
  ZOOM_6_10: { maxMarkers: 500, clusterRadius: 50, showClusters: true },
  ZOOM_11_15: { maxMarkers: 2000, clusterRadius: 30, showClusters: false },
  ZOOM_16_PLUS: { maxMarkers: 10000, clusterRadius: 10, showClusters: false }
};

// Função para determinar configuração baseada no zoom
const getClusterConfig = (zoom: number) => {
  if (zoom <= 5) return CLUSTER_CONFIG.ZOOM_1_5;
  if (zoom <= 10) return CLUSTER_CONFIG.ZOOM_6_10;
  if (zoom <= 15) return CLUSTER_CONFIG.ZOOM_11_15;
  return CLUSTER_CONFIG.ZOOM_16_PLUS;
};

// Criar ícone personalizado para veículos com efeito pulsante
const createVehicleIcon = (isOnline: boolean, isSelected: boolean) => {
  const size = isSelected ? 24 : 20;
  const color = isOnline ? '#667eea' : '#ff4d4f';
  const pulseColor = isOnline ? '#764ba2' : '#ff7875';
  const isPulsing = isOnline && isSelected;

  return L.divIcon({
    html: `
      <div class="vehicle-marker ${isPulsing ? 'pulsing' : ''}" style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        cursor: pointer;
      ">
        ${isPulsing ? `
          <div class="pulse-ring" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size + 20}px;
            height: ${size + 20}px;
            border: 2px solid ${pulseColor};
            border-radius: 50%;
            animation: pulse 2s infinite;
            opacity: 0.6;
          "></div>
          <div class="pulse-ring" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size + 40}px;
            height: ${size + 40}px;
            border: 2px solid ${pulseColor};
            border-radius: 50%;
            animation: pulse 2s infinite 0.5s;
            opacity: 0.4;
          "></div>
        ` : ''}
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, ${color} 0%, ${pulseColor} 100%);
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10;
        ">
          <div style="
            width: ${size - 8}px;
            height: ${size - 8}px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
          "></div>
        </div>
      </div>
    `,
    className: 'custom-vehicle-icon',
    iconSize: [size + (isPulsing ? 40 : 0), size + (isPulsing ? 40 : 0)],
    iconAnchor: [size / 2 + (isPulsing ? 20 : 0), size / 2 + (isPulsing ? 20 : 0)],
  });
};

// Criar ícone de cluster
const createClusterIcon = (count: number) => {
  const size = Math.min(20 + count * 2, 40);
  const color = count > 100 ? '#ff4d4f' : count > 50 ? '#faad14' : '#52c41a';
  
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(10, size / 3)}px;
      ">
        ${count > 999 ? '999+' : count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Função para agrupar marcadores próximos
const clusterMarkers = (markers: Array<{ device: Device; position: Position }>, radius: number) => {
  const clusters: Array<{
    center: [number, number];
    markers: Array<{ device: Device; position: Position }>;
    count: number;
  }> = [];

  markers.forEach(marker => {
    let addedToCluster = false;
    
    for (const cluster of clusters) {
      const distance = Math.sqrt(
        Math.pow(marker.position.latitude - cluster.center[0], 2) +
        Math.pow(marker.position.longitude - cluster.center[1], 2)
      );
      
      if (distance < radius / 111000) { // Converter para graus aproximados
        cluster.markers.push(marker);
        cluster.count++;
        // Recalcular centro do cluster
        cluster.center = [
          cluster.markers.reduce((sum, m) => sum + m.position.latitude, 0) / cluster.markers.length,
          cluster.markers.reduce((sum, m) => sum + m.position.longitude, 0) / cluster.markers.length
        ];
        addedToCluster = true;
        break;
      }
    }
    
    if (!addedToCluster) {
      clusters.push({
        center: [marker.position.latitude, marker.position.longitude],
        markers: [marker],
        count: 1
      });
    }
  });

  return clusters;
};

// Componente para atualizar o mapa automaticamente
const MapUpdater: React.FC<{
  devices: Device[];
  positions: Position[];
  selectedDevice: Device | null;
  onZoomChange: (zoom: number) => void;
}> = ({ devices, positions, selectedDevice, onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    const handleZoomEnd = () => {
      onZoomChange(map.getZoom());
    };

    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onZoomChange]);

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
  const [currentZoom, setCurrentZoom] = useState(10);
  const [showClusters, setShowClusters] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Filtrar e processar marcadores baseado no zoom
  const processedMarkers = useMemo(() => {
    if (devices.length === 0 || positions.length === 0) return { markers: [], clusters: [] };

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

    const config = getClusterConfig(currentZoom);
    
    // Limitar número de marcadores para performance
    const limitedMarkers = markersWithPositions.slice(0, config.maxMarkers);
    
    if (config.showClusters && limitedMarkers.length > 50) {
      // Criar clusters
      const clusters = clusterMarkers(limitedMarkers, config.clusterRadius);
      return { markers: [], clusters };
    } else {
      // Mostrar marcadores individuais
      return { markers: limitedMarkers, clusters: [] };
    }
  }, [devices, positions, currentZoom]);

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

  const config = getClusterConfig(currentZoom);
  const totalDevices = devices.length;
  const visibleDevices = processedMarkers.markers.length + processedMarkers.clusters.length;

  return (
    <div className="responsive-map-container" style={{ height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.4;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0;
          }
        }
        
        .vehicle-marker.pulsing .pulse-ring {
          animation: pulse 2s infinite;
        }
        
        .vehicle-marker.pulsing .pulse-ring:nth-child(2) {
          animation-delay: 0.5s;
        }
      `}</style>
      <MapContainer
        center={mapCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={!isMobile}
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
          onZoomChange={setCurrentZoom}
        />
        
        {/* Renderizar clusters */}
        {processedMarkers.clusters.map((cluster, index) => (
          <Marker
            key={`cluster-${index}`}
            position={cluster.center}
            icon={createClusterIcon(cluster.count)}
            eventHandlers={{
                             click: () => {
                 // Zoom in para mostrar marcadores individuais
                 const mapElement = document.querySelector('.leaflet-container');
                 const map = (mapElement as any)?._leaflet_map;
                 if (map) {
                   map.setView(cluster.center, Math.min(currentZoom + 2, 18));
                 }
               },
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>
                  Cluster de {cluster.count} veículos
                </h4>
                <p style={{ margin: '4px 0', fontSize: '12px' }}>
                  Clique para ampliar e ver veículos individuais
                </p>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {cluster.markers.slice(0, 10).map(({ device }) => (
                    <div key={device.id} style={{ 
                      padding: '4px 0', 
                      borderBottom: '1px solid #eee',
                      fontSize: '12px'
                    }}>
                      {device.name}
                    </div>
                  ))}
                  {cluster.markers.length > 10 && (
                    <div style={{ fontSize: '12px', color: '#666', padding: '4px 0' }}>
                      +{cluster.markers.length - 10} mais...
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Renderizar marcadores individuais */}
        {processedMarkers.markers.map(({ device, position }) => {
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
      
      {/* Indicador de performance e zoom responsivo */}
      <div className="responsive-map-info" style={{
        position: 'absolute',
        top: isMobile ? '8px' : '20px',
        right: isMobile ? '8px' : '20px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: isMobile ? '8px 12px' : '12px 16px',
        borderRadius: '8px',
        fontSize: isMobile ? '11px' : '13px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '4px' : '6px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        maxWidth: isMobile ? '150px' : '200px'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>OpenStreetMap</div>
        <div>Zoom: {currentZoom}</div>
        <div>Veículos: {visibleDevices} de {totalDevices}</div>
        {config.showClusters && (
          <div style={{ color: '#667eea', fontSize: isMobile ? '10px' : '12px' }}>
            Modo: Clustering
          </div>
        )}
      </div>
    </div>
  );
};
