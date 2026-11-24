import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  ScrollText,
  Database,
  Clock,
  UserCheck,
  Lock,
  Wrench,
  MapPin,
  Radio,
  ShoppingCart,
  Download,
  RefreshCw,
  Search,
  Loader2,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { collection, getCountFromServer, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import { AccessManagementPanel } from '../components/AccessManagementPanel';
import { UserLog } from '../types';

type Tab = 'overview' | 'users' | 'audit' | 'data';

/** Firestore collections the back office can count and export. */
const COLLECTIONS: { id: string; label: string }[] = [
  { id: 'users', label: 'ຜູ້ໃຊ້ (users)' },
  { id: 'repairs', label: 'ວຽກສ້ອມແປງ (repairs)' },
  { id: 'projects', label: 'ໂຄງການສຳຫຼວດ (projects)' },
  { id: 'quotations', label: 'ໃບສະເໜີລາຄາ (quotations)' },
  { id: 'cors_stations', label: 'ສະຖານີ CORS (cors_stations)' },
  { id: 'equipment', label: 'ອຸປະກອນ (equipment)' },
  { id: 'employees', label: 'ພະນັກງານ/ຊ່າງ (employees)' },
  { id: 'internal_notes', label: 'ບັນທຶກພາຍໃນ (internal_notes)' },
  { id: 'activity_logs', label: 'ບັນທຶກກິດຈະກຳ (activity_logs)' }
];

const LOG_TYPES: { id: UserLog['type'] | 'all'; label: string }[] = [
  { id: 'all', label: 'ທຸກປະເພດ' },
  { id: 'auth', label: 'ເຂົ້າລະບົບ/ສິດ' },
  { id: 'repair', label: 'ສ້ອມແປງ' },
  { id: 'project', label: 'ໂຄງການ' },
  { id: 'cors', label: 'CORS' },
  { id: 'quote', label: 'ໃບສະເໜີລາຄາ' },
  { id: 'profile', label: 'ໂປຣໄຟລ໌/ຜູ້ໃຊ້' },
  { id: 'system', label: 'ລະບົບ' }
];

// ---------- export helpers ----------
const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCsv(rows: Record<string, unknown>[]): string {
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const cell = (v: unknown) => {
    if (v === undefined || v === null) return '""';
    let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    // Spreadsheet formula injection: user-entered text such as names or notes
    // starting with = + - @ (or tab/CR) would run as a formula in Excel.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))];
  // BOM so Excel reads Lao text as UTF-8
  return '﻿' + lines.join('\r\n');
}

async function readCollection(id: string): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(collection(db, id));
  return snap.docs.map((d) => {
    const data = { ...d.data(), _id: d.id } as Record<string, unknown>;
    delete data.password; // never export legacy password fields
    delete data.passwordUpdatedAt;
    return data;
  });
}

const logTime = (l: UserLog) => {
  if (typeof l.createdAtMs === 'number') return l.createdAtMs;
  const m = /^log-(\d{10,})/.exec(l.id);
  return m ? Number(m[1]) : 0;
};

const fmtTime = (ms: number, fallback: string) =>
  ms ? new Date(ms).toLocaleString('en-GB') : fallback;

// ---------- small UI pieces ----------
const Card: React.FC<{ title: string; value: React.ReactNode; sub?: string; tone?: string; icon: React.ElementType; onClick?: () => void }> = ({
  title,
  value,
  sub,
  tone = 'text-slate-900 dark:text-white',
  icon: Icon,
  onClick
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className="text-left bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs enabled:hover:border-blue-400 enabled:cursor-pointer transition-colors"
  >
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{title}</span>
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    <div className={`mt-1 text-2xl font-extrabold font-mono ${tone}`}>{value}</div>
    {sub && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</div>}
  </button>
);

export const BackOfficeView: React.FC = () => {
  const {
    isSuperAdmin,
    users,
    repairs,
    projects,
    stations,
    quotations,
    quotationReport,
    navigateTo,
    logUserOperation
  } = useApp();
  const [tab, setTab] = useState<Tab>('overview');

  // ---- full audit log (admins only by firestore.rules) ----
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');
  useEffect(() => {
    if (!isSuperAdmin) return;
    const unsub = onSnapshot(
      collection(db, 'activity_logs'),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as UserLog), id: d.id }));
        list.sort((a, b) => logTime(b) - logTime(a));
        setLogs(list);
        setLogsLoading(false);
      },
      (err) => {
        setLogsError(err.message);
        setLogsLoading(false);
      }
    );
    return unsub;
  }, [isSuperAdmin]);

  // ---- audit filters ----
  const [q, setQ] = useState('');
  const [logType, setLogType] = useState<UserLog['type'] | 'all'>('all');
  const [logUser, setLogUser] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [logLimit, setLogLimit] = useState(100);

  const logUsers = useMemo(
    () => Array.from(new Set(logs.map((l) => l.userEmail).filter(Boolean) as string[])).sort(),
    [logs]
  );
  const filteredLogs = useMemo(() => {
    const term = q.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : 0;
    const to = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Infinity;
    return logs.filter((l) => {
      if (logType !== 'all' && l.type !== logType) return false;
      if (logUser !== 'all' && l.userEmail !== logUser) return false;
      const t = logTime(l);
      if ((fromDate || toDate) && (t < from || t > to)) return false;
      if (!term) return true;
      return `${l.action} ${l.details} ${l.userEmail || ''}`.toLowerCase().includes(term);
    });
  }, [logs, q, logType, logUser, fromDate, toDate]);

  // ---- collection counts ----
  const [counts, setCounts] = useState<Record<string, number | 'error'>>({});
  const [countsLoading, setCountsLoading] = useState(false);
  const [countsAt, setCountsAt] = useState('');
  const loadCounts = async () => {
    setCountsLoading(true);
    const entries = await Promise.all(
      COLLECTIONS.map(async (c) => {
        try {
          const snap = await getCountFromServer(collection(db, c.id));
          return [c.id, snap.data().count] as const;
        } catch {
          return [c.id, 'error' as const] as const;
        }
      })
    );
    setCounts(Object.fromEntries(entries));
    setCountsAt(new Date().toLocaleTimeString('en-GB'));
    setCountsLoading(false);
  };
  useEffect(() => {
    if (isSuperAdmin && tab === 'data' && !countsAt) loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, tab]);

  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState('');
  const exportCollection = async (id: string, format: 'json' | 'csv') => {
    setExporting(`${id}:${format}`);
    setExportError('');
    try {
      const rows = await readCollection(id);
      if (format === 'json') {
        downloadFile(`uniqtek-${id}-${stamp()}.json`, JSON.stringify(rows, null, 2), 'application/json');
      } else {
        downloadFile(`uniqtek-${id}-${stamp()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
      }
      logUserOperation('ດາວໂຫຼດສຳຮອງຂໍ້ມູນ', `${id} (${format.toUpperCase()}, ${rows.length} ລາຍການ)`, 'system');
    } catch (err) {
      setExportError(`ດາວໂຫຼດ ${id} ບໍ່ສຳເລັດ: ${(err as Error).message}`);
    } finally {
      setExporting(null);
    }
  };
  const exportAll = async () => {
    setExporting('all');
    setExportError('');
    try {
      const backup: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        project: 'balmy-blueprint-kn50x'
      };
      for (const c of COLLECTIONS) backup[c.id] = await readCollection(c.id);
      downloadFile(`uniqtek-full-backup-${stamp()}.json`, JSON.stringify(backup, null, 2), 'application/json');
      logUserOperation('ດາວໂຫຼດສຳຮອງຂໍ້ມູນທັງໝົດ', `${COLLECTIONS.length} collections`, 'system');
    } catch (err) {
      setExportError(`ສຳຮອງທັງໝົດບໍ່ສຳເລັດ: ${(err as Error).message}`);
    } finally {
      setExporting(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-red-200 text-center space-y-2">
        <Lock className="w-8 h-8 text-red-500 mx-auto" />
        <h1 className="font-bold text-slate-900 dark:text-white">ສະເພາະຜູ້ດູແລລະບົບ (SuperAdmin)</h1>
        <p className="text-sm text-slate-500">ທ່ານບໍ່ມີສິດເຂົ້າໃຊ້ Back Office.</p>
      </div>
    );
  }

  // ---- overview numbers ----
  const pending = users.filter((u) => u.approvalStatus === 'pending');
  const approved = users.filter((u) => u.approvalStatus === 'approved' && u.accountEnabled !== false);
  const disabled = users.filter((u) => u.accountEnabled === false);
  const levelCounts = ['SuperAdmin', 'Admin', 'Manager', 'Engineer', 'Technician'].map((lvl) => ({
    lvl,
    n: approved.filter((u) => u.accessLevel === lvl).length
  }));
  const activeRepairs = repairs.filter((r) => r.status !== 'ສຳເລັດແລ້ວ').length;
  const activeProjects = projects.filter((p) => p.status !== 'ສຳເລັດແລ້ວ').length;
  const onlineStations = stations.filter((s) => s.status === 'Online').length;
  const last24h = logs.filter((l) => logTime(l) > Date.now() - 24 * 3600 * 1000).length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'ພາບລວມ', icon: LayoutDashboard },
    { id: 'users', label: 'ຜູ້ໃຊ້ & ສິດ', icon: Users, badge: pending.length },
    { id: 'audit', label: 'ບັນທຶກກິດຈະກຳ', icon: ScrollText },
    { id: 'data', label: 'ຂໍ້ມູນ & ສຳຮອງ', icon: Database }
  ];

  return (
    <div className="space-y-4 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] p-5 sm:p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E21B23] flex items-center justify-center shadow-md shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold">Back Office</h1>
            <p className="text-xs text-blue-200">
              ສູນຄວບຄຸມສຳລັບຜູ້ດູແລລະບົບ • ຜູ້ໃຊ້, ສິດ, ບັນທຶກກິດຈະກຳ ແລະ ສຳຮອງຂໍ້ມູນ
            </p>
          </div>
        </div>
        {pending.length > 0 && (
          <button
            type="button"
            onClick={() => setTab('users')}
            className="mt-4 w-full sm:w-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 text-amber-950 text-xs font-bold cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>ມີຄຳຂໍສິດເຂົ້າໃຊ້ລໍຖ້າອະນຸມັດ {pending.length} ລາຍການ</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            data-testid={`backoffice_tab_${t.id}`}
            onClick={() => setTab(t.id)}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === t.id ? 'bg-[#E21B23] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <t.icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.label}</span>
            {!!t.badge && (
              <span className="px-1.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ---------------- Overview ---------------- */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card title="ລໍຖ້າອະນຸມັດ" value={pending.length} sub="ຄຳຂໍສິດເຂົ້າໃຊ້" tone={pending.length ? 'text-amber-600' : undefined} icon={Clock} onClick={() => setTab('users')} />
            <Card title="ຜູ້ໃຊ້ທີ່ໃຊ້ງານໄດ້" value={approved.length} sub={`ລະງັບ ${disabled.length} • ທັງໝົດ ${users.length}`} tone="text-emerald-600" icon={UserCheck} onClick={() => setTab('users')} />
            <Card title="ກິດຈະກຳ 24 ຊມ" value={logsLoading ? '…' : last24h} sub={`ທັງໝົດ ${logs.length} ລາຍການ`} icon={ScrollText} onClick={() => setTab('audit')} />
            <Card title="ໃບສະເໜີລາຄາ" value={quotations.length} sub={`${quotationReport.grandTotalPrice.toLocaleString()} ${quotationReport.currency}`} icon={ShoppingCart} onClick={() => navigateTo('quotations')} />
            <Card title="ວຽກສ້ອມແປງທີ່ຍັງເປີດ" value={activeRepairs} sub={`ທັງໝົດ ${repairs.length}`} tone="text-blue-600" icon={Wrench} onClick={() => navigateTo('repairs')} />
            <Card title="ໂຄງການທີ່ກຳລັງດຳເນີນ" value={activeProjects} sub={`ທັງໝົດ ${projects.length}`} icon={MapPin} onClick={() => navigateTo('projects')} />
            <Card title="ສະຖານີ CORS Online" value={`${onlineStations}/${stations.length}`} icon={Radio} onClick={() => navigateTo('cors')} />
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">ຜູ້ໃຊ້ຕາມລະດັບສິດ</span>
              <div className="mt-1.5 space-y-0.5 text-[11px]">
                {levelCounts.map(({ lvl, n }) => (
                  <div key={lvl} className="flex justify-between text-slate-700 dark:text-slate-200">
                    <span>{lvl}</span>
                    <span className="font-mono font-bold">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">ກິດຈະກຳລ່າສຸດ</h2>
              <button type="button" onClick={() => setTab('audit')} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                ເບິ່ງທັງໝົດ
              </button>
            </div>
            {logs.slice(0, 8).map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-3 text-xs py-1.5 border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{l.action}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {l.userEmail ? `${l.userEmail} • ` : ''}{l.details}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">{fmtTime(logTime(l), l.timestamp)}</span>
              </div>
            ))}
            {!logsLoading && logs.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">ຍັງບໍ່ມີບັນທຶກ</p>}
          </section>
        </div>
      )}

      {/* ---------------- Users & roles ---------------- */}
      {tab === 'users' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                const rows = users.map((u) => ({
                  name: u.name,
                  email: u.email,
                  accessLevel: u.accessLevel,
                  approvalStatus: u.approvalStatus,
                  accountEnabled: u.accountEnabled !== false,
                  role: u.role,
                  department: u.department,
                  phone: u.phone,
                  requestedAt: u.requestedAt || '',
                  reviewedBy: u.reviewedBy || '',
                  reviewedAt: u.reviewedAt || ''
                }));
                downloadFile(`uniqtek-users-${stamp()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>ດາວໂຫຼດລາຍຊື່ຜູ້ໃຊ້ (CSV)</span>
            </button>
          </div>
          <AccessManagementPanel />
        </div>
      )}

      {/* ---------------- Audit log ---------------- */}
      {tab === 'audit' && (
        <section className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-blue-600" />
              <span>ບັນທຶກກິດຈະກຳ ({filteredLogs.length}/{logs.length})</span>
            </h2>
            <button
              type="button"
              disabled={!filteredLogs.length}
              onClick={() =>
                downloadFile(
                  `uniqtek-audit-log-${stamp()}.csv`,
                  toCsv(
                    filteredLogs.map((l) => ({
                      time: fmtTime(logTime(l), l.timestamp),
                      user: l.userEmail || '',
                      type: l.type,
                      action: l.action,
                      details: l.details
                    }))
                  ),
                  'text/csv;charset=utf-8'
                )
              }
              className="px-3 py-2 rounded-xl bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ດາວໂຫຼດ CSV (ຕາມຕົວກອງ)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ຄົ້ນຫາ ການກະທຳ, ລາຍລະອຽດ, ອີເມວ..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              />
            </div>
            <select value={logType} onChange={(e) => setLogType(e.target.value as UserLog['type'] | 'all')} className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
              {LOG_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <select value={logUser} onChange={(e) => setLogUser(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
              <option value="all">ທຸກຜູ້ໃຊ້</option>
              {logUsers.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="ຈາກວັນທີ" className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} title="ຫາວັນທີ" className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>

          {logsError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 text-red-600 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>ໂຫຼດບັນທຶກບໍ່ສຳເລັດ: {logsError}</span>
            </div>
          )}

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 px-1 font-semibold">ເວລາ</th>
                  <th className="py-2 px-1 font-semibold">ຜູ້ໃຊ້</th>
                  <th className="py-2 px-1 font-semibold">ປະເພດ</th>
                  <th className="py-2 px-1 font-semibold">ການກະທຳ / ລາຍລະອຽດ</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin inline" /> ກຳລັງໂຫຼດ...
                    </td>
                  </tr>
                )}
                {filteredLogs.slice(0, logLimit).map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 dark:border-slate-700/60 align-top">
                    <td className="py-2 px-1 font-mono text-[10.5px] text-slate-500 whitespace-nowrap">{fmtTime(logTime(l), l.timestamp)}</td>
                    <td className="py-2 px-1 font-mono text-[11px] text-slate-700 dark:text-slate-200 max-w-[180px] truncate">{l.userEmail || '-'}</td>
                    <td className="py-2 px-1">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">{l.type}</span>
                    </td>
                    <td className="py-2 px-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{l.action}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 break-words">{l.details}</div>
                    </td>
                  </tr>
                ))}
                {!logsLoading && filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">ບໍ່ພົບບັນທຶກຕາມຕົວກອງ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredLogs.length > logLimit && (
            <button type="button" onClick={() => setLogLimit((n) => n + 200)} className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50">
              ສະແດງເພີ່ມ ({filteredLogs.length - logLimit} ລາຍການ)
            </button>
          )}
        </section>
      )}

      {/* ---------------- Data & backup ---------------- */}
      {tab === 'data' && (
        <section className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>ຂໍ້ມູນໃນ Firestore & ສຳຮອງ</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ຈຳນວນເອກະສານແຕ່ລະ collection{countsAt ? ` • ອັບເດດເມື່ອ ${countsAt}` : ''}. ໄຟລ໌ສຳຮອງບໍ່ລວມລະຫັດຜ່ານ.
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={loadCounts} disabled={countsLoading} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 disabled:opacity-60">
                <RefreshCw className={`w-3.5 h-3.5 ${countsLoading ? 'animate-spin' : ''}`} />
                <span>ນັບໃໝ່</span>
              </button>
              <button type="button" onClick={exportAll} disabled={!!exporting} className="px-3 py-2 rounded-xl bg-[#E21B23] hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                {exporting === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>ສຳຮອງທັງໝົດ (JSON)</span>
              </button>
            </div>
          </div>

          {exportError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 text-red-600 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {COLLECTIONS.map((c) => {
              const n = counts[c.id];
              return (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.label}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {countsLoading && n === undefined ? '…' : n === 'error' ? 'ອ່ານບໍ່ໄດ້' : n === undefined ? '-' : `${n} ເອກະສານ`}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button type="button" disabled={!!exporting} onClick={() => exportCollection(c.id, 'json')} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer hover:bg-slate-50 disabled:opacity-60">
                      {exporting === `${c.id}:json` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileJson className="w-3.5 h-3.5 text-amber-600" />}
                      JSON
                    </button>
                    <button type="button" disabled={!!exporting} onClick={() => exportCollection(c.id, 'csv')} className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer hover:bg-slate-50 disabled:opacity-60">
                      {exporting === `${c.id}:csv` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                      CSV
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
