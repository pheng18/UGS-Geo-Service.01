import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Wrench,
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  User,
  ArrowUpRight,
  X,
  Filter,
  ListFilter
} from 'lucide-react';
import { Repair, Project } from '../types';

export type CalendarEventType = 'service_appointment' | 'project_deadline';

export interface DashboardCalendarEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string; // YYYY-MM-DD
  time: string;
  type: CalendarEventType;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  assignee: string;
  locationOrClient: string;
  linkedRepairId?: string;
  linkedProjectId?: string;
  isCustom?: boolean;
}

interface ServiceProjectCalendarProps {
  repairs: Repair[];
  projects: Project[];
  onSelectRepair: (repair: Repair) => void;
  onSelectProject: (project: Project) => void;
  onNavigate: (view: string) => void;
  onAddCustomEvent?: (event: DashboardCalendarEvent) => void;
}

const LAO_MONTHS = [
  'ມັງກອນ',
  'ກຸມພາ',
  'ມີນາ',
  'ເມສາ',
  'ພຶດສະພາ',
  'ມິຖຸນາ',
  'ກໍລະກົດ',
  'ສິງຫາ',
  'ກັນຍາ',
  'ຕຸລາ',
  'ພະຈິກ',
  'ທັນວາ'
];

const LAO_WEEKDAYS = ['ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ'];

function formatDateKey(year: number, monthIdx: number, day: number): string {
  const mm = String(monthIdx + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function addDaysToDate(base: Date, offsetDays: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

export const ServiceProjectCalendar: React.FC<ServiceProjectCalendarProps> = ({
  repairs,
  projects,
  onSelectRepair,
  onSelectProject,
  onNavigate,
  onAddCustomEvent
}) => {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(
    () => formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
    [today]
  );

  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [filterType, setFilterType] = useState<'all' | CalendarEventType>('all');
  const [displayMode, setDisplayMode] = useState<'calendar' | 'upcoming'>('calendar');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Custom user-scheduled events persisted in localStorage
  const [customEvents, setCustomEvents] = useState<DashboardCalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('uniqtek_dashboard_calendar_events');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return [
      {
        id: 'cal-custom-hce600',
        title: 'ນັດໝາຍປ່ຽນຊຸດໜ້າຈໍສຳຜັດ Controller HCE600 (2 ເຄື່ອງ)',
        subtitle: 'S/N: 6307300655 & 6310300795 • ກວດເຊັກລະບົບສຳຜັດ ແລະ ປຸ່ມປິດເຄື່ອງ',
        date: addDaysToDate(new Date(), 1),
        time: '09:30 - 11:30',
        type: 'service_appointment',
        status: 'ນັດໝາຍບໍລິການ',
        priority: 'High',
        assignee: 'Mr Pheng BOUNMUECHANYA',
        locationOrClient: 'ບໍລິສັດ EPL ຈຳກັດ',
        isCustom: true
      },
      {
        id: 'cal-custom-cors',
        title: 'ກຳນົດບຳລຸງຮັກສາສະຖານີອ້າງອີງ CORS ພາກສະໜາມ (DOL1 & LPBP)',
        subtitle: 'ກວດສອບລະບົບໄຟສຳຮອງ UPS ແລະ ຄວາມໝັ້ນຄົງສັນຍານ NTRIP RTCM 3.2',
        date: addDaysToDate(new Date(), 4),
        time: '14:00 - 16:30',
        type: 'service_appointment',
        status: 'ຕາມແຜນບຳລຸງຮັກສາ',
        priority: 'Medium',
        assignee: 'ທ່ານ ອານຸສອນ ສີຫາວົງ',
        locationOrClient: 'ກົມທີ່ດິນ DOL • ນະຄອນຫຼວງວຽງຈັນ',
        isCustom: true
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('uniqtek_dashboard_calendar_events', JSON.stringify(customEvents));
    } catch {
      // ignore storage errors
    }
  }, [customEvents]);

  // New event form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newDate, setNewDate] = useState(todayKey);
  const [newTime, setNewTime] = useState('09:00 - 11:00');
  const [newType, setNewType] = useState<CalendarEventType>('service_appointment');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newAssignee, setNewAssignee] = useState('ສົມພອນ ເພັດດາລາ');
  const [newLocationOrClient, setNewLocationOrClient] = useState('');

  // Generate unified calendar events from repairs, projects, and custom schedule items
  const allEvents = useMemo<DashboardCalendarEvent[]>(() => {
    const derivedRepairs: DashboardCalendarEvent[] = repairs.map((rep, idx) => {
      // Map each repair to an upcoming appointment date relative to current month so the calendar is actionable
      const offsetDays = idx === 0 ? 0 : idx === 1 ? 2 : idx * 3 + 1;
      const scheduledDate = addDaysToDate(today, offsetDays);
      const nextStep =
        rep.timeline?.find((t) => !t.done)?.title ||
        (rep.status === 'ສຳເລັດແລ້ວ' ? 'ນັດໝາຍສົ່ງມອບອຸປະກອນຄືນລູກຄ້າ' : 'ນັດໝາຍກວດສອບຄ່າມາດຕະຖານ Calibration');

      return {
        id: `cal-rep-${rep.id}`,
        title: `${rep.model} — ${nextStep}`,
        subtitle: `${rep.id} (${rep.serialNo}) • ${rep.problem}`,
        date: scheduledDate,
        time: idx % 2 === 0 ? '09:00 - 11:30' : '13:30 - 16:00',
        type: 'service_appointment',
        status: rep.status,
        priority: rep.priority || 'Medium',
        assignee: rep.assignedTech || 'ສົມພອນ ເພັດດາລາ',
        locationOrClient: rep.client,
        linkedRepairId: rep.id
      };
    });

    const derivedProjects: DashboardCalendarEvent[] = projects.map((proj, idx) => {
      // Map each survey project to an upcoming deadline in the current/next week
      const offsetDays = idx === 0 ? 3 : idx === 1 ? 6 : idx === 2 ? -2 : 9 + idx * 2;
      const deadlineDate = addDaysToDate(today, offsetDays);

      return {
        id: `cal-prj-${proj.id}`,
        title: `ກຳນົດສົ່ງມອບ: ${proj.title}`,
        subtitle: `ຄວາມຄືບໜ້າໂຄງການ ${proj.progress}% • ສະຖານະ: ${proj.status}`,
        date: deadlineDate,
        time: '16:00 (Deadline)',
        type: 'project_deadline',
        status: proj.status,
        priority: proj.progress < 50 ? 'High' : proj.progress < 100 ? 'Medium' : 'Low',
        assignee: proj.team?.[0]?.name || 'ທີມວິສະວະກອນສຳຫຼວດ UniqTek',
        locationOrClient: `${proj.client} • ${proj.location}`,
        linkedProjectId: proj.id
      };
    });

    return [...customEvents, ...derivedRepairs, ...derivedProjects].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [repairs, projects, customEvents, today]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return allEvents;
    return allEvents.filter((ev) => ev.type === filterType);
  }, [allEvents, filterType]);

  // Group events by YYYY-MM-DD for quick calendar lookup
  const eventsByDate = useMemo(() => {
    const map: Record<string, DashboardCalendarEvent[]> = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.date]) {
        map[ev.date] = [];
      }
      map[ev.date].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Calendar grid generation for (viewYear, viewMonth)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Leading days from previous month
    const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateKey = formatDateKey(prevMonthYear, prevMonthIdx, d);
      cells.push({
        dateKey,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateKey === todayKey
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateKey(viewYear, viewMonth, d);
      cells.push({
        dateKey,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateKey === todayKey
      });
    }

    // Trailing days to complete 35 or 42 cells
    const totalCells = cells.length <= 35 ? 35 : 42;
    const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
    let nextDay = 1;
    while (cells.length < totalCells) {
      const dateKey = formatDateKey(nextMonthYear, nextMonthIdx, nextDay);
      cells.push({
        dateKey,
        dayNumber: nextDay,
        isCurrentMonth: false,
        isToday: dateKey === todayKey
      });
      nextDay++;
    }

    return cells;
  }, [viewYear, viewMonth, todayKey]);

  const selectedDayEvents = useMemo(() => {
    return eventsByDate[selectedDateKey] || [];
  }, [eventsByDate, selectedDateKey]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter((ev) => ev.date >= todayKey);
  }, [filteredEvents, todayKey]);

  const serviceCount = useMemo(
    () => allEvents.filter((e) => e.type === 'service_appointment' && e.date >= todayKey).length,
    [allEvents, todayKey]
  );

  const deadlineCount = useMemo(
    () => allEvents.filter((e) => e.type === 'project_deadline' && e.date >= todayKey).length,
    [allEvents, todayKey]
  );

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateKey(todayKey);
  };

  const handleEventClick = (ev: DashboardCalendarEvent) => {
    if (ev.linkedRepairId) {
      const foundRepair = repairs.find((r) => r.id === ev.linkedRepairId);
      if (foundRepair) {
        onSelectRepair(foundRepair);
        return;
      }
      onNavigate('repairs');
      return;
    }
    if (ev.linkedProjectId) {
      const foundProject = projects.find((p) => p.id === ev.linkedProjectId);
      if (foundProject) {
        onSelectProject(foundProject);
        return;
      }
      onNavigate('projects');
      return;
    }
  };

  const handleCreateCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const created: DashboardCalendarEvent = {
      id: `cal-custom-${Date.now()}`,
      title: newTitle.trim(),
      subtitle:
        newSubtitle.trim() ||
        (newType === 'service_appointment'
          ? 'ນັດໝາຍບໍລິການກວດເຊັກ ແລະ ສ້ອມແປງອຸປະກອນເຕັກນິກ'
          : 'ກຳນົດສົ່ງມອບຂໍ້ມູນໂຄງການສຳຫຼວດພາກສະໜາມ'),
      date: newDate,
      time: newTime.trim() || '09:00 - 11:00',
      type: newType,
      status: newType === 'service_appointment' ? 'ນັດໝາຍບໍລິການ' : 'ກຳນົດສົ່ງມອບ',
      priority: newPriority,
      assignee: newAssignee.trim() || 'ສົມພອນ ເພັດດາລາ',
      locationOrClient: newLocationOrClient.trim() || 'ສູນບໍລິການ UniqTek Co., Ltd',
      isCustom: true
    };

    setCustomEvents((prev) => [created, ...prev]);
    setSelectedDateKey(newDate);
    const [y, m] = newDate.split('-').map(Number);
    if (y && m) {
      setViewYear(y);
      setViewMonth(m - 1);
    }
    if (onAddCustomEvent) {
      onAddCustomEvent(created);
    }
    setNewTitle('');
    setNewSubtitle('');
    setNewLocationOrClient('');
    setShowAddModal(false);
  };

  const formatLaoReadableDate = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `ວັນທີ ${d} ${LAO_MONTHS[m - 1] || ''} ${y}`;
  };

  return (
    <section
      data-testid="dashboard_service_project_calendar"
      className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5"
    >
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/80">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                ປະຕິທິນນັດໝາຍບໍລິການສ້ອມແປງ & ກຳນົດສົ່ງມອບໂຄງການ (Service & Project Calendar)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {LAO_MONTHS[viewMonth]} {viewYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ຕິດຕາມຕາຕະລາງນັດໝາຍສ້ອມແປງອຸປະກອນ ({serviceCount} ນັດໝາຍ) ແລະ ກຳນົດເວລາສົ່ງມອບໂຄງການສຳຫຼວດ ({deadlineCount} ໂຄງການ)
            </p>
          </div>
        </div>

        {/* Controls: Filter Type, View Toggle, Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ທັງໝົດ ({allEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('service_appointment')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                filterType === 'service_appointment'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>ນັດໝາຍບໍລິການ</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('project_deadline')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                filterType === 'project_deadline'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>ກຳນົດໂຄງການ</span>
            </button>
          </div>

          {/* Display Mode Toggle (Calendar Grid vs Upcoming Timeline) */}
          <div className="inline-flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setDisplayMode('calendar')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                displayMode === 'calendar'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>ຕາຕະລາງເດືອນ</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('upcoming')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                displayMode === 'upcoming'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ListFilter className="w-3 h-3" />
              <span>ລາຍການທີ່ຈະມາເຖິງ</span>
            </button>
          </div>

          {/* Add New Schedule Button */}
          <button
            type="button"
            onClick={() => {
              setNewDate(selectedDateKey || todayKey);
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ເພີ່ມນັດໝາຍໃໝ່</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {displayMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Columns: Interactive Monthly Calendar Grid */}
          <div className="lg:col-span-7 space-y-3">
            {/* Month Navigation Header */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="ເດືອນກ່ອນໜ້າ"
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white min-w-[140px] text-center">
                  ເດືອນ{LAO_MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="ເດືອນຖັດໄປ"
                  className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mr-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>ບໍລິການສ້ອມແປງ</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>ກຳນົດສົ່ງໂຄງການ</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  ມື້ນີ້ (Today)
                </button>
              </div>
            </div>

            {/* Weekday Header Row */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {LAO_WEEKDAYS.map((dayName, i) => (
                <div
                  key={dayName}
                  className={`py-1.5 text-[11px] font-bold rounded-lg ${
                    i === 0
                      ? 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/40'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell) => {
                const dayEvents = eventsByDate[cell.dateKey] || [];
                const isSelected = cell.dateKey === selectedDateKey;
                const hasService = dayEvents.some((e) => e.type === 'service_appointment');
                const hasDeadline = dayEvents.some((e) => e.type === 'project_deadline');

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                    className={`min-h-[68px] sm:min-h-[82px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/20 shadow-2xs'
                        : cell.isToday
                        ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20'
                        : cell.isCurrentMonth
                        ? 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 hover:border-blue-300'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold w-6 h-6 rounded-lg flex items-center justify-center ${
                          cell.isToday
                            ? 'bg-amber-500 text-slate-950 font-extrabold'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event preview badges inside cell */}
                    <div className="space-y-1 w-full mt-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold truncate ${
                            ev.type === 'service_appointment'
                              ? 'bg-blue-100/90 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                              : 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                          }`}
                        >
                          {ev.type === 'service_appointment' ? '🔧 ' : '📍 '}
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] font-bold text-slate-400 pl-1">
                          +{dayEvents.length - 2} ລາຍການ
                        </div>
                      )}
                    </div>

                    {/* Bottom dot indicators */}
                    {(hasService || hasDeadline) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {hasService && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                        {hasDeadline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 5 Columns: Selected Date Details + Upcoming Queue */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-4">
            <div className="space-y-3">
              {/* Selected Day Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    ລາຍລະອຽດວັນທີ່ເລືອກ
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {formatLaoReadableDate(selectedDateKey)}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  {selectedDayEvents.length} ນັດໝາຍ
                </span>
              </div>

              {/* Events on Selected Day */}
              {selectedDayEvents.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ບໍ່ມີນັດໝາຍບໍລິການ ຫຼື ກຳນົດສົ່ງມອບໂຄງການໃນວັນທີນີ້
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDate(selectedDateKey);
                      setShowAddModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ເພີ່ມນັດໝາຍໃສ່ວັນທີນີ້</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => handleEventClick(ev)}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all cursor-pointer space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ev.type === 'service_appointment'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {ev.type === 'service_appointment' ? (
                            <>
                              <Wrench className="w-3 h-3" />
                              <span>ນັດໝາຍບໍລິການສ້ອມແປງ</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3 h-3" />
                              <span>ກຳນົດສົ່ງມອບໂຄງການ</span>
                            </>
                          )}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.priority === 'High'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : ev.priority === 'Medium'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {ev.priority === 'High'
                            ? 'ດ່ວນ (High)'
                            : ev.priority === 'Medium'
                            ? 'ປານກາງ'
                            : 'ປົກກະຕິ'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {ev.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {ev.subtitle}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-blue-500" />
                          {ev.time}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <User className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{ev.assignee}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming Appointments & Project Deadlines List */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>ນັດໝາຍ ແລະ ກຳນົດສົ່ງມອບທີ່ໃກ້ຈະມາເຖິງ</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {upcomingEvents.length} ລາຍການ
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[195px] overflow-y-auto pr-1">
                  {upcomingEvents.slice(0, 4).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSelectedDateKey(ev.date);
                        handleEventClick(ev);
                      }}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 hover:border-blue-400 flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            ev.type === 'service_appointment'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {ev.type === 'service_appointment' ? (
                            <Wrench className="w-4 h-4" />
                          ) : (
                            <MapPin className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {ev.title}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {ev.locationOrClient} • ຜູ້ຮັບຜິດຊອບ: {ev.assignee}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 block">
                          {ev.date}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">{ev.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Navigation Footer */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onNavigate('repairs')}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>ເບິ່ງຄິວສ້ອມແປງທັງໝົດ</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('projects')}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>ເບິ່ງໂຄງການສຳຫຼວດທັງໝົດ</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Upcoming Schedule Timeline View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              onClick={() => handleEventClick(ev)}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      ev.type === 'service_appointment'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {ev.type === 'service_appointment' ? (
                      <>
                        <Wrench className="w-3.5 h-3.5" />
                        <span>ນັດໝາຍບໍລິການສ້ອມແປງ</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>ກຳນົດສົ່ງມອບໂຄງການ</span>
                      </>
                    )}
                  </span>

                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    📅 {ev.date} • {ev.time}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{ev.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ev.subtitle}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>ລູກຄ້າ/ສະຖານທີ່: {ev.locationOrClient}</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {ev.assignee}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Adding a New Service Appointment or Project Deadline */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span>ເພີ່ມນັດໝາຍບໍລິການ ຫຼື ກຳນົດສົ່ງມອບໂຄງການ</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ປະເພດລາຍການ *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('service_appointment')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      newType === 'service_appointment'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>ນັດໝາຍບໍລິການສ້ອມແປງ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('project_deadline')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      newType === 'project_deadline'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>ກຳນົດສົ່ງມອບໂຄງການ</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ຫົວຂໍ້ນັດໝາຍ / ຊື່ໂຄງການ *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ເຊັ່ນ: ນັດໝາຍປັບຕັ້ງຄ່າມາດຕະຖານ CHCNAV i93 RTK"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ວັນທີນັດໝາຍ *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ເວລາ
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="09:00 - 11:30"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ລູກຄ້າ / ສະຖານທີ່
                  </label>
                  <input
                    type="text"
                    value={newLocationOrClient}
                    onChange={(e) => setNewLocationOrClient(e.target.value)}
                    placeholder="ເຊັ່ນ: ບໍລິສັດ EPL ຈຳກັດ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ຊ່າງເຕັກນິກ / ຜູ້ຮັບຜິດຊອບ
                  </label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['High', 'Medium', 'Low'] as const).map((prio) => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => setNewPriority(prio)}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold cursor-pointer ${
                      newPriority === prio
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    ລະດັບຄວາມສຳຄັນ: {prio}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ລາຍລະອຽດເຕັກນິກເພີ່ມເຕີມ
                </label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="ເຊັ່ນ: ກວດສອບຄ່າມາດຕະຖານ ISO ແລະ ອັບເດດ Firmware"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold shadow-xs cursor-pointer"
                >
                  ບັນທຶກລົງປະຕິທິນ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
