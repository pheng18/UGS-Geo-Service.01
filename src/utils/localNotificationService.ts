import { UserAccount, UserProfile } from '../types';

/**
 * Plays a pleasant, non-intrusive dual-tone notification chime using the Web Audio API.
 */
export function playNotificationChime(
  type: 'repair_assigned' | 'repair_status' | 'project_status' = 'repair_assigned',
  priority: 'High' | 'Medium' | 'Low' = 'Medium'
): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Choose distinct frequencies for repair assignment vs project status change
    if (type === 'repair_assigned') {
      osc1.frequency.setValueAtTime(priority === 'High' ? 659.25 : 587.33, now); // E5 or D5
      osc2.frequency.setValueAtTime(priority === 'High' ? 880.0 : 783.99, now + 0.11); // A5 or G5
    } else if (type === 'project_status') {
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
    } else {
      osc1.frequency.setValueAtTime(493.88, now); // B4
      osc2.frequency.setValueAtTime(659.25, now + 0.11); // E5
    }

    osc1.type = 'sine';
    osc2.type = 'triangle';

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.14);

    osc2.start(now + 0.11);
    osc2.stop(now + 0.36);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
  } catch {
    // Ignore audio context restriction errors if user hasn't interacted yet
  }
}

/**
 * Requests permission for native browser Notifications if supported.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'default';
  }
}

/**
 * Sends a native browser Notification if permission is granted.
 */
export function dispatchBrowserNotification(title: string, body: string, tag?: string): void {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        tag: tag || `uniqtek-notif-${Date.now()}`,
        silent: false
      });
    }
  } catch {
    // Ignore errors inside restricted iframes
  }
}

/**
 * Checks whether a repair's assignedTech matches the currently logged-in user.
 */
export function isAssignedToUser(
  assignedTech: string | undefined,
  profile: UserProfile,
  currentUserAccount: UserAccount | null,
  userEmail: string | null
): boolean {
  if (!assignedTech) return false;
  const cleanTech = assignedTech.trim().toLowerCase();
  if (!cleanTech) return false;

  const candidates = [
    profile?.name,
    currentUserAccount?.name,
    currentUserAccount?.username,
    userEmail,
    userEmail?.split('@')[0]
  ]
    .filter((v): v is string => Boolean(v && v.trim()))
    .map((v) => v.trim().toLowerCase());

  return candidates.some(
    (c) => cleanTech.includes(c) || c.includes(cleanTech)
  );
}
