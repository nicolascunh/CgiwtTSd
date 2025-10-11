import { useEffect, useState } from 'react';

/**
 * Hook for Google Maps integration
 * Provides utilities for working with Google Maps API
 */
export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        console.log('🔄 Iniciando carregamento do Google Maps...');
        
        // Verificar se o Google Maps já está carregado
        if (typeof window !== 'undefined' && (window as any).google?.maps) {
          console.log('✅ Google Maps já carregado!');
          setIsLoaded(true);
          setError(null);
          return;
        }
        
        // Aguardar o carregamento do Google Maps
        const checkGoogleMaps = () => {
          return new Promise<void>((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos
            
            const interval = setInterval(() => {
              attempts++;
              
              if (typeof window !== 'undefined' && (window as any).google?.maps) {
                clearInterval(interval);
                resolve();
              } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                reject(new Error('Timeout waiting for Google Maps'));
              }
            }, 100);
          });
        };
        
        await checkGoogleMaps();
        
        console.log('✅ Google Maps carregado com sucesso!');
        console.log('🗺️ google.maps disponível:', !!(window as any).google?.maps);
        
        setIsLoaded(true);
        setError(null);
      } catch (err) {
        const errorMsg = 'Failed to load Google Maps API';
        console.error('❌ Google Maps loading error:', err);
        setError(errorMsg);
      }
    };

    initializeGoogleMaps();
  }, []);

  // Helper function to create a Google Maps marker
  const createMarker = (position: { lat: number; lng: number }, title?: string) => {
    if (!isLoaded || typeof window === 'undefined' || !(window as any).google) {
      return null;
    }

    return new (window as any).google.maps.Marker({
      position,
      title: title || 'Marker',
      map: null // Will be set when added to map
    });
  };

  // Helper function to create a Google Maps map
  const createMap = (element: HTMLElement, options?: any) => {
    if (!isLoaded || typeof window === 'undefined' || !(window as any).google) {
      return null;
    }

    const defaultOptions = {
      zoom: 12,
      center: { lat: -23.5505, lng: -46.6333 }, // São Paulo
      ...options
    };

    return new (window as any).google.maps.Map(element, defaultOptions);
  };

  // Helper function to geocode an address
  const geocodeAddress = (address: string): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!isLoaded || typeof window === 'undefined' || !(window as any).google) {
        resolve(null);
        return;
      }

      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address }, (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          resolve(null);
        }
      });
    });
  };

  // Helper function to reverse geocode coordinates
  const reverseGeocode = (lat: number, lng: number): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!isLoaded || typeof window === 'undefined' || !(window as any).google) {
        console.log('❌ Google Maps não disponível para reverse geocoding');
        resolve(null);
        return;
      }

      console.log('🔍 Fazendo reverse geocoding para:', lat, lng);
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        console.log('📍 Resultado do geocoding:', status, results);
        if (status === 'OK' && results[0]) {
          console.log('✅ Endereço encontrado:', results[0].formatted_address);
          resolve(results[0].formatted_address);
        } else {
          console.log('❌ Erro no geocoding:', status);
          resolve(null);
        }
      });
    });
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    if (!isLoaded || typeof window === 'undefined' || !(window as any).google) {
      return 0;
    }

    const distance = (window as any).google.maps.geometry.spherical.computeDistanceBetween(
      new (window as any).google.maps.LatLng(point1.lat, point1.lng),
      new (window as any).google.maps.LatLng(point2.lat, point2.lng)
    );

    return distance; // Returns distance in meters
  };

  return {
    isLoaded,
    error,
    apiKey: 'configured',
    createMarker,
    createMap,
    geocodeAddress,
    reverseGeocode,
    calculateDistance
  };
};
