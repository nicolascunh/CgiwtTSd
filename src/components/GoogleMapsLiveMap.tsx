import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { VehicleCard } from './VehicleCard';
import { VehicleDetailsModal } from './VehicleDetailsModal';
import { VehicleSidebar } from './VehicleSidebar';
import { VehicleList } from './VehicleList';
import { MapDebug } from './MapDebug';
import type { Device, Position } from '../types';
import '../styles/responsive.css';
import '../styles/dark-theme.css';

interface GoogleMapsLiveMapProps {
  devices: Device[];
  positions: Position[];
  selectedDevice: Device | null;
  onDeviceSelect: (device: Device) => void;
}

export const GoogleMapsLiveMap: React.FC<GoogleMapsLiveMapProps> = ({
  devices,
  positions,
  selectedDevice,
  onDeviceSelect
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { isLoaded, error, createMap, geocodeAddress, reverseGeocode } = useGoogleMaps();
  const [currentZoom, setCurrentZoom] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<{ device: Device; position: Position } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [addressCache, setAddressCache] = useState<Map<string, string>>(new Map());
  const [loadingAddresses, setLoadingAddresses] = useState<Set<number>>(new Set());

  // Detectar tamanho da tela
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Função para carregar endereços automaticamente
  const loadAddressesForPositions = async (positionsToLoad: Position[]) => {
    if (!isLoaded || !reverseGeocode) {
      console.log('❌ Google Maps não carregado ou reverseGeocode não disponível');
      return;
    }

    const positionsNeedingAddress = positionsToLoad.filter(pos => {
      const cacheKey = `${pos.latitude.toFixed(4)},${pos.longitude.toFixed(4)}`;
      const needsAddress = !addressCache.has(cacheKey) && !pos.address;
      if (needsAddress) {
        console.log('📍 Posição precisa de endereço:', pos.deviceId, cacheKey);
      }
      return needsAddress;
    });

    if (positionsNeedingAddress.length === 0) {
      console.log('✅ Todas as posições já têm endereços');
      return;
    }

    console.log('🏠 Carregando endereços para', positionsNeedingAddress.length, 'posições');

    // Marcar como carregando
    setLoadingAddresses(prev => {
      const newSet = new Set(prev);
      positionsNeedingAddress.forEach(pos => newSet.add(pos.id));
      return newSet;
    });

    // Carregar endereços em paralelo (limitado a 5 por vez para não sobrecarregar a API)
    const batchSize = 5;
    for (let i = 0; i < positionsNeedingAddress.length; i += batchSize) {
      const batch = positionsNeedingAddress.slice(i, i + batchSize);
      
      const addressPromises = batch.map(async (pos) => {
        try {
          const cacheKey = `${pos.latitude.toFixed(4)},${pos.longitude.toFixed(4)}`;
          const address = await reverseGeocode(pos.latitude, pos.longitude);
          
          if (address) {
            setAddressCache(prev => new Map(prev).set(cacheKey, address));
            console.log('✅ Endereço carregado:', address);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar endereço:', error);
        }
      });

      await Promise.all(addressPromises);
      
      // Pequena pausa entre batches para não sobrecarregar a API
      if (i + batchSize < positionsNeedingAddress.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Remover do estado de carregamento
    setLoadingAddresses(prev => {
      const newSet = new Set(prev);
      positionsNeedingAddress.forEach(pos => newSet.delete(pos.id));
      return newSet;
    });
  };

  // Calcular centro do mapa
  const mapCenter = useMemo(() => {
    if (selectedDevice) {
      const position = positions.find(p => p.deviceId === selectedDevice.id);
      if (position) {
        return { lat: position.latitude, lng: position.longitude };
      }
    }

    if (positions.length > 0) {
      const avgLat = positions.reduce((sum, p) => sum + p.latitude, 0) / positions.length;
      const avgLng = positions.reduce((sum, p) => sum + p.longitude, 0) / positions.length;
      return { lat: avgLat, lng: avgLng };
    }

    return { lat: -23.5505, lng: -46.6333 }; // São Paulo como fallback
  }, [positions, selectedDevice]);

  // Inicializar o mapa
  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstanceRef.current) {
      const map = createMap(mapRef.current, {
        zoom: currentZoom,
        center: mapCenter,
        mapTypeId: 'roadmap',
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#263c3f' }]
          },
          {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#6b9a76' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }]
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca5b3' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#746855' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2835' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#f3d19c' }]
          },
          {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#2f3948' }]
          },
          {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#515c6d' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#17263c' }]
          }
        ]
      });

      if (map) {
        mapInstanceRef.current = map;
        
        // Adicionar listener para mudanças de zoom
        map.addListener('zoom_changed', () => {
          setCurrentZoom(map.getZoom());
        });

        // Adicionar listener para mudanças de centro
        map.addListener('center_changed', () => {
          // Opcional: atualizar centro se necessário
        });
      }
    }
  }, [isLoaded, createMap, mapCenter, currentZoom]);

  // Carregar endereços automaticamente quando posições mudarem
  useEffect(() => {
    if (isLoaded && positions.length > 0) {
      console.log('🏠 Iniciando carregamento automático de endereços para', positions.length, 'posições');
      loadAddressesForPositions(positions);
    }
  }, [isLoaded, positions]);

  // Atualizar marcadores quando dispositivos ou posições mudarem
  useEffect(() => {
    console.log('🔍 Atualizando marcadores:', { 
      isLoaded, 
      hasMap: !!mapInstanceRef.current, 
      devicesCount: devices.length, 
      positionsCount: positions.length 
    });

    if (!isLoaded || !mapInstanceRef.current || devices.length === 0) {
      console.log('❌ Condições não atendidas para criar marcadores');
      return;
    }

    // Limpar marcadores existentes
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Criar mapa de posições para acesso rápido
    const positionMap = new Map<number, Position>();
    positions.forEach(pos => {
      positionMap.set(pos.deviceId, pos);
    });

    console.log('📍 Mapa de posições criado:', positionMap.size, 'posições');

    // Filtrar dispositivos com posições
    const devicesWithPositions = devices
      .map(device => {
        const position = positionMap.get(device.id);
        return position ? { device, position } : null;
      })
      .filter(Boolean) as Array<{ device: Device; position: Position }>;

    console.log('🚗 Dispositivos com posições:', devicesWithPositions.length);

    // Criar marcadores
    devicesWithPositions.forEach(({ device, position }, index) => {
      console.log(`🎯 Criando marcador ${index + 1}:`, {
        deviceId: device.id,
        deviceName: device.name,
        lat: position.latitude,
        lng: position.longitude,
        isOnline: new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000
      });

      const isOnline = new Date(position.deviceTime).getTime() > Date.now() - 5 * 60 * 1000;
      const isSelected = selectedDevice?.id === device.id;

      // Criar ícone personalizado moderno
      const onlineColor = isOnline ? '#52c41a' : '#ff4d4f';
      const selectedCircle = isSelected ? `
        <circle cx="16" cy="16" r="20" fill="none" stroke="${onlineColor}" stroke-width="2" opacity="0.6">
          <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite"/>
        </circle>
      ` : '';
      
      const icon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
              </filter>
            </defs>
            <circle cx="16" cy="16" r="12" fill="${onlineColor}" stroke="white" stroke-width="3" filter="url(#shadow)"/>
            <path d="M12 10 L20 10 L22 12 L22 20 L20 22 L12 22 L10 20 L10 12 Z" fill="white" opacity="0.9"/>
            <path d="M14 12 L18 12 L18 16 L14 16 Z" fill="${onlineColor}"/>
            ${selectedCircle}
          </svg>
        `)}`,
        scaledSize: new (window as any).google.maps.Size(32, 32),
        anchor: new (window as any).google.maps.Point(16, 16)
      };

      // Criar marcador
      const marker = new (window as any).google.maps.Marker({
        position: { lat: position.latitude, lng: position.longitude },
        map: mapInstanceRef.current,
        title: device.name,
        icon: icon,
        animation: isSelected ? (window as any).google.maps.Animation.BOUNCE : null
      });

      // Adicionar listener para clique no marcador
      marker.addListener('click', () => {
        console.log('🖱️ Marcador clicado:', device.name);
        setSelectedVehicle({ device, position });
      });

      markersRef.current.push(marker);
      console.log(`✅ Marcador ${index + 1} criado e adicionado ao mapa`);
    });

    // Ajustar bounds para mostrar todos os marcadores
    if (devicesWithPositions.length > 0) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      devicesWithPositions.forEach(({ position }) => {
        bounds.extend({ lat: position.latitude, lng: position.longitude });
      });
      
      if (devicesWithPositions.length > 1) {
        mapInstanceRef.current.fitBounds(bounds, { padding: 20 });
      } else if (devicesWithPositions.length === 1) {
        const firstDevice = devicesWithPositions[0];
        mapInstanceRef.current.setCenter({ lat: firstDevice.position.latitude, lng: firstDevice.position.longitude });
      }
    }
  }, [isLoaded, devices, positions, selectedDevice, onDeviceSelect]);

  // Centralizar no dispositivo selecionado
  useEffect(() => {
    if (selectedDevice && mapInstanceRef.current) {
      const position = positions.find(p => p.deviceId === selectedDevice.id);
      if (position) {
        mapInstanceRef.current.setCenter({ lat: position.latitude, lng: position.longitude });
        mapInstanceRef.current.setZoom(Math.max(currentZoom, 15));
      }
    }
  }, [selectedDevice, positions, currentZoom]);

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

  if (error) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5',
        borderRadius: '8px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <div style={{ textAlign: 'center' }}>
          <h3>Erro ao carregar Google Maps</h3>
          <p>{error}</p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Verifique se a chave da API está configurada corretamente
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5',
        borderRadius: '8px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: '48px' }}>🗺️</div>
        <div style={{ textAlign: 'center' }}>
          <h3>Carregando Google Maps...</h3>
          <p>Aguarde enquanto a API do Google Maps carrega</p>
        </div>
      </div>
    );
  }

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

  const totalDevices = devices.length;
  const visibleDevices = markersRef.current.length;

  return (
    <div className="dark-theme" style={{ height: '100%', display: 'flex' }}>
      {/* Painel lateral - Lista de veículos ou detalhes do veículo selecionado */}
      {selectedVehicle ? (
        <VehicleSidebar
          selectedVehicle={selectedVehicle}
          onBack={() => setSelectedVehicle(null)}
          onContact={() => {
            if (selectedVehicle?.device.phone) {
              window.open(`tel:${selectedVehicle.device.phone}`);
            }
          }}
          onRefresh={() => {
            // Implementar refresh dos dados
            console.log('Refreshing data...');
          }}
          positions={positions.filter(p => p.deviceId === selectedVehicle?.device.id)}
          addressCache={addressCache}
        />
      ) : (
        <VehicleList
          devices={devices}
          positions={positions}
          addressCache={addressCache}
          loadingAddresses={loadingAddresses}
          onVehicleSelect={(device) => {
            console.log('🚗 Veículo selecionado:', device.name);
            const position = positions.find(p => p.deviceId === device.id);
            if (position) {
              setSelectedVehicle({ device, position });
            }
          }}
          selectedDevice={selectedDevice}
        />
      )}

      {/* Debug info */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px', fontSize: '12px', zIndex: 1000 }}>
        <div>Selected Vehicle: {selectedVehicle ? selectedVehicle.device.name : 'None'}</div>
        <div>Devices: {devices.length}</div>
        <div>Positions: {positions.length}</div>
        <div>Address Cache: {addressCache.size}</div>
      </div>

      {/* Mapa */}
      <div className="responsive-map-container" style={{ flex: 1, position: 'relative' }}>
        <MapDebug />
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%'
          }} 
        />
        
        {/* Indicador de performance e zoom responsivo */}
        <div className="responsive-map-info" style={{
          position: 'absolute',
          top: isMobile ? '8px' : '20px',
          right: isMobile ? '8px' : '20px',
          background: 'rgba(0,0,0,0.8)',
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
          <div style={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>Google Maps</div>
          <div>Zoom: {currentZoom}</div>
          <div>Veículos: {visibleDevices} de {totalDevices}</div>
          <div style={{ color: '#52c41a', fontSize: isMobile ? '10px' : '12px' }}>
            API: Carregada
          </div>
        </div>
      </div>

      {/* Modal de detalhes */}
      <VehicleDetailsModal
        visible={showDetailsModal}
        device={selectedVehicle?.device || null}
        position={selectedVehicle?.position || null}
        onClose={() => setShowDetailsModal(false)}
        onCenterMap={() => {
          if (selectedVehicle && mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ 
              lat: selectedVehicle.position.latitude, 
              lng: selectedVehicle.position.longitude 
            });
            mapInstanceRef.current.setZoom(Math.max(currentZoom, 15));
            setShowDetailsModal(false);
          }
        }}
      />
    </div>
  );
};
