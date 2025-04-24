import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 13.7563, 
  lng: 100.5018
};

function MapPicker({ location, onLocationChange }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const onLoad = React.useCallback(function callback(map) {
    if (location) {
      map.panTo(location);
    }
  }, [location]);

  const handleClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    onLocationChange({ lat, lng });
  };

  if (loadError) {
    return (
      <div className="alert alert-danger">
        Error loading maps: {loadError.message}
      </div>
    );
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  return (
    <div className="mb-3">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={location || center}
        zoom={10}
        onLoad={onLoad}
        onClick={handleClick}
      >
        {location && <Marker position={location} />}
      </GoogleMap>
    </div>
  );
}

export default React.memo(MapPicker);
