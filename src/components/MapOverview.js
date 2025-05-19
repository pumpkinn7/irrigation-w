import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, OverlayView } from '@react-google-maps/api';
import { useGoogleMapsApi } from '../services/GoogleMapsService';

const mapContainerStyle = { 
  width: '100%', 
  height: '100%',
  borderRadius: '4px'
};

// พิกัดเริ่มต้นที่ขอนแก่น
const defaultCenter = { lat: 16.4419, lng: 102.8360 };
const mapOptions = { 
  fullscreenControl: true, 
  streetViewControl: false, 
  mapTypeControl: true,
  mapTypeId: 'hybrid'
};

// กำหนดสไตล์สำหรับกล่องข้อมูลแบบกำหนดเอง
const customInfoBoxStyle = {
  backgroundColor: 'white',
  boxShadow: '0 2px 7px 1px rgba(0, 0, 0, 0.3)',
  padding: '10px',
  borderRadius: '8px',
  zIndex: 100,
  minWidth: '200px',
  maxWidth: '300px',
  maxHeight: '200px',
  overflow: 'auto',
  fontSize: '14px',
  marginBottom: '45px' // เพิ่มระยะห่างด้านล่างเพื่อให้ไม่ทับ marker
};

function MapOverview({ projects, selectedProject, onMarkerClick }) {
  const [map, setMap] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);
  
  // ใช้ service เดียวกับ MapPicker เพื่อไม่ให้โหลด API ซ้ำ
  const { isLoaded } = useGoogleMapsApi();

  // ปรับ zoom และ center เมื่อมีโครงการหรือเลือกโครงการ
  useEffect(() => {
    if (map && window.google) {
      if (selectedProject && selectedProject.location) {
        // ถ้ามีโครงการที่ถูกเลือก ให้ zoom ไปที่โครงการนั้น
        map.panTo({
          lat: selectedProject.location.lat, 
          lng: selectedProject.location.lng
        });
        map.setZoom(16);
        setActiveMarker(selectedProject.id);
      } else if (projects.length > 0) {
        // คำนวณ bounds ที่ครอบคลุมทุกโครงการ
        const bounds = new window.google.maps.LatLngBounds();
        projects.forEach(project => {
          if (project.location && typeof project.location.lat === 'number') {
            bounds.extend({
              lat: project.location.lat,
              lng: project.location.lng
            });
          }
        });
        map.fitBounds(bounds, { padding: 50 });
      } else {
        // กรณีไม่มีโครงการ กลับไปที่ค่าเริ่มต้น
        map.setCenter(defaultCenter);
        map.setZoom(8);
      }
    }
  }, [map, projects, selectedProject]);

  const handleMarkerClick = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setActiveMarker(projectId);
      onMarkerClick(project);
    }
  };

  const handleMapClick = () => {
    setActiveMarker(null);
  };

  // ฟังก์ชันสำหรับสร้าง custom marker SVG ตามสถานะการถ่ายโอน
  const createCustomMarkerIcon = (project, isSelected) => {
    // กำหนดสีตามสถานะการถ่ายโอน (เหมือนกับสีที่ใช้ในตาราง)
    const color = project.transferDate ? '#16C47F' : '#FF9D23';
    
    // สร้าง SVG marker แบบ custom
    const svgMarker = {
      path: 'M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z',
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: isSelected ? 2 : 0,
      strokeColor: '#FFFFFF',
      rotation: 0,
      scale: isSelected ? 2 : 1.6, // เพิ่มขนาดจาก 1.5/1.2 เป็น 2/1.6
      anchor: new window.google.maps.Point(12, 22),
    };
    
    return svgMarker;
  };

  if (!isLoaded) return <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
    <div className="spinner-border text-info" role="status">
      <span className="visually-hidden">กำลังโหลดแผนที่...</span>
    </div>
  </div>;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={defaultCenter}
        options={mapOptions}
        onLoad={setMap}
        onClick={handleMapClick}
      >
        {projects.map((project) => {
          if (!project.location || typeof project.location.lat !== 'number') return null;
          
          const isSelected = selectedProject?.id === project.id;
          
          return (
            <React.Fragment key={project.id}>
              <Marker
                position={{
                  lat: project.location.lat,
                  lng: project.location.lng
                }}
                onClick={() => handleMarkerClick(project.id)}
                icon={createCustomMarkerIcon(project, isSelected)}
              />
              
              {/* แสดงกล่องข้อมูลเฉพาะเมื่อโครงการนี้ถูกเลือก */}
              {activeMarker === project.id && (
                <OverlayView
                  position={{
                    lat: project.location.lat,
                    lng: project.location.lng
                  }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={(width, height) => ({
                    x: -(width / 2),
                    y: -height
                  })}
                >
                  <div className="custom-info-window" style={customInfoBoxStyle}>
                    <h6 className="mb-1">{project.name}</h6>
                    <p className="mb-1 small"><strong>หน่วยงาน:</strong> {project.department}</p>
                    {project.location.address && (
                      <p className="mb-1 small">{project.location.address}</p>
                    )}
                    <p className="mb-0 small text-muted">
                      พิกัด: {project.location.lat.toFixed(4)}, {project.location.lng.toFixed(4)}
                    </p>
                  </div>
                </OverlayView>
              )}
            </React.Fragment>
          );
        })}
      </GoogleMap>
    </div>
  );
}

export default MapOverview;
