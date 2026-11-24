import React from 'react';
import { User, LogOut, Users, Wifi, PanelLeft } from 'lucide-react';
import { UniqTekLogo } from './UniqTekLogo';
import { NotificationCenter } from './NotificationCenter';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    user,
    profile,
    users,
    currentUserAccount,
    lastSyncedAt,
    updateUserPresenceStatus,
    navigateTo,
    logout
  } = useApp();

  const onlineCount = users.filter((u) => u.status === 'Online' || u.status === 'Busy').length;
  const activeStatus = currentUserAccount?.status || 'Online';

  const statusColor =
    activeStatus === 'Online'
      ? 'bg-emerald-500'
      : activeStatus === 'Busy'
      ? 'bg-amber-500'
      : 'bg-slate-400';

  const handleToggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-left-sidebar'));
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="w-full px-2.5 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Sidebar Toggle + Brand identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            data-testid="header_sidebar_toggle"
            onClick={handleToggleSidebar}
            title="ຫຍໍ້/ຂະຫຍາຍແຖບເມນູຊ້າຍ (Toggle Left Menu)"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-700 transition-colors cursor-pointer shrink-0"
          >
            <PanelLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div
            data-testid="app_header_row"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0"
            onClick={() => navigateTo('dashboard')}
          >
            <UniqTekLogo size={32} roundedClassName="rounded-lg shrink-0" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm lg:text-base tracking-wide text-slate-900 dark:text-white leading-tight truncate">
                  UNIQTEK SERVICES
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>LIVE • {lastSyncedAt}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
                <span className="truncate">
                  {profile.name || user || 'ບໍ່ລະບຸ'} ({currentUserAccount?.accessLevel || '-'})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Header Actions & Real-Time Presence */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Online Status Selector */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <select
              data-testid="header_presence_select"
              value={activeStatus}
              onChange={(e) =>
                updateUserPresenceStatus(e.target.value as 'Online' | 'Busy' | 'Offline')
              }
              aria-label="ສະຖານະອອນລາຍ"
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 outline-hidden cursor-pointer text-[11px]"
            >
              <option value="Online" className="text-slate-900">🟢 ອອນລາຍ (Online)</option>
              <option value="Busy" className="text-slate-900">🟡 ກຳລັງເຮັດວຽກ (Busy)</option>
              <option value="Offline" className="text-slate-900">⚪ ອອບລາຍ (Offline)</option>
            </select>
          </div>

          {/* Users Database Quick Button */}
          <button
            data-testid="users_db_header_btn"
            onClick={() => navigateTo('profile')}
            title="ຖານຂໍ້ມູນຜູ້ເຂົ້າໃຊ້ງານ Real-time"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/70 dark:border-blue-800/60 transition-colors text-[11px] sm:text-xs font-bold cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">ຜູ້ໃຊ້ ({onlineCount}/{users.length})</span>
            <span className="md:hidden">{onlineCount}</span>
          </button>

          {/* Local Notification Center Bell */}
          <NotificationCenter />

          <button
            data-testid="profile_button"
            onClick={() => navigateTo('profile')}
            title="ຂໍ້ມູນສ່ວນຕົວ (Profile)"
            className="p-1.5 sm:p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            data-testid="logout_button"
            onClick={logout}
            title="ອອກຈາກລະບົບ (Logout)"
            className="p-1.5 sm:p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
