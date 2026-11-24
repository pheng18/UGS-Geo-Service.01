import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Search,
  Users,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAccount } from '../types';

type Level = UserAccount['accessLevel'];

const LEVEL_LABELS: Record<Level, string> = {
  SuperAdmin: 'ຜູ້ດູແລລະບົບ (SuperAdmin)',
  Admin: 'ແອັດມິນ (Admin)',
  Manager: 'ຜູ້ຈັດການ (Manager)',
  Engineer: 'ວິສະວະກອນ (Engineer)',
  Technician: 'ຊ່າງເຕັກນິກ (Technician)'
};

const LEVEL_BADGE: Record<Level, string> = {
  SuperAdmin: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  Admin: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  Manager: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  Engineer: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  Technician: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
};

const isAdminLevel = (level?: string) => level === 'SuperAdmin' || level === 'Admin';
// Records created by the old password system have no Firebase Auth account behind them.
const isLegacyRecord = (u: UserAccount) => /^USR-/i.test(u.id);

/**
 * Admin-only screen: approve or reject access requests and manage existing users.
 * Every action is re-checked by firestore.rules on the server.
 */
export const AccessManagementPanel: React.FC = () => {
  const {
    users,
    myAccount,
    isSuperAdmin,
    approveUser,
    rejectUser,
    updateUserAccount,
    toggleUserAccountLock,
    resetUserPassword,
    deleteUserAccount
  } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'disabled'>('all');
  const [levelChoice, setLevelChoice] = useState<Record<string, Level>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const grantableLevels: Level[] = isSuperAdmin
    ? ['Technician', 'Engineer', 'Manager', 'Admin', 'SuperAdmin']
    : ['Technician', 'Engineer', 'Manager'];

  const showToast = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3500);
  };

  const run = async (id: string, action: () => Promise<void>, success: string) => {
    setBusyId(id);
    try {
      await action();
      showToast(true, success);
    } catch (err) {
      console.warn(err);
      showToast(false, 'ບໍ່ສຳເລັດ: ທ່ານອາດບໍ່ມີສິດຈັດການບັນຊີນີ້');
    } finally {
      setBusyId(null);
    }
  };

  const pending = users.filter((u) => u.approvalStatus === 'pending');
  const counts = {
    pending: pending.length,
    approved: users.filter((u) => u.approvalStatus === 'approved' && u.accountEnabled !== false).length,
    rejected: users.filter((u) => u.approvalStatus === 'rejected').length,
    disabled: users.filter((u) => u.accountEnabled === false).length
  };

  const others = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => u.approvalStatus !== 'pending')
      .filter((u) => {
        if (filter === 'approved') return u.approvalStatus === 'approved' && u.accountEnabled !== false;
        if (filter === 'rejected') return u.approvalStatus === 'rejected';
        if (filter === 'disabled') return u.accountEnabled === false;
        return true;
      })
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.role || '').toLowerCase().includes(q)
      );
  }, [users, search, filter]);

  // Admins may manage only non-admin accounts; SuperAdmins manage everyone except themselves.
  const canManage = (u: UserAccount) =>
    u.id !== myAccount?.id && (isSuperAdmin || !isAdminLevel(u.accessLevel));

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl text-white text-xs font-bold shadow-xl ${
            toast.ok ? 'bg-slate-900' : 'bg-red-600'
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'ລໍຖ້າອະນຸມັດ', value: counts.pending, cls: 'text-amber-600' },
          { label: 'ອະນຸມັດແລ້ວ', value: counts.approved, cls: 'text-emerald-600' },
          { label: 'ປະຕິເສດ', value: counts.rejected, cls: 'text-red-600' },
          { label: 'ລະງັບ', value: counts.disabled, cls: 'text-slate-600 dark:text-slate-300' }
        ].map((c) => (
          <div
            key={c.label}
            className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">{c.label}</span>
            <span className={`text-xl font-extrabold font-mono ${c.cls}`}>{c.value}</span>
          </div>
        ))}
      </div>

      {/* Pending access requests */}
      <section className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs space-y-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>ຄຳຂໍສິດເຂົ້າໃຊ້ທີ່ລໍຖ້າອະນຸມັດ ({pending.length})</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            ຜູ້ໃຊ້ເຫຼົ່ານີ້ຍັງເບິ່ງຂໍ້ມູນໃດໆໃນລະບົບບໍ່ໄດ້ ຈົນກວ່າຈະໄດ້ຮັບອະນຸມັດ.
          </p>
        </div>

        {pending.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">ບໍ່ມີຄຳຂໍທີ່ລໍຖ້າອະນຸມັດ</div>
        ) : (
          <div className="space-y-2.5">
            {pending.map((u) => {
              const level = levelChoice[u.id] || 'Technician';
              const busy = busyId === u.id;
              return (
                <div
                  key={u.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.name}</div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">{u.email}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {[u.role, u.department, u.phone].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{u.requestedAt}</span>
                  </div>
                  {u.requestNote && (
                    <div className="text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
                      “{u.requestNote}”
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={level}
                      onChange={(e) => setLevelChoice((prev) => ({ ...prev, [u.id]: e.target.value as Level }))}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden"
                    >
                      {grantableLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {LEVEL_LABELS[lvl]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(u.id, () => approveUser(u.id, level), `ອະນຸມັດ ${u.name} ແລ້ວ`)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      <span>ອະນຸມັດ</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(u.id, () => rejectUser(u.id), `ປະຕິເສດຄຳຂໍຂອງ ${u.name} ແລ້ວ`)}
                      className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-60 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>ປະຕິເສດ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* All other users */}
      <section className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>ຜູ້ໃຊ້ທັງໝົດ ແລະ ສິດເຂົ້າໃຊ້</span>
          </h2>
          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                ['all', 'ທັງໝົດ'],
                ['approved', 'ອະນຸມັດແລ້ວ'],
                ['rejected', 'ປະຕິເສດ'],
                ['disabled', 'ລະງັບ']
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer ${
                  filter === key
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາດ້ວຍ ຊື່, ອີເມວ ຫຼື ຕຳແໜ່ງ..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          {others.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-400">ບໍ່ພົບຜູ້ໃຊ້</div>
          )}
          {others.map((u) => {
            const manageable = canManage(u);
            const busy = busyId === u.id;
            const disabled = u.accountEnabled === false;
            const legacy = isLegacyRecord(u);
            return (
              <div
                key={u.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${LEVEL_BADGE[u.accessLevel] || LEVEL_BADGE.Technician}`}>
                      {u.accessLevel}
                    </span>
                    {u.approvalStatus === 'rejected' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">ປະຕິເສດ</span>
                    )}
                    {disabled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">ລະງັບ</span>
                    )}
                    {u.id === myAccount?.id && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">ທ່ານ</span>
                    )}
                    {legacy && (
                      <span
                        title="ບັນທຶກຈາກລະບົບລະຫັດຜ່ານເກົ່າ ບໍ່ມີບັນຊີ Firebase Auth ເຂົ້າລະບົບບໍ່ໄດ້. ຜູ້ໃຊ້ຕ້ອງລົງທະບຽນໃໝ່."
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        ບັນຊີເກົ່າ
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">{u.email}</div>
                  {u.reviewedBy && (
                    <div className="text-[10px] text-slate-400">
                      ກວດສອບໂດຍ {u.reviewedBy} • {u.reviewedAt}
                    </div>
                  )}
                </div>

                {manageable ? (
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {!legacy && (
                      <select
                        value={u.accessLevel}
                        disabled={busy}
                        onChange={(e) => {
                          const lvl = e.target.value as Level;
                          run(
                            u.id,
                            () =>
                              u.approvalStatus === 'approved'
                                ? updateUserAccount(u.id, { accessLevel: lvl })
                                : approveUser(u.id, lvl),
                            `ປ່ຽນສິດຂອງ ${u.name} ເປັນ ${lvl} ແລ້ວ`
                          );
                        }}
                        className="px-2 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden"
                      >
                        {(grantableLevels.includes(u.accessLevel) ? grantableLevels : [u.accessLevel, ...grantableLevels]).map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    )}
                    {!legacy && (
                      <button
                        type="button"
                        disabled={busy}
                        title={disabled ? 'ເປີດໃຊ້ບັນຊີ' : 'ລະງັບບັນຊີ'}
                        onClick={() =>
                          run(u.id, () => toggleUserAccountLock(u.id), disabled ? 'ເປີດໃຊ້ບັນຊີແລ້ວ' : 'ລະງັບບັນຊີແລ້ວ')
                        }
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        {disabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {!legacy && (
                      <button
                        type="button"
                        disabled={busy}
                        title="ສົ່ງອີເມວຕັ້ງລະຫັດຜ່ານໃໝ່"
                        onClick={() => run(u.id, () => resetUserPassword(u.id), `ສົ່ງອີເມວຕັ້ງລະຫັດຜ່ານໃໝ່ໄປທີ່ ${u.email} ແລ້ວ`)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      title="ລຶບບັນທຶກຜູ້ໃຊ້"
                      onClick={() => {
                        if (
                          window.confirm(
                            `ລຶບບັນທຶກຂອງ ${u.name} (${u.email}) ອອກຈາກຖານຂໍ້ມູນ? ຜູ້ໃຊ້ຈະເສຍສິດເຂົ້າໃຊ້ ແລະ ຕ້ອງຂໍສິດໃໝ່.`
                          )
                        ) {
                          run(u.id, () => deleteUserAccount(u.id), `ລຶບບັນທຶກຂອງ ${u.name} ແລ້ວ`);
                        }
                      }}
                      className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {u.id === myAccount?.id ? 'ບັນຊີຂອງທ່ານ' : 'ສະເພາະຜູ້ດູແລລະບົບ'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
