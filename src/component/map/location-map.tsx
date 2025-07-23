// components/LocationMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'; // เพิ่ม useMapEvents
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix default icon issue with Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


interface LocationMapProps {
  latitude?: number;
  longitude?: number;
  // เพิ่ม callback สำหรับเมื่อมีการคลิกบนแผนที่
  onMapClick: (lat: number, lng: number) => void;
}

// MapRecenter component (เหมือนเดิม)
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMapEvents({ // ใช้ useMapEvents เพื่อเข้าถึง map instance
    // สามารถเพิ่ม event อื่นๆ ได้ที่นี่ เช่น zoomend, moveend
    // เพื่อให้ map center ที่แสดงผลใน map ไม่คลาดเคลื่อนจาก marker
    // หากต้องการให้แผนที่ขยับไปที่ marker เสมอเมื่อ marker เปลี่ยน
    // (แต่ถ้า mapPosition เป็น null ตอนแรก, marker จะไม่แสดง)
    // เราจะใช้ setView เมื่อ props เปลี่ยน
  });

  // ใช้ useEffect เพื่อ setView เมื่อ lat/lng เปลี่ยน
  // หรือเมื่อคอมโพเนนต์ Mount ครั้งแรกพร้อมค่า lat/lng
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]); // เพิ่ม map ใน dependency array

  return null;
}

// Component สำหรับจัดการ Map Click Event
// function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
//   useMapEvents({
//     click: (e) => {
//       if (onMapClick) {
//         onMapClick(e.latlng.lat, e.latlng.lng);
//       }
//     },
//   });
//   return null;
// }


export default function LocationMap({ latitude, longitude, onMapClick }: LocationMapProps) {
  const defaultPosition: [number, number] = [7.0185, 100.4795]; // ตำแหน่งเริ่มต้น: สงขลา, หาดใหญ่ (ประเทศไทย)
  const position: [number, number] = (latitude && longitude) ? [latitude, longitude] : defaultPosition;

  return (
    <MapContainer
      center={position}
      zoom={15}
      scrollWheelZoom={true}
      style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {latitude && longitude && (
        <Marker position={position}>
          <Popup>
            ตำแหน่งปัจจุบัน: <br/> ละติจูด: {latitude.toFixed(6)}, ลองจิจูด: {longitude.toFixed(6)}
          </Popup>
        </Marker>
      )}

      {/* เพิ่ม MapClickHandler เข้าไปใน MapContainer */}
      {/* <MapClickHandler onMapClick={onMapClick} /> */}
      
      {/* Recenter map when position changes */}
      {latitude && longitude && <MapRecenter lat={latitude} lng={longitude} />}

    </MapContainer>
  );
}