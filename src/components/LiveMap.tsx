import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Device, Position } from '../types';

// Fix para os ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícone personalizado para veículos
const createVehicleIcon = (isOnline: boolean) => {
  return L.divIcon({
    className: 'custom-vehicle-icon',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: ${isOnline ? '#52c41a' : '#ff4d4f'};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface MapUpdaterProps {
  devices: Device[];
  positions: Position[];
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ devices, positions }) => {
  const map = useMap();

  useEffect(() => {
    if (devices.length > 0 && positions.length > 0) {
      const bounds = L.latLngBounds([]);
      
      positions.forEach(position => {
        if (position.latitude && position.longitude) {
          bounds.extend([position.latitude, position.longitude]);
        }
      });

      // Verificar se há coordenadas válidas
      if (bounds.getNorthEast() && bounds.getSouthWest()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [devices, positions, map]);

  return null;
};

interface LiveMapProps {
  devices: Device[];
  positions: Position[];
  selectedDevice?: Device | null;
  onDeviceSelect?: (device: Device) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  devices,
  positions,
  selectedDevice,
  onDeviceSelect
}) => {
  const mapRef = useRef<L.Map>(null);

  // Centralizar no dispositivo selecionado
  useEffect(() => {
    if (selectedDevice && mapRef.current) {
      const devicePosition = positions.find(p => p.deviceId === selectedDevice.id);
      if (devicePosition && devicePosition.latitude && devicePosition.longitude) {
        mapRef.current.setView(
          [devicePosition.latitude, devicePosition.longitude],
          15
        );
      }
    }
  }, [selectedDevice, positions]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        ref={mapRef}
        center={[-23.5505, -46.6333]} // São Paulo como centro padrão
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater devices={devices} positions={positions} />

        {positions.map((position) => {
          const device = devices.find(d => d.id === position.deviceId);
          if (!device || !position.latitude || !position.longitude) return null;

          const isOnline = device.status === 'online' && !device.disabled;
          const isSelected = selectedDevice?.id === device.id;

          return (
            <Marker
              key={position.id}
              position={[position.latitude, position.longitude]}
              icon={createVehicleIcon(isOnline)}
              eventHandlers={{
                click: () => onDeviceSelect?.(device),
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
                    <strong>Última atualização:</strong> {device.lastUpdate ? 
                      new Date(device.lastUpdate).toLocaleString() : 'N/A'
                    }
                  </p>
                  {isSelected && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '4px 8px', 
                      background: '#1890ff', 
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '11px',
                      textAlign: 'center'
                    }}>
                      Selecionado
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
