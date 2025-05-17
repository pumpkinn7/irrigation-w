import { useJsApiLoader } from '@react-google-maps/api';

// Google Maps API key จาก environment variables หรือค่าเริ่มต้น
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// Libraries ที่ต้องใช้ในแอพพลิเคชัน - รวมทั้งหมดเพื่อโหลดครั้งเดียว
const libraries = ['places'];

// ฟังก์ชันสำหรับใช้ Google Maps API ในโปรเจค
export const useGoogleMapsApi = () => {
  return useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    language: 'th',
  });
};
