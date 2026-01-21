'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';


const icon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function Map() {
  
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: './images/icon.png',
      iconRetinaUrl: './images/icon-2x.png',
     hadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    
    });
  }, []);

  return (
    <MapContainer 
      center={[44.7866, 20.4489]} 
      zoom={13} 
      style={{ height: "100%", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
     
      <Marker position={[44.7866, 20.4489]}>
        <Popup>
          Ovde trčimo! 🏃‍♂️ <br /> Vidimo se u 18h.
        </Popup>
      </Marker>
    </MapContainer>
  );
}