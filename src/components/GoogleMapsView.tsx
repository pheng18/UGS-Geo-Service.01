// Source: Google Maps Platform Code Assist
import React, { useState, useMemo } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { CORSStation, Project } from '../types';
import { CORS_COORDINATES, UNIQTEK_HQ } from '../data/corsLocations';
import {
  Radio,
  MapPin,
  Wifi,
  WifiOff,
  Layers,
  Search,
  Navigation,
  Crosshair,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { CorsStationIcon } from './CorsStationIcon';

interface GoogleMapsViewProps {
  stations?: CORSStation[];
  projects?: Project[];
  activeMode?: 'cors' | 'projects';
  onStationSelect?: (station: CORSStation) => void;
  onProjectSelect?: (project: Project) => void;
}

// Calculate Haversine distance in km between two lat/lng points
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const GoogleMapsView: React.FC<GoogleMapsViewProps> = ({
  stations = [],
  projects = [],
  activeMode = 'cors',
  onStationSelect,
  onProjectSelect
}) => {
  const [mode, setMode] = useState<'cors' | 'projects'>(activeMode);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [selectedStation, setSelectedStation] = useState<CORSStation | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [infoWindowPos, setInfoWindowPos] = useState<{ lat: number; lng: number } | null>(null);

  // Maps API Key from environment
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';

  // Enrich CORS stations with coordinates (prioritizing station's dynamic lat/lng from Firestore / 183.182.105.253)
  const enrichedStations = useMemo(() => {
    return stations.map((st) => {
      const coord = CORS_COORDINATES[st.id] || {
        lat: 17.9757,
        lng: 102.6331,
        elevation: 170,
        province: 'ສປປ ລາວ',
        satellites: st.status === 'Online' ? 30 : 0,
        mountpoint: `${st.id}_RTCM32`
      };
      return {
        ...st,
        lat: typeof st.lat === 'number' ? st.lat : coord.lat,
        lng: typeof st.lng === 'number' ? st.lng : coord.lng,
        elevation: typeof st.elevation === 'number' ? st.elevation : coord.elevation,
        province: st.province || coord.province,
        satellites: typeof st.satellites === 'number' ? st.satellites : coord.satellites,
        mountpoint: st.mountpoint || coord.mountpoint
      };
    });
  }, [stations]);

  // Filtered CORS Stations
  const filteredStations = useMemo(() => {
    return enrichedStations.filter((st) => {
      const matchesSearch =
        st.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
        st.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (st.province && st.province.toLowerCase().includes(searchFilter.toLowerCase()));
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'online' && st.status === 'Online') ||
        (statusFilter === 'offline' && st.status === 'Offline');
      return matchesSearch && matchesStatus;
    });
  }, [enrichedStations, searchFilter, statusFilter]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      return (
        p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.client.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.location.toLowerCase().includes(searchFilter.toLowerCase())
      );
    });
  }, [projects, searchFilter]);

  // Center of Laos (approx Vientiane / Bolikhamxay)
  const defaultCenter = { lat: 18.25, lng: 103.5 };

  return (
    <div className="w-full flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
      {/* Top Map Toolbar */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          {/* Mode Tabs */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setMode('cors');
                setSelectedProject(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'cors'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>ເຄືອຂ່າຍ CORS ({filteredStations.length})</span>
            </button>
            <button
              onClick={() => {
                setMode('projects');
                setSelectedStation(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'projects'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>ໂຄງການສຳຫຼວດ ({filteredProjects.length})</span>
            </button>
          </div>

          {/* Map Layer Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                mapType === 'roadmap'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ຖະໜົນ
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                mapType === 'satellite'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ດາວທຽມ
            </button>
            <button
              onClick={() => setMapType('terrain')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                mapType === 'terrain'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ພູມປະເທດ
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="ຄົ້ນຫາສະຖານີ / ໂຄງການ..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
            />
          </div>

          {mode === 'cors' && (
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setStatusFilter(statusFilter === 'online' ? 'all' : 'online')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'online'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}
              >
                <CorsStationIcon status="Online" size="xs" />
                <span>Online</span>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'offline'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                }`}
              >
                <CorsStationIcon status="Offline" size="xs" />
                <span>Offline</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Google Map Container with explicit height (CF2) */}
      <div className="w-full h-[520px] relative bg-slate-100 dark:bg-slate-800">
        <APIProvider apiKey={apiKey} language="lo" region="LA">
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={defaultCenter}
            defaultZoom={7}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            className="w-full h-full"
          >
            {/* UniqTek HQ Marker */}
            <AdvancedMarker
              position={{ lat: UNIQTEK_HQ.lat, lng: UNIQTEK_HQ.lng }}
              title={UNIQTEK_HQ.name}
            >
              <div className="bg-amber-600 text-white px-2.5 py-1 rounded-xl shadow-lg border-2 border-white flex items-center gap-1.5 cursor-pointer transform hover:scale-110 transition-transform">
                <Navigation className="w-3.5 h-3.5 text-amber-200" />
                <span className="text-[11px] font-bold">UniqTek HQ (ວຽງຈັນ)</span>
              </div>
            </AdvancedMarker>

            {/* CORS Station Markers using station_open.png (Online) & station_close.png (Offline) */}
            {mode === 'cors' &&
              filteredStations.map((station) => {
                const isOnline = station.status === 'Online';
                const lat = station.lat || defaultCenter.lat;
                const lng = station.lng || defaultCenter.lng;

                return (
                  <AdvancedMarker
                    key={station.id}
                    position={{ lat, lng }}
                    title={`${station.id} - ${station.name} (${station.status})`}
                    onClick={() => {
                      setSelectedStation(station);
                      setInfoWindowPos({ lat, lng });
                      if (onStationSelect) onStationSelect(station);
                    }}
                  >
                    <div className="group flex flex-col items-center cursor-pointer transform hover:scale-125 transition-transform">
                      <CorsStationIcon status={station.status} size="map" />
                      <span
                        className={`mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold leading-tight shadow-xs border ${
                          isOnline
                            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/60'
                            : 'bg-rose-950/90 text-rose-200 border-rose-500/60'
                        }`}
                      >
                        {station.id}
                      </span>
                    </div>
                  </AdvancedMarker>
                );
              })}

            {/* Project Site Markers */}
            {mode === 'projects' &&
              filteredProjects.map((project) => {
                const lat = project.coordinatesLat;
                const lng = project.coordinatesLng;

                return (
                  <AdvancedMarker
                    key={project.id}
                    position={{ lat, lng }}
                    title={project.title}
                    onClick={() => {
                      setSelectedProject(project);
                      setInfoWindowPos({ lat, lng });
                      if (onProjectSelect) onProjectSelect(project);
                    }}
                  >
                    <div className="bg-sky-600 text-white p-1.5 rounded-xl shadow-lg border-2 border-white cursor-pointer transform hover:scale-125 transition-transform flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-200" />
                      <span className="text-[10px] font-bold px-1">{project.id}</span>
                    </div>
                  </AdvancedMarker>
                );
              })}

            {/* InfoWindow for Selected CORS Station */}
            {selectedStation && infoWindowPos && (
              <InfoWindow
                position={infoWindowPos}
                onCloseClick={() => {
                  setSelectedStation(null);
                  setInfoWindowPos(null);
                }}
              >
                <div className="p-1 max-w-[280px] text-slate-900 space-y-2">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="font-mono font-bold text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      {selectedStation.id}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        selectedStation.status === 'Online'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedStation.status === 'Online' ? (
                        <Wifi className="w-3 h-3" />
                      ) : (
                        <WifiOff className="w-3 h-3" />
                      )}
                      <span>{selectedStation.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <CorsStationIcon status={selectedStation.status} size="sm" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{selectedStation.name}</h4>
                      <p className="text-xs text-slate-500">
                        ແຂວງ/ທີ່ຕັ້ງ: {selectedStation.province || 'ສປປ ລາວ'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 p-2 rounded-lg">
                    <div>
                      <span className="text-slate-400 block">Latitude (WGS84):</span>
                      <span className="font-mono font-bold text-slate-900">
                        {(selectedStation.lat ?? defaultCenter.lat).toFixed(6)}° N
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Longitude (WGS84):</span>
                      <span className="font-mono font-bold text-slate-900">
                        {(selectedStation.lng ?? defaultCenter.lng).toFixed(6)}° E
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ຄວາມສູງ (Elevation):</span>
                      <span className="font-mono font-semibold text-blue-700">
                        {selectedStation.elevation ?? 170} m
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ດາວທຽມ (Sats):</span>
                      <span className="font-semibold text-emerald-600">
                        {selectedStation.satellites ?? 32} ດວງ
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200/70 flex items-center justify-between">
                      <span className="text-slate-400">ໄລຍະຫ່າງຈາກ HQ ວຽງຈັນ:</span>
                      <span className="font-semibold text-amber-700">
                        ~
                        {calculateDistanceKm(
                          UNIQTEK_HQ.lat,
                          UNIQTEK_HQ.lng,
                          selectedStation.lat || defaultCenter.lat,
                          selectedStation.lng || defaultCenter.lng
                        )}{' '}
                        km
                      </span>
                    </div>
                  </div>

                  {selectedStation.issue !== 'none' && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                      <strong>ອາການ/Issue:</strong> {selectedStation.issue}
                    </div>
                  )}

                  {selectedStation.notes && (
                    <div className="text-[10px] text-slate-600 bg-slate-100 p-1.5 rounded">
                      <strong>ແຜນປັບປຸງ:</strong> {selectedStation.notes}
                    </div>
                  )}

                  {onStationSelect && (
                    <button
                      type="button"
                      onClick={() => onStationSelect(selectedStation)}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>ປ່ຽນພິກັດ / ແກ້ໄຂສະຖານີ (Edit Coordinates)</span>
                    </button>
                  )}
                </div>
              </InfoWindow>
            )}

            {/* InfoWindow for Selected Survey Project */}
            {selectedProject && infoWindowPos && (
              <InfoWindow
                position={infoWindowPos}
                onCloseClick={() => {
                  setSelectedProject(null);
                  setInfoWindowPos(null);
                }}
              >
                <div className="p-1 max-w-[280px] text-slate-900 space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-mono font-bold text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                      {selectedProject.id}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600">
                      ຄວາມຄືບໜ້າ: {selectedProject.progress}%
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {selectedProject.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    ລູກຄ້າ: <strong>{selectedProject.client}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    ສະຖານທີ່: {selectedProject.location}
                  </p>

                  <div className="bg-sky-50 p-2 rounded-lg text-[11px]">
                    <span className="font-semibold block text-sky-900 mb-1">ທີມງານພາກສະໜາມ:</span>
                    {selectedProject.team.map((t, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span>{t.name}</span>
                        <span className="text-slate-400 font-mono">{t.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </APIProvider>

        {/* Floating Quick Legend (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-lg text-[11px] space-y-1.5">
          <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">ຄຳອະທິບາຍສັນຍາລັກ:</div>
          <div className="flex items-center gap-2.5">
            <CorsStationIcon status="Online" size="xs" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              CORS Online (station_open)
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <CorsStationIcon status="Offline" size="xs" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              CORS Offline (station_close)
            </span>
          </div>
          <div className="flex items-center gap-2.5 pt-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shadow-2xs shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">ສຳນັກງານໃຫຍ່ UniqTek HQ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
