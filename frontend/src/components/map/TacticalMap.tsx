import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../../store/useStore';
import type { Incident } from '../../store/useStore';

// Fix Leaflet marker icon asset mapping inside Vite/React bundle environment
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
    className: 'custom-leaflet-icon',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const createPulseIcon = (color: string) => {
  return new L.DivIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full opacity-75" style="background-color: ${color};"></span>
        <span class="relative inline-flex rounded-full h-4.5 w-4.5 border border-white" style="background-color: ${color};"></span>
      </div>
    `,
    className: 'pulse-leaflet-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Component to handle map centering/zooming dynamically when active incident changes
const MapController: React.FC = () => {
  const map = useMap();
  const { activeIncident } = useStore();

  useEffect(() => {
    if (activeIncident && activeIncident.location?.coordinates) {
      const [lng, lat] = activeIncident.location.coordinates;
      map.setView([lat, lng], 14, { animate: true, duration: 1 });
    }
  }, [activeIncident, map]);

  return null;
};

interface TacticalMapProps {
  onDispatchTrigger?: (incident: Incident) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({ onDispatchTrigger }) => {
  const { incidents, resources, shelters, dispatchHistory } = useStore();

  // Chennai base coord
  const defaultCenter: [number, number] = [13.0827, 80.2707];

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl border border-gray-850 shadow-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="w-full h-full"
        zoomControl={true}
      >
        {/* Dark map tiles layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapController />

        {/* 1. Incidents markers */}
        {incidents.map((inc) => {
          if (!inc.location?.coordinates) return null;
          const [lng, lat] = inc.location.coordinates;
          const isCritical = inc.urgency.toLowerCase() === 'critical';
          const color = isCritical ? '#ef4444' : (inc.urgency.toLowerCase() === 'high' ? '#f59e0b' : '#06b6d4');
          const markerIcon = isCritical ? createPulseIcon(color) : createCustomIcon(color);

          return (
            <Marker key={inc._id} position={[lat, lng]} icon={markerIcon}>
              <Popup>
                <div className="p-1 space-y-1 font-sans">
                  <h4 className="font-extrabold text-xs text-white">{inc.title}</h4>
                  <div className="text-[10px] text-gray-400 capitalize">{inc.incident_type} &bull; {inc.urgency}</div>
                  <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed">{inc.description}</p>
                  
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-[9px] font-mono text-cyan-400">Affected: {inc.people_affected}</span>
                    {onDispatchTrigger && inc.status !== 'resolved' && (
                      <button
                        onClick={() => onDispatchTrigger(inc)}
                        className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold transition-all"
                      >
                        Quick Dispatch
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 2. Resources markers */}
        {resources.map((res) => {
          if (!res.location?.coordinates) return null;
          const [lng, lat] = res.location.coordinates;
          const isIdle = res.deployment_status.toLowerCase() === 'idle';
          return (
            <Marker key={res._id} position={[lat, lng]} icon={createCustomIcon(isIdle ? '#10b981' : '#3b82f6')}>
              <Popup>
                <div className="p-1 font-sans text-xs">
                  <h4 className="font-bold text-white">{res.name}</h4>
                  <p className="text-gray-400 font-mono text-[10px] mt-0.5">
                    Type: {res.resource_type.toUpperCase()} <br />
                    Available: {res.availability}/{res.quantity}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 3. Shelters markers */}
        {shelters.map((s) => {
          if (!s.location?.coordinates) return null;
          const [lng, lat] = s.location.coordinates;
          return (
            <Marker key={s._id} position={[lat, lng]} icon={createCustomIcon('#a855f7')}>
              <Popup>
                <div className="p-1 font-sans text-xs">
                  <h4 className="font-bold text-white">{s.name}</h4>
                  <p className="text-gray-400 font-mono text-[10px] mt-0.5">
                    Capacity: {s.occupancy}/{s.capacity} beds <br />
                    Beds Available: {s.available_beds}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 4. Active Dispatch Routes (Polylines) */}
        {dispatchHistory
          .filter((d) => d.status === 'en_route' && d.route?.coordinates)
          .map((d) => {
            const coords = d.route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
            return (
              <Polyline
                key={d._id}
                positions={coords}
                color="#06b6d4"
                dashArray="5, 10"
                weight={3}
                opacity={0.8}
              />
            );
          })}
      </MapContainer>
    </div>
  );
};
export default TacticalMap;
