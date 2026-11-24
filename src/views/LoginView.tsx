import React, { useState } from 'react';
import {
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import { UniqTekLogo } from '../components/UniqTekLogo';
import { useApp } from '../context/AppContext';

type Mode = 'login' | 'register' | 'forgot';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 text-[#0F172A] text-sm transition-all outline-hidden';

export const LoginView: React.FC = () => {
  const { login, loginWithGoogle, registerAccount, sendPasswordReset } = useApp();
  const [mode, setMode] = useState<Mode>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register (creates an account + access request that an admin must approve)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Technical Survey Engineer');
  const [regPhone, setRegPhone] = useState('');
  const [regDept, setRegDept] = useState('Technical Service & Support');
  const [regNote, setRegNote] = useState('');

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານໃຫ້ຄົບຖ້ວນ');
      return;
    }
    setBusy(true);
    setError('');
    const result = await login(email.trim(), password);
    setBusy(false);
    if (!result.success) setError(result.message || 'ຂໍ້ມູນການເຂົ້າສູ່ລະບົບບໍ່ຖືກຕ້ອງ');
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError('');
    const result = await loginWithGoogle();
    setBusy(false);
    if (!result.success && result.message) setError(result.message);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('ກະລຸນາປ້ອນ ຊື່, ອີເມວ ແລະ ລະຫັດຜ່ານໃຫ້ຄົບຖ້ວນ');
      return;
    }
    if (regPassword.length < 8) {
      setError('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ');
      return;
    }
    setBusy(true);
    setError('');
    const result = await registerAccount({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: regRole.trim() || 'Technical Specialist',
      department: regDept.trim() || 'Technical Service & Support',
      phone: regPhone.trim(),
      requestNote: regNote.trim()
    });
    setBusy(false);
    if (!result.success) setError(result.message || 'ລົງທະບຽນບໍ່ສຳເລັດ');
    // On success the app switches to the "waiting for approval" screen automatically.
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('ກະລຸນາປ້ອນອີເມວທີ່ໃຊ້ລົງທະບຽນ');
      return;
    }
    setBusy(true);
    setError('');
    const result = await sendPasswordReset(email.trim());
    setBusy(false);
    if (result.success) {
      setInfo(`ສົ່ງລິ້ງຕັ້ງລະຫັດຜ່ານໃໝ່ໄປທີ່ ${email.trim()} ແລ້ວ (ກວດເບິ່ງໃນ Spam ນຳ)`);
    } else {
      setError(result.message || 'ສົ່ງອີເມວບໍ່ສຳເລັດ');
    }
  };

  const errorBox = error && (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{error}</span>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-[#1E3A8A] to-[#0F172A]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <UniqTekLogo size={72} roundedClassName="rounded-2xl shadow-md" />
          <h1 className="mt-4 text-xl sm:text-2xl font-bold text-[#0F172A]">UNIQTEK CO., LTD</h1>
          <p className="text-sm text-[#475569] mt-1">ລະບົບຈັດການບໍລິການເຕັກນິກ</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ເຂົ້າເຖິງຂໍ້ມູນໄດ້ສະເພາະຜູ້ທີ່ໄດ້ຮັບອະນຸຍາດ</span>
          </div>
        </div>

        {mode !== 'forgot' && (
          <div className="mt-5 grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-[#1E3A8A] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ເຂົ້າສູ່ລະບົບ
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white text-[#1E3A8A] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>ລົງທະບຽນ / ຂໍສິດເຂົ້າໃຊ້</span>
            </button>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ອີເມວ (Email)</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  data-testid="username_input"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className={`${inputClass} pl-11 py-3`}
                  placeholder="name@uniqtek.la"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">ລະຫັດຜ່ານ (Password)</label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  ລືມລະຫັດຜ່ານ?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  data-testid="password_input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className={`${inputClass} pl-11 pr-11 py-3`}
                  placeholder="ລະຫັດຜ່ານ"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'ເຊື່ອງລະຫັດຜ່ານ' : 'ສະແດງລະຫັດຜ່ານ'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorBox}

            <div className="pt-1 space-y-2.5">
              <button
                data-testid="login_button"
                type="submit"
                disabled={busy}
                className="w-full h-12 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>ເຂົ້າສູ່ລະບົບ</span>
              </button>

              <div className="relative flex items-center justify-center py-0.5">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 shrink-0">ຫຼື</span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="w-full h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span>ເຂົ້າສູ່ລະບົບດ້ວຍບັນຊີ Google</span>
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="mt-4 space-y-3 text-xs">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                ຫຼັງລົງທະບຽນ ບັນຊີຂອງທ່ານຈະຢູ່ໃນສະຖານະ "ລໍຖ້າອະນຸມັດ". ທ່ານຈະເຫັນຂໍ້ມູນໃນລະບົບໄດ້ ເມື່ອ
                ຜູ້ດູແລລະບົບ ຫຼື ແອັດມິນ ອະນຸມັດແລ້ວເທົ່ານັ້ນ.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ຊື່ ແລະ ນາມສະກຸນ *</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="ທ່ານ ສົມພອນ ເພັດດາລາ"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ອີເມວ (Email) *</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@uniqtek.la"
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ລະຫັດຜ່ານ * (ຢ່າງໜ້ອຍ 8 ຕົວ)</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ຕຳແໜ່ງ</label>
                <input
                  type="text"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ເບີໂທ</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="020 ..."
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ພະແນກ</label>
              <input
                type="text"
                value={regDept}
                onChange={(e) => setRegDept(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ເຫດຜົນທີ່ຂໍສິດເຂົ້າໃຊ້</label>
              <textarea
                rows={2}
                value={regNote}
                onChange={(e) => setRegNote(e.target.value)}
                placeholder="ເຊັ່ນ: ຊ່າງເຕັກນິກໃໝ່ ພະແນກສ້ອມແປງ GNSS"
                className={`${inputClass} resize-none`}
              />
            </div>

            {errorBox}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>ລົງທະບຽນ ແລະ ສົ່ງຄຳຂໍສິດເຂົ້າໃຊ້</span>
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="mt-5 space-y-3.5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ກັບໄປໜ້າເຂົ້າສູ່ລະບົບ</span>
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>ຕັ້ງລະຫັດຜ່ານໃໝ່</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                ປ້ອນອີເມວທີ່ໃຊ້ລົງທະບຽນ ລະບົບຈະສົ່ງລິ້ງສຳລັບຕັ້ງລະຫັດຜ່ານໃໝ່ໃຫ້.
              </p>
            </div>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className={`${inputClass} font-mono`}
              placeholder="name@uniqtek.la"
            />
            {errorBox}
            {info && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{info}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>ສົ່ງລິ້ງຕັ້ງລະຫັດຜ່ານ</span>
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-xs text-slate-400">ຕິດຕໍ່ຝ່າຍບໍລິຫານລະບົບ: 020 76 111 800</div>
      </div>
    </div>
  );
};
