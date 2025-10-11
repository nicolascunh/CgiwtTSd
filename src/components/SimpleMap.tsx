import React, { useEffect, useRef, useState } from 'react';
import { Card, Typography, Alert, Button } from 'antd';

const { Title, Text } = Typography;

interface SimpleMapProps {
  devices: Array<{ id: number; name: string; lat: number; lng: number }>;
}

export const SimpleMap: React.FC<SimpleMapProps> = ({ devices }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
        setIsLoaded(true);
        setError(null);
        console.log('✅ Google Maps carregado com sucesso');
      } else {
        console.log('⏳ Aguardando Google Maps carregar...');
        setTimeout(checkGoogleMaps, 100);
      }
    };

    checkGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    console.log('🗺️ Criando mapa...');
    console.log('📱 Dispositivos para marcar:', devices);
    
    try {
      const map = new (window as any).google.maps.Map(mapRef.current, {
        zoom: 10,
        center: { lat: -23.5505, lng: -46.6333 },
        mapTypeId: 'roadmap'
      });

      mapInstanceRef.current = map;
      console.log('✅ Mapa criado com sucesso');

      // Limpar marcadores existentes
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Criar marcadores
      devices.forEach((device, index) => {
        console.log(`🎯 Criando marcador ${index + 1}:`, device);
        
        try {
          const marker = new (window as any).google.maps.Marker({
            position: { lat: device.lat, lng: device.lng },
            map: map,
            title: device.name,
            label: `${index + 1}`,
            animation: (window as any).google.maps.Animation.DROP
          });

          markersRef.current.push(marker);
          console.log(`✅ Marcador ${index + 1} criado e adicionado ao mapa`);
          
          // Verificar se o marcador foi realmente adicionado
          console.log(`🔍 Marcador ${index + 1} no mapa:`, marker.getMap() !== null);
          
        } catch (markerError) {
          console.error(`❌ Erro ao criar marcador ${index + 1}:`, markerError);
        }
      });

      console.log(`📊 Total de marcadores criados: ${markersRef.current.length}`);

      // Ajustar zoom para mostrar todos os marcadores
      if (devices.length > 0) {
        const bounds = new (window as any).google.maps.LatLngBounds();
        devices.forEach(device => {
          bounds.extend({ lat: device.lat, lng: device.lng });
        });
        map.fitBounds(bounds);
        console.log('🔍 Zoom ajustado para mostrar todos os marcadores');
      }

    } catch (err) {
      console.error('❌ Erro ao criar mapa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, [isLoaded, devices]);

  if (error) {
    return (
      <Card>
        <Alert
          message="Erro no Mapa"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Title level={4}>Carregando Google Maps...</Title>
          <Text>Aguarde enquanto a API do Google Maps carrega</Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ height: '500px', position: 'relative' }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '8px'
        }} 
      />
      
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        {devices.length} veículos no mapa
      </div>
    </div>
  );
};
