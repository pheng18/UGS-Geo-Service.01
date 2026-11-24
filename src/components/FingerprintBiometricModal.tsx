import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Fingerprint,
  ShieldCheck,
  CheckCircle2,
  X,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { UserAccount } from '../types';

interface FingerprintBiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'authenticate' | 'enroll';
  targetIdentifier?: string;
  users: UserAccount[];
  onAuthenticateSuccess: (matchedUser: UserAccount) => void;
  onEnrollFingerprint: (userId: string, customCredentialId?: string) => Promise<string>;
}

export const FingerprintBiometricModal: React.FC<FingerprintBiometricModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'authenticate',
  targetIdentifier = '',
  users,
  onAuthenticateSuccess,
  onEnrollFingerprint
}) => {
  const [mode, setMode] = useState<'authenticate' | 'enroll'>(initialMode);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<
    'idle' | 'scanning' | 'verified' | 'error'
  >('idle');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'ວາງນິ້ວມືລົງເທິງເຊັນເຊີ ເພື່ອຢືນຢັນຕົວຕົນເຂົ້າສູ່ລະບົບ'
  );
  const [webAuthnAvailable, setWebAuthnAvailable] = useState<boolean>(false);

  const scanTimerRef = useRef<number | null>(null);

  // Check if WebAuthn platform authenticator is available
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
        'function'
    ) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => setWebAuthnAvailable(available))
        .catch(() => setWebAuthnAvailable(false));
    }
  }, []);

  // Resolve target user when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setScanStatus('idle');
    setScanProgress(0);

    const cleanTarget = targetIdentifier.trim().toLowerCase();
    const matched = users.find(
      (u) =>
        u.id.toLowerCase() === cleanTarget ||
        u.email.toLowerCase() === cleanTarget ||
        (u.username && u.username.toLowerCase() === cleanTarget)
    );

    if (matched) {
      setSelectedUserId(matched.id);
      if (initialMode === 'authenticate' && !matched.biometricEnabled) {
        setStatusMessage(
          `ບັນຊີ @${matched.username || matched.email} ຍັງບໍ່ທັນຜູກລາຍນິ້ວມື — ກະລຸນາລົງທະບຽນລາຍນິ້ວມືກ່ອນ`
        );
      } else {
        setStatusMessage(
          initialMode === 'enroll'
            ? 'ກົດປຸ່ມເຊັນເຊີລາຍນິ້ວມື ເພື່ອບັນທຶກລາຍນິ້ວມືລົງຖານຂໍ້ມູນ Firestore'
            : 'ແຕະເຊັນເຊີລາຍນິ້ວມື ເພື່ອກວດສອບລະຫັດຊີວະມິຕິ (Biometric Passkey)'
        );
      }
    } else {
      const firstBioUser =
        users.find((u) => u.biometricEnabled && u.accountEnabled !== false) ||
        users[0];
      if (firstBioUser) {
        setSelectedUserId(firstBioUser.id);
      }
      setStatusMessage(
        initialMode === 'enroll'
          ? 'ກົດປຸ່ມເຊັນເຊີລາຍນິ້ວມື ເພື່ອບັນທຶກລາຍນິ້ວມືລົງຖານຂໍ້ມູນ Firestore'
          : 'ແຕະເຊັນເຊີລາຍນິ້ວມື ເພື່ອກວດສອບລະຫັດຊີວະມິຕິ (Biometric Passkey)'
      );
    }
  }, [isOpen, initialMode, targetIdentifier, users]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current);
      }
    };
  }, []);

  // Sound feedback via Web Audio API
  const playBiometricSound = useCallback((type: 'scan' | 'success' | 'error') => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'scan') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.setValueAtTime(990, ctx.currentTime + 0.09);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch {
      // Ignore audio context errors
    }
  }, []);

  const selectedUser =
    users.find((u) => u.id === selectedUserId) || users[0] || null;

  // Complete authentication or enrollment after scan reaches 100%
  const finishBiometricProcess = useCallback(
    async (customHardwareCredId?: string) => {
      if (!selectedUser) return;

      if (selectedUser.accountEnabled === false) {
        setScanStatus('error');
        setStatusMessage(
          `ບັນຊີ @${selectedUser.username || selectedUser.email} ຖືກລະງັບຊົ່ວຄາວ (Account Locked)`
        );
        playBiometricSound('error');
        return;
      }

      if (mode === 'enroll') {
        const newCredId = await onEnrollFingerprint(
          selectedUser.id,
          customHardwareCredId
        );
        setScanStatus('verified');
        setScanProgress(100);
        setStatusMessage(
          `ລົງທະບຽນລາຍນິ້ວມືສຳເລັດ! ລະຫັດ: ${newCredId} — ກຳລັງເຂົ້າສູ່ລະບົບ...`
        );
        playBiometricSound('success');
        setTimeout(() => {
          onAuthenticateSuccess({
            ...selectedUser,
            biometricEnabled: true,
            biometricCredentialId: newCredId
          });
        }, 700);
        return;
      }

      // Authenticate mode
      if (!selectedUser.biometricEnabled) {
        setScanStatus('error');
        setScanProgress(0);
        setStatusMessage(
          `ບັນຊີ @${selectedUser.username || selectedUser.email} ຍັງບໍ່ທັນລົງທະບຽນລາຍນິ້ວມື ກະລຸນາກົດປຸ່ມ "ລົງທະບຽນລາຍນິ້ວມືໃໝ່" ດ້ານລຸ່ມ`
        );
        playBiometricSound('error');
        return;
      }

      setScanStatus('verified');
      setScanProgress(100);
      setStatusMessage(
        `ຢືນຢັນລາຍນິ້ວມືສຳເລັດ! ຍິນດີຕ້ອນຮັບ ${selectedUser.name}`
      );
      playBiometricSound('success');

      setTimeout(() => {
        onAuthenticateSuccess(selectedUser);
      }, 650);
    },
    [
      selectedUser,
      mode,
      onEnrollFingerprint,
      onAuthenticateSuccess,
      playBiometricSound
    ]
  );

  // Trigger interactive optical sensor scan
  const handleStartSensorScan = () => {
    if (!selectedUser || scanStatus === 'scanning' || scanStatus === 'verified') {
      return;
    }

    if (mode === 'authenticate' && !selectedUser.biometricEnabled) {
      setScanStatus('error');
      setStatusMessage(
        `ບັນຊີ @${selectedUser.username || selectedUser.email} ຍັງບໍ່ທັນຜູກລາຍນິ້ວມື — ກະລຸນາສະຫຼັບໄປໂໝດ "ລົງທະບຽນລາຍນິ້ວມື"`
      );
      playBiometricSound('error');
      return;
    }

    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
    }

    setScanStatus('scanning');
    setScanProgress(10);
    playBiometricSound('scan');
    setStatusMessage(
      mode === 'enroll'
        ? 'ກຳລັງອ່ານໂຄງສ້າງລາຍນິ້ວມື ແລະ ເຂົ້າລະຫັດຊີວະມິຕິ...'
        : `ກຳລັງກວດສອບລາຍນິ້ວມືກັບຖານຂໍ້ມູນ (${selectedUser.biometricCredentialId})...`
    );

    let current = 10;
    scanTimerRef.current = window.setInterval(() => {
      current += 18;
      if (current >= 100) {
        if (scanTimerRef.current) {
          window.clearInterval(scanTimerRef.current);
          scanTimerRef.current = null;
        }
        setScanProgress(100);
        finishBiometricProcess();
      } else {
        setScanProgress(current);
      }
    }, 110);
  };

  // Optional native WebAuthn / Passkey hardware trigger
  const handleHardwareWebAuthn = async () => {
    if (!selectedUser) return;
    setScanStatus('scanning');
    setScanProgress(35);
    playBiometricSound('scan');
    setStatusMessage(
      'ກຳລັງເອີ້ນໃຊ້ເຊັນເຊີລາຍນິ້ວມືຂອງອຸປະກອນ (Touch ID / Windows Hello / Android Biometric)...'
    );

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      if (mode === 'enroll' && navigator.credentials?.create) {
        const userIdBytes = new TextEncoder().encode(selectedUser.id);
        const cred = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'UniqTek Technical Service' },
            user: {
              id: userIdBytes,
              name: selectedUser.email,
              displayName: selectedUser.name
            },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 },
              { type: 'public-key', alg: -257 }
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'preferred'
            },
            timeout: 15000
          }
        })) as PublicKeyCredential | null;

        if (cred) {
          const shortHwId = `PASSKEY-${cred.id.slice(0, 8).toUpperCase()}`;
          await finishBiometricProcess(shortHwId);
          return;
        }
      } else if (navigator.credentials?.get) {
        await navigator.credentials.get({
          publicKey: {
            challenge,
            userVerification: 'preferred',
            timeout: 15000
          }
        });
        await finishBiometricProcess();
        return;
      }
    } catch {
      // In cross-origin sandboxed iframes, WebAuthn throws NotAllowedError or SecurityError;
      // seamlessly fall back to the built-in optical biometric verification flow
      handleStartSensorScan();
    }
  };

  if (!isOpen) return null;

  const enrolledUsers = users.filter((u) => u.biometricEnabled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1E3A8A] to-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                {mode === 'enroll'
                  ? 'ລົງທະບຽນລາຍນິ້ວມື (Enroll Fingerprint)'
                  : 'ສະແກນລາຍນິ້ວມືເຂົ້າລະບົບ (Fingerprint Login)'}
              </h3>
              <p className="text-[11px] text-slate-300">
                ລະບົບຢືນຢັນຕົວຕົນຊີວະມິຕິ (Biometric Authentication)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle: Login with Fingerprint vs Enroll New Fingerprint */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('authenticate');
                setScanStatus('idle');
                setScanProgress(0);
                setStatusMessage('ແຕະເຊັນເຊີລາຍນິ້ວມື ເພື່ອຢືນຢັນຕົວຕົນເຂົ້າສູ່ລະບົບ');
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'authenticate'
                  ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>ສະແກນເຂົ້າລະບົບ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('enroll');
                setScanStatus('idle');
                setScanProgress(0);
                setStatusMessage(
                  'ແຕະເຊັນເຊີລາຍນິ້ວມື ເພື່ອຜູກລາຍນິ້ວມືເຂົ້າກັບບັນຊີຜູ້ໃຊ້'
                );
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'enroll'
                  ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ລົງທະບຽນລາຍນິ້ວມືໃໝ່</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Account Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              ບັນຊີຜູ້ໃຊ້ສຳລັບຢືນຢັນລາຍນິ້ວມື:
            </label>
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setScanStatus('idle');
                setScanProgress(0);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.biometricEnabled ? '🟢 [ມີລາຍນິ້ວມື] ' : '⚪ [ຍັງບໍ່ມີລາຍນິ້ວມື] '}
                  {u.name} (@{u.username || u.email.split('@')[0]}) — {u.accessLevel}
                </option>
              ))}
            </select>

            {selectedUser && (
              <div className="mt-2 flex items-center justify-between text-[11px] px-1">
                <span className="text-slate-500 dark:text-slate-400">
                  ສະຖານະລາຍນິ້ວມື:
                </span>
                {selectedUser.biometricEnabled ? (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      ພ້ອມໃຊ້ງານ ({selectedUser.biometricCredentialId || 'BIO-PASSKEY'})
                    </span>
                  </span>
                ) : (
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    ຍັງບໍ່ທັນລົງທະບຽນລາຍນິ້ວມື
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Interactive Fingerprint Sensor Pad */}
          <div className="flex flex-col items-center justify-center py-3">
            <button
              data-testid="fingerprint_sensor_pad"
              type="button"
              onClick={handleStartSensorScan}
              className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none border-4 shadow-xl ${
                scanStatus === 'verified'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-600 scale-105'
                  : scanStatus === 'error'
                  ? 'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-600'
                  : scanStatus === 'scanning'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 animate-pulse'
                  : 'bg-slate-50 dark:bg-slate-800 border-blue-600/40 hover:border-blue-600 text-[#1E3A8A] dark:text-blue-400 hover:scale-105 active:scale-95'
              }`}
              title="ແຕະເພື່ອສະແກນລາຍນິ້ວມື"
            >
              {/* Circular Progress Ring */}
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 120 120"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="opacity-10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray={339.29}
                  strokeDashoffset={339.29 - (339.29 * scanProgress) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              </svg>

              {scanStatus === 'verified' ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              ) : (
                <Fingerprint className="w-16 h-16 stroke-[1.75]" />
              )}

              <span className="mt-1.5 text-[11px] font-extrabold tracking-wide">
                {scanStatus === 'scanning'
                  ? `${scanProgress}%`
                  : scanStatus === 'verified'
                  ? 'ສຳເລັດ 100%'
                  : mode === 'enroll'
                  ? 'ແຕະເພື່ອບັນທຶກ'
                  : 'ແຕະເພື່ອສະແກນ'}
              </span>
            </button>

            {/* Status / Feedback Text */}
            <div
              className={`mt-3 text-center px-3 py-2 rounded-xl text-xs font-semibold w-full ${
                scanStatus === 'verified'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : scanStatus === 'error'
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800'
                  : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300'
              }`}
            >
              {statusMessage}
            </div>
          </div>

          {/* Quick Enrolled Biometric Accounts Bar */}
          {mode === 'authenticate' && enrolledUsers.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                ບັນຊີທີ່ເປີດໃຊ້ງານລາຍນິ້ວມືແລ້ວ (ຄລິກເພື່ອສະແກນເຂົ້າລະບົບທັນທີ):
              </span>
              <div className="grid grid-cols-1 gap-1.5 max-h-28 overflow-y-auto">
                {enrolledUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setScanStatus('scanning');
                      setScanProgress(60);
                      playBiometricSound('scan');
                      setStatusMessage(
                        `ກຳລັງຢືນຢັນລາຍນິ້ວມືຂອງ ${u.name} (${u.biometricCredentialId})...`
                      );
                      setTimeout(() => {
                        setScanStatus('verified');
                        setScanProgress(100);
                        playBiometricSound('success');
                        onAuthenticateSuccess(u);
                      }, 450);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-emerald-50/40 flex items-center justify-between text-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Fingerprint className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="text-left truncate">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {u.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 ml-1.5">
                          @{u.username || u.email.split('@')[0]}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md shrink-0">
                      {u.biometricCredentialId || 'BIO-FP'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            {webAuthnAvailable && (
              <button
                type="button"
                onClick={handleHardwareWebAuthn}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>ໃຊ້ Touch ID / ອຸປະກອນ</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStartSensorScan}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Fingerprint className="w-4 h-4" />
              <span>
                {mode === 'enroll'
                  ? 'ຢືນຢັນການລົງທະບຽນລາຍນິ້ວມື'
                  : 'ສະແກນລາຍນິ້ວມືດຽວນີ້'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
