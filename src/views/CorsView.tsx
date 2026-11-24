import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Wifi,
  WifiOff,
  AlertTriangle,
  Edit2,
  X,
  Check,
  Map as MapIcon,
  List,
  Compass,
  RefreshCw,
  Upload,
  ExternalLink,
  Plus,
  Mountain,
  Satellite,
  CheckCircle2,
  RotateCcw,
  FileSpreadsheet,
  Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CORSStation } from '../types';
import { GoogleMapsView } from '../components/GoogleMapsView';
import { CorsStationIcon } from '../components/CorsStationIcon';
import {
  CORS_COORDINATES,
  CORS_SERVER_PORTAL_URL,
  CORS_NTRIP_HOST,
  CORS_NTRIP_PORT
} from '../data/corsLocations';

/**
 * Helper to parse single-line coordinate strings copied from http://183.182.105.253/index.aspx
 * Supports:
 * - Decimal degrees: "17.975718, 102.633142" or "17.975718 102.633142 171.8"
 * - DMS format: "17°58'32.58"N 102°37'59.31"E"
 */
function parseCoordinateInputString(raw: string): { lat?: number; lng?: number; elevation?: number } | null {
  const text = raw.trim();
  if (!text) return null;

  // Try DMS pattern first: e.g. 17°58'32.58"N 102°37'59.31"E
  const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["\s]*([NSns])?[,;\s]+(\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["\s]*([EWew])?/;
  const dmsMatch = text.match(dmsRegex);
  if (dmsMatch) {
    let lat =
      parseFloat(dmsMatch[1]) +
      parseFloat(dmsMatch[2]) / 60 +
      parseFloat(dmsMatch[3]) / 3600;
    if (dmsMatch[4] && dmsMatch[4].toUpperCase() === 'S') lat = -lat;

    let lng =
      parseFloat(dmsMatch[5]) +
      parseFloat(dmsMatch[6]) / 60 +
      parseFloat(dmsMatch[7]) / 3600;
    if (dmsMatch[8] && dmsMatch[8].toUpperCase() === 'W') lng = -lng;

    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6))
    };
  }

  // Try decimal floating numbers separated by comma, tab, semicolon, or whitespace
  const numberMatches = text.match(/-?\d+\.\d+|-?\d+/g);
  if (numberMatches && numberMatches.length >= 2) {
    const nums = numberMatches.map(Number).filter(n => !isNaN(n));
    // Find pair that looks like Laos / regional Lat (5..30) & Lng (95..115) or general valid (-90..90, -180..180)
    for (let i = 0; i < nums.length - 1; i++) {
      const a = nums[i];
      const b = nums[i + 1];
      if (a >= -90 && a <= 90 && b >= -180 && b <= 180) {
        const elev = nums[i + 2] !== undefined && nums[i + 2] >= -100 && nums[i + 2] <= 9000 ? nums[i + 2] : undefined;
        return {
          lat: Number(a.toFixed(6)),
          lng: Number(b.toFixed(6)),
          ...(elev !== undefined ? { elevation: elev } : {})
        };
      }
    }
  }

  return null;
}

/**
 * Helper to parse multi-line batch coordinate data pasted from http://183.182.105.253/index.aspx
 * Supports:
 * - Tab/Comma/Space separated table rows: "DOL1  17.975718  102.633142  171.8  Vientiane Capital"
 * - NTRIP Sourcetable STR lines: "STR;DOL1_RTCM32;Vientiane;RTCM 3.2;...;LAO;17.9757;102.6331;..."
 */
interface ParsedBatchRow {
  id: string;
  lat: number;
  lng: number;
  elevation?: number;
  province?: string;
  mountpoint?: string;
  satellites?: number;
  status?: 'Online' | 'Offline';
}

function parseBatchCoordinatesText(rawText: string): ParsedBatchRow[] {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const results: ParsedBatchRow[] = [];

  for (const line of lines) {
    // 1. Check NTRIP Caster STR format: STR;MOUNTPOINT;IDENTIFIER;FORMAT;...;COUNTRY;LAT;LON;...
    if (line.toUpperCase().startsWith('STR;')) {
      const parts = line.split(';');
      if (parts.length >= 11) {
        const rawMount = parts[1].trim();
        const stationId = rawMount.split('_')[0].toUpperCase();
        const identifier = parts[2]?.trim();
        const lat = parseFloat(parts[9]);
        const lng = parseFloat(parts[10]);
        if (stationId && !isNaN(lat) && !isNaN(lng)) {
          results.push({
            id: stationId,
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            mountpoint: rawMount,
            ...(identifier ? { province: identifier } : {})
          });
          continue;
        }
      }
    }

    // 2. General CSV / TSV / table row copied from http://183.182.105.253/index.aspx
    // Example: "DOL1, 17.975718, 102.633142, 171.8, Vientiane Capital"
    // or "1  DOL1  17.975718  102.633142  171.8  Online"
    const tokens = line.split(/[\t,;]+|\s{2,}/).map(t => t.trim()).filter(Boolean);
    const spaceTokens = tokens.length === 1 ? line.split(/\s+/).map(t => t.trim()).filter(Boolean) : tokens;

    // Locate station code token (3-6 alphanumeric characters starting with a letter, e.g., DOL1, LPB1, VTE1)
    let idCandidate = '';
    let idIndex = -1;
    for (let i = 0; i < Math.min(spaceTokens.length, 3); i++) {
      const cleanToken = spaceTokens[i].replace(/_RTCM.*$/i, '').toUpperCase();
      if (/^[A-Z][A-Z0-9]{2,6}$/.test(cleanToken) && cleanToken !== 'ONLINE' && cleanToken !== 'OFFLINE') {
        idCandidate = cleanToken;
        idIndex = i;
        break;
      }
    }

    if (!idCandidate) continue;

    // Collect numeric values after the station ID
    const remaining = spaceTokens.slice(idIndex + 1);
    const numbers: number[] = [];
    const textTokens: string[] = [];

    for (const tok of remaining) {
      const num = Number(tok);
      if (!isNaN(num) && tok !== '') {
        numbers.push(num);
      } else {
        textTokens.push(tok);
      }
    }

    if (numbers.length >= 2) {
      const lat = numbers[0];
      const lng = numbers[1];
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        const elevation = numbers[2] !== undefined ? numbers[2] : undefined;
        const satellites = numbers[3] !== undefined ? Math.round(numbers[3]) : undefined;
        const statusToken = textTokens.find(
          t => t.toLowerCase() === 'online' || t.toLowerCase() === 'offline'
        );
        const provinceToken = textTokens.find(
          t =>
            t.toLowerCase() !== 'online' &&
            t.toLowerCase() !== 'offline' &&
            !t.toUpperCase().includes('RTCM')
        );

        results.push({
          id: idCandidate,
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          ...(elevation !== undefined ? { elevation } : {}),
          ...(satellites !== undefined ? { satellites } : {}),
          ...(provinceToken ? { province: provinceToken } : {}),
          ...(statusToken
            ? { status: statusToken.toLowerCase() === 'online' ? 'Online' : 'Offline' }
            : {})
        });
      }
    }
  }

  return results;
}

export const CorsView: React.FC = () => {
  const {
    stations: corsStations,
    toggleStationStatus,
    updateStationCoordinates,
    batchUpdateStationCoordinates,
    syncStationsFromCORSServer,
    addCORSStation
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Online' | 'Offline'>('ALL');
  const [provinceFilter, setProvinceFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);

  // Single Station Coordinate & Issue Edit Modal State
  const [editingStation, setEditingStation] = useState<CORSStation | null>(null);
  const [editLat, setEditLat] = useState<string>('');
  const [editLng, setEditLng] = useState<string>('');
  const [editElevation, setEditElevation] = useState<string>('');
  const [editProvince, setEditProvince] = useState<string>('');
  const [editMountpoint, setEditMountpoint] = useState<string>('');
  const [editSatellites, setEditSatellites] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'Online' | 'Offline'>('Online');
  const [issueText, setIssueText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [quickCoordPaste, setQuickCoordPaste] = useState('');
  const [isSavingStation, setIsSavingStation] = useState(false);

  // Batch Coordinate Input / Import Modal from http://183.182.105.253/index.aspx
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchTab, setBatchTab] = useState<'quick_select' | 'paste_table' | 'add_new'>('quick_select');
  const [selectedQuickId, setSelectedQuickId] = useState<string>('DOL1');
  const [quickFormLat, setQuickFormLat] = useState<string>('17.975718');
  const [quickFormLng, setQuickFormLng] = useState<string>('102.633142');
  const [quickFormElev, setQuickFormElev] = useState<string>('171.8');
  const [quickFormProvince, setQuickFormProvince] = useState<string>('Vientiane Capital');
  const [quickFormMountpoint, setQuickFormMountpoint] = useState<string>('DOL1_RTCM32');
  const [rawBatchText, setRawBatchText] = useState<string>('');
  const [isApplyingBatch, setIsApplyingBatch] = useState(false);

  // Add New Station state
  const [newStationId, setNewStationId] = useState('');
  const [newStationLat, setNewStationLat] = useState('');
  const [newStationLng, setNewStationLng] = useState('');
  const [newStationElev, setNewStationElev] = useState('');
  const [newStationProvince, setNewStationProvince] = useState('');
  const [newStationMountpoint, setNewStationMountpoint] = useState('');

  // Enrich stations with fallback coordinates from CORS_COORDINATES if missing
  const enrichedStations = useMemo(() => {
    return corsStations.map(st => {
      const ref = CORS_COORDINATES[st.id];
      return {
        ...st,
        lat: typeof st.lat === 'number' && !isNaN(st.lat) ? st.lat : (ref?.lat ?? 17.975718),
        lng: typeof st.lng === 'number' && !isNaN(st.lng) ? st.lng : (ref?.lng ?? 102.633142),
        elevation:
          typeof st.elevation === 'number' && !isNaN(st.elevation)
            ? st.elevation
            : (ref?.elevation ?? 180),
        province: st.province || ref?.province || 'Lao PDR',
        satellites:
          typeof st.satellites === 'number' && !isNaN(st.satellites)
            ? st.satellites
            : (ref?.satellites ?? 16),
        mountpoint: st.mountpoint || ref?.mountpoint || `${st.id}_RTCM32`,
        coordSource: st.coordSource || CORS_SERVER_PORTAL_URL
      };
    });
  }, [corsStations]);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    enrichedStations.forEach(s => {
      if (s.province) set.add(s.province);
    });
    return Array.from(set).sort();
  }, [enrichedStations]);

  const filteredStations = useMemo(() => {
    return enrichedStations.filter(station => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        station.id.toLowerCase().includes(q) ||
        (station.province && station.province.toLowerCase().includes(q)) ||
        (station.mountpoint && station.mountpoint.toLowerCase().includes(q)) ||
        (station.issue && station.issue.toLowerCase().includes(q)) ||
        `${station.lat}, ${station.lng}`.includes(q);
      const matchesStatus = statusFilter === 'ALL' || station.status === statusFilter;
      const matchesProvince = provinceFilter === 'ALL' || station.province === provinceFilter;
      return matchesSearch && matchesStatus && matchesProvince;
    });
  }, [enrichedStations, searchTerm, statusFilter, provinceFilter]);

  const onlineCount = enrichedStations.filter(s => s.status === 'Online').length;
  const offlineCount = enrichedStations.filter(s => s.status === 'Offline').length;
  const issueCount = enrichedStations.filter(s => s.issue && s.issue.trim() !== '').length;

  const parsedBatchPreview = useMemo(() => {
    return parseBatchCoordinatesText(rawBatchText);
  }, [rawBatchText]);

  const handleEditClick = (station: CORSStation) => {
    const ref = CORS_COORDINATES[station.id];
    const lat = typeof station.lat === 'number' ? station.lat : (ref?.lat ?? 17.975718);
    const lng = typeof station.lng === 'number' ? station.lng : (ref?.lng ?? 102.633142);
    const elev = typeof station.elevation === 'number' ? station.elevation : (ref?.elevation ?? 180);

    setEditingStation(station);
    setEditLat(String(lat));
    setEditLng(String(lng));
    setEditElevation(String(elev));
    setEditProvince(station.province || ref?.province || '');
    setEditMountpoint(station.mountpoint || ref?.mountpoint || `${station.id}_RTCM32`);
    setEditSatellites(String(station.satellites ?? ref?.satellites ?? 16));
    setEditStatus(station.status);
    setIssueText(station.issue || '');
    setNotesText(station.notes || '');
    setQuickCoordPaste('');
  };

  const handleQuickPasteApply = (value: string) => {
    setQuickCoordPaste(value);
    const parsed = parseCoordinateInputString(value);
    if (parsed) {
      if (parsed.lat !== undefined) setEditLat(String(parsed.lat));
      if (parsed.lng !== undefined) setEditLng(String(parsed.lng));
      if (parsed.elevation !== undefined) setEditElevation(String(parsed.elevation));
    }
  };

  const handleResetToPortalReference = () => {
    if (!editingStation) return;
    const ref = CORS_COORDINATES[editingStation.id];
    if (!ref) return;
    setEditLat(String(ref.lat));
    setEditLng(String(ref.lng));
    if (ref.elevation !== undefined) setEditElevation(String(ref.elevation));
    setEditProvince(ref.province);
    if (ref.mountpoint) setEditMountpoint(ref.mountpoint);
    setEditSatellites(String(ref.satellites));
  };

  const handleSaveStationDetails = async () => {
    if (!editingStation) return;
    const parsedLat = parseFloat(editLat);
    const parsedLng = parseFloat(editLng);
    const parsedElev = parseFloat(editElevation);
    const parsedSats = parseInt(editSatellites, 10);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      showToast('ຄ່າ Latitude ບໍ່ຖືກຕ້ອງ (ຕ້ອງຢູ່ລະຫວ່າງ -90 ຫາ 90)', 'error');
      return;
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      showToast('ຄ່າ Longitude ບໍ່ຖືກຕ້ອງ (ຕ້ອງຢູ່ລະຫວ່າງ -180 ຫາ 180)', 'error');
      return;
    }

    setIsSavingStation(true);
    try {
      await updateStationCoordinates(editingStation.id, {
        lat: Number(parsedLat.toFixed(6)),
        lng: Number(parsedLng.toFixed(6)),
        elevation: !isNaN(parsedElev) ? Number(parsedElev.toFixed(2)) : undefined,
        province: editProvince.trim() || undefined,
        mountpoint: editMountpoint.trim() || `${editingStation.id}_RTCM32`,
        satellites: !isNaN(parsedSats) ? parsedSats : undefined,
        status: editStatus,
        issue: issueText.trim(),
        notes: notesText.trim(),
        coordSource: CORS_SERVER_PORTAL_URL
      });
      showToast(
        `ອັບເດດພິກັດສະຖານີ ${editingStation.id} (${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}) ສຳເລັດແລ້ວ`
      );
      setEditingStation(null);
    } catch {
      showToast('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກພິກັດສະຖານີ', 'error');
    } finally {
      setIsSavingStation(false);
    }
  };

  const handleSyncFromPortal = async () => {
    setIsSyncing(true);
    try {
      const count = await syncStationsFromCORSServer();
      showToast(
        `ຊິ້ງຂໍ້ມູນພິກັດທັງໝົດ ${count} ສະຖານີຈາກ ${CORS_SERVER_PORTAL_URL} ສຳເລັດແລ້ວ!`
      );
    } catch {
      showToast('ບໍ່ສາມາດຊິ້ງຂໍ້ມູນພິກັດໄດ້ ກະລຸນາລອງໃໝ່', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectQuickStation = (id: string) => {
    setSelectedQuickId(id);
    const st = enrichedStations.find(s => s.id === id);
    const ref = CORS_COORDINATES[id];
    const lat = st?.lat ?? ref?.lat ?? 17.975718;
    const lng = st?.lng ?? ref?.lng ?? 102.633142;
    const elev = st?.elevation ?? ref?.elevation ?? 180;
    const prov = st?.province ?? ref?.province ?? '';
    const mp = st?.mountpoint ?? ref?.mountpoint ?? `${id}_RTCM32`;

    setQuickFormLat(String(lat));
    setQuickFormLng(String(lng));
    setQuickFormElev(String(elev));
    setQuickFormProvince(prov);
    setQuickFormMountpoint(mp);
  };

  const handleQuickSingleCoordinateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(quickFormLat);
    const lng = parseFloat(quickFormLng);
    const elev = parseFloat(quickFormElev);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      showToast('ກະລຸນາປ້ອນຄ່າພິກັດ Latitude ແລະ Longitude ໃຫ້ຖືກຕ້ອງ', 'error');
      return;
    }

    setIsApplyingBatch(true);
    try {
      await updateStationCoordinates(selectedQuickId, {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        elevation: !isNaN(elev) ? Number(elev.toFixed(2)) : undefined,
        province: quickFormProvince.trim() || undefined,
        mountpoint: quickFormMountpoint.trim() || `${selectedQuickId}_RTCM32`,
        coordSource: CORS_SERVER_PORTAL_URL
      });
      showToast(
        `ປ່ຽນພິກັດສະຖານີ ${selectedQuickId} ເປັນ (${lat.toFixed(6)}, ${lng.toFixed(6)}) ຈາກ ${CORS_SERVER_PORTAL_URL} ສຳເລັດແລ້ວ!`
      );
      setShowBatchModal(false);
    } catch {
      showToast('ບໍ່ສາມາດອັບເດດພິກັດໄດ້', 'error');
    } finally {
      setIsApplyingBatch(false);
    }
  };

  const handleApplyBatchPaste = async () => {
    if (parsedBatchPreview.length === 0) {
      showToast('ບໍ່ພົບຂໍ້ມູນພິກັດທີ່ຖືກຕ້ອງ ກະລຸນາກວດສອບຮູບແບບຂໍ້ມູນ', 'error');
      return;
    }

    setIsApplyingBatch(true);
    try {
      const updatedCount = await batchUpdateStationCoordinates(
        parsedBatchPreview,
        CORS_SERVER_PORTAL_URL
      );
      showToast(
        `ນຳເຂົ້າ ແລະ ອັບເດດພິກັດຈຳນວນ ${updatedCount} ສະຖານີ ຈາກ ${CORS_SERVER_PORTAL_URL} ສຳເລັດແລ້ວ!`
      );
      setRawBatchText('');
      setShowBatchModal(false);
    } catch {
      showToast('ເກີດຂໍ້ຜິດພາດໃນການນຳເຂົ້າພິກັດແບບກຸ່ມ', 'error');
    } finally {
      setIsApplyingBatch(false);
    }
  };

  const handleCreateNewStation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newStationId.trim().toUpperCase();
    const lat = parseFloat(newStationLat);
    const lng = parseFloat(newStationLng);
    const elev = parseFloat(newStationElev);

    if (!cleanId) {
      showToast('ກະລຸນາລະບຸລະຫັດສະຖານີ (Station ID)', 'error');
      return;
    }
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      showToast('ກະລຸນາລະບຸພິກັດ Latitude ແລະ Longitude ໃຫ້ຖືກຕ້ອງ', 'error');
      return;
    }

    setIsApplyingBatch(true);
    try {
      await addCORSStation({
        id: cleanId,
        name: cleanId,
        type: 'ໃໝ່',
        issue: 'none',
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        elevation: !isNaN(elev) ? Number(elev.toFixed(2)) : 180,
        province: newStationProvince.trim() || 'Lao PDR',
        mountpoint: newStationMountpoint.trim() || `${cleanId}_RTCM32`,
        status: 'Online'
      });
      showToast(`ເພີ່ມສະຖານີ CORS ໃໝ່ ${cleanId} (${lat.toFixed(6)}, ${lng.toFixed(6)}) ສຳເລັດແລ້ວ!`);
      setNewStationId('');
      setNewStationLat('');
      setNewStationLng('');
      setNewStationElev('');
      setNewStationProvince('');
      setNewStationMountpoint('');
      setShowBatchModal(false);
    } catch {
      showToast('ບໍ່ສາມາດເພີ່ມສະຖານີໃໝ່ໄດ້', 'error');
    } finally {
      setIsApplyingBatch(false);
    }
  };

  const handleLoadSampleFromPortal = () => {
    const sampleLines = [
      'DOL1\t17.975718\t102.633142\t171.8\tVientiane Capital\tOnline',
      'VTE1\t17.966742\t102.600084\t169.4\tVientiane Capital\tOnline',
      'LPB1\t19.883395\t102.133374\t305.2\tLuang Prabang\tOnline',
      'PKS1\t15.116736\t105.816748\t102.4\tChampasak\tOnline',
      'SVK1\t16.550082\t104.750064\t144.8\tSavannakhet\tOnline',
      'XKH1\t19.450068\t103.216735\t1102.4\tXiengkhouang\tOnline',
      'LNT1\t20.950062\t101.400085\t596.4\tLuang Namtha\tOnline',
      'BKEO\t20.283364\t100.416728\t382.5\tBokeo\tOnline'
    ].join('\n');
    setRawBatchText(sampleLines);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/70 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CORS Reference Portal Integration Banner (http://183.182.105.253/index.aspx) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-indigo-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Satellite className="w-3.5 h-3.5" />
                LAO NATIONAL CORS SERVER
              </span>
              <span className="text-xs font-mono text-slate-300 bg-white/10 px-2.5 py-1 rounded-md">
                NTRIP Caster: {CORS_NTRIP_HOST}:{CORS_NTRIP_PORT}
              </span>
              <a
                href={CORS_SERVER_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-amber-300 hover:text-amber-200 underline underline-offset-2"
              >
                {CORS_SERVER_PORTAL_URL}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              ລະບົບຄຸ້ມຄອງພິກັດສະຖານີ CORS (Coordinate Position Management)
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl">
              ອັບເດດ, ແກ້ໄຂ ຫຼື ນຳເຂົ້າຄ່າພິກັດຕຳແໜ່ງ (Latitude, Longitude, Elevation, Mountpoint) ຈາກເຊີບເວີ{' '}
              <span className="font-mono text-white">{CORS_SERVER_PORTAL_URL}</span> ໂດຍກົງ ເພື່ອສະແດງຜົນເທິງແຜນທີ່ Google Maps ແບບ Real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                handleSelectQuickStation(selectedQuickId);
                setShowBatchModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>ປ້ອນ / ປ່ຽນພິກັດຈາກ 183.182.105.253</span>
            </button>

            <button
              onClick={handleSyncFromPortal}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium rounded-xl border border-white/15 transition-colors disabled:opacity-50 cursor-pointer"
              title={`Sync all 73 stations with ${CORS_SERVER_PORTAL_URL}`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
              <span>{isSyncing ? 'ກຳລັງຊິ້ງພິກັດ...' : 'ຊິ້ງພິກັດມາດຕະຖານ (73 ສະຖານີ)'}</span>
            </button>

            <a
              href={CORS_SERVER_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs sm:text-sm font-medium rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">ເປີດເວັບ 183.182.105.253</span>
            </a>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">ສະຖານີທັງໝົດ (Total)</p>
            <h3 className="text-2xl font-bold text-gray-900">{enrichedStations.length}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">WGS84 Geodetic</p>
          </div>
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">ອອນລາຍ (Online)</p>
            <h3 className="text-2xl font-bold text-emerald-600">{onlineCount}</h3>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">ສົ່ງສັນຍານ RTCM ປົກກະຕິ</p>
          </div>
          <div className="w-12 h-14 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center justify-center">
            <CorsStationIcon status="Online" size="md" showPulse />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">ອອບລາຍ (Offline)</p>
            <h3 className="text-2xl font-bold text-rose-600">{offlineCount}</h3>
            <p className="text-[11px] text-rose-500 mt-0.5">ຂາດການເຊື່ອມຕໍ່</p>
          </div>
          <div className="w-12 h-14 bg-rose-50/80 border border-rose-100 rounded-xl flex items-center justify-center">
            <CorsStationIcon status="Offline" size="md" showPulse />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">ມີບັນຫາ (Issues Reported)</p>
            <h3 className="text-2xl font-bold text-amber-600">{issueCount}</h3>
            <p className="text-[11px] text-amber-600/80 mt-0.5">ກຳລັງຕິດຕາມແກ້ໄຂ</p>
          </div>
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters, Search & View Switcher */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-3 justify-between items-center">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາລະຫັດສະຖານີ, ແຂວງ, ຫຼື ພິກັດ Lat/Lng..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* Province filter */}
          <select
            value={provinceFilter}
            onChange={e => setProvinceFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">ທຸກແຂວງ ({provinces.length})</option>
            {provinces.map(prov => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ທັງໝົດ
            </button>
            <button
              onClick={() => setStatusFilter('Online')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Online'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CorsStationIcon status="Online" size="xs" />
              <span>Online</span>
            </button>
            <button
              onClick={() => setStatusFilter('Offline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Offline'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CorsStationIcon status="Offline" size="xs" />
              <span>Offline</span>
            </button>
          </div>

          {/* Map / List toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>ແຜນທີ່ (Map)</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>ລາຍການພິກັດ ({filteredStations.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Map or Station Coordinate Cards */}
      {viewMode === 'map' ? (
        <div className="space-y-4">
          <GoogleMapsView
            stations={filteredStations}
            onStationSelect={station => handleEditClick(station)}
          />

          {/* Compact Coordinate Quick-Jump Bar under Map */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-gray-800">
                  ລາຍການພິກັດສະຖານີ CORS ({filteredStations.length} ສະຖານີ) — ຄລິກເພື່ອແກ້ໄຂພິກັດ Lat/Lng
                </h4>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                Source: {CORS_SERVER_PORTAL_URL}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {filteredStations.map(st => (
                <button
                  key={st.id}
                  onClick={() => handleEditClick(st)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CorsStationIcon status={st.status} size="xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-gray-900">{st.id}</span>
                        <span className="text-[11px] text-gray-500 truncate">{st.province}</span>
                      </div>
                      <p className="text-[11px] font-mono text-indigo-600 mt-0.5">
                        {Number(st.lat).toFixed(5)}°N, {Number(st.lng).toFixed(5)}°E
                      </p>
                    </div>
                  </div>
                  <Edit2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Station Coordinate Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStations.map(station => (
            <div
              key={station.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                station.status === 'Online'
                  ? 'border-gray-100 hover:border-emerald-200'
                  : 'border-rose-100 bg-rose-50/20 hover:border-rose-300'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-2 py-1.5 rounded-xl border flex items-center justify-center ${
                        station.status === 'Online'
                          ? 'bg-emerald-50/70 border-emerald-200/80'
                          : 'bg-rose-50/70 border-rose-200/80'
                      }`}
                    >
                      <CorsStationIcon status={station.status} size="sm" showPulse />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 leading-none">{station.id}</h4>
                      <span className="text-xs text-gray-500">{station.province}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(station)}
                      className="text-gray-500 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="ແກ້ໄຂພິກັດ & ລາຍລະອຽດ"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Coordinate Position Box */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-indigo-600" />
                      Latitude:
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      {Number(station.lat).toFixed(6)}° N
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-indigo-600" />
                      Longitude:
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      {Number(station.lng).toFixed(6)}° E
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/70">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Mountain className="w-3.5 h-3.5 text-emerald-600" />
                      Elevation:
                    </span>
                    <span className="font-mono text-slate-800">{station.elevation ?? 180} m</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Mountpoint:</span>
                    <span className="font-mono text-indigo-700 font-medium">
                      {station.mountpoint || `${station.id}_RTCM32`}
                    </span>
                  </div>
                </div>

                {/* Status & Satellites */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      station.status === 'Online'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {station.status === 'Online' ? (
                      <Wifi className="w-3 h-3" />
                    ) : (
                      <WifiOff className="w-3 h-3" />
                    )}
                    {station.status}
                  </span>

                  <span className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                    <Satellite className="w-3.5 h-3.5 text-indigo-500" />
                    {station.satellites ?? 16} Sats
                  </span>
                </div>

                {station.issue && (
                  <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 line-clamp-2">{station.issue}</p>
                  </div>
                )}

                {station.notes && (
                  <div className="mb-3 p-2 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-xs text-gray-600 line-clamp-2">ໝາຍເຫດ: {station.notes}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                <button
                  onClick={() => handleEditClick(station)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  ປ່ຽນພິກັດ
                </button>
                <button
                  onClick={() => toggleStationStatus(station)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    station.status === 'Online'
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {station.status === 'Online' ? 'Set Offline' : 'Set Online'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Station Coordinate & Issue Edit Modal */}
      {editingStation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className={`px-2.5 py-1.5 rounded-xl border ${
                    editStatus === 'Online'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <CorsStationIcon status={editStatus} size="sm" showPulse />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-sm">
                      {editingStation.id}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">
                      ແກ້ໄຂພິກັດຕຳແໜ່ງ & ຂໍ້ມູນສະຖານີ
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    ອ້າງອີງຂໍ້ມູນຈາກ:{' '}
                    <a
                      href={CORS_SERVER_PORTAL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-indigo-600 hover:underline"
                    >
                      {CORS_SERVER_PORTAL_URL}
                    </a>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingStation(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Quick Paste Coordinate Line from http://183.182.105.253/index.aspx */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-indigo-950">
                    ວາງຄ່າພິກັດດ່ວນຈາກ {CORS_SERVER_PORTAL_URL} (Quick Coordinate Paste)
                  </label>
                  {CORS_COORDINATES[editingStation.id] && (
                    <button
                      type="button"
                      onClick={handleResetToPortalReference}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 hover:text-indigo-900 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      ຄືນຄ່າເລີ່ມຕົ້ນຈາກເຊີບເວີ
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={quickCoordPaste}
                  onChange={e => handleQuickPasteApply(e.target.value)}
                  placeholder="ວາງພິກັດ ເຊັ່ນ: 17.975718, 102.633142 ຫຼື 17°58'32.58&quot;N 102°37'59.31&quot;E"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Lat / Lng / Elevation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Latitude (WGS84 °N) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editLat}
                    onChange={e => setEditLat(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="17.975718"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Longitude (WGS84 °E) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editLng}
                    onChange={e => setEditLng(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="102.633142"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Elevation (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editElevation}
                    onChange={e => setEditElevation(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="171.8"
                  />
                </div>
              </div>

              {/* Province, Mountpoint, Satellites, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ແຂວງ / ທີ່ຕັ້ງ (Province)
                  </label>
                  <input
                    type="text"
                    value={editProvince}
                    onChange={e => setEditProvince(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Vientiane Capital"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    NTRIP Mountpoint
                  </label>
                  <input
                    type="text"
                    value={editMountpoint}
                    onChange={e => setEditMountpoint(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder={`${editingStation.id}_RTCM32`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ຈຳນວນດາວທຽມ (Satellites)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={editSatellites}
                    onChange={e => setEditSatellites(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ສະຖານະ (Station Status)
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as 'Online' | 'Offline')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Online">Online (ປົກກະຕິ)</option>
                    <option value="Offline">Offline (ຂາດການເຊື່ອມຕໍ່)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ບັນຫາທີ່ພົບ (Issue Description)
                </label>
                <textarea
                  value={issueText}
                  onChange={e => setIssueText(e.target.value)}
                  placeholder="ລະບຸບັນຫາ (ຖ້າມີ) ເຊັ່ນ: ໄຟດັບ, ອິນເຕີເນັດຂັດຂ້ອງ..."
                  rows={2}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ໝາຍເຫດ (Notes)
                </label>
                <textarea
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  placeholder="ໝາຍເຫດເພີ່ມເຕີມ..."
                  rows={2}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="button"
                  disabled={isSavingStation}
                  onClick={handleSaveStationDetails}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {isSavingStation ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກພິກັດ & ຂໍ້ມູນ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Coordinate Input / Import Modal from http://183.182.105.253/index.aspx */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  {CORS_SERVER_PORTAL_URL}
                </span>
                <h3 className="text-lg font-bold text-gray-900">
                  ປ້ອນ ແລະ ອັບເດດຄ່າພິກັດສະຖານີ CORS (Coordinate Input & Sync)
                </h3>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-2 mt-4 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setBatchTab('quick_select')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  batchTab === 'quick_select'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                1. ເລືອກສະຖານີ & ປ່ຽນພິກັດ
              </button>
              <button
                type="button"
                onClick={() => setBatchTab('paste_table')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  batchTab === 'paste_table'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                2. ວາງຕາຕະລາງພິກັດຈາກ 183.182.105.253
              </button>
              <button
                type="button"
                onClick={() => setBatchTab('add_new')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  batchTab === 'add_new'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                3. ເພີ່ມສະຖານີ CORS ໃໝ່
              </button>
            </div>

            {/* Tab 1: Quick Select & Update Coordinate Position */}
            {batchTab === 'quick_select' && (
              <form onSubmit={handleQuickSingleCoordinateUpdate} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ເລືອກສະຖານີ CORS (Select Station)
                  </label>
                  <select
                    value={selectedQuickId}
                    onChange={e => handleSelectQuickStation(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-medium border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {enrichedStations.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.id} — {st.province} ({Number(st.lat).toFixed(5)}°N,{' '}
                        {Number(st.lng).toFixed(5)}°E)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
                  <label className="block text-xs font-semibold text-indigo-900 mb-1">
                    ວາງຄ່າພິກັດຈາກໜ້າເວັບ {CORS_SERVER_PORTAL_URL} (Auto-Parse Lat/Lng)
                  </label>
                  <input
                    type="text"
                    placeholder="ວາງພິກັດ ເຊັ່ນ: 17.975718, 102.633142, 171.8"
                    onChange={e => {
                      const parsed = parseCoordinateInputString(e.target.value);
                      if (parsed) {
                        if (parsed.lat !== undefined) setQuickFormLat(String(parsed.lat));
                        if (parsed.lng !== undefined) setQuickFormLng(String(parsed.lng));
                        if (parsed.elevation !== undefined) setQuickFormElev(String(parsed.elevation));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Latitude (WGS84 °N) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={quickFormLat}
                      onChange={e => setQuickFormLat(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Longitude (WGS84 °E) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={quickFormLng}
                      onChange={e => setQuickFormLng(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Elevation (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={quickFormElev}
                      onChange={e => setQuickFormElev(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ແຂວງ / ທີ່ຕັ້ງ (Province)
                    </label>
                    <input
                      type="text"
                      value={quickFormProvince}
                      onChange={e => setQuickFormProvince(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mountpoint ({CORS_NTRIP_HOST}:{CORS_NTRIP_PORT})
                    </label>
                    <input
                      type="text"
                      value={quickFormMountpoint}
                      onChange={e => setQuickFormMountpoint(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                  >
                    ຍົກເລີກ
                  </button>
                  <button
                    type="submit"
                    disabled={isApplyingBatch}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {isApplyingBatch ? 'ກຳລັງອັບເດດ...' : `ບັນທຶກພິກັດ ${selectedQuickId}`}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Batch Paste Coordinate Table / NTRIP Caster from http://183.182.105.253/index.aspx */}
            {batchTab === 'paste_table' && (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-600">
                    ກ໊ອບປີ້ຕາຕະລາງພິກັດຈາກ{' '}
                    <a
                      href={CORS_SERVER_PORTAL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-indigo-600 underline"
                    >
                      {CORS_SERVER_PORTAL_URL}
                    </a>{' '}
                    ຫຼື NTRIP Sourcetable ແລ້ວວາງລົງດ້ານລຸ່ມ:
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadSampleFromPortal}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    ໂຫຼດຕົວຢ່າງຂໍ້ມູນຈາກ 183.182.105.253
                  </button>
                </div>

                <textarea
                  value={rawBatchText}
                  onChange={e => setRawBatchText(e.target.value)}
                  rows={6}
                  placeholder={`ຮູບແບບທີ່ຮອງຮັບ (1 ແຖວຕໍ່ 1 ສະຖານີ):\nDOL1   17.975718   102.633142   171.8   Vientiane Capital\nLPB1, 19.883395, 102.133374, 305.2, Luang Prabang\nSTR;VTE1_RTCM32;Vientiane;RTCM 3.2;...;LAO;17.966742;102.600084;...`}
                  className="w-full p-3 text-xs font-mono border border-gray-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                {/* Parsed Preview Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      ກວດສອບຂໍ້ມູນພິກັດກ່ອນບັນທຶກ ({parsedBatchPreview.length} ສະຖານີ)
                    </span>
                  </div>
                  {parsedBatchPreview.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      ຍັງບໍ່ມີຂໍ້ມູນພິກັດທີ່ວາງລົງ...
                    </div>
                  ) : (
                    <div className="max-h-44 overflow-y-auto divide-y divide-gray-100">
                      {parsedBatchPreview.map((row, idx) => (
                        <div
                          key={`${row.id}-${idx}`}
                          className="px-3.5 py-2 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              {row.id}
                            </span>
                            {row.province && (
                              <span className="text-gray-600">{row.province}</span>
                            )}
                          </div>
                          <div className="font-mono text-gray-800">
                            Lat: {row.lat.toFixed(6)}°N | Lng: {row.lng.toFixed(6)}°E
                            {row.elevation !== undefined ? ` | ${row.elevation}m` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                  >
                    ຍົກເລີກ
                  </button>
                  <button
                    type="button"
                    disabled={isApplyingBatch || parsedBatchPreview.length === 0}
                    onClick={handleApplyBatchPaste}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {isApplyingBatch
                      ? 'ກຳລັງອັບເດດ...'
                      : `ອັບເດດພິກັດ (${parsedBatchPreview.length} ສະຖານີ)`}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Add New CORS Station */}
            {batchTab === 'add_new' && (
              <form onSubmit={handleCreateNewStation} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ລະຫັດສະຖານີ (Station ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStationId}
                      onChange={e => setNewStationId(e.target.value.toUpperCase())}
                      placeholder="ເຊັ່ນ: VTE2"
                      className="w-full px-3 py-2 text-sm font-mono uppercase border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ແຂວງ / ທີ່ຕັ້ງ (Province) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStationProvince}
                      onChange={e => setNewStationProvince(e.target.value)}
                      placeholder="ເຊັ່ນ: Vientiane Capital"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Latitude (WGS84 °N) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newStationLat}
                      onChange={e => setNewStationLat(e.target.value)}
                      placeholder="17.975718"
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Longitude (WGS84 °E) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newStationLng}
                      onChange={e => setNewStationLng(e.target.value)}
                      placeholder="102.633142"
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Elevation (m)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newStationElev}
                      onChange={e => setNewStationElev(e.target.value)}
                      placeholder="171.8"
                      className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    NTRIP Mountpoint
                  </label>
                  <input
                    type="text"
                    value={newStationMountpoint}
                    onChange={e => setNewStationMountpoint(e.target.value)}
                    placeholder={newStationId ? `${newStationId}_RTCM32` : 'STATION_RTCM32'}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                  >
                    ຍົກເລີກ
                  </button>
                  <button
                    type="submit"
                    disabled={isApplyingBatch}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {isApplyingBatch ? 'ກຳລັງເພີ່ມ...' : 'ເພີ່ມສະຖານີ CORS ໃໝ່'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
