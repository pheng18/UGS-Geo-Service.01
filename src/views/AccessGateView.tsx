import React, { useState } from 'react';
import { Clock, ShieldX, Lock, LogOut, Send, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { UniqTekLogo } from '../components/UniqTekLogo';
import { useApp } from '../context/AppContext';

/**
 * Shown to signed-in users who are not (or no longer) approved.
 * They see no company data here; firestore.rules also blocks every read.
 */
export const AccessGateView: React.FC = () => {
  const { accessState, myAccount, user, requestAccessAgain, logout } = useApp();
  const [note, setNote] = useState(myAccount?.requestNote || '');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (accessState === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#1E3A8A] to-[#0F172A]">
        <div className="flex items-center gap-3 text-white text-sm font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>ກຳລັງກວດສອບສິດເຂົ້າໃຊ້...</span>
        </div>
      </div>
    );
  }

  const isRejected = accessState === 'rejected';
  const isDisabled = accessState === 'disabled';

  const handleRequest = async () => {
    setBusy(true);
    setError('');
    try {
      await requestAccessAgain(note);
      setSent(true);
    } catch {
      setError('ສົ່ງຄຳຂໍບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່');
    } finally {
      setBusy(false);
    }
  };

  const Icon = isDisabled ? Lock : isRejected ? ShieldX : Clock;
  const title = isDisabled
    ? 'ບັນຊີຖືກລະງັບການໃຊ້ງານ'
    : isRejected
    ? 'ຄຳຂໍສິດເຂົ້າໃຊ້ຖືກປະຕິເສດ'
    : 'ລໍຖ້າການອະນຸມັດສິດເຂົ້າໃຊ້';
  const message = isDisabled
    ? 'ບັນຊີຂອງທ່ານຖືກລະງັບຊົ່ວຄາວ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ.'
    : isRejected
    ? 'ຜູ້ດູແລລະບົບ ຫຼື ແອັດມິນ ບໍ່ໄດ້ອະນຸມັດຄຳຂໍຂອງທ່ານ. ທ່ານສາມາດສົ່ງຄຳຂໍໃໝ່ພ້ອມເຫດຜົນໄດ້.'
    : 'ບັນຊີຂອງທ່ານຖືກສ້າງແລ້ວ. ທ່ານຈະເຫັນຂໍ້ມູນໃນລະບົບໄດ້ ເມື່ອຜູ້ດູແລລະບົບ ຫຼື ແອັດມິນ ອະນຸມັດ. ໜ້ານີ້ຈະເປີດເຂົ້າລະບົບໃຫ້ອັດຕະໂນມັດເມື່ອໄດ້ຮັບອະນຸມັດ.';
  const tone = isDisabled || isRejected ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-[#1E3A8A] to-[#0F172A]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col items-center text-center">
          <UniqTekLogo size={56} roundedClassName="rounded-2xl shadow-md" />
          <div className={`mt-4 w-12 h-12 rounded-2xl flex items-center justify-center ${tone}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h1 className="mt-3 text-lg font-bold text-[#0F172A]">{title}</h1>
          <p className="text-sm text-slate-600 mt-1.5">{message}</p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">ບັນຊີ</span>
            <span className="font-mono font-semibold text-slate-800 truncate">{user}</span>
          </div>
          {myAccount?.name && (
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">ຊື່</span>
              <span className="font-semibold text-slate-800 truncate">{myAccount.name}</span>
            </div>
          )}
          {myAccount?.requestedAt && (
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">ສົ່ງຄຳຂໍເມື່ອ</span>
              <span className="font-mono text-slate-800">{myAccount.requestedAt}</span>
            </div>
          )}
        </div>

        {!isDisabled && myAccount && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              {isRejected ? 'ເຫດຜົນສຳລັບຄຳຂໍໃໝ່' : 'ຂໍ້ຄວາມເຖິງຜູ້ອະນຸມັດ (ບໍ່ບັງຄັບ)'}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setSent(false);
              }}
              placeholder="ເຊັ່ນ: ຊ່າງເຕັກນິກໃໝ່ ພະແນກສ້ອມແປງ GNSS"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] text-sm text-[#0F172A] outline-hidden resize-none"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            {sent && (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ສົ່ງຄຳຂໍສິດເຂົ້າໃຊ້ແລ້ວ</span>
              </p>
            )}
            <button
              type="button"
              onClick={handleRequest}
              disabled={busy}
              className="w-full h-11 bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-60 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : isRejected ? <RefreshCw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              <span>{isRejected ? 'ສົ່ງຄຳຂໍສິດເຂົ້າໃຊ້ໃໝ່' : 'ອັບເດດຄຳຂໍສິດເຂົ້າໃຊ້'}</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => logout()}
          className="w-full h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>ອອກຈາກລະບົບ</span>
        </button>

        <p className="text-center text-xs text-slate-400">ຕິດຕໍ່ຝ່າຍບໍລິຫານລະບົບ: 020 76 111 800</p>
      </div>
    </div>
  );
};
