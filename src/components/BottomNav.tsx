import React, { useState, useEffect } from 'react';
import {
  Home,
  Wrench,
  MapPin,
  Radio,
  Info,
  ShoppingCart,
  GraduationCap,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Tablet,
  Smartphone,
  X,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

type DeviceMode = 'mobile' | 'tablet' | 'pc';

const SIDEBAR_STORAGE_KEY = 'uniqtek_independent_sidebar_expanded';

export const BottomNav: React.FC = () => {
  const { currentView, navigateTo, selectRepair, selectProject, selectQuotation, isSuperAdmin } =
    useApp();

  // Track device indicator without forcing or overriding the sidebar's independent state
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    if (typeof window === 'undefined') return 'pc';
    if (window.innerWidth < 640) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'pc';
  });

  // Independent expand/collapse state persisted in localStorage
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    return window.innerWidth >= 1024;
  });

  // Independent mobile overlay drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setDeviceMode('mobile');
      } else if (w < 1024) {
        setDeviceMode('tablet');
        setMobileDrawerOpen(false);
      } else {
        setDeviceMode('pc');
        setMobileDrawerOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleIndependentExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    const handleToggleSidebar = () => {
      if (window.innerWidth < 640) {
        setMobileDrawerOpen((prev) => !prev);
      } else {
        toggleIndependentExpanded();
      }
    };

    window.addEventListener('toggle-left-sidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggle-left-sidebar', handleToggleSidebar);
  }, []);

  const navItems = [
    {
      id: 'dashboard',
      matchIds: ['dashboard'],
      label: 'ໜ້າຫຼັກ',
      shortLabel: 'ໜ້າຫຼັກ',
      sublabel: 'Dashboard',
      icon: Home,
      indicatorColor: 'bg-blue-600 border-blue-300',
      testId: 'nav_dashboard'
    },
    {
      id: 'repairs',
      matchIds: ['repairs', 'repair_details'],
      label: 'ສ້ອມແປງ',
      shortLabel: 'ສ້ອມແປງ',
      sublabel: 'Service & Repairs',
      icon: Wrench,
      indicatorColor: 'bg-blue-600 border-blue-300',
      testId: 'nav_repairs'
    },
    {
      id: 'projects',
      matchIds: ['projects', 'project_details'],
      label: 'ສຳຫຼວດ',
      shortLabel: 'ສຳຫຼວດ',
      sublabel: 'Survey Projects',
      icon: MapPin,
      indicatorColor: 'bg-emerald-600 border-emerald-300',
      testId: 'nav_projects'
    },
    {
      id: 'cors',
      matchIds: ['cors'],
      label: 'ສະຖານີ CORS',
      shortLabel: 'CORS',
      sublabel: 'Lao CORS Network',
      icon: Radio,
      indicatorColor: 'bg-amber-600 border-amber-300',
      testId: 'nav_cors'
    },
    {
      id: 'equipment',
      matchIds: ['equipment'],
      label: 'ອຸປະກອນ',
      shortLabel: 'ອຸປະກອນ',
      sublabel: 'Equipment & QR',
      icon: Info,
      indicatorColor: 'bg-sky-600 border-sky-300',
      testId: 'nav_equipment'
    },
    {
      id: 'quotations',
      matchIds: ['quotations', 'quotation_details'],
      label: 'ໃບສະເໜີລາຄາ',
      shortLabel: 'ໃບສະເໜີ',
      sublabel: 'Quotations',
      icon: ShoppingCart,
      indicatorColor: 'bg-pink-600 border-pink-300',
      testId: 'nav_quotations'
    },
    {
      id: 'training',
      matchIds: ['training'],
      label: 'ຝຶກອົບຮົມ RTK',
      shortLabel: 'ຝຶກ RTK',
      sublabel: 'CHCNAV & LandStar 8',
      icon: GraduationCap,
      indicatorColor: 'bg-indigo-600 border-indigo-300',
      testId: 'nav_training'
    },
    {
      id: 'profile',
      matchIds: ['profile'],
      label: 'ຜູ້ໃຊ້ & ໂປຣໄຟລ໌',
      shortLabel: 'ໂປຣໄຟລ໌',
      sublabel: 'Users & Security',
      icon: UserCheck,
      indicatorColor: 'bg-teal-600 border-teal-300',
      testId: 'nav_profile'
    },
    // SuperAdmin-only back office (data access is also enforced by firestore.rules)
    ...(isSuperAdmin
      ? [
          {
            id: 'backoffice',
            matchIds: ['backoffice'],
            label: 'Back Office',
            shortLabel: 'Back Office',
            sublabel: 'ຜູ້ດູແລລະບົບ (SuperAdmin)',
            icon: ShieldCheck,
            indicatorColor: 'bg-[#E21B23] border-red-300',
            testId: 'nav_backoffice'
          }
        ]
      : [])
  ];

  const handleSelectNav = (id: string) => {
    if (id === 'repairs') selectRepair(null);
    if (id === 'projects') selectProject(null);
    if (id === 'quotations') selectQuotation(null);
    navigateTo(id);
    if (deviceMode === 'mobile') {
      setMobileDrawerOpen(false);
    }
  };

  const handleToggleButton = () => {
    if (deviceMode === 'mobile') {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      toggleIndependentExpanded();
    }
  };

  // Independent floating sidebar sizing
  const sidebarWidthClass =
    deviceMode === 'mobile'
      ? 'w-[62px] px-1.5 py-2.5'
      : isExpanded
      ? 'w-56 lg:w-64 px-2.5 lg:px-3.5 py-3.5'
      : 'w-[76px] sm:w-20 px-2 py-3';

  const DeviceIcon =
    deviceMode === 'pc' ? Monitor : deviceMode === 'tablet' ? Tablet : Smartphone;

  const deviceLabel =
    deviceMode === 'pc' ? 'PC' : deviceMode === 'tablet' ? 'Tablet' : 'Mobile';

  return (
    <>
      {/* Independent Floating Left Sidebar Dock */}
      <aside
        data-testid="left_sidebar_nav"
        className={`sticky top-16 sm:top-[4.5rem] m-1.5 sm:m-3 h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-5.5rem)] shrink-0 bg-[#1E3A8A] text-white rounded-2xl shadow-2xl border border-blue-700/70 ring-1 ring-white/10 flex flex-col justify-between transition-all duration-200 z-30 select-none overflow-hidden ${sidebarWidthClass}`}
      >
        <div className="flex-1 min-h-0 space-y-1 sm:space-y-1.5 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-none">
          {/* Independent Sidebar Control Header */}
          <div
            className={`pb-2 mb-1.5 border-b border-blue-800/80 flex items-center ${
              isExpanded && deviceMode !== 'mobile'
                ? 'justify-between px-1.5'
                : 'flex-col gap-1 justify-center'
            }`}
          >
            {isExpanded && deviceMode !== 'mobile' ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <DeviceIcon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100 truncate">
                  ເມນູຫຼັກ ({deviceLabel})
                </span>
              </div>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-200/85 flex items-center gap-0.5">
                <DeviceIcon className="w-3 h-3 text-emerald-300" />
                <span>{deviceLabel}</span>
              </span>
            )}

            <button
              type="button"
              data-testid="sidebar_collapse_toggle"
              onClick={handleToggleButton}
              title={
                deviceMode === 'mobile'
                  ? 'ເປີດເມນູຂະຫຍາຍ (Open Full Menu)'
                  : isExpanded
                  ? 'ຫຍໍ້ແຖບເມນູຊ້າຍ (Collapse)'
                  : 'ຂະຫຍາຍແຖບເມນູຊ້າຍ (Expand)'
              }
              className="p-1.5 rounded-lg bg-blue-900/70 hover:bg-blue-800 text-blue-200 hover:text-white transition-colors cursor-pointer"
            >
              {(deviceMode === 'mobile' && mobileDrawerOpen) ||
              (deviceMode !== 'mobile' && isExpanded) ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items */}
          {navItems.map((item) => {
            const isSelected = item.matchIds.includes(currentView);
            const IconComponent = item.icon;
            const showFullHorizontal = isExpanded && deviceMode !== 'mobile';

            return (
              <button
                key={item.id}
                data-testid={item.testId}
                onClick={() => handleSelectNav(item.id)}
                title={`${item.label} (${item.sublabel})`}
                className={`w-full rounded-xl transition-all cursor-pointer group focus:outline-hidden ${
                  showFullHorizontal
                    ? 'flex items-center gap-3 justify-start py-2.5 px-3'
                    : 'flex flex-col items-center justify-center gap-1 py-2 px-1'
                } ${
                  isSelected
                    ? `${item.indicatorColor} text-white shadow-md ${
                        showFullHorizontal ? 'border-l-4' : 'ring-1 ring-white/40'
                      }`
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                <div
                  className={`flex items-center justify-center rounded-lg shrink-0 transition-transform group-hover:scale-105 ${
                    showFullHorizontal ? 'w-8 h-8' : 'w-7 h-7 sm:w-8 sm:h-8'
                  } ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-950/50 text-blue-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>

                {showFullHorizontal ? (
                  <div className="flex flex-col items-start min-w-0 text-left">
                    <span
                      className={`text-xs tracking-tight truncate ${
                        isSelected ? 'font-extrabold text-white' : 'font-semibold text-white/90'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="text-[10px] text-blue-200/75 truncate">
                      {item.sublabel}
                    </span>
                  </div>
                ) : (
                  <span
                    className={`text-[9.5px] sm:text-[10px] leading-tight text-center truncate w-full px-0.5 ${
                      isSelected ? 'font-extrabold text-white' : 'font-medium text-blue-100/90'
                    }`}
                  >
                    {item.shortLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Independent Footer Status Card */}
        {isExpanded && deviceMode !== 'mobile' && (
          <div className="pt-2.5 border-t border-blue-800/80 px-1 shrink-0">
            <div className="bg-blue-950/60 rounded-xl p-2.5 border border-blue-800/60 text-[10px] text-blue-200 space-y-0.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">UNIQTEK SERVICES</span>
              </div>
              <p className="text-blue-300/80 font-mono truncate">CHCNAV • LandStar 8</p>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Slide-Out Independent Floating Drawer */}
      {deviceMode === 'mobile' && mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden p-2">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-64 max-w-[82vw] bg-[#1E3A8A] text-white h-full rounded-2xl shadow-2xl border border-blue-700/80 flex flex-col justify-between p-3.5 z-10">
            <div className="space-y-1.5 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-blue-800">
                <div>
                  <div className="text-xs font-extrabold tracking-wide text-white">
                    UNIQTEK SERVICES
                  </div>
                  <div className="text-[10px] text-blue-200">
                    ເມນູນຳທາງສຳລັບມືຖື (Mobile Menu)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-blue-900/80 text-blue-200 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {navItems.map((item) => {
                const isSelected = item.matchIds.includes(currentView);
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all text-left ${
                      isSelected
                        ? `${item.indicatorColor} text-white shadow-md border-l-4`
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-950/50 text-blue-200'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{item.label}</div>
                      <div className="text-[10px] text-blue-200/80 truncate">{item.sublabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-blue-800/80">
              <div className="bg-blue-950/60 rounded-xl p-2.5 border border-blue-800/60 text-[10px] text-blue-200">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>CHCNAV • LandStar 8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
