import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Wrench,
  FolderKanban,
  Volume2,
  VolumeX,
  Settings,
  X,
  ArrowRight,
  Sparkles,
  UserCheck,
  MonitorCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppNotification } from '../types';
import { requestBrowserNotificationPermission } from '../utils/localNotificationService';

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    notificationPrefs,
    repairs,
    projects,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    updateNotificationPreferences,
    triggerTestNotification,
    selectRepair,
    selectProject,
    navigateTo
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'repairs' | 'projects'>('all');
  const [browserPermStatus, setBrowserPermStatus] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'mine') return Boolean(n.isAssignedToMe);
    if (activeTab === 'repairs')
      return n.category === 'repair_assigned' || n.category === 'repair_status';
    if (activeTab === 'projects') return n.category === 'project_status';
    return true;
  });

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    if (
      (notif.category === 'repair_assigned' || notif.category === 'repair_status') &&
      notif.targetId
    ) {
      const foundRepair = repairs.find((r) => r.id === notif.targetId);
      if (foundRepair) {
        selectRepair(foundRepair);
        setIsOpen(false);
        return;
      }
      navigateTo('repairs');
      setIsOpen(false);
      return;
    }

    if (notif.category === 'project_status' && notif.targetId) {
      const foundProject = projects.find((p) => p.id === notif.targetId);
      if (foundProject) {
        selectProject(foundProject);
        setIsOpen(false);
        return;
      }
      navigateTo('projects');
      setIsOpen(false);
    }
  };

  const handleToggleBrowserNotifications = async () => {
    const nextVal = !notificationPrefs.browserNotificationEnabled;
    if (nextVal) {
      const perm = await requestBrowserNotificationPermission();
      setBrowserPermStatus(perm);
    }
    updateNotificationPreferences({ browserNotificationEnabled: nextVal });
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell Trigger Button */}
      <button
        type="button"
        data-testid="notification_bell_button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="ລະບົບແຈ້ງເຕືອນວຽກສ້ອມແປງ ແລະ ໂຄງການ (Notifications)"
        className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
          unreadNotificationCount > 0
            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/70 hover:bg-amber-100'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
        }`}
      >
        {unreadNotificationCount > 0 ? (
          <BellRing className="w-5 h-5 animate-bounce" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadNotificationCount > 0 && (
          <span
            data-testid="notification_unread_badge"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm border border-white dark:border-slate-900"
          >
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          data-testid="notification_center_panel"
          className="fixed sm:absolute right-3 sm:right-0 top-14 sm:top-12 w-[calc(100vw-1.5rem)] sm:w-[410px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold leading-none">
                    ສູນແຈ້ງເຕືອນລະບົບ (Local Notifications)
                  </h3>
                  {unreadNotificationCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-md">
                      ໃໝ່ {unreadNotificationCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  ແຈ້ງເຕືອນວຽກສ້ອມແປງໃໝ່ & ການປ່ຽນສະຖານະໂຄງການ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  updateNotificationPreferences({
                    soundEnabled: !notificationPrefs.soundEnabled
                  })
                }
                title={
                  notificationPrefs.soundEnabled ? 'ປິດສຽງແຈ້ງເຕືອນ' : 'ເປີດສຽງແຈ້ງເຕືອນ'
                }
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
              >
                {notificationPrefs.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowSettings((prev) => !prev)}
                title="ຕັ້ງຄ່າການແຈ້ງເຕືອນ"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showSettings
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-white/10 text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Notification Preferences & Quick Simulator */}
          {showSettings && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>ຕັ້ງຄ່າການແຈ້ງເຕືອນ (Notification Preferences)</span>
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                  Browser: {browserPermStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.soundEnabled}
                    onChange={(e) =>
                      updateNotificationPreferences({ soundEnabled: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    ສຽງແຈ້ງເຕືອນ (Sound)
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.toastEnabled}
                    onChange={(e) =>
                      updateNotificationPreferences({ toastEnabled: e.target.checked })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    ປ໊ອບອັບເທິງຈໍ (Toast)
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.browserNotificationEnabled}
                    onChange={handleToggleBrowserNotifications}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MonitorCheck className="w-3 h-3 text-indigo-500" />
                    Desktop Alert
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.notifyAllTeamRepairs}
                    onChange={(e) =>
                      updateNotificationPreferences({
                        notifyAllTeamRepairs: e.target.checked
                      })
                    }
                    className="rounded text-indigo-600"
                  />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    ແຈ້ງເຕືອນທຸກຊ່າງໃນທີມ
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Quick Test Notification Bar */}
          <div className="px-3.5 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              ທົດສອບແຈ້ງເຕືອນ:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="test_repair_notif_btn"
                onClick={() => triggerTestNotification('repair_assigned')}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                + ມອບໝາຍວຽກສ້ອມແປງ
              </button>
              <button
                type="button"
                data-testid="test_project_notif_btn"
                onClick={() => triggerTestNotification('project_status')}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                + ປ່ຽນສະຖານະໂຄງການ
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'all' as const, label: `ທັງໝົດ (${notifications.length})` },
                {
                  id: 'mine' as const,
                  label: `ວຽກຂອງຂ້ອຍ (${notifications.filter((n) => n.isAssignedToMe).length})`
                },
                {
                  id: 'repairs' as const,
                  label: 'ສ້ອມແປງ'
                },
                {
                  id: 'projects' as const,
                  label: 'ໂຄງການ'
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    title="ໝາຍວ່າອ່ານທັງໝົດແລ້ວ"
                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  title="ລ້າງການແຈ້ງເຕືອນທັງໝົດ"
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Notification Items List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ບໍ່ມີລາຍການແຈ້ງເຕືອນໃນໝວດນີ້
                </p>
                <p className="text-[11px] text-slate-400">
                  ລະບົບຈະແຈ້ງເຕືອນອັດຕະໂນມັດເມື່ອມີການມອບໝາຍວຽກສ້ອມແປງໃໝ່ ຫຼື ໂຄງການປ່ຽນສະຖານະ
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isRepair =
                  notif.category === 'repair_assigned' || notif.category === 'repair_status';
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      !notif.read
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isRepair
                          ? notif.isAssignedToMe
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                          : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300'
                      }`}
                    >
                      {isRepair ? (
                        <Wrench className="w-4 h-4" />
                      ) : (
                        <FolderKanban className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {notif.title}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {notif.isAssignedToMe && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <UserCheck className="w-3 h-3" />
                            ມອບໝາຍໃຫ້ທ່ານ
                          </span>
                        )}

                        {notif.priority && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              notif.priority === 'High'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                                : notif.priority === 'Medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            }`}
                          >
                            Priority: {notif.priority}
                          </span>
                        )}

                        {notif.newStatus && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
                            {notif.previousStatus ? (
                              <>
                                <span>{notif.previousStatus}</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                                <span>{notif.newStatus}</span>
                              </>
                            ) : (
                              <span>{notif.newStatus}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
