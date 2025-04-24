import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, StandaloneSearchBox } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '400px' };
const defaultCenter = { lat: 16.4419, lng: 102.8360 }; // ขอนแก่น
const mapOptions = { fullscreenControl: true, streetViewControl: false, mapTypeControl: true };

function MapPicker({ location, onLocationChange }) {
  const [mapInstance, setMapInstance] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
    language: 'th'
  });
  
  const handleMapClick = (e) => {
    onLocationChange({ 
      lat: e.latLng.lat(), 
      lng: e.latLng.lng()
    });
  };

  const handlePlacesChanged = () => {
    const places = searchBox?.getPlaces();
    if (places?.[0]?.geometry?.location) {
      const newPos = {
        lat: places[0].geometry.location.lat(),
        lng: places[0].geometry.location.lng()
      };
      
      onLocationChange(newPos);
      
      // แก้ไขการใช้ optional chaining ที่ทำให้เกิด ESLint error
      if (mapInstance) {
        mapInstance.panTo(newPos);
        mapInstance.setZoom(15);
      }
    }
  };

  if (!isLoaded) return <div className="text-center"><div className="spinner-border text-primary"></div></div>;

  const position = (location?.lat && location?.lng) ? location : defaultCenter;

  return (
    <div className="mb-3">
      <div className="mb-2">
        <StandaloneSearchBox onLoad={setSearchBox} onPlacesChanged={handlePlacesChanged}>
          <input type="text" className="form-control" placeholder="🔍 ค้นหาสถานที่..." />
        </StandaloneSearchBox>
      </div>
      
      <div className="border rounded">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={position}
          zoom={13}
          onClick={handleMapClick}
          onLoad={setMapInstance}
          options={mapOptions}
        >
          <Marker position={position} key={`${position.lat}-${position.lng}`} />
        </GoogleMap>
      </div>
      
      <div className="mt-2 small">
        <strong>พิกัดที่เลือก:</strong> {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
      </div>
    </div>
  );
}

export default MapPicker;
