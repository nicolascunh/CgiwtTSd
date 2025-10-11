import React, { useEffect, useRef, useState } from 'react';

export const UltraSimpleMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Carregando...');

  useEffect(() => {
    const initMap = () => {
      console.log('🚀 Iniciando teste ultra simples...');
      
      if (typeof window === 'undefined') {
        setStatus('❌ Window não disponível');
        return;
      }

      if (!(window as any).google) {
        setStatus('❌ Google não disponível');
        console.log('❌ window.google não existe');
        return;
      }

      if (!(window as any).google.maps) {
        setStatus('❌ Google Maps não disponível');
        console.log('❌ window.google.maps não existe');
        return;
      }

      console.log('✅ Google Maps disponível!');

      if (!mapRef.current) {
        setStatus('❌ Elemento do mapa não encontrado');
        return;
      }

      try {
        console.log('🗺️ Criando mapa...');
        const map = new (window as any).google.maps.Map(mapRef.current, {
          zoom: 10,
          center: { lat: -23.5505, lng: -46.6333 }
        });

        console.log('✅ Mapa criado!');

        // Criar um marcador simples
        console.log('🎯 Criando marcador...');
        const marker = new (window as any).google.maps.Marker({
          position: { lat: -23.5505, lng: -46.6333 },
          map: map,
          title: 'Teste'
        });

        console.log('✅ Marcador criado!');
        console.log('🔍 Marcador no mapa:', marker.getMap() !== null);
        
        setStatus('✅ Mapa e marcador criados com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro:', error);
        setStatus(`❌ Erro: ${error}`);
      }
    };

    // Verificar se o Google Maps já carregou
    if ((window as any).googleMapsLoaded) {
      initMap();
    } else {
      // Aguardar o callback
      const checkLoaded = () => {
        if ((window as any).googleMapsLoaded) {
          initMap();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    }
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Teste Ultra Simples do Google Maps</h2>
      <p><strong>Status:</strong> {status}</p>
      
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '400px',
          border: '2px solid #ccc',
          borderRadius: '8px'
        }} 
      />
      
      <div style={{ marginTop: '20px' }}>
        <h3>Verificações:</h3>
        <ul>
          <li>Window: {typeof window !== 'undefined' ? '✅' : '❌'}</li>
          <li>Google: {typeof window !== 'undefined' && (window as any).google ? '✅' : '❌'}</li>
          <li>Google Maps: {typeof window !== 'undefined' && (window as any).google?.maps ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  );
};
