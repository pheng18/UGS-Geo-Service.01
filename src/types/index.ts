export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  desc: string;
  done: boolean;
  status: 'done' | 'active' | 'upcoming';
}

export interface Repair {
  id: string;
  serialNo: string;
  model: string;
  title: string;
  client: string;
  receivedDate: string;
  status: 'ກຳລັງສ້ອມແປງ' | 'ສຳເລັດແລ້ວ' | 'ລໍຖ້າກວດເຊັກ' | 'ກຳລັງສຳຫຼວດ';
  priority?: 'High' | 'Medium' | 'Low';
  problem: string;
  cause: string;
  solution: string;
  assignedTech: string;
  timeline: TimelineItem[];
  imageUrl?: string | null;
}

export interface InternalNote {
  id: string;
  repairId: string;
  author: string;
  date: string;
  text: string;
}

export interface TeamMember {
  name: string;
  role: string;
  avatar?: string;
  active: boolean;
  phone: string;
}

export interface Project {
  id: string;
  title: string;
  client: string;
  progress: number;
  status: 'ກຳລັງສຳຫຼວດ' | 'ລໍຖ້າການວິເຄາະ' | 'ສຳເລັດແລ້ວ';
  location: string;
  coordinatesLat: number;
  coordinatesLng: number;
  team: TeamMember[];
}

export interface CORSStation {
  id: string;
  name: string;
  type: 'ເກົ່າ' | 'ໃໝ່';
  status: 'Online' | 'Offline';
  issue: string;
  notes?: string | null;
  lat?: number;
  lng?: number;
  elevation?: number;
  province?: string;
  satellites?: number;
  mountpoint?: string;
  coordSource?: string;
  lastCoordSync?: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  details: string;
  unit?: string;
  qty: number;
  unitPrice: number;
  isFree?: boolean;
}

export interface Quotation {
  id: string;
  refNo: string;
  revision?: number;
  handledBy?: string;
  customerName: string;
  customerPhone?: string;
  deliveryTo?: string;
  deliveryLeadTime?: string;
  deliveryTerms?: string;
  currency?: string;
  date: string;
  validity: string;
  remark?: string;
  items: QuotationItem[];
  includeFreeInspection?: boolean;
  terms: string;
  subtotal: number;
  vat: number;
  vatRate?: number;
  vatIncluded?: boolean;
  total: number;
  showOfficialStamp?: boolean;
}

export interface Equipment {
  id: number;
  districtCode: string;
  districtNameLao: string;
  districtNameEng: string;
  provinceName: string;
  model: string;
  serialNo: string;
  note: string;
}

export interface UserLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: 'auth' | 'repair' | 'project' | 'cors' | 'quote' | 'profile' | 'system';
  userEmail?: string;
  /** Epoch ms; sortable (the display timestamp string is not). */
  createdAtMs?: number;
}

export interface UserProfile {
  name: string;
  role: string;
  phone: string;
  department: string;
  email: string;
  themeMode: 'Light' | 'Dark' | 'System';
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email?: string;
  active: boolean;
  specialties?: string[];
  avatarUrl?: string;
}

export interface UserAccount {
  id: string;
  username?: string;
  name: string;
  email: string;
  password?: string;
  passwordUpdatedAt?: string;
  accountEnabled?: boolean;
  biometricEnabled?: boolean;
  biometricCredentialId?: string;
  biometricRegisteredAt?: string;
  role: string;
  department: string;
  phone: string;
  // SuperAdmin = ຜູ້ດູແລລະບົບ, Admin = ແອັດມິນ. Others need approval before seeing data.
  accessLevel: 'SuperAdmin' | 'Admin' | 'Technician' | 'Engineer' | 'Manager';
  // Access request workflow; enforced server-side by firestore.rules.
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  requestNote?: string;
  requestedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: 'Online' | 'Busy' | 'Offline';
  lastActive: string;
  currentActivity?: string;
  themeMode?: 'Light' | 'Dark' | 'System';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  createdAtMs: number;
  category: 'repair_assigned' | 'repair_status' | 'project_status';
  priority?: 'High' | 'Medium' | 'Low';
  read: boolean;
  isAssignedToMe?: boolean;
  targetId?: string;
  targetView?: 'repair_details' | 'project_details' | 'repairs' | 'projects';
  assignedTech?: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  browserNotificationEnabled: boolean;
  toastEnabled: boolean;
  notifyAllTeamRepairs: boolean;
}
