import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Repair,
  Project,
  CORSStation,
  Equipment,
  Quotation,
  InternalNote,
  UserLog,
  UserProfile,
  QuotationItem,
  Employee,
  UserAccount,
  AppNotification,
  NotificationPreferences
} from '../types';
import {
  initialRepairs,
  initialProjects,
  initialCORSStations,
  initialEquipment,
  initialQuotations,
  initialNotes,
  initialProfile,
  initialEmployees,
  initialUsers
} from '../data/seedData';
import { CORS_COORDINATES, CORS_SERVER_PORTAL_URL } from '../data/corsLocations';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  deleteField
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile as updateFirebaseAuthProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { db, auth, googleProvider, BOOTSTRAP_ADMIN_EMAILS } from '../firebase';

export type AccessState = 'loading' | 'signed_out' | 'pending' | 'rejected' | 'disabled' | 'approved';

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  phone: string;
  requestNote?: string;
}

// Fields a user may change on their own profile (mirrors firestore.rules).
const SELF_EDITABLE_FIELDS = [
  'name',
  'username',
  'role',
  'department',
  'phone',
  'status',
  'currentActivity',
  'themeMode',
  'biometricEnabled',
  'biometricCredentialId',
  'biometricRegisteredAt'
] as const;

// Locally cached data that must not survive a logout on a shared device.
const CACHED_DATA_KEYS = [
  'user',
  'repairs',
  'projects',
  'stations',
  'equipment',
  'quotations',
  'notes',
  'profile',
  'employees',
  'users_db',
  'logs',
  'notifications'
];

function authErrorMessageLao(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-login-credentials':
      return 'ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ ກະລຸນາກວດສອບອີກຄັ້ງ';
    case 'auth/too-many-requests':
      return 'ພະຍາຍາມເຂົ້າສູ່ລະບົບຫຼາຍເກີນໄປ ກະລຸນາລໍຖ້າບຶດໜຶ່ງແລ້ວລອງໃໝ່';
    case 'auth/email-already-in-use':
      return 'ອີເມວນີ້ລົງທະບຽນແລ້ວ ກະລຸນາເຂົ້າສູ່ລະບົບ ຫຼື ກົດ "ລືມລະຫັດຜ່ານ"';
    case 'auth/weak-password':
      return 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ';
    case 'auth/invalid-email':
      return 'ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ';
    case 'auth/missing-password':
      return 'ກະລຸນາປ້ອນລະຫັດຜ່ານ';
    case 'auth/operation-not-allowed':
      return 'ວິທີເຂົ້າສູ່ລະບົບນີ້ຍັງບໍ່ໄດ້ເປີດໃຊ້ໃນ Firebase Authentication (ແຈ້ງຜູ້ດູແລລະບົບ)';
    case 'auth/unauthorized-domain':
      return 'ໂດເມນນີ້ຍັງບໍ່ໄດ້ຮັບອະນຸຍາດໃນ Firebase Authentication (ແຈ້ງຜູ້ດູແລລະບົບ)';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'ປິດໜ້າຕ່າງ Google ກ່ອນເຂົ້າສູ່ລະບົບສຳເລັດ';
    case 'auth/popup-blocked':
      return 'ບຣາວເຊີບລັອກໜ້າຕ່າງ Google ກະລຸນາອະນຸຍາດ Pop-up ແລ້ວລອງໃໝ່';
    case 'auth/network-request-failed':
      return 'ບໍ່ສາມາດເຊື່ອມຕໍ່ອິນເຕີເນັດໄດ້ ກະລຸນາລອງໃໝ່';
    default:
      return (err as { message?: string })?.message || 'ເກີດຂໍ້ຜິດພາດໃນການເຂົ້າສູ່ລະບົບ';
  }
}
import {
  playNotificationChime,
  dispatchBrowserNotification,
  isAssignedToUser
} from '../utils/localNotificationService';
import {
  QuotationTotalPriceReport,
  computeClientQuotationReport,
  fetchQuotationsAndReportFromSql,
  saveQuotationToSql,
  setAuthTokenInMemory
} from '../utils/quotationSqlApi';

function enrichStationWithPortalCoords(st: CORSStation): CORSStation {
  const ref = CORS_COORDINATES[st.id];
  return {
    ...st,
    lat: typeof st.lat === 'number' ? st.lat : ref?.lat ?? 17.9757,
    lng: typeof st.lng === 'number' ? st.lng : ref?.lng ?? 102.6331,
    elevation: typeof st.elevation === 'number' ? st.elevation : ref?.elevation ?? 170,
    province: st.province || ref?.province || 'ສປປ ລາວ',
    satellites:
      typeof st.satellites === 'number'
        ? st.satellites
        : st.status === 'Online'
        ? ref?.satellites ?? 32
        : 0,
    mountpoint: st.mountpoint || ref?.mountpoint || `${st.id}_RTCM32`,
    coordSource: st.coordSource || CORS_SERVER_PORTAL_URL,
    lastCoordSync: st.lastCoordSync || '2025-02-18 09:00'
  };
}

const VIEW_LABELS_LAO: Record<string, string> = {
  dashboard: 'ກຳລັງຕິດຕາມໜ້າຫຼັກ (Dashboard)',
  repairs: 'ກຳລັງຈັດການລາຍການສ້ອມແປງ (Repairs)',
  repair_details: 'ກຳລັງກວດເຊັກລາຍລະອຽດເຄື່ອງສ້ອມແປງ',
  projects: 'ກຳລັງຕິດຕາມໂຄງການສຳຫຼວດ (Projects)',
  project_details: 'ກຳລັງເບິ່ງລາຍລະອຽດໂຄງການສຳຫຼວດ',
  cors: 'ກຳລັງຕິດຕາມສະຖານີ CORS Real-time',
  equipment: 'ກຳລັງກວດສອບບັນຊີອຸປະກອນເຕັກນິກ',
  quotations: 'ກຳລັງຈັດການໃບສະເໜີລາຄາ (Quotations)',
  quotation_details: 'ກຳລັງກວດສອບລາຍລະອຽດໃບສະເໜີລາຄາ',
  training: 'ກຳລັງຮຽນຮູ້ລະບົບການຝຶກອົບຮົມ GNSS RTK',
  profile: 'ກຳລັງຈັດການຖານຂໍ້ມູນຜູ້ໃຊ້ ແລະ ໂປຣໄຟລ໌',
  backoffice: 'ກຳລັງໃຊ້ງານ Back Office (ຜູ້ດູແລລະບົບ)'
};

interface AppContextType {
  // ---- Access control (enforced server-side by firestore.rules) ----
  accessState: AccessState;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  myAccount: UserAccount | null;
  registerAccount: (data: RegistrationInput) => Promise<{ success: boolean; message?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  requestAccessAgain: (note?: string) => Promise<void>;
  approveUser: (id: string, accessLevel: UserAccount['accessLevel']) => Promise<void>;
  rejectUser: (id: string) => Promise<void>;
  user: string | null;
  currentView: string;
  selectedRepair: Repair | null;
  selectedProject: Project | null;
  selectedQuotation: Quotation | null;
  profile: UserProfile;
  activityLogs: UserLog[];
  repairs: Repair[];
  projects: Project[];
  stations: CORSStation[];
  equipment: Equipment[];
  quotations: Quotation[];
  quotationReport: QuotationTotalPriceReport;
  notes: InternalNote[];
  employees: Employee[];
  isLoadingEmployees: boolean;
  users: UserAccount[];
  currentUserAccount: UserAccount | null;
  isRealtimeConnected: boolean;
  lastSyncedAt: string;
  realtimeEventCount: number;
  addEmployee: (employee: Omit<Employee, 'id'> & { id?: string }) => Promise<void>;
  addUserAccount: (userData: Omit<UserAccount, 'id' | 'lastActive'> & { id?: string }) => Promise<void>;
  updateUserAccount: (id: string, updates: Partial<UserAccount>) => Promise<void>;
  updateUserCredentials: (id: string, username: string, email: string, password: string) => Promise<void>;
  /** Sends the user a Firebase password-reset email. */
  resetUserPassword: (id: string) => Promise<void>;
  toggleUserAccountLock: (id: string) => Promise<void>;
  deleteUserAccount: (id: string) => Promise<void>;
  updateUserPresenceStatus: (status: 'Online' | 'Busy' | 'Offline', currentActivity?: string) => Promise<void>;
  login: (identifier: string, passwordInput?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  loginWithBiometric: (
    identifier?: string,
    credentialId?: string
  ) => { success: boolean; message?: string; matchedUser?: UserAccount };
  registerBiometricFingerprint: (userId: string, credentialId?: string) => Promise<string>;
  removeBiometricFingerprint: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  navigateTo: (view: string) => void;
  selectRepair: (repair: Repair | null) => void;
  selectProject: (project: Project | null) => void;
  selectQuotation: (quotation: Quotation | null) => void;
  addRepair: (
    serialNo: string,
    model: string,
    title: string,
    client: string,
    problem: string,
    assignedTech: string,
    priority?: 'High' | 'Medium' | 'Low'
  ) => void;
  updateRepairStatus: (
    repair: Repair,
    newStatus: 'ກຳລັງສ້ອມແປງ' | 'ສຳເລັດແລ້ວ' | 'ລໍຖ້າກວດເຊັກ' | 'ກຳລັງສຳຫຼວດ',
    cause?: string,
    solution?: string,
    priority?: 'High' | 'Medium' | 'Low',
    assignedTech?: string
  ) => void;
  addInternalNote: (repairId: string, author: string, text: string) => void;
  addProject: (title: string, client: string, location: string, lat: number, lng: number, teamName: string, teamRole: string, teamPhone: string) => void;
  updateProjectProgress: (project: Project, progress: number, status: 'ກຳລັງສຳຫຼວດ' | 'ລໍຖ້າການວິເຄາະ' | 'ສຳເລັດແລ້ວ') => void;
  toggleStationStatus: (station: CORSStation) => void;
  updateStationIssue: (station: CORSStation, issue: string) => void;
  updateStationCoordinates: (
    stationId: string,
    updates: {
      name?: string;
      lat: number;
      lng: number;
      elevation?: number;
      province?: string;
      satellites?: number;
      mountpoint?: string;
      issue?: string;
      notes?: string;
      status?: 'Online' | 'Offline';
      coordSource?: string;
    }
  ) => Promise<void>;
  batchUpdateStationCoordinates: (
    entries: Array<{
      id: string;
      name?: string;
      lat: number;
      lng: number;
      elevation?: number;
      province?: string;
      satellites?: number;
      mountpoint?: string;
      status?: 'Online' | 'Offline';
    }>,
    sourceLabel?: string
  ) => Promise<number>;
  syncStationsFromCORSServer: () => Promise<number>;
  addCORSStation: (stationData: CORSStation) => Promise<void>;
  updateEquipmentDetail: (eq: Equipment) => void;
  addQuotation: (
    customerName: string,
    validity: string,
    items: QuotationItem[],
    terms: string,
    extra?: Partial<Quotation>
  ) => Quotation;
  updateQuotation: (updated: Quotation) => void;
  updateProfile: (name: string, role: string, phone: string, dept: string) => void;
  updateThemeMode: (mode: 'Light' | 'Dark' | 'System') => void;
  clearActivityLogs: () => void;
  logUserOperation: (action: string, details: string, type: UserLog['type']) => void;
  notifications: AppNotification[];
  activeToastNotifications: AppNotification[];
  unreadNotificationCount: number;
  notificationPrefs: NotificationPreferences;
  pushLocalNotification: (
    payload: Omit<AppNotification, 'id' | 'timestamp' | 'createdAtMs' | 'read'>
  ) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  dismissToastNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;
  triggerTestNotification: (kind: 'repair_assigned' | 'project_status') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`uniqtek_${key}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(`uniqtek_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // `user` is the signed-in Firebase Auth email; never restored from localStorage.
  const [user, setUser] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [myAccount, setMyAccount] = useState<UserAccount | null>(null);
  const [myAccountLoaded, setMyAccountLoaded] = useState(false);
  // Details typed into the registration form, used when the profile doc is first created.
  const pendingRegistrationRef = useRef<Omit<RegistrationInput, 'email' | 'password'> | null>(null);

  const isBootstrapAdmin =
    !!authUser?.email &&
    authUser.emailVerified &&
    BOOTSTRAP_ADMIN_EMAILS.includes(authUser.email.toLowerCase());

  const accessState: AccessState = useMemo(() => {
    if (!authReady) return 'loading';
    if (!authUser) return 'signed_out';
    if (isBootstrapAdmin) return 'approved';
    if (!myAccountLoaded) return 'loading';
    if (!myAccount) return 'pending';
    if (myAccount.accountEnabled === false) return 'disabled';
    if (myAccount.approvalStatus === 'approved') return 'approved';
    if (myAccount.approvalStatus === 'rejected') return 'rejected';
    return 'pending';
  }, [authReady, authUser, isBootstrapAdmin, myAccountLoaded, myAccount]);

  const canAccessData = accessState === 'approved';
  const isSuperAdmin =
    canAccessData && (isBootstrapAdmin || myAccount?.accessLevel === 'SuperAdmin');
  const isAdmin = isSuperAdmin || (canAccessData && myAccount?.accessLevel === 'Admin');
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const [repairs, setRepairs] = useState<Repair[]>(() => loadFromStorage<Repair[]>('repairs', initialRepairs));
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage<Project[]>('projects', initialProjects));
  const [stations, setStations] = useState<CORSStation[]>(() =>
    loadFromStorage<CORSStation[]>('stations', initialCORSStations).map(enrichStationWithPortalCoords)
  );
  const [equipment, setEquipment] = useState<Equipment[]>(() => loadFromStorage<Equipment[]>('equipment', initialEquipment));
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const loaded = loadFromStorage<Quotation[]>('quotations', initialQuotations);
    const refQuote = initialQuotations[0];
    if (refQuote && !loaded.some((q) => q.id === refQuote.id)) {
      return [refQuote, ...loaded];
    }
    return loaded;
  });
  const [sqlQuotationReport, setSqlQuotationReport] = useState<QuotationTotalPriceReport | null>(
    null
  );
  const quotationReport = useMemo<QuotationTotalPriceReport>(() => {
    const computed = computeClientQuotationReport(quotations);
    if (
      sqlQuotationReport &&
      sqlQuotationReport.quotationCount === computed.quotationCount &&
      sqlQuotationReport.grandTotalPrice === computed.grandTotalPrice
    ) {
      return sqlQuotationReport;
    }
    return computed;
  }, [quotations, sqlQuotationReport]);
  const [notes, setNotes] = useState<InternalNote[]>(() => loadFromStorage<InternalNote[]>('notes', initialNotes));
  const [profile, setProfile] = useState<UserProfile>(() => loadFromStorage<UserProfile>('profile', initialProfile));
  const [employees, setEmployees] = useState<Employee[]>(() => loadFromStorage<Employee[]>('employees', initialEmployees));
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(true);
  // Only admins ever hold the full user list (never seeded or cached for others).
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toLocaleTimeString('en-GB'));
  const [realtimeEventCount, setRealtimeEventCount] = useState<number>(1);

  const [activityLogs, setActivityLogs] = useState<UserLog[]>(() => loadFromStorage<UserLog[]>('logs', [
    {
      id: "log-init",
      timestamp: new Date().toLocaleString('en-GB'),
      action: "ເລີ່ມຕົ້ນລະບົບ Real-time",
      details: "ເຊື່ອມຕໍ່ຖານຂໍ້ມູນຜູ້ໃຊ້ງານ ແລະ Cloud Firestore Real-time Sync ສຳເລັດ",
      type: "system",
      userEmail: "admin@uniqtek.la"
    }
  ]));

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() =>
    loadFromStorage<NotificationPreferences>('notification_prefs', {
      soundEnabled: true,
      browserNotificationEnabled: true,
      toastEnabled: true,
      notifyAllTeamRepairs: true
    })
  );

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadFromStorage<AppNotification[]>('notifications', [
      {
        id: 'notif-seed-1',
        title: 'ວຽກສ້ອມແປງໃໝ່ຖືກມອບໝາຍໃຫ້ທ່ານ',
        message: 'ບັດ REP-2024-8821: Leica TS07 (ກົມແຜນທີ່ແຫ່ງຊາດ) — ມອບໝາຍໃຫ້ ສົມພອນ ເພັດດາລາ',
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        createdAtMs: Date.now() - 1000 * 60 * 15,
        category: 'repair_assigned',
        priority: 'High',
        read: false,
        isAssignedToMe: true,
        targetId: 'REP-2024-8821',
        targetView: 'repair_details',
        assignedTech: 'ສົມພອນ ເພັດດາລາ'
      },
      {
        id: 'notif-seed-2',
        title: 'ອັບເດດສະຖານະໂຄງການສຳຫຼວດ',
        message: 'ໂຄງການ PRJ-101 (ສຳຫຼວດເສັ້ນທາງດ່ວນ ວຽງຈັນ-ວັງວຽງ) ຢູ່ໃນສະຖານະ "ກຳລັງສຳຫຼວດ" (75%)',
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        createdAtMs: Date.now() - 1000 * 60 * 45,
        category: 'project_status',
        read: false,
        targetId: 'PRJ-101',
        targetView: 'project_details',
        newStatus: 'ກຳລັງສຳຫຼວດ'
      }
    ])
  );

  const [activeToastNotifications, setActiveToastNotifications] = useState<AppNotification[]>([]);

  // Track known repairs & projects for real-time Firestore diff detection without duplicate alerts
  const knownRepairsRef = useRef<Record<string, Repair>>({});
  const knownProjectsRef = useRef<Record<string, Project>>({});
  const repairsInitializedRef = useRef<boolean>(false);
  const projectsInitializedRef = useRef<boolean>(false);
  const recentlyNotifiedKeysRef = useRef<Set<string>>(new Set());

  const markRealtimeSync = () => {
    setIsRealtimeConnected(true);
    setLastSyncedAt(new Date().toLocaleTimeString('en-GB'));
    setRealtimeEventCount(prev => prev + 1);
  };

  // Current logged-in user account matched from Firestore users DB
  const currentUserAccount = useMemo<UserAccount | null>(() => {
    if (!authUser) return null;
    if (myAccount) {
      // Bootstrap admins are always SuperAdmin, whatever their stored level says.
      return isBootstrapAdmin ? { ...myAccount, accessLevel: 'SuperAdmin' } : myAccount;
    }
    const email = authUser.email || '';
    return {
      id: authUser.uid,
      username: email.split('@')[0],
      name: profile.name || authUser.displayName || email.split('@')[0],
      email,
      accountEnabled: true,
      role: profile.role,
      department: profile.department,
      phone: profile.phone,
      accessLevel: isBootstrapAdmin ? 'SuperAdmin' : 'Technician',
      approvalStatus: isBootstrapAdmin ? 'approved' : 'pending',
      status: 'Online',
      lastActive: lastSyncedAt,
      currentActivity: VIEW_LABELS_LAO[currentView] || 'ກຳລັງໃຊ້ງານລະບົບ',
      themeMode: profile.themeMode
    };
  }, [authUser, myAccount, isBootstrapAdmin, profile, lastSyncedAt, currentView]);

  // ---- Firebase Auth session (source of truth for who is signed in) ----
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser?.isAnonymous) {
        // Old builds signed everyone in anonymously; drop those sessions.
        await signOut(auth).catch(() => {});
        return;
      }
      setAuthUser(fbUser);
      setAuthReady(true);
      if (fbUser) {
        setUser(fbUser.email);
        try {
          setAuthTokenInMemory(await fbUser.getIdToken());
        } catch {
          setAuthTokenInMemory(null);
        }
      } else {
        setUser(null);
        setAuthTokenInMemory(null);
        setMyAccount(null);
        setMyAccountLoaded(false);
        setUsers([]);
      }
    });
    return unsubscribe;
  }, []);

  // ---- Own profile / access request (users/{uid}) ----
  useEffect(() => {
    if (!authUser) return;
    setMyAccountLoaded(false);
    const ref = doc(db, 'users', authUser.uid);
    const unsubscribe = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          const email = authUser.email || '';
          const bootstrap =
            authUser.emailVerified && BOOTSTRAP_ADMIN_EMAILS.includes(email.toLowerCase());
          const reg = pendingRegistrationRef.current;
          const nowFull = new Date().toLocaleString('en-GB');
          const newAccount: UserAccount = {
            id: authUser.uid,
            username: email.split('@')[0],
            name: reg?.name || authUser.displayName || email.split('@')[0],
            email,
            accountEnabled: true,
            role: reg?.role || 'Technical Specialist',
            department: reg?.department || 'Technical Service & Support',
            phone: reg?.phone || '',
            accessLevel: bootstrap ? 'SuperAdmin' : 'Technician',
            approvalStatus: bootstrap ? 'approved' : 'pending',
            requestNote: reg?.requestNote || '',
            requestedAt: nowFull,
            status: 'Online',
            lastActive: `ລົງທະບຽນເມື່ອ ${nowFull}`,
            currentActivity: bootstrap ? 'ຜູ້ດູແລລະບົບ' : 'ລໍຖ້າການອະນຸມັດສິດເຂົ້າໃຊ້',
            themeMode: 'Light'
          };
          try {
            await setDoc(ref, newAccount);
            pendingRegistrationRef.current = null;
          } catch (err) {
            console.warn('Could not create access request profile:', err);
            setMyAccount(null);
            setMyAccountLoaded(true);
          }
          return; // the snapshot fires again once the doc exists
        }
        const data = { ...(snap.data() as UserAccount), id: snap.id };
        setMyAccount(data);
        setMyAccountLoaded(true);
        setProfile((prev) => ({
          ...prev,
          name: data.name,
          role: data.role,
          phone: data.phone,
          department: data.department,
          email: data.email,
          themeMode: data.themeMode || prev.themeMode
        }));
      },
      (error) => {
        console.warn('Own profile listener:', error.message);
        setMyAccountLoaded(true);
      }
    );
    return unsubscribe;
  }, [authUser]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const dismissToastNotification = useCallback((id: string) => {
    setActiveToastNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushLocalNotification = useCallback(
    (
      payload: Omit<AppNotification, 'id' | 'timestamp' | 'createdAtMs' | 'read'> & {
        dedupeKey?: string;
      }
    ) => {
      if (payload.dedupeKey) {
        if (recentlyNotifiedKeysRef.current.has(payload.dedupeKey)) {
          return;
        }
        recentlyNotifiedKeysRef.current.add(payload.dedupeKey);
        setTimeout(() => {
          if (payload.dedupeKey) {
            recentlyNotifiedKeysRef.current.delete(payload.dedupeKey);
          }
        }, 8000);
      }

      const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const nowTime = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const { dedupeKey: _unusedDedupe, ...cleanPayload } = payload;
      const newNotif: AppNotification = {
        ...cleanPayload,
        id,
        timestamp: nowTime,
        createdAtMs: Date.now(),
        read: false
      };

      setNotifications((prev) => [newNotif, ...prev].slice(0, 60));

      if (notificationPrefs.toastEnabled) {
        setActiveToastNotifications((prev) => [newNotif, ...prev].slice(0, 4));
        setTimeout(() => {
          setActiveToastNotifications((prev) => prev.filter((item) => item.id !== id));
        }, 6500);
      }

      if (notificationPrefs.soundEnabled) {
        playNotificationChime(newNotif.category, newNotif.priority || 'Medium');
      }

      if (notificationPrefs.browserNotificationEnabled) {
        dispatchBrowserNotification(newNotif.title, newNotif.message, id);
      }
    },
    [notificationPrefs]
  );

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setActiveToastNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setActiveToastNotifications([]);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setActiveToastNotifications([]);
  }, []);

  const updateNotificationPreferences = useCallback(
    (updates: Partial<NotificationPreferences>) => {
      setNotificationPrefs((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Non-admins only ever hold their own profile in `users`.
  useEffect(() => {
    if (!isAdmin) setUsers(myAccount ? [myAccount] : []);
  }, [isAdmin, myAccount]);

  // 1. Real-time listener for `users` — admins only (firestore.rules denies everyone else).
  useEffect(() => {
    if (!isAdmin) return;
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const list: UserAccount[] = [];
          snapshot.forEach((docSnap) => {
            const raw = docSnap.data() as UserAccount & Record<string, unknown>;
            // Legacy records stored plaintext passwords; scrub them as soon as an admin sees them.
            if ('password' in raw || 'passwordUpdatedAt' in raw) {
              updateDoc(docSnap.ref, {
                password: deleteField(),
                passwordUpdatedAt: deleteField()
              }).catch(() => {});
            }
            const { password: _pw, passwordUpdatedAt: _pwAt, ...data } = raw;
            list.push({
              ...(data as UserAccount),
              id: docSnap.id,
              name: (data.name as string) || (data.email as string) || docSnap.id,
              email: (data.email as string) || '',
              username:
                (data.username as string) ||
                ((data.email as string) ? (data.email as string).split('@')[0] : docSnap.id),
              accountEnabled: data.accountEnabled !== undefined ? (data.accountEnabled as boolean) : true,
              // Records without a status predate the approval workflow.
              approvalStatus: (data.approvalStatus as UserAccount['approvalStatus']) || 'approved'
            });
          });
          // Pending requests first, then Online > Busy > Offline, then by name
          const statusOrder: Record<string, number> = { Online: 3, Busy: 2, Offline: 1 };
          list.sort(
            (a, b) =>
              Number(b.approvalStatus === 'pending') - Number(a.approvalStatus === 'pending') ||
              (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0) ||
              a.name.localeCompare(b.name)
          );
          setUsers(list);
          markRealtimeSync();
        },
        (error) => {
          console.warn('Firestore users listener:', error.message);
        }
      );
    } catch (err) {
      console.warn('Firestore users setup error:', err);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin]);

  // Sync current user's profile state when their Firestore UserAccount updates in real-time
  useEffect(() => {
    if (!user) return;
    const matched = users.find(u => u.email.toLowerCase() === user.toLowerCase());
    if (matched) {
      setProfile(prev => {
        if (
          prev.name === matched.name &&
          prev.role === matched.role &&
          prev.phone === matched.phone &&
          prev.department === matched.department &&
          prev.email === matched.email
        ) {
          return prev;
        }
        return {
          ...prev,
          name: matched.name,
          role: matched.role,
          phone: matched.phone,
          department: matched.department,
          email: matched.email,
          themeMode: matched.themeMode || prev.themeMode
        };
      });
    }
  }, [users, user]);

  // 2. Real-time listener for `employees` (approved users only)
  useEffect(() => {
    if (!canAccessData) return;
    let unsubscribe: (() => void) | undefined;
    try {
      const colRef = collection(db, 'employees');
      unsubscribe = onSnapshot(
        colRef,
        async (snapshot) => {
          if (snapshot.empty) {
            for (const emp of initialEmployees) {
              try {
                await setDoc(doc(db, 'employees', emp.id), emp, { merge: true });
              } catch (err) {
                console.warn(`Failed seeding employee ${emp.id}:`, err);
              }
            }
            setEmployees(initialEmployees);
            saveToStorage('employees', initialEmployees);
          } else {
            const list: Employee[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Employee;
              list.push({
                ...data,
                id: data.id || docSnap.id
              });
            });
            list.sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0) || a.name.localeCompare(b.name));
            setEmployees(list);
            saveToStorage('employees', list);
          }
          setIsLoadingEmployees(false);
          markRealtimeSync();
        },
        (error) => {
          console.warn("Firestore employees listener:", error.message);
          setIsLoadingEmployees(false);
        }
      );
    } catch (err) {
      console.warn("Firestore employees setup error:", err);
      setIsLoadingEmployees(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [canAccessData]);

  // 3. Real-time listener for `repairs`, `projects`, `quotations`, `internal_notes`, `activity_logs`
  // (approved users only; the audit log is admin-only)
  useEffect(() => {
    if (!canAccessData) return;
    const unsubs: Array<() => void> = [];

    try {
      // Repairs real-time sync (with live notification diff detection)
      unsubs.push(
        onSnapshot(
          collection(db, 'repairs'),
          async (snapshot) => {
            if (snapshot.empty) {
              for (const r of initialRepairs) {
                knownRepairsRef.current[r.id] = r;
                setDoc(doc(db, 'repairs', r.id), r, { merge: true }).catch(() => {});
              }
              repairsInitializedRef.current = true;
            } else {
              const list: Repair[] = [];
              snapshot.forEach((d) => list.push({ ...(d.data() as Repair), id: d.id }));
              list.sort((a, b) => b.receivedDate.localeCompare(a.receivedDate));

              if (repairsInitializedRef.current) {
                list.forEach((incomingRepair) => {
                  const prevRepair = knownRepairsRef.current[incomingRepair.id];
                  const assignedToMe = isAssignedToUser(
                    incomingRepair.assignedTech,
                    profile,
                    currentUserAccount,
                    user
                  );

                  if (!prevRepair) {
                    // Brand-new repair created
                    if (assignedToMe || notificationPrefs.notifyAllTeamRepairs) {
                      pushLocalNotification({
                        dedupeKey: `repair-new-${incomingRepair.id}`,
                        title: assignedToMe
                          ? '🔔 ວຽກສ້ອມແປງໃໝ່ມອບໝາຍໃຫ້ທ່ານ!'
                          : '🔧 ມີວຽກສ້ອມແປງໃໝ່ໃນລະບົບ',
                        message: `ບັດ ${incomingRepair.id}: ${incomingRepair.model} (${incomingRepair.client}) • ຜູ້ຮັບຜິດຊອບ: ${incomingRepair.assignedTech}`,
                        category: 'repair_assigned',
                        priority: incomingRepair.priority || 'Medium',
                        isAssignedToMe: assignedToMe,
                        targetId: incomingRepair.id,
                        targetView: 'repair_details',
                        assignedTech: incomingRepair.assignedTech,
                        newStatus: incomingRepair.status
                      });
                    }
                  } else {
                    // Existing repair: check if technician assignment changed or status changed
                    if (prevRepair.assignedTech !== incomingRepair.assignedTech) {
                      if (assignedToMe || notificationPrefs.notifyAllTeamRepairs) {
                        pushLocalNotification({
                          dedupeKey: `repair-assign-${incomingRepair.id}-${incomingRepair.assignedTech}`,
                          title: assignedToMe
                            ? '🔔 ມອບໝາຍວຽກສ້ອມແປງໃຫ້ທ່ານ!'
                            : '👤 ປ່ຽນຊ່າງຜູ້ຮັບຜິດຊອບວຽກສ້ອມແປງ',
                          message: `ບັດ ${incomingRepair.id} (${incomingRepair.model}) ຖືກມອບໝາຍໃຫ້ ${incomingRepair.assignedTech}`,
                          category: 'repair_assigned',
                          priority: incomingRepair.priority || 'Medium',
                          isAssignedToMe: assignedToMe,
                          targetId: incomingRepair.id,
                          targetView: 'repair_details',
                          assignedTech: incomingRepair.assignedTech
                        });
                      }
                    } else if (prevRepair.status !== incomingRepair.status) {
                      pushLocalNotification({
                        dedupeKey: `repair-status-${incomingRepair.id}-${incomingRepair.status}`,
                        title: '🔧 ອັບເດດສະຖານະວຽກສ້ອມແປງ',
                        message: `ບັດ ${incomingRepair.id} (${incomingRepair.model}): ປ່ຽນຈາກ "${prevRepair.status}" ເປັນ "${incomingRepair.status}"`,
                        category: 'repair_status',
                        priority: incomingRepair.priority || 'Medium',
                        isAssignedToMe: assignedToMe,
                        targetId: incomingRepair.id,
                        targetView: 'repair_details',
                        assignedTech: incomingRepair.assignedTech,
                        previousStatus: prevRepair.status,
                        newStatus: incomingRepair.status
                      });
                    }
                  }
                });
              }

              const nextMap: Record<string, Repair> = {};
              list.forEach((r) => {
                nextMap[r.id] = r;
              });
              knownRepairsRef.current = nextMap;
              repairsInitializedRef.current = true;

              setRepairs(list);
              saveToStorage('repairs', list);
              markRealtimeSync();
            }
          },
          () => {}
        )
      );

      // Projects real-time sync (with live status change notification detection)
      unsubs.push(
        onSnapshot(
          collection(db, 'projects'),
          async (snapshot) => {
            if (snapshot.empty) {
              for (const p of initialProjects) {
                knownProjectsRef.current[p.id] = p;
                setDoc(doc(db, 'projects', p.id), p, { merge: true }).catch(() => {});
              }
              projectsInitializedRef.current = true;
            } else {
              const list: Project[] = [];
              snapshot.forEach((d) => list.push({ ...(d.data() as Project), id: d.id }));

              if (projectsInitializedRef.current) {
                list.forEach((incomingProj) => {
                  const prevProj = knownProjectsRef.current[incomingProj.id];
                  if (
                    prevProj &&
                    (prevProj.status !== incomingProj.status ||
                      prevProj.progress !== incomingProj.progress)
                  ) {
                    const statusChanged = prevProj.status !== incomingProj.status;
                    pushLocalNotification({
                      dedupeKey: `proj-status-${incomingProj.id}-${incomingProj.status}-${incomingProj.progress}`,
                      title: statusChanged
                        ? '📌 ສະຖານະໂຄງການສຳຫຼວດປ່ຽນແປງ!'
                        : '📊 ອັບເດດຄວາມຄືບໜ້າໂຄງການສຳຫຼວດ',
                      message: statusChanged
                        ? `ໂຄງການ ${incomingProj.id} (${incomingProj.title}): ປ່ຽນສະຖານະຈາກ "${prevProj.status}" ➔ "${incomingProj.status}" (${incomingProj.progress}%)`
                        : `ໂຄງການ ${incomingProj.id} (${incomingProj.title}): ຄວາມຄືບໜ້າປັບເປັນ ${incomingProj.progress}% (${incomingProj.status})`,
                      category: 'project_status',
                      targetId: incomingProj.id,
                      targetView: 'project_details',
                      previousStatus: prevProj.status,
                      newStatus: incomingProj.status
                    });
                  }
                });
              }

              const nextProjMap: Record<string, Project> = {};
              list.forEach((p) => {
                nextProjMap[p.id] = p;
              });
              knownProjectsRef.current = nextProjMap;
              projectsInitializedRef.current = true;

              setProjects(list);
              saveToStorage('projects', list);
              markRealtimeSync();
            }
          },
          () => {}
        )
      );

      // Quotations real-time sync
      unsubs.push(
        onSnapshot(
          collection(db, 'quotations'),
          async (snapshot) => {
            if (snapshot.empty) {
              for (const q of initialQuotations) {
                setDoc(doc(db, 'quotations', q.id), q, { merge: true }).catch(() => {});
              }
            } else {
              const list: Quotation[] = [];
              snapshot.forEach((d) => list.push({ ...(d.data() as Quotation), id: d.id }));
              const refQuote = initialQuotations[0];
              if (refQuote && !list.some((q) => q.id === refQuote.id)) {
                list.unshift(refQuote);
                setDoc(doc(db, 'quotations', refQuote.id), refQuote, { merge: true }).catch(() => {});
              }
              setQuotations(list);
              saveToStorage('quotations', list);
              markRealtimeSync();
            }
          },
          () => {}
        )
      );

      // Internal Notes real-time sync
      unsubs.push(
        onSnapshot(
          collection(db, 'internal_notes'),
          async (snapshot) => {
            if (snapshot.empty) {
              for (const n of initialNotes) {
                setDoc(doc(db, 'internal_notes', n.id), n, { merge: true }).catch(() => {});
              }
            } else {
              const list: InternalNote[] = [];
              snapshot.forEach((d) => list.push({ ...(d.data() as InternalNote), id: d.id }));
              setNotes(list);
              saveToStorage('notes', list);
              markRealtimeSync();
            }
          },
          () => {}
        )
      );

      // Activity Logs real-time sync (admins only)
      if (isAdmin) unsubs.push(
        onSnapshot(
          collection(db, 'activity_logs'),
          (snapshot) => {
            if (!snapshot.empty) {
              const list: UserLog[] = [];
              snapshot.forEach((d) => list.push({ ...(d.data() as UserLog), id: d.id }));
              list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
              setActivityLogs(list.slice(0, 50));
              saveToStorage('logs', list.slice(0, 50));
              markRealtimeSync();
            }
          },
          () => {}
        )
      );

      // CORS Stations real-time sync (with coordinates from http://183.182.105.253/index.aspx)
      unsubs.push(
        onSnapshot(
          collection(db, 'cors_stations'),
          async (snapshot) => {
            if (snapshot.empty) {
              const enrichedDefaults = initialCORSStations.map(enrichStationWithPortalCoords);
              for (const st of enrichedDefaults) {
                setDoc(doc(db, 'cors_stations', st.id), st, { merge: true }).catch(() => {});
              }
              setStations(enrichedDefaults);
              saveToStorage('stations', enrichedDefaults);
            } else {
              const firestoreMap: Record<string, CORSStation> = {};
              snapshot.forEach((d) => {
                const raw = d.data() as CORSStation;
                const stId = raw.id || d.id;
                firestoreMap[stId] = enrichStationWithPortalCoords({ ...raw, id: stId });
              });

              // Merge with initialCORSStations so all 73 stations are present
              const mergedList: CORSStation[] = initialCORSStations.map((seedSt) => {
                if (firestoreMap[seedSt.id]) {
                  const found = firestoreMap[seedSt.id];
                  delete firestoreMap[seedSt.id];
                  return found;
                }
                return enrichStationWithPortalCoords(seedSt);
              });

              // Append any newly added custom CORS stations from Firestore
              Object.values(firestoreMap).forEach((extraSt) => {
                mergedList.push(extraSt);
              });

              mergedList.sort((a, b) => a.id.localeCompare(b.id));
              setStations(mergedList);
              saveToStorage('stations', mergedList);
              markRealtimeSync();
            }
          },
          () => {}
        )
      );
      // Firebase Auth listener & Cloud SQL PostgreSQL Quotations sync
      unsubs.push(
        onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            try {
              const idToken = await fbUser.getIdToken();
              setAuthTokenInMemory(idToken);
              const sqlData = await fetchQuotationsAndReportFromSql();
              if (sqlData && sqlData.quotations.length > 0) {
                setQuotations((prev) => {
                  const map = new Map<string, Quotation>();
                  sqlData.quotations.forEach((q) => map.set(q.id, q));
                  prev.forEach((q) => {
                    if (!map.has(q.id)) {
                      map.set(q.id, q);
                      saveQuotationToSql(q).catch(() => {});
                    }
                  });
                  const merged = Array.from(map.values());
                  saveToStorage('quotations', merged);
                  return merged;
                });
                setSqlQuotationReport(sqlData.report);
                markRealtimeSync();
              }
            } catch {
              // Silent fallback to local/Firestore state
            }
          } else {
            setAuthTokenInMemory(null);
          }
        })
      );
    } catch (err) {
      console.warn("Real-time listeners setup notice:", err);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [canAccessData, isAdmin]);

  // Auto-sync theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (profile.themeMode === 'Dark') {
      root.classList.add('dark');
    } else if (profile.themeMode === 'Light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [profile.themeMode]);

  // Sync state changes to storage
  useEffect(() => saveToStorage('repairs', repairs), [repairs]);
  useEffect(() => saveToStorage('projects', projects), [projects]);
  useEffect(() => saveToStorage('stations', stations), [stations]);
  useEffect(() => saveToStorage('equipment', equipment), [equipment]);
  useEffect(() => saveToStorage('quotations', quotations), [quotations]);
  useEffect(() => saveToStorage('notes', notes), [notes]);
  useEffect(() => saveToStorage('profile', profile), [profile]);
  useEffect(() => saveToStorage('employees', employees), [employees]);
  useEffect(() => saveToStorage('users_db', users), [users]);
  useEffect(() => saveToStorage('logs', activityLogs), [activityLogs]);
  useEffect(() => saveToStorage('notifications', notifications), [notifications]);
  useEffect(() => saveToStorage('notification_prefs', notificationPrefs), [notificationPrefs]);

  const logUserOperation = (action: string, details: string, type: UserLog['type']) => {
    const timestamp = new Date().toLocaleString('en-GB');
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const signedInEmail = auth.currentUser && !auth.currentUser.isAnonymous ? auth.currentUser.email : null;
    const newLog: UserLog = {
      id,
      timestamp,
      action,
      details,
      type,
      userEmail: signedInEmail || user || profile.email,
      createdAtMs: Date.now()
    };
    setActivityLogs(prev => [newLog, ...prev]);
    markRealtimeSync();
    // Only signed-in users can append to the audit log (firestore.rules).
    if (signedInEmail) {
      setDoc(doc(db, 'activity_logs', id), newLog).catch(() => {});
    }
  };

  // Helper to update current user's real-time presence in Firestore
  const syncCurrentUserActivity = async (
    targetEmail: string,
    updates: Partial<UserAccount>
  ) => {
    // Only ever writes the signed-in user's own profile, and only self-editable fields.
    const fbUser = auth.currentUser;
    if (!fbUser || fbUser.isAnonymous) return;
    void targetEmail;
    const nowTime = new Date().toLocaleTimeString('en-GB');
    const safe: Record<string, unknown> = {};
    for (const key of SELF_EDITABLE_FIELDS) {
      if (updates[key] !== undefined) safe[key] = updates[key];
    }
    safe.lastActive = `ອັບເດດເມື່ອ ${nowTime}`;
    setMyAccount((prev) => (prev ? ({ ...prev, ...safe } as UserAccount) : prev));
    setUsers((prev) => prev.map((u) => (u.id === fbUser.uid ? ({ ...u, ...safe } as UserAccount) : u)));
    updateDoc(doc(db, 'users', fbUser.uid), safe).catch(() => {});
    markRealtimeSync();
  };

  const login = async (
    identifier: string,
    passwordInput?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim();
    const email = cleanId.includes('@') ? cleanId : `${cleanId}@uniqtek.la`;
    if (!passwordInput) {
      return { success: false, message: 'ກະລຸນາປ້ອນລະຫັດຜ່ານ' };
    }
    try {
      await signInWithEmailAndPassword(auth, email, passwordInput);
      logUserOperation('ເຂົ້າສູ່ລະບົບສຳເລັດ', `ຜູ້ໃຊ້: ${email}`, 'auth');
      return { success: true };
    } catch (err) {
      return { success: false, message: authErrorMessageLao(err) };
    }
  };

  const registerAccount = async (
    data: RegistrationInput
  ): Promise<{ success: boolean; message?: string }> => {
    const { email, password, ...details } = data;
    pendingRegistrationRef.current = details;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateFirebaseAuthProfile(cred.user, { displayName: details.name }).catch(() => {});
      logUserOperation('ລົງທະບຽນ ແລະ ຂໍສິດເຂົ້າໃຊ້ລະບົບ', `ຜູ້ໃຊ້: ${email.trim()}`, 'auth');
      return { success: true };
    } catch (err) {
      pendingRegistrationRef.current = null;
      return { success: false, message: authErrorMessageLao(err) };
    }
  };

  const sendPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err) {
      return { success: false, message: authErrorMessageLao(err) };
    }
  };

  // A rejected user may ask again (rejected -> pending); pending users can update their note.
  const requestAccessAgain = async (note?: string) => {
    const fbUser = auth.currentUser;
    if (!fbUser || !myAccount) return;
    const updates: Record<string, unknown> = {
      requestedAt: new Date().toLocaleString('en-GB'),
      requestNote: (note ?? myAccount.requestNote ?? '').trim()
    };
    if (myAccount.approvalStatus === 'rejected') updates.approvalStatus = 'pending';
    await updateDoc(doc(db, 'users', fbUser.uid), updates);
    logUserOperation('ສົ່ງຄຳຂໍສິດເຂົ້າໃຊ້ລະບົບ', `ຜູ້ໃຊ້: ${fbUser.email}`, 'auth');
  };

  const approveUser = async (id: string, accessLevel: UserAccount['accessLevel']) => {
    const target = users.find((u) => u.id === id);
    await updateDoc(doc(db, 'users', id), {
      approvalStatus: 'approved',
      accessLevel,
      accountEnabled: true,
      reviewedBy: user || '',
      reviewedAt: new Date().toLocaleString('en-GB')
    });
    logUserOperation(
      'ອະນຸມັດສິດເຂົ້າໃຊ້ລະບົບ',
      `ຜູ້ໃຊ້: ${target?.name || id} (${target?.email || ''}) • ສິດ: ${accessLevel}`,
      'auth'
    );
  };

  const rejectUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    await updateDoc(doc(db, 'users', id), {
      approvalStatus: 'rejected',
      reviewedBy: user || '',
      reviewedAt: new Date().toLocaleString('en-GB')
    });
    logUserOperation(
      'ປະຕິເສດຄຳຂໍສິດເຂົ້າໃຊ້ລະບົບ',
      `ຜູ້ໃຊ້: ${target?.name || id} (${target?.email || ''})`,
      'auth'
    );
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      setAuthTokenInMemory(token);

      const emailAddr = result.user.email || '';
      const displayName = result.user.displayName || emailAddr.split('@')[0];

      // The users/{uid} profile (and access request) is created by the auth listener.
      logUserOperation(
        'ເຂົ້າສູ່ລະບົບດ້ວຍ Google ສຳເລັດ',
        `ຜູ້ໃຊ້: ${displayName} (${emailAddr})`,
        'auth'
      );
      return { success: true };
    } catch (error) {
      return { success: false, message: authErrorMessageLao(error) };
    }
  };

  const logout = async () => {
    const lastUser = user || 'ບໍ່ລະບຸ';
    logUserOperation('ອອກຈາກລະບົບ', `ຜູ້ໃຊ້: ${lastUser}`, 'auth');
    if (myAccount) {
      await syncCurrentUserActivity(lastUser, {
        status: 'Offline',
        currentActivity: 'ອອກຈາກລະບົບແລ້ວ'
      });
    }
    await signOut(auth).catch(() => {});
    // Don't leave company data cached for the next person on this device.
    CACHED_DATA_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(`uniqtek_${key}`);
      } catch {
        /* storage unavailable */
      }
    });
    setUsers([]);
    setActivityLogs([]);
    setCurrentView('dashboard');
    setSelectedRepair(null);
    setSelectedProject(null);
    setSelectedQuotation(null);
  };

  const navigateTo = (view: string) => {
    setCurrentView(view);
    if (view !== 'repair_details') setSelectedRepair(null);
    if (view !== 'project_details') setSelectedProject(null);
    if (view !== 'quotation_details') setSelectedQuotation(null);

    if (user && VIEW_LABELS_LAO[view]) {
      syncCurrentUserActivity(user, {
        currentActivity: VIEW_LABELS_LAO[view]
      });
    }
  };

  const selectRepair = (repair: Repair | null) => {
    setSelectedRepair(repair);
    if (repair) navigateTo('repair_details');
  };

  const selectProject = (project: Project | null) => {
    setSelectedProject(project);
    if (project) navigateTo('project_details');
  };

  const selectQuotation = (quotation: Quotation | null) => {
    setSelectedQuotation(quotation);
    if (quotation) navigateTo('quotation_details');
  };

  const addRepair = (
    serialNo: string,
    model: string,
    title: string,
    client: string,
    problem: string,
    assignedTech: string,
    priority: 'High' | 'Medium' | 'Low' = 'Medium'
  ) => {
    const date = new Date().toISOString().split('T')[0];
    const id = `REP-2024-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRepair: Repair = {
      id,
      serialNo: serialNo.startsWith("SN:") ? serialNo : `SN: ${serialNo}`,
      model,
      title,
      client,
      receivedDate: date,
      status: "ລໍຖ້າກວດເຊັກ",
      priority: priority || 'Medium',
      problem,
      cause: "",
      solution: "",
      assignedTech: assignedTech || "ສົມພອນ ເພັດດາລາ",
      timeline: [
        {
          id: "t1",
          date: `${date} - 09:00`,
          title: "ຮັບເຄື່ອງ ແລະ ລົງທະບຽນ",
          desc: "ອຸປະກອນຖືກຮັບເຂົ້າສາງ ແລະ ກວດສອບເບື້ອງຕົ້ນ.",
          done: true,
          status: "done"
        }
      ]
    };
    knownRepairsRef.current[id] = newRepair;
    setRepairs(prev => [newRepair, ...prev]);
    setDoc(doc(db, 'repairs', id), newRepair, { merge: true }).catch(() => {});
    logUserOperation("ເພີ່ມລາຍການສ້ອມແປງ", `ເລກບັດ: ${id}, ອຸປະກອນ: ${model} (${serialNo}), ບູລິມະສິດ: ${priority}`, "repair");

    const assignedToMe = isAssignedToUser(
      newRepair.assignedTech,
      profile,
      currentUserAccount,
      user
    );
    if (assignedToMe || notificationPrefs.notifyAllTeamRepairs) {
      pushLocalNotification({
        dedupeKey: `repair-new-${id}`,
        title: assignedToMe
          ? '🔔 ວຽກສ້ອມແປງໃໝ່ມອບໝາຍໃຫ້ທ່ານ!'
          : '🔧 ມອບໝາຍວຽກສ້ອມແປງໃໝ່ສຳເລັດ',
        message: `ບັດ ${id}: ${model} (${client}) • ຊ່າງຜູ້ຮັບຜິດຊອບ: ${newRepair.assignedTech}`,
        category: 'repair_assigned',
        priority: newRepair.priority || 'Medium',
        isAssignedToMe: assignedToMe,
        targetId: id,
        targetView: 'repair_details',
        assignedTech: newRepair.assignedTech,
        newStatus: newRepair.status
      });
    }
  };

  const updateRepairStatus = (
    repair: Repair,
    newStatus: 'ກຳລັງສ້ອມແປງ' | 'ສຳເລັດແລ້ວ' | 'ລໍຖ້າກວດເຊັກ' | 'ກຳລັງສຳຫຼວດ',
    cause = '',
    solution = '',
    priority?: 'High' | 'Medium' | 'Low',
    assignedTech?: string
  ) => {
    const currentTimeline = [...repair.timeline];
    const nowStr = new Date().toLocaleString('en-GB');
    const nextId = `t${currentTimeline.length + 1}`;
    const nextTech = assignedTech ? assignedTech.trim() : repair.assignedTech;
    const techChanged = nextTech !== repair.assignedTech;

    currentTimeline.push({
      id: nextId,
      date: nowStr,
      title: techChanged
        ? `ອັບເດດສະຖານະ: ${newStatus} (ຜູ້ຮັບຜິດຊອບ: ${nextTech})`
        : `ອັບເດດສະຖານະ: ${newStatus}`,
      desc: newStatus === 'ສຳເລັດແລ້ວ' ? "ສ້ອມແປງສຳເລັດ ແລະ ພ້ອມສົ່ງມອບ" : "ປ່ຽນສະຖານະໃນລະບົບຈັດການສ້ອມແປງ",
      done: true,
      status: "done"
    });

    const updated: Repair = {
      ...repair,
      status: newStatus,
      priority: priority || repair.priority || 'Medium',
      cause: cause || repair.cause,
      solution: solution || repair.solution,
      assignedTech: nextTech,
      timeline: currentTimeline
    };

    knownRepairsRef.current[repair.id] = updated;
    setRepairs(prev => prev.map(r => r.id === repair.id ? updated : r));
    if (selectedRepair?.id === repair.id) {
      setSelectedRepair(updated);
    }
    setDoc(doc(db, 'repairs', repair.id), updated, { merge: true }).catch(() => {});
    logUserOperation("ອັບເດດສະຖານະການສ້ອມແປງ", `ບັດ: ${repair.id}, ສະຖານະ: ${newStatus}, ຊ່າງ: ${nextTech}`, "repair");

    const assignedToMe = isAssignedToUser(nextTech, profile, currentUserAccount, user);
    if (techChanged && (assignedToMe || notificationPrefs.notifyAllTeamRepairs)) {
      pushLocalNotification({
        dedupeKey: `repair-assign-${repair.id}-${nextTech}`,
        title: assignedToMe
          ? '🔔 ວຽກສ້ອມແປງຖືກໂອນມອບໝາຍໃຫ້ທ່ານ!'
          : '👤 ປ່ຽນຊ່າງຜູ້ຮັບຜິດຊອບວຽກສ້ອມແປງ',
        message: `ບັດ ${repair.id} (${repair.model}) ຖືກມອບໝາຍໃຫ້ ${nextTech} • ສະຖານະ: ${newStatus}`,
        category: 'repair_assigned',
        priority: updated.priority,
        isAssignedToMe: assignedToMe,
        targetId: repair.id,
        targetView: 'repair_details',
        assignedTech: nextTech,
        previousStatus: repair.status,
        newStatus
      });
    } else if (repair.status !== newStatus) {
      pushLocalNotification({
        dedupeKey: `repair-status-${repair.id}-${newStatus}`,
        title: '🔧 ອັບເດດສະຖານະວຽກສ້ອມແປງ',
        message: `ບັດ ${repair.id} (${repair.model}): ປ່ຽນສະຖານະຈາກ "${repair.status}" ➔ "${newStatus}"`,
        category: 'repair_status',
        priority: updated.priority,
        isAssignedToMe: assignedToMe,
        targetId: repair.id,
        targetView: 'repair_details',
        assignedTech: nextTech,
        previousStatus: repair.status,
        newStatus
      });
    }
  };

  const addInternalNote = (repairId: string, author: string, text: string) => {
    const date = new Date().toLocaleDateString('en-GB');
    const id = `note-${Math.random().toString(36).substring(2, 9)}`;
    const newNote: InternalNote = { id, repairId, author, date, text };
    setNotes(prev => [newNote, ...prev]);
    setDoc(doc(db, 'internal_notes', id), newNote, { merge: true }).catch(() => {});
    logUserOperation("ເພີ່ມບັນທຶກພາຍໃນ", `ເລກບັດ: ${repairId}, ໂດຍ: ${author}`, "repair");
  };

  const addProject = (
    title: string,
    client: string,
    location: string,
    lat: number,
    lng: number,
    teamName: string,
    teamRole: string,
    teamPhone: string
  ) => {
    const id = `PRJ-${Math.floor(100 + Math.random() * 900)}`;
    const newProject: Project = {
      id,
      title,
      client,
      progress: 0,
      status: "ກຳລັງສຳຫຼວດ",
      location,
      coordinatesLat: lat,
      coordinatesLng: lng,
      team: [
        {
          name: teamName || "ທ່ານ ອານຸສອນ ສີຫາວົງ",
          role: teamRole || "ຫົວໜ້າທີມສຳຫຼວດ",
          active: true,
          phone: teamPhone || "020 5556 1234"
        }
      ]
    };
    knownProjectsRef.current[id] = newProject;
    setProjects(prev => [newProject, ...prev]);
    setDoc(doc(db, 'projects', id), newProject, { merge: true }).catch(() => {});
    logUserOperation("ເພີ່ມໂຄງການສຳຫຼວດ", `ໂຄງການ: ${title}, ສະຖານທີ່: ${location}`, "project");

    pushLocalNotification({
      dedupeKey: `proj-new-${id}`,
      title: '📌 ເປີດໂຄງການສຳຫຼວດໃໝ່',
      message: `ໂຄງການ ${id}: ${title} (${location}) • ສະຖານະເລີ່ມຕົ້ນ: ກຳລັງສຳຫຼວດ`,
      category: 'project_status',
      targetId: id,
      targetView: 'project_details',
      newStatus: 'ກຳລັງສຳຫຼວດ'
    });
  };

  const updateProjectProgress = (
    project: Project,
    progress: number,
    status: 'ກຳລັງສຳຫຼວດ' | 'ລໍຖ້າການວິເຄາະ' | 'ສຳເລັດແລ້ວ'
  ) => {
    const updated: Project = { ...project, progress, status };
    knownProjectsRef.current[project.id] = updated;
    setProjects(prev => prev.map(p => p.id === project.id ? updated : p));
    if (selectedProject?.id === project.id) {
      setSelectedProject(updated);
    }
    setDoc(doc(db, 'projects', project.id), updated, { merge: true }).catch(() => {});
    logUserOperation("ອັບເດດໂຄງການສຳຫຼວດ", `ໂຄງການ: ${project.id}, ສະຖານະ: ${status}, ຄວາມຄືບໜ້າ: ${progress}%`, "project");

    const statusChanged = project.status !== status;
    pushLocalNotification({
      dedupeKey: `proj-status-${project.id}-${status}-${progress}`,
      title: statusChanged
        ? '📌 ສະຖານະໂຄງການສຳຫຼວດປ່ຽນແປງ!'
        : '📊 ອັບເດດຄວາມຄືບໜ້າໂຄງການສຳຫຼວດ',
      message: statusChanged
        ? `ໂຄງການ ${project.id} (${project.title}): ປ່ຽນສະຖານະຈາກ "${project.status}" ➔ "${status}" (${progress}%)`
        : `ໂຄງການ ${project.id} (${project.title}): ຄວາມຄືບໜ້າປັບເປັນ ${progress}% (${status})`,
      category: 'project_status',
      targetId: project.id,
      targetView: 'project_details',
      previousStatus: project.status,
      newStatus: status
    });
  };

  const toggleStationStatus = (station: CORSStation) => {
    const newStatus = station.status === 'Online' ? 'Offline' : 'Online';
    const updated: CORSStation = { ...station, status: newStatus };
    setStations(prev => prev.map(s => s.id === station.id ? updated : s));
    setDoc(doc(db, 'cors_stations', station.id), updated, { merge: true }).catch(() => {});
    logUserOperation("ປ່ຽນສະຖານະສະຖານີ CORS", `ສະຖານີ: ${station.name} (${station.id}) -> ${newStatus}`, "cors");
  };

  const updateStationIssue = (station: CORSStation, issue: string) => {
    const updated: CORSStation = { ...station, issue };
    setStations(prev => prev.map(s => s.id === station.id ? updated : s));
    setDoc(doc(db, 'cors_stations', station.id), updated, { merge: true }).catch(() => {});
    logUserOperation("ອັບເດດບັນຫາສະຖານີ CORS", `ສະຖານີ: ${station.name}, ບັນຫາ: ${issue}`, "cors");
  };

  const updateStationCoordinates = async (
    stationId: string,
    updates: {
      name?: string;
      lat: number;
      lng: number;
      elevation?: number;
      province?: string;
      satellites?: number;
      mountpoint?: string;
      issue?: string;
      notes?: string;
      status?: 'Online' | 'Offline';
      coordSource?: string;
    }
  ) => {
    const existing = stations.find((s) => s.id === stationId);
    if (!existing) return;

    const nowStr = new Date().toLocaleString('en-GB');
    const updated: CORSStation = {
      ...existing,
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      lat: Number(updates.lat.toFixed(6)),
      lng: Number(updates.lng.toFixed(6)),
      ...(updates.elevation !== undefined ? { elevation: Number(updates.elevation) } : {}),
      ...(updates.province !== undefined ? { province: updates.province } : {}),
      ...(updates.satellites !== undefined ? { satellites: Number(updates.satellites) } : {}),
      ...(updates.mountpoint !== undefined ? { mountpoint: updates.mountpoint } : {}),
      ...(updates.issue !== undefined ? { issue: updates.issue } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      coordSource: updates.coordSource || CORS_SERVER_PORTAL_URL,
      lastCoordSync: nowStr
    };

    setStations((prev) => prev.map((s) => (s.id === stationId ? updated : s)));
    markRealtimeSync();

    try {
      await setDoc(doc(db, 'cors_stations', stationId), updated, { merge: true });
      logUserOperation(
        'ອັບເດດພິກັດສະຖານີ CORS (Coordinate Position)',
        `ສະຖານີ: ${updated.id} (${updated.name}) -> Lat: ${updates.lat.toFixed(6)}, Lng: ${updates.lng.toFixed(6)}, H: ${updated.elevation ?? 170}m [${updated.coordSource}]`,
        'cors'
      );
    } catch (err) {
      console.warn('Failed updating station coordinates in Firestore:', err);
    }
  };

  const batchUpdateStationCoordinates = async (
    entries: Array<{
      id: string;
      name?: string;
      lat: number;
      lng: number;
      elevation?: number;
      province?: string;
      satellites?: number;
      mountpoint?: string;
      status?: 'Online' | 'Offline';
    }>,
    sourceLabel: string = CORS_SERVER_PORTAL_URL
  ): Promise<number> => {
    if (!entries || entries.length === 0) return 0;
    const nowStr = new Date().toLocaleString('en-GB');
    const entryLookup: Record<string, (typeof entries)[number]> = {};
    entries.forEach((item) => {
      entryLookup[item.id.trim().toUpperCase()] = item;
    });

    let updatedCount = 0;
    const nextStations = stations.map((st) => {
      const match = entryLookup[st.id.toUpperCase()];
      if (!match) return st;
      updatedCount++;
      delete entryLookup[st.id.toUpperCase()];
      const updatedSt: CORSStation = {
        ...st,
        ...(match.name ? { name: match.name } : {}),
        lat: Number(match.lat.toFixed(6)),
        lng: Number(match.lng.toFixed(6)),
        elevation:
          typeof match.elevation === 'number' ? match.elevation : st.elevation ?? 170,
        province: match.province || st.province || 'ສປປ ລາວ',
        satellites:
          typeof match.satellites === 'number' ? match.satellites : st.satellites ?? 32,
        mountpoint: match.mountpoint || st.mountpoint || `${st.id}_RTCM32`,
        ...(match.status ? { status: match.status } : {}),
        coordSource: sourceLabel,
        lastCoordSync: nowStr
      };
      setDoc(doc(db, 'cors_stations', updatedSt.id), updatedSt, { merge: true }).catch(
        () => {}
      );
      return updatedSt;
    });

    // Also add any brand-new station IDs from the batch input
    Object.values(entryLookup).forEach((newItem) => {
      const cleanId = newItem.id.trim().toUpperCase();
      if (!cleanId) return;
      updatedCount++;
      const createdSt: CORSStation = {
        id: cleanId,
        name: newItem.name || cleanId,
        type: 'ໃໝ່',
        status: newItem.status || 'Online',
        issue: 'none',
        lat: Number(newItem.lat.toFixed(6)),
        lng: Number(newItem.lng.toFixed(6)),
        elevation: newItem.elevation ?? 175,
        province: newItem.province || 'ສປປ ລາວ',
        satellites: newItem.satellites ?? 32,
        mountpoint: newItem.mountpoint || `${cleanId}_RTCM32`,
        coordSource: sourceLabel,
        lastCoordSync: nowStr
      };
      nextStations.push(createdSt);
      setDoc(doc(db, 'cors_stations', createdSt.id), createdSt, { merge: true }).catch(
        () => {}
      );
    });

    nextStations.sort((a, b) => a.id.localeCompare(b.id));
    setStations(nextStations);
    markRealtimeSync();
    logUserOperation(
      'ນຳເຂົ້າພິກັດສະຖານີ CORS ແບບກຸ່ມ (Batch Coordinate Sync)',
      `ອັບເດດພິກັດ ${updatedCount} ສະຖານີ ຈາກ ${sourceLabel}`,
      'cors'
    );
    return updatedCount;
  };

  const syncStationsFromCORSServer = async (): Promise<number> => {
    const nowStr = new Date().toLocaleString('en-GB');
    const syncedList = stations.map((st) => {
      const portalCoord = CORS_COORDINATES[st.id];
      const updatedSt: CORSStation = {
        ...st,
        lat: portalCoord ? portalCoord.lat : st.lat ?? 17.9757,
        lng: portalCoord ? portalCoord.lng : st.lng ?? 102.6331,
        elevation: portalCoord ? portalCoord.elevation : st.elevation ?? 170,
        province: portalCoord ? portalCoord.province : st.province ?? 'ສປປ ລາວ',
        satellites:
          st.status === 'Online'
            ? portalCoord?.satellites ?? st.satellites ?? 32
            : 0,
        mountpoint: portalCoord?.mountpoint || st.mountpoint || `${st.id}_RTCM32`,
        coordSource: CORS_SERVER_PORTAL_URL,
        lastCoordSync: nowStr
      };
      setDoc(doc(db, 'cors_stations', updatedSt.id), updatedSt, { merge: true }).catch(
        () => {}
      );
      return updatedSt;
    });

    setStations(syncedList);
    markRealtimeSync();
    logUserOperation(
      'ຊິ້ງພິກັດສະຖານີ CORS ຈາກເຊີບເວີຫຼັກ',
      `ດຶງ ແລະ ອັບເດດພິກັດທັງໝົດ ${syncedList.length} ສະຖານີ ຈາກ ${CORS_SERVER_PORTAL_URL}`,
      'cors'
    );
    return syncedList.length;
  };

  const addCORSStation = async (stationData: CORSStation): Promise<void> => {
    const cleanId = stationData.id.trim().toUpperCase();
    const nowStr = new Date().toLocaleString('en-GB');
    const newStation: CORSStation = {
      ...stationData,
      id: cleanId,
      lat: Number((stationData.lat ?? 17.9757).toFixed(6)),
      lng: Number((stationData.lng ?? 102.6331).toFixed(6)),
      elevation: Number(stationData.elevation ?? 170),
      mountpoint: stationData.mountpoint || `${cleanId}_RTCM32`,
      coordSource: stationData.coordSource || CORS_SERVER_PORTAL_URL,
      lastCoordSync: nowStr
    };

    setStations((prev) =>
      [...prev.filter((s) => s.id !== cleanId), newStation].sort((a, b) =>
        a.id.localeCompare(b.id)
      )
    );
    markRealtimeSync();

    try {
      await setDoc(doc(db, 'cors_stations', cleanId), newStation, { merge: true });
      logUserOperation(
        'ເພີ່ມສະຖານີ CORS & ພິກັດໃໝ່',
        `ສະຖານີ: ${cleanId} (${newStation.name}) • Lat: ${newStation.lat}, Lng: ${newStation.lng} [${newStation.coordSource}]`,
        'cors'
      );
    } catch (err) {
      console.warn('Failed adding CORS station to Firestore:', err);
    }
  };

  const updateEquipmentDetail = (eq: Equipment) => {
    setEquipment(prev => prev.map(e => e.id === eq.id ? eq : e));
    setDoc(doc(db, 'equipment', String(eq.id)), eq, { merge: true }).catch(() => {});
    logUserOperation("ອັບເດດຂໍ້ມູນອຸປະກອນ", `ເມືອງ: ${eq.districtNameLao}, ລຸ້ນ: ${eq.model}, SN: ${eq.serialNo}`, "system");
  };

  const addQuotation = (
    customerName: string,
    validity: string,
    items: QuotationItem[],
    terms: string,
    extra?: Partial<Quotation>
  ): Quotation => {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.isFree ? 0 : item.qty * item.unitPrice),
      0
    );
    const vatIncluded = extra?.vatIncluded ?? true;
    const vatRate = extra?.vatRate ?? 10;
    const vat = vatIncluded ? 0 : Math.round(subtotal * (vatRate / 100));
    const total = subtotal + vat;

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const date = extra?.date || `${dd}/${mm}/${yyyy}`;
    const refNo = extra?.refNo || `${yyyy}${mm}${dd}-${Math.floor(10 + Math.random() * 89)}`;
    const id = extra?.id || `QT-${yyyy}${mm}${dd}-${Math.floor(10 + Math.random() * 89)}`;

    const newQuotation: Quotation = {
      id,
      refNo,
      revision: extra?.revision ?? 1,
      handledBy: extra?.handledBy || 'Mr Pheng BOUNMUECHANYA',
      customerName,
      customerPhone: extra?.customerPhone || '020 96 666 082',
      deliveryTo: extra?.deliveryTo || customerName,
      deliveryLeadTime: extra?.deliveryLeadTime || '30 Days',
      deliveryTerms: extra?.deliveryTerms || 'Repair Service',
      currency: extra?.currency || 'LAK',
      date,
      validity: validity || '30 Days',
      remark: extra?.remark || '',
      items,
      includeFreeInspection: extra?.includeFreeInspection ?? true,
      terms,
      subtotal,
      vat,
      vatRate,
      vatIncluded,
      total,
      showOfficialStamp: extra?.showOfficialStamp ?? true
    };
    setQuotations((prev) => [newQuotation, ...prev.filter((q) => q.id !== id)]);
    setDoc(doc(db, 'quotations', id), newQuotation, { merge: true }).catch(() => {});
    saveQuotationToSql(newQuotation)
      .then((res) => {
        if (res?.report) setSqlQuotationReport(res.report);
      })
      .catch(() => {});
    logUserOperation(
      'ສ້າງໃບສະເໜີລາຄາ',
      `ເລກທີ: ${refNo} (Rev.${newQuotation.revision}), ລູກຄ້າ: ${customerName}, ຍອດລວມ: ${total.toLocaleString()} LAK`,
      'quote'
    );
    return newQuotation;
  };

  const updateQuotation = (updated: Quotation) => {
    const subtotal = updated.items.reduce(
      (sum, item) => sum + (item.isFree ? 0 : item.qty * item.unitPrice),
      0
    );
    const vatIncluded = updated.vatIncluded ?? true;
    const vatRate = updated.vatRate ?? 10;
    const vat = vatIncluded ? 0 : Math.round(subtotal * (vatRate / 100));
    const total = subtotal + vat;

    const normalized: Quotation = {
      ...updated,
      subtotal,
      vat,
      vatRate,
      vatIncluded,
      total
    };

    setQuotations((prev) => prev.map((q) => (q.id === normalized.id ? normalized : q)));
    setSelectedQuotation((prev) => (prev && prev.id === normalized.id ? normalized : prev));
    setDoc(doc(db, 'quotations', normalized.id), normalized, { merge: true }).catch(() => {});
    saveQuotationToSql(normalized)
      .then((res) => {
        if (res?.report) setSqlQuotationReport(res.report);
      })
      .catch(() => {});
    logUserOperation(
      'ປັບປຸງໃບສະເໜີລາຄາ (Revised Quotation)',
      `ເລກທີ: ${normalized.refNo} (Rev.${normalized.revision ?? 1}), ລູກຄ້າ: ${normalized.customerName}, ຍອດລວມ: ${total.toLocaleString()} LAK`,
      'quote'
    );
  };

  const updateProfile = (name: string, role: string, phone: string, dept: string) => {
    setProfile(prev => ({ ...prev, name, role, phone, department: dept }));
    if (user) {
      syncCurrentUserActivity(user, {
        name,
        role,
        phone,
        department: dept,
        currentActivity: `ອັບເດດຂໍ້ມູນໂປຣໄຟລ໌ (${role})`
      });
    }
    logUserOperation("ອັບເດດຂໍ້ມູນສ່ວນຕົວ (Real-time)", `ຊື່ແທ້: ${name}, ຕຳແໜ່ງ: ${role}, ພະແນກ: ${dept}`, "profile");
  };

  const updateThemeMode = (mode: 'Light' | 'Dark' | 'System') => {
    setProfile(prev => ({ ...prev, themeMode: mode }));
    if (user) {
      syncCurrentUserActivity(user, { themeMode: mode });
    }
    logUserOperation("ປ່ຽນຮູບແບບການສະແດງຜົນ", `ເປັນຮູບແບບ: ${mode}`, "profile");
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id'> & { id?: string }) => {
    const id = employeeData.id || `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const newEmp: Employee = {
      ...employeeData,
      id,
      active: employeeData.active ?? true
    };

    setEmployees(prev => [newEmp, ...prev.filter(e => e.id !== id)]);

    try {
      await setDoc(doc(db, 'employees', id), newEmp, { merge: true });
      logUserOperation("ເພີ່ມຊ່າງເຕັກນິກ / ພະນັກງານ", `ຊື່: ${newEmp.name}, ຕຳແໜ່ງ: ${newEmp.role} (Firestore ID: ${id})`, "system");
    } catch (err) {
      console.warn("Could not save employee to Firestore (offline fallback):", err);
      logUserOperation("ເພີ່ມຊ່າງເຕັກນິກ (Local Cache)", `ຊື່: ${newEmp.name}`, "system");
    }
  };

  // User & Credentials Database CRUD Operations (Real-time synced with Firestore `users` collection)
  // Accounts are created by the people themselves (register / Google) and then approved,
  // because Firebase Auth accounts can't be created for others from the browser.
  const addUserAccount = async (_userData: Omit<UserAccount, 'id' | 'lastActive'> & { id?: string }) => {
    console.warn('addUserAccount is disabled: users register themselves and an admin approves them.');
  };

  const updateUserAccount = async (id: string, updates: Partial<UserAccount>) => {
    const nowTime = new Date().toLocaleTimeString('en-GB');
    const existing = users.find(u => u.id === id);
    if (!existing) return;

    const {
      password: _pw,
      passwordUpdatedAt: _pwAt,
      id: _ignoredId,
      email: _ignoredEmail,
      ...safeUpdates
    } = updates;
    const updatedUser: UserAccount = {
      ...existing,
      ...safeUpdates,
      lastActive: `ອັບເດດເມື່ອ ${nowTime}`
    };

    setUsers(prev => prev.map(u => (u.id === id ? updatedUser : u)));
    markRealtimeSync();

    // If updating the currently logged-in user, also update local profile state
    if (user && (updatedUser.email.toLowerCase() === user.toLowerCase() || existing.email.toLowerCase() === user.toLowerCase())) {
      setUser(updatedUser.email);
      setProfile(prev => ({
        ...prev,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        department: updatedUser.department,
        email: updatedUser.email
      }));
    }

    try {
      await updateDoc(doc(db, 'users', id), {
        ...Object.fromEntries(Object.entries(safeUpdates).filter(([, v]) => v !== undefined)),
        lastActive: updatedUser.lastActive
      });
      logUserOperation(
        "ອັບເດດຖານຂໍ້ມູນຜູ້ໃຊ້ (Real-time)",
        `ຜູ້ໃຊ້: ${updatedUser.name} (${updatedUser.username || updatedUser.email})`,
        "profile"
      );
    } catch (err) {
      console.warn("Failed updating user in Firestore:", err);
      throw err;
    }
  };

  const updateUserCredentials = async (
    id: string,
    username: string,
    email: string,
    password: string
  ) => {
    const nowFull = new Date().toLocaleString('en-GB');
    const nowTime = new Date().toLocaleTimeString('en-GB');
    const existing = users.find(u => u.id === id);
    if (!existing) return;

    // Email and password belong to Firebase Auth; only the display username is stored here.
    void email;
    void password;
    void nowFull;
    const updatedUser: UserAccount = {
      ...existing,
      username: username.trim(),
      lastActive: `ອັບເດດບັນຊີເມື່ອ ${nowTime}`
    };

    setUsers(prev => prev.map(u => (u.id === id ? updatedUser : u)));
    markRealtimeSync();

    try {
      await updateDoc(doc(db, 'users', id), {
        username: updatedUser.username,
        lastActive: updatedUser.lastActive
      });
      logUserOperation(
        "ອັບເດດຂໍ້ມູນ ອີເມວ/ຊື່ຜູ້ໃຊ້ & ລະຫັດຜ່ານ",
        `ບັນຊີ: ${updatedUser.name} (Username: ${updatedUser.username}, Email: ${updatedUser.email})`,
        "auth"
      );
    } catch (err) {
      console.warn("Failed updating credentials in Firestore:", err);
    }
  };

  // Sends a Firebase password-reset email; nobody (not even admins) sees passwords.
  const resetUserPassword = async (id: string) => {
    const existing = users.find(u => u.id === id);
    if (!existing?.email) return;
    try {
      await sendPasswordResetEmail(auth, existing.email);
      logUserOperation(
        "ສົ່ງອີເມວຕັ້ງລະຫັດຜ່ານໃໝ່ (Password Reset)",
        `ບັນຊີ: ${existing.name} (${existing.email})`,
        "auth"
      );
    } catch (err) {
      console.warn("Failed sending password reset email:", err);
      throw err;
    }
  };

  const toggleUserAccountLock = async (id: string) => {
    const existing = users.find(u => u.id === id);
    if (!existing) return;

    const nextEnabled = existing.accountEnabled === false ? true : false;
    const nowTime = new Date().toLocaleTimeString('en-GB');
    const updatedUser: UserAccount = {
      ...existing,
      accountEnabled: nextEnabled,
      status: nextEnabled ? existing.status : 'Offline',
      lastActive: `${nextEnabled ? 'ເປີດໃຊ້ບັນຊີ' : 'ລະງັບບັນຊີ'}ເມື່ອ ${nowTime}`
    };

    setUsers(prev => prev.map(u => (u.id === id ? updatedUser : u)));
    markRealtimeSync();

    try {
      await updateDoc(doc(db, 'users', id), {
        accountEnabled: updatedUser.accountEnabled,
        status: updatedUser.status,
        lastActive: updatedUser.lastActive
      });
      logUserOperation(
        nextEnabled ? "ເປີດການໃຊ້ງານບັນຊີຜູ້ໃຊ້" : "ລະງັບການໃຊ້ງານບັນຊີຜູ້ໃຊ້",
        `ບັນຊີ: ${updatedUser.name} (${updatedUser.username || updatedUser.email})`,
        "auth"
      );
    } catch (err) {
      console.warn("Failed toggling account lock in Firestore:", err);
      throw err;
    }
  };

  const deleteUserAccount = async (id: string) => {
    const target = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    markRealtimeSync();

    try {
      await deleteDoc(doc(db, 'users', id));
      if (target) {
        logUserOperation("ລຶບບັນຊີຜູ້ໃຊ້ງານ", `ລຶບຜູ້ໃຊ້: ${target.name} (${target.email})`, "profile");
      }
    } catch (err) {
      console.warn("Failed deleting user from Firestore:", err);
      throw err;
    }
  };

  const updateUserPresenceStatus = async (
    status: 'Online' | 'Busy' | 'Offline',
    currentActivity?: string
  ) => {
    if (!user) return;
    await syncCurrentUserActivity(user, {
      status,
      ...(currentActivity !== undefined ? { currentActivity } : {})
    });
    logUserOperation(
      "ປ່ຽນສະຖານະຜູ້ໃຊ້ Real-time",
      `ສະຖານະ: ${status}${currentActivity ? ` • ${currentActivity}` : ''}`,
      "profile"
    );
  };

  const registerBiometricFingerprint = async (
    userId: string,
    customCredentialId?: string
  ): Promise<string> => {
    const existing = users.find(
      (u) =>
        u.id === userId ||
        u.email.toLowerCase() === userId.toLowerCase() ||
        (u.username && u.username.toLowerCase() === userId.toLowerCase())
    );
    const randomSuffix = Math.random().toString(16).substring(2, 6).toUpperCase();
    const cleanNum = existing ? existing.id.replace(/[^a-zA-Z0-9]/g, '') : 'USR';
    const credentialId = customCredentialId || `BIO-FP-${cleanNum}-${randomSuffix}`;
    const nowFull = new Date().toLocaleString('en-GB');
    const nowTime = new Date().toLocaleTimeString('en-GB');

    if (existing) {
      const updatedUser: UserAccount = {
        ...existing,
        biometricEnabled: true,
        biometricCredentialId: credentialId,
        biometricRegisteredAt: nowFull,
        lastActive: `ລົງທະບຽນລາຍນິ້ວມືເມື່ອ ${nowTime}`
      };
      setUsers((prev) => prev.map((u) => (u.id === existing.id ? updatedUser : u)));
      markRealtimeSync();
      try {
        await updateDoc(doc(db, 'users', existing.id), {
          biometricEnabled: true,
          biometricCredentialId: credentialId,
          biometricRegisteredAt: nowFull,
          lastActive: updatedUser.lastActive
        });
        logUserOperation(
          'ລົງທະບຽນລາຍນິ້ວມື Biometric (Fingerprint Enrolled)',
          `ບັນຊີ: ${updatedUser.name} (@${updatedUser.username || updatedUser.email}) • ID: ${credentialId}`,
          'auth'
        );
      } catch (err) {
        console.warn('Failed saving biometric credential in Firestore:', err);
      }
    }
    return credentialId;
  };

  const removeBiometricFingerprint = async (userId: string): Promise<void> => {
    const existing = users.find((u) => u.id === userId);
    if (!existing) return;
    const nowTime = new Date().toLocaleTimeString('en-GB');
    const updatedUser: UserAccount = {
      ...existing,
      biometricEnabled: false,
      biometricCredentialId: '',
      biometricRegisteredAt: '',
      lastActive: `ຍົກເລີກລາຍນິ້ວມືເມື່ອ ${nowTime}`
    };
    setUsers((prev) => prev.map((u) => (u.id === existing.id ? updatedUser : u)));
    markRealtimeSync();
    try {
      await updateDoc(doc(db, 'users', existing.id), {
        biometricEnabled: false,
        biometricCredentialId: '',
        biometricRegisteredAt: '',
        lastActive: updatedUser.lastActive
      });
      logUserOperation(
        'ຍົກເລີກການເຂົ້າລະບົບດ້ວຍລາຍນິ້ວມື (Fingerprint Removed)',
        `ບັນຊີ: ${updatedUser.name} (@${updatedUser.username || updatedUser.email})`,
        'auth'
      );
    } catch (err) {
      console.warn('Failed removing biometric credential in Firestore:', err);
    }
  };

  const loginWithBiometric = (
    identifier?: string,
    credentialId?: string
  ): { success: boolean; message?: string; matchedUser?: UserAccount } => {
    // A fingerprint match in the browser can't create a Firebase session, so it is
    // no longer a way to sign in. Firebase keeps you signed in on this device instead.
    void identifier;
    void credentialId;
    return {
      success: false,
      message: 'ການເຂົ້າສູ່ລະບົບດ້ວຍລາຍນິ້ວມືຖືກປິດແລ້ວ ກະລຸນາໃຊ້ອີເມວ/ລະຫັດຜ່ານ ຫຼື Google'
    };
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
    logUserOperation("ລ້າງປະຫວັດການເຮັດວຽກ", "ປະຫວັດການເຮັດວຽກທັງໝົດຖືກລຶບອອກແລ້ວ", "system");
  };

  const triggerTestNotification = (kind: 'repair_assigned' | 'project_status') => {
    if (kind === 'repair_assigned') {
      const sampleRepair = repairs[0];
      const techName = profile.name || currentUserAccount?.name || 'ສົມພອນ ເພັດດາລາ';
      pushLocalNotification({
        title: '🔔 ວຽກສ້ອມແປງໃໝ່ມອບໝາຍໃຫ້ທ່ານ!',
        message: sampleRepair
          ? `ບັດ ${sampleRepair.id}: ${sampleRepair.model} (${sampleRepair.client}) • ມອບໝາຍໃຫ້ ${techName}`
          : `ບັດ REP-2025-9012: Trimble R12i GNSS — ມອບໝາຍໃຫ້ ${techName}`,
        category: 'repair_assigned',
        priority: 'High',
        isAssignedToMe: true,
        targetId: sampleRepair?.id,
        targetView: sampleRepair ? 'repair_details' : 'repairs',
        assignedTech: techName,
        newStatus: 'ລໍຖ້າກວດເຊັກ'
      });
    } else {
      const sampleProject = projects[0];
      pushLocalNotification({
        title: '📌 ສະຖານະໂຄງການສຳຫຼວດປ່ຽນແປງ!',
        message: sampleProject
          ? `ໂຄງການ ${sampleProject.id} (${sampleProject.title}): ປ່ຽນສະຖານະຈາກ "ກຳລັງສຳຫຼວດ" ➔ "ລໍຖ້າການວິເຄາະ" (${sampleProject.progress}%)`
          : 'ໂຄງການ PRJ-101: ປ່ຽນສະຖານະຈາກ "ກຳລັງສຳຫຼວດ" ➔ "ສຳເລັດແລ້ວ" (100%)',
        category: 'project_status',
        targetId: sampleProject?.id,
        targetView: sampleProject ? 'project_details' : 'projects',
        previousStatus: 'ກຳລັງສຳຫຼວດ',
        newStatus: 'ລໍຖ້າການວິເຄາະ'
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        accessState,
        isAdmin,
        isSuperAdmin,
        myAccount,
        registerAccount,
        sendPasswordReset,
        requestAccessAgain,
        approveUser,
        rejectUser,
        user,
        currentView,
        selectedRepair,
        selectedProject,
        selectedQuotation,
        profile,
        activityLogs,
        repairs,
        projects,
        stations,
        equipment,
        quotations,
        quotationReport,
        notes,
        employees,
        isLoadingEmployees,
        users,
        currentUserAccount,
        isRealtimeConnected,
        lastSyncedAt,
        realtimeEventCount,
        addEmployee,
        addUserAccount,
        updateUserAccount,
        updateUserCredentials,
        resetUserPassword,
        toggleUserAccountLock,
        deleteUserAccount,
        updateUserPresenceStatus,
        login,
        loginWithGoogle,
        loginWithBiometric,
        registerBiometricFingerprint,
        removeBiometricFingerprint,
        logout,
        navigateTo,
        selectRepair,
        selectProject,
        selectQuotation,
        addRepair,
        updateRepairStatus,
        addInternalNote,
        addProject,
        updateProjectProgress,
        toggleStationStatus,
        updateStationIssue,
        updateStationCoordinates,
        batchUpdateStationCoordinates,
        syncStationsFromCORSServer,
        addCORSStation,
        updateEquipmentDetail,
        addQuotation,
        updateQuotation,
        updateProfile,
        updateThemeMode,
        clearActivityLogs,
        logUserOperation,
        notifications,
        activeToastNotifications,
        unreadNotificationCount,
        notificationPrefs,
        pushLocalNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        dismissToastNotification,
        clearAllNotifications,
        updateNotificationPreferences,
        triggerTestNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
};

