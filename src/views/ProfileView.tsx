import React, { useState } from 'react';
import {
  User,
  Users,
  Settings,
  List,
  Edit2,
  Phone,
  Mail,
  Briefcase,
  Building,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Wrench,
  MapPin,
  Radio,
  ShoppingCart,
  Info,
  Plus,
  Search,
  Database,
  Activity,
  Shield,
  RefreshCw,
  UserCheck,
  AtSign,
  X,
  Fingerprint
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAccount } from '../types';
import { AccessManagementPanel } from '../components/AccessManagementPanel';

export const ProfileView: React.FC = () => {
  const {
    user,
    profile,
    users,
    currentUserAccount,
    lastSyncedAt,
    realtimeEventCount,
    activityLogs,
    updateProfile,
    updateThemeMode,
    addUserAccount,
    updateUserAccount,
    updateUserCredentials,
    resetUserPassword,
    toggleUserAccountLock,
    deleteUserAccount,
    updateUserPresenceStatus,
    login,
    registerBiometricFingerprint,
    removeBiometricFingerprint,
    clearActivityLogs,
    navigateTo,
    isAdmin
  } = useApp();

  const [activeTab, setActiveTab] = useState<'access' | 'profile' | 'settings' | 'logs'>(
    isAdmin ? 'access' : 'profile'
  );
  const pendingRequestCount = users.filter((u) => u.approvalStatus === 'pending').length;
  const [isEditing, setIsEditing] = useState(false);

  // Personal Profile Form states
  const [tempName, setTempName] = useState(profile.name);
  const [tempRole, setTempRole] = useState(profile.role);
  const [tempPhone, setTempPhone] = useState(profile.phone);
  const [tempDept, setTempDept] = useState(profile.department);
  const [liveActivityInput, setLiveActivityInput] = useState(
    currentUserAccount?.currentActivity || 'ກຳລັງຕິດຕາມລະບົບບໍລິການເຕັກນິກ'
  );

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const rolesList = [
    'Senior Technical Specialist',
    'Technical Survey Engineer',
    'CORS Network Administrator',
    'Equipment Calibration Engineer',
    'Hardware & Electronics Engineer',
    'Geodetic & GIS Engineer',
    'Field Survey Team Lead',
    'IT Systems Administrator',
    'Operations Manager'
  ];

  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3000);
  };

  const handleStartEdit = () => {
    setTempName(profile.name);
    setTempRole(profile.role);
    setTempPhone(profile.phone);
    setTempDept(profile.department);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(tempName.trim(), tempRole.trim(), tempPhone.trim(), tempDept.trim());
    setIsEditing(false);
    triggerToast('ບັນທຶກຂໍ້ມູນສ່ວນຕົວລົງຖານຂໍ້ມູນ Real-time ແລ້ວ');
  };

  const handleUpdateLiveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveActivityInput.trim()) return;
    updateUserPresenceStatus(currentUserAccount?.status || 'Online', liveActivityInput.trim());
    triggerToast('ອັບເດດສະຖານະ Real-time ແລ້ວ');
  };

  const getStatusStyle = (st: UserAccount['status']) => {
    switch (st) {
      case 'Online':
        return {
          dot: 'bg-emerald-500 animate-pulse',
          badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
          label: 'ອອນລາຍ (Online)'
        };
      case 'Busy':
        return {
          dot: 'bg-amber-500',
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
          label: 'ກຳລັງເຮັດວຽກ (Busy)'
        };
      default:
        return {
          dot: 'bg-slate-400',
          badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
          label: 'ອອບລາຍ (Offline)'
        };
    }
  };

  const getAccessBadge = (level: UserAccount['accessLevel']) => {
    switch (level) {
      case 'Admin':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      case 'Manager':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
      case 'Engineer':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
      default:
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300';
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'auth':
        return { icon: Lock, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' };
      case 'repair':
        return { icon: Wrench, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' };
      case 'project':
        return { icon: MapPin, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' };
      case 'cors':
        return { icon: Radio, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' };
      case 'quote':
        return { icon: ShoppingCart, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40' };
      case 'profile':
        return { icon: User, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40' };
      default:
        return { icon: Info, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' };
    }
  };

  return (
    <div className="space-y-4 pb-12 max-w-4xl mx-auto">
      {/* Feedback Toast Banner */}
      {feedbackToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-emerald-500/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Upper Profile Hero Header + Real-time Presence Bar */}
      <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-[#1E3A8A] to-[#0F172A] p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="relative inline-block shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#E21B23] to-[#2563EB] p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full rounded-full bg-[#1E3A8A] flex items-center justify-center text-2xl font-bold">
                {profile.name ? profile.name.slice(0, 1).toUpperCase() : 'U'}
              </div>
            </div>
            <span
              className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 ${
                currentUserAccount?.status === 'Busy'
                  ? 'bg-amber-500'
                  : currentUserAccount?.status === 'Offline'
                  ? 'bg-slate-400'
                  : 'bg-emerald-500'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold">
                {currentUserAccount?.accessLevel || 'Admin'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-semibold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Firestore Real-time • {lastSyncedAt}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {profile.role} • {profile.department}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[11px] text-slate-200 font-mono">
                @{currentUserAccount?.username || (user || profile.email).split('@')[0]}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[11px] text-slate-200">
                {user || profile.email}
              </span>
            </div>
          </div>
        </div>

        {/* Live Status & Real-Time Activity Broadcaster */}
        <form
          onSubmit={handleUpdateLiveActivity}
          className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs"
        >
          <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-2 shrink-0">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">ສະຖານະ Real-time:</span>
            <select
              value={currentUserAccount?.status || 'Online'}
              onChange={(e) =>
                updateUserPresenceStatus(
                  e.target.value as 'Online' | 'Busy' | 'Offline',
                  liveActivityInput
                )
              }
              className="bg-transparent font-bold text-white outline-hidden cursor-pointer"
            >
              <option value="Online" className="text-slate-900">🟢 Online</option>
              <option value="Busy" className="text-slate-900">🟡 Busy (ກຳລັງເຮັດວຽກ)</option>
              <option value="Offline" className="text-slate-900">⚪ Offline</option>
            </select>
          </div>

          <input
            type="text"
            value={liveActivityInput}
            onChange={(e) => setLiveActivityInput(e.target.value)}
            placeholder="ອັບເດດວຽກທີ່ກຳລັງເຮັດແບບ Real-time..."
            className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 outline-hidden focus:border-blue-400"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ອັບເດດ Real-time</span>
          </button>
        </form>
      </div>

      {/* Navigation Tabs */}
      <div
        className={`bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs grid gap-1 ${
          isAdmin ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'
        }`}
      >
        {isAdmin && (
          <button
            data-testid="tab_access"
            onClick={() => setActiveTab('access')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'access'
                ? 'bg-[#E21B23] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span className="truncate">
              ອະນຸມັດ & ສິດເຂົ້າໃຊ້{pendingRequestCount > 0 ? ` (${pendingRequestCount})` : ''}
            </span>
          </button>
        )}
        <button
          data-testid="tab_profile"
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#E21B23] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="truncate">ຂໍ້ມູນສ່ວນຕົວ</span>
        </button>
        <button
          data-testid="tab_settings"
          onClick={() => setActiveTab('settings')}
          className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#E21B23] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="truncate">ການຕັ້ງຄ່າ</span>
        </button>
        {isAdmin && (
          <button
            data-testid="tab_logs"
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-[#E21B23] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4 shrink-0" />
            <span className="truncate">ປະຫວັດ Real-time</span>
          </button>
        )}
      </div>

      {/* Access approval & user management (admins only; also enforced by firestore.rules) */}
      {activeTab === 'access' && isAdmin && <AccessManagementPanel />}

      {/* ========================================================================= */}
      {/* TAB 2: PERSONAL PROFILE (ຂໍ້ມູນສ່ວນຕົວ)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              ຂໍ້ມູນປະຈຳຕົວເຕັກນິກ (Real-time Synced)
            </h2>
            {!isEditing && (
              <button
                data-testid="edit_profile_toggle"
                onClick={handleStartEdit}
                className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                title="ແກ້ໄຂຂໍ້ມູນ"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ຊື່ ແລະ ນາມສະກຸນ
                </label>
                <input
                  data-testid="edit_profile_name"
                  type="text"
                  required
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ບົດບາດ / ຕຳແໜ່ງ
                </label>
                <select
                  data-testid="edit_profile_role"
                  value={tempRole}
                  onChange={(e) => setTempRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ພະແນກ / ຝ່າຍ
                </label>
                <input
                  data-testid="edit_profile_dept"
                  type="text"
                  value={tempDept}
                  onChange={(e) => setTempDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ເບີໂທຕິດຕໍ່
                </label>
                <input
                  data-testid="edit_profile_phone"
                  type="text"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  data-testid="cancel_edit_button"
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors"
                >
                  ຍົກເລີກ
                </button>
                <button
                  data-testid="save_edit_button"
                  type="submit"
                  className="px-5 py-2 bg-[#E21B23] hover:bg-red-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  ບັນທຶກ Real-time
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <User className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-slate-400 text-[10px] block">ຊື່ ແລະ ນາມສະກຸນ:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{profile.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-slate-400 text-[10px] block">ຕຳແໜ່ງ:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{profile.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <Building className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-slate-400 text-[10px] block">ພະແນກ:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{profile.department}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <Phone className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-slate-400 text-[10px] block">ເບີໂທຕິດຕໍ່:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{profile.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <Mail className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-slate-400 text-[10px] block">ອີເມວລະບົບ:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{user || profile.email}</span>
                </div>
              </div>

              {/* Digital Signature Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  ລາຍເຊັນດິຈິຕອນ (Digital Signature Approved)
                </span>
                <p className="font-serif italic text-lg text-blue-900 dark:text-blue-300 py-1">
                  / signed / {profile.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  ID: UNIQ-{Math.abs(profile.name.length * 9871).toString(16).toUpperCase()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SETTINGS & REAL-TIME SYNC DIAGNOSTICS                              */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5 text-xs">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            ການຕັ້ງຄ່າແອັບພລິເຄຊັນ & Real-time Sync
          </h2>

          {/* Theme Mode */}
          <div className="space-y-2">
            <span className="text-slate-500 font-medium block">
              ຮູບແບບການສະແດງຜົນ (App Theme)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['Light', 'Dark', 'System'] as const).map((mode) => (
                <button
                  key={mode}
                  data-testid={`theme_${mode.toLowerCase()}`}
                  onClick={() => updateThemeMode(mode)}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    profile.themeMode === mode
                      ? 'bg-[#E21B23] text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
            <span className="text-slate-500 font-medium block">
              ການດູແລຮັກສາລະບົບ (Maintenance)
            </span>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  ແຄຊ໌ ແລະ ຂໍ້ມູນຊົ່ວຄາວ
                </p>
                <p className="text-[11px] text-slate-400">
                  ລຶບລາຍການບັນທຶກປະຫວັດ ແລະ ໄຟລ໌ຂີ້ເຫຍື້ອ
                </p>
              </div>
              <button
                data-testid="clear_system_cache_button"
                onClick={clearActivityLogs}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold"
              >
                ລ້າງຂໍ້ມູນ
              </button>
            </div>
          </div>

          {/* Sync Diagnostics */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">
                    ການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ Firebase Firestore: Online (Real-time)
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    ອັບເດດຂໍ້ມູນຫຼ້າສຸດເມື່ອ: {lastSyncedAt} • ຈຳນວນ Event Sync: {realtimeEventCount} ຄັ້ງ
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['users', 'employees', 'repairs', 'projects', 'quotations', 'internal_notes', 'activity_logs'].map(
                (col) => (
                  <span
                    key={col}
                    className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/70 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] border border-emerald-200/60 dark:border-emerald-800/60"
                  >
                    /{col} ✓
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REAL-TIME LOGS (ປະຫວັດການເຮັດວຽກ Real-time)                        */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                ບັນທຶກການເຮັດວຽກ Real-time (Live Activity Stream)
              </h2>
              <p className="text-[11px] text-slate-400">
                ຊິ້ງຂໍ້ມູນກັບຄໍເລັກຊັນ Firestore `activity_logs` ແບບເວລາຈິງ
              </p>
            </div>
            {activityLogs.length > 0 && (
              <button
                data-testid="clear_logs_text"
                onClick={clearActivityLogs}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                ລ້າງປະຫວັດ
              </button>
            )}
          </div>

          {activityLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              ບໍ່ມີການເຄື່ອນໄຫວໃນເວລານີ້
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activityLogs.map((log) => {
                const { icon: IconComp, color } = getLogIcon(log.type);
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 flex items-start gap-3 text-xs"
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                        {log.details}
                      </p>
                      {log.userEmail && (
                        <span className="inline-block mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                          ໂດຍ: {log.userEmail}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Back to dashboard button */}
      <button
        data-testid="back_to_dashboard_button"
        onClick={() => navigateTo('dashboard')}
        className="w-full h-12 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ກັບຄືນໜ້າຫຼັກ</span>
      </button>
    </div>
  );
};


