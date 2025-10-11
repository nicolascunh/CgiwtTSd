import React, { useEffect, useRef } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

/**
 * Example component demonstrating Google Maps integration
 * This component shows how to use the Google Maps API with your API key
 */
export const GoogleMapsExample: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { isLoaded, error, createMap, geocodeAddress, reverseGeocode } = useGoogleMaps();

  useEffect(() => {
    if (isLoaded && mapRef.current) {
      // Create a Google Maps instance
      const map = createMap(mapRef.current, {
        zoom: 12,
        center: { lat: -23.5505, lng: -46.6333 }, // São Paulo
        mapTypeId: 'roadmap'
      });

      if (map) {
        // Add a marker for São Paulo
        const marker = new (window as any).google.maps.Marker({
          position: { lat: -23.5505, lng: -46.6333 },
          map: map,
          title: 'São Paulo, Brazil'
        });

        // Add an info window
        const infoWindow = new (window as any).google.maps.InfoWindow({
          content: `
            <div>
              <h3>São Paulo, Brazil</h3>
              <p>Google Maps API is working!</p>
              <p>Google Maps API is working!</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }
    }
  }, [isLoaded, createMap]);

  const handleGeocodeTest = async () => {
    const result = await geocodeAddress('São Paulo, Brazil');
    if (result) {
      console.log('Geocoding result:', result);
      alert(`Coordinates: ${result.lat}, ${result.lng}`);
    } else {
      alert('Geocoding failed');
    }
  };

  const handleReverseGeocodeTest = async () => {
    const result = await reverseGeocode(-23.5505, -46.6333);
    if (result) {
      console.log('Reverse geocoding result:', result);
      alert(`Address: ${result}`);
    } else {
      alert('Reverse geocoding failed');
    }
  };

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Error loading Google Maps</h3>
        <p>{error}</p>
        <p>Google Maps API Error</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Loading Google Maps...</h3>
        <p>Please wait while Google Maps API loads</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Google Maps Integration Test</h2>
      <p>Your Google Maps API key is configured and working!</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleGeocodeTest} style={{ marginRight: '10px' }}>
          Test Geocoding
        </button>
        <button onClick={handleReverseGeocodeTest}>
          Test Reverse Geocoding
        </button>
      </div>

      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '400px', 
          border: '1px solid #ccc',
          borderRadius: '8px'
        }} 
      />
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p><strong>API Key:</strong> Configured</p>
        <p><strong>Status:</strong> {isLoaded ? 'Loaded' : 'Loading...'}</p>
      </div>
    </div>
  );
};



