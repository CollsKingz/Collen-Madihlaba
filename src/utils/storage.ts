import {
  AttendanceRecord,
  Employee,
  GeofenceLocation,
  EmployeeWorkReport,
  PrivilegeRequest,
  MeetingSession,
  FullSystemBackupData
} from '../types';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const EMPLOYEES_KEY = 'geoface_employees_v7';
const GEOFENCES_KEY = 'geoface_geofences_v7';
const RECORDS_KEY = 'geoface_records_v7';
const WORK_REPORTS_KEY = 'geoface_work_reports_v7';
const PRIVILEGE_REQUESTS_KEY = 'geoface_privilege_requests_v7';
const MEETINGS_KEY = 'geoface_meetings_v1';
const DEPARTMENTS_KEY = 'geoface_departments_v5';
const CURRENT_USER_KEY = 'geofence_current_user_v2';

export const DEFAULT_WORK_REPORTS: EmployeeWorkReport[] = [];

export const DEFAULT_GEOFENCES: GeofenceLocation[] = [
  {
    id: 'geo-1',
    name: 'Ga-Rankuwa YMCA Main Center',
    address: 'Zone 1, Ga-Rankuwa, Pretoria, 0208',
    lat: -25.6175,
    lng: 27.9942,
    radiusMeters: 200,
    active: true,
  },
  {
    id: 'geo-2',
    name: 'YMCA Youth & Sports Complex',
    address: 'Zone 4 Sports Hub, Ga-Rankuwa, 0208',
    lat: -25.6210,
    lng: 27.9880,
    radiusMeters: 250,
    active: true,
  },
  {
    id: 'geo-3',
    name: 'YMCA Vocational Training Academy',
    address: 'Industrial Crescent, Zone 5, Ga-Rankuwa, 0208',
    lat: -25.6130,
    lng: 28.0015,
    radiusMeters: 180,
    active: true,
  },
];

export const DEFAULT_DEPARTMENTS: string[] = [
  'Information Technology (IT)',
  'Management & Operations',
  'IT & Systems Security',
  'Youth & Community Development',
  'Administration',
  'Sports & Athletics',
  'Education & Skills',
  'Community Engagement',
];

export const ALL_DEPARTMENT_KEYS = [
  'departments',
  'geoface_departments',
  'geoface_departments_v1',
  'geoface_departments_v2',
  'geoface_departments_v3',
  'geoface_departments_v4',
  'geoface_departments_v5',
];

export const ALL_GEOFENCE_KEYS = [
  'geofences',
  'geoface_geofences',
  'geoface_geofences_v1',
  'geoface_geofences_v2',
  'geoface_geofences_v3',
  'geoface_geofences_v4',
  'geoface_geofences_v5',
  'geoface_geofences_v6',
  'geoface_geofences_v7',
];

export const ALL_RECORD_KEYS = [
  'records',
  'geoface_records',
  'geoface_records_v1',
  'geoface_records_v2',
  'geoface_records_v3',
  'geoface_records_v4',
  'geoface_records_v5',
  'geoface_records_v6',
  'geoface_records_v7',
];

export const ALL_WORK_REPORT_KEYS = [
  'work_reports',
  'geoface_work_reports',
  'geoface_work_reports_v1',
  'geoface_work_reports_v2',
  'geoface_work_reports_v3',
  'geoface_work_reports_v4',
  'geoface_work_reports_v5',
  'geoface_work_reports_v6',
  'geoface_work_reports_v7',
];

export const ALL_PRIVILEGE_KEYS = [
  'privilege_requests',
  'geoface_privilege_requests',
  'geoface_privilege_requests_v1',
  'geoface_privilege_requests_v7',
];

export const ALL_MEETING_KEYS = [
  'meetings',
  'geoface_meetings',
  'geoface_meetings_v1',
];

export const COLLEN_EMPLOYEE: Employee = {
  id: 'emp-100',
  name: 'Collen Madihlaba',
  role: 'super_admin',
  department: 'Information Technology (IT)',
  email: 'collen@garankuwaymca.org.za',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  password: 'Collen@2026',
  registeredFacePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  biometricRegistered: true,
  registeredAt: new Date().toISOString(),
};

export const BOARD_MEMBER_EMPLOYEE: Employee = {
  id: 'emp-board-1',
  name: 'Adv. Tebogo Molefe',
  role: 'board_member',
  department: 'Management & Operations',
  email: 'board.molefe@garankuwaymca.org.za',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  password: 'Board@2026',
  registeredFacePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  biometricRegistered: true,
  registeredAt: new Date().toISOString(),
};

export const MANAGER_EMPLOYEE: Employee = {
  id: 'emp-mgr-1',
  name: 'Sibusiso Dlamini',
  role: 'manager',
  department: 'Management & Operations',
  email: 'sibusiso@garankuwaymca.org.za',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
  password: 'Sibusiso@2026',
  registeredFacePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
  biometricRegistered: true,
  registeredAt: new Date().toISOString(),
};

export const DEFAULT_EMPLOYEES: Employee[] = [COLLEN_EMPLOYEE, BOARD_MEMBER_EMPLOYEE, MANAGER_EMPLOYEE];
export const DEFAULT_PRIVILEGE_REQUESTS: PrivilegeRequest[] = [];
export const DEFAULT_RECORDS: AttendanceRecord[] = [];

export const ALL_EMPLOYEE_KEYS = [
  'employees',
  'geoface_employees',
  'geoface_employees_v1',
  'geoface_employees_v2',
  'geoface_employees_v3',
  'geoface_employees_v4',
  'geoface_employees_v5',
  'geoface_employees_v6',
  'geoface_employees_v7'
];

export const DEFAULT_MEETINGS: MeetingSession[] = [
  {
    id: 'meet-101',
    title: 'YMCA Board of Directors Quarterly Governance Review',
    category: 'Board Meeting',
    scheduledTime: new Date(Date.now() + 3600000).toISOString(),
    durationMinutes: 60,
    status: 'scheduled',
    hostId: 'emp-board-1',
    hostName: 'Adv. Tebogo Molefe (Board Member)',
    meetingLink: 'https://garankuwaymca.org.za/meet/board-q3-governance',
    createdAt: new Date().toISOString(),
    participants: [
      {
        id: 'emp-board-1',
        name: 'Adv. Tebogo Molefe',
        role: 'board_member',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        isVideoOn: true,
        isAudioOn: true,
        isHandRaised: false,
      },
      {
        id: 'emp-100',
        name: 'Collen Madihlaba',
        role: 'super_admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        isVideoOn: true,
        isAudioOn: false,
        isHandRaised: false,
      },
      {
        id: 'emp-mgr-1',
        name: 'Sibusiso Dlamini',
        role: 'manager',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        isVideoOn: true,
        isAudioOn: true,
        isHandRaised: false,
      },
    ],
  },
];

// Helper to sanitize objects for Firestore
function sanitizeForFirestore<T>(data: T): any {
  if (!data) return data;
  return JSON.parse(JSON.stringify(data));
}

async function saveToFirestoreDoc(collectionName: string, docId: string, data: any) {
  try {
    const clean = sanitizeForFirestore(data);
    await setDoc(doc(db, collectionName, docId), clean, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    } else {
      console.warn(`Firestore save error [${collectionName}/${docId}]:`, err);
    }
  }
}

async function removeFromFirestoreDoc(collectionName: string, docId: string) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (err: any) {
    if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
    } else {
      console.warn(`Firestore delete error [${collectionName}/${docId}]:`, err);
    }
  }
}

// REALTIME FIRESTORE INITIALIZATION & LISTENERS
let isFirestoreInitialized = false;
const knownRecordIds = new Set<string>();

export function initFirestoreSync() {
  if (isFirestoreInitialized) return;
  isFirestoreInitialized = true;

  // 1. Attendance Records Listener
  try {
    onSnapshot(collection(db, 'records'), (snapshot) => {
      const records: AttendanceRecord[] = [];
      let newRecordEventDetail: AttendanceRecord | null = null;

      snapshot.forEach((docSnap) => {
        const rec = docSnap.data() as AttendanceRecord;
        if (rec && rec.id) {
          records.push(rec);
          if (!knownRecordIds.has(rec.id)) {
            knownRecordIds.add(rec.id);
            if (snapshot.docChanges().some((change) => change.type === 'added' && change.doc.id === rec.id)) {
              newRecordEventDetail = rec;
            }
          }
        }
      });

      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (snapshot.empty) {
        // Seed Firestore if empty
        const local = getAttendanceRecordsFromLocalStorage();
        if (local.length > 0) {
          local.forEach((r) => saveToFirestoreDoc('records', r.id, r));
        }
        return;
      }

      ALL_RECORD_KEYS.forEach((key) => {
        try { localStorage.setItem(key, JSON.stringify(records)); } catch {}
      });

      if (newRecordEventDetail) {
        window.dispatchEvent(new CustomEvent('geofence_clock_in_event', { detail: newRecordEventDetail }));
      }
      window.dispatchEvent(new Event('geofence_storage_update'));
    }, (err: any) => {
      if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, 'records');
      } else {
        console.warn('Firestore records listener:', err);
      }
    });
  } catch (e) {
    console.warn('Failed to start records listener:', e);
  }

  // 2. Employees Listener
  try {
    onSnapshot(collection(db, 'employees'), (snapshot) => {
      if (snapshot.empty) {
        const local = getEmployeesFromLocalStorage();
        if (local.length > 0) {
          local.forEach((emp) => saveToFirestoreDoc('employees', emp.id, emp));
        }
        return;
      }

      const employees: Employee[] = [];
      snapshot.forEach((docSnap) => {
        const emp = docSnap.data() as Employee;
        if (emp && emp.id) employees.push(emp);
      });

      ALL_EMPLOYEE_KEYS.forEach((key) => {
        try { localStorage.setItem(key, JSON.stringify(employees)); } catch {}
      });

      window.dispatchEvent(new Event('geofence_storage_update'));
    }, (err: any) => {
      if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, 'employees');
      } else {
        console.warn('Firestore employees listener:', err);
      }
    });
  } catch (e) {
    console.warn('Failed to start employees listener:', e);
  }

  // 3. Departments Listener
  try {
    onSnapshot(collection(db, 'departments'), (snapshot) => {
      if (snapshot.empty) {
        const local = getDepartmentsFromLocalStorage();
        local.forEach((d) => saveToFirestoreDoc('departments', d.replace(/[\/\s]/g, '_'), { name: d }));
        return;
      }

      const depts = new Set<string>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.name) depts.add(data.name);
      });

      const list = Array.from(depts);
      if (list.length > 0) {
        ALL_DEPARTMENT_KEYS.forEach((key) => {
          try { localStorage.setItem(key, JSON.stringify(list)); } catch {}
        });
        window.dispatchEvent(new Event('geofence_departments_update'));
        window.dispatchEvent(new Event('geofence_storage_update'));
      }
    }, (err: any) => {
      if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, 'departments');
      } else {
        console.warn('Firestore departments listener:', err);
      }
    });
  } catch (e) {
    console.warn('Failed to start departments listener:', e);
  }

  // 4. Geofences Listener
  try {
    onSnapshot(collection(db, 'geofences'), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_GEOFENCES.forEach((geo) => saveToFirestoreDoc('geofences', geo.id, geo));
        return;
      }

      const geofences: GeofenceLocation[] = [];
      snapshot.forEach((docSnap) => {
        const geo = docSnap.data() as GeofenceLocation;
        if (geo && geo.id) geofences.push(geo);
      });

      ALL_GEOFENCE_KEYS.forEach((key) => {
        try { localStorage.setItem(key, JSON.stringify(geofences)); } catch {}
      });

      window.dispatchEvent(new Event('geofence_storage_update'));
    }, (err: any) => {
      if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, 'geofences');
      } else {
        console.warn('Firestore geofences listener:', err);
      }
    });
  } catch (e) {
    console.warn('Failed to start geofences listener:', e);
  }

  // 5. Work Reports Listener
  try {
    onSnapshot(collection(db, 'workReports'), (snapshot) => {
      if (snapshot.empty) return;

      const reports: EmployeeWorkReport[] = [];
      snapshot.forEach((docSnap) => {
        const rep = docSnap.data() as EmployeeWorkReport;
        if (rep && rep.id) reports.push(rep);
      });

      reports.sort((a, b) => new Date(b.submittedAt || b.timestamp).getTime() - new Date(a.submittedAt || a.timestamp).getTime());

      ALL_WORK_REPORT_KEYS.forEach((key) => {
        try { localStorage.setItem(key, JSON.stringify(reports)); } catch {}
      });

      window.dispatchEvent(new Event('geofence_storage_update'));
    }, (err: any) => {
      if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, 'workReports');
      } else {
        console.warn('Firestore workReports listener:', err);
      }
    });
  } catch (e) {
    console.warn('Failed to start workReports listener:', e);
  }

  // 6. Meetings Listener
  try {
    onSnapshot(collection(db, 'meetings'), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_MEETINGS.forEach((m) => saveToFirestoreDoc('meetings', m.id, m));
        return;
      }

      const meetings: MeetingSession[] = [];
      snapshot.forEach((docSnap) => {
        const m = docSnap.data() as MeetingSession;
        if (m && m.id) meetings.push(m);
      });

      ALL_MEETING_KEYS.forEach((key) => {
        try { localStorage.setItem(key, JSON.stringify(meetings)); } catch {}
      });

      window.dispatchEvent(new Event('geofence_meetings_update'));
      window.dispatchEvent(new Event('geofence_storage_update'));
    }, (err: any) => {
      if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, 'meetings');
      } else {
        console.warn('Firestore meetings listener:', err);
      }
    });
  } catch (e) {
    console.warn('Failed to start meetings listener:', e);
  }

  // 7. Privilege Requests Listener
  try {
    onSnapshot(collection(db, 'privilegeRequests'), (snapshot) => {
      if (snapshot.empty) return;

      const requests: PrivilegeRequest[] = [];
      snapshot.forEach((docSnap) => {
        const req = docSnap.data() as PrivilegeRequest;
        if (req && req.id) requests.push(req);
      });

      ALL_PRIVILEGE_KEYS.forEach((key) => {
        try { localStorage.setItem(key, JSON.stringify(requests)); } catch {}
      });

      window.dispatchEvent(new Event('geofence_storage_update'));
    }, (err: any) => {
      if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
        handleFirestoreError(err, OperationType.LIST, 'privilegeRequests');
      } else {
        console.warn('Firestore privilegeRequests listener:', err);
      }
    });
  } catch (e) {
    console.warn('Failed to start privilegeRequests listener:', e);
  }
}

// Synchronous local reading helpers
function getAttendanceRecordsFromLocalStorage(): AttendanceRecord[] {
  const map = new Map<string, AttendanceRecord>();
  for (const key of ALL_RECORD_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: AttendanceRecord[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((rec) => {
            if (rec && rec.id) map.set(rec.id, rec);
          });
        }
      }
    } catch {}
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function getEmployeesFromLocalStorage(): Employee[] {
  const map = new Map<string, Employee>();
  for (const key of ALL_EMPLOYEE_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: Employee[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((emp) => {
            if (emp && emp.id && emp.name) {
              map.set(emp.id, {
                ...emp,
                password: emp.password || `${emp.name.split(' ')[0] || 'User'}@2026`,
              });
            }
          });
        }
      }
    } catch {}
  }
  if (map.size === 0) {
    DEFAULT_EMPLOYEES.forEach((emp) => map.set(emp.id, emp));
  }
  return Array.from(map.values());
}

function getDepartmentsFromLocalStorage(): string[] {
  const set = new Set<string>();
  for (const key of ALL_DEPARTMENT_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          parsed.forEach((d) => typeof d === 'string' && d.trim() && set.add(d.trim()));
        }
      }
    } catch {}
  }
  DEFAULT_DEPARTMENTS.forEach((d) => set.add(d.trim()));
  return Array.from(set);
}

// -------------------------------------------------------------
// DEPARTMENTS PUBLIC API
// -------------------------------------------------------------
export function getDepartments(): string[] {
  return getDepartmentsFromLocalStorage();
}

export function saveDepartments(departments: string[]): void {
  const cleaned = departments.map((d) => d.trim()).filter(Boolean);
  const unique = Array.from(new Set(cleaned));

  ALL_DEPARTMENT_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(unique)); } catch {}
  });

  unique.forEach((d) => {
    saveToFirestoreDoc('departments', d.replace(/[\/\s]/g, '_'), { name: d });
  });

  window.dispatchEvent(new Event('geofence_departments_update'));
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function addDepartment(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const current = getDepartments();
  if (current.some((d) => d.toLowerCase() === trimmed.toLowerCase())) return false;
  const updated = [...current, trimmed];
  saveDepartments(updated);
  return true;
}

export function updateDepartment(oldName: string, newName: string): boolean {
  const trimmedNew = newName.trim();
  if (!trimmedNew || oldName === trimmedNew) return false;
  const current = getDepartments();
  const index = current.findIndex((d) => d === oldName);
  if (index === -1) return false;

  current[index] = trimmedNew;
  saveDepartments(current);

  // Remove old doc from Firestore
  removeFromFirestoreDoc('departments', oldName.replace(/[\/\s]/g, '_'));

  const employees = getEmployees();
  let empUpdated = false;
  employees.forEach((emp) => {
    if (emp.department === oldName) {
      emp.department = trimmedNew;
      empUpdated = true;
    }
  });
  if (empUpdated) {
    saveEmployees(employees);
  }

  return true;
}

export function deleteDepartment(deptName: string): boolean {
  const current = getDepartments();
  if (current.length <= 1) return false;
  const filtered = current.filter((d) => d !== deptName);
  if (filtered.length === current.length) return false;

  saveDepartments(filtered);
  removeFromFirestoreDoc('departments', deptName.replace(/[\/\s]/g, '_'));
  return true;
}

export function resetDepartmentsToDefaults(): void {
  saveDepartments(DEFAULT_DEPARTMENTS);
}

export const YMCA_DEPARTMENTS = DEFAULT_DEPARTMENTS;

// -------------------------------------------------------------
// EMPLOYEES PUBLIC API
// -------------------------------------------------------------
export function getEmployees(): Employee[] {
  return getEmployeesFromLocalStorage();
}

export function saveEmployees(employees: Employee[]): void {
  ALL_EMPLOYEE_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(employees)); } catch {}
  });

  employees.forEach((emp) => {
    saveToFirestoreDoc('employees', emp.id, emp);
  });

  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function addEmployee(emp: Employee): void {
  const current = getEmployees();
  const updated = [emp, ...current.filter((e) => e.id !== emp.id)];
  saveEmployees(updated);
}

export function updateEmployee(emp: Employee): void {
  const current = getEmployees();
  const index = current.findIndex((e) => e.id === emp.id);
  if (index !== -1) {
    current[index] = emp;
    saveEmployees(current);
  } else {
    addEmployee(emp);
  }
}

export function deleteEmployee(id: string): void {
  const current = getEmployees();
  const updated = current.filter((e) => e.id !== id);
  saveEmployees(updated);
  removeFromFirestoreDoc('employees', id);
}

export function updateEmployeePassword(id: string, newPass: string): boolean {
  const emps = getEmployees();
  const emp = emps.find((e) => e.id === id);
  if (!emp) return false;

  emp.password = newPass;
  saveEmployees(emps);
  return true;
}

export function updateEmployeeElevatedPrivileges(empId: string, role: string, isElevated?: boolean): boolean {
  const employees = getEmployees();
  const emp = employees.find(e => e.id === empId);
  if (!emp) return false;
  emp.role = role;
  saveEmployees(employees);
  return true;
}

export function loginEmployee(identifier: string, passwordInput: string): { success: boolean; employee?: Employee; user?: Employee; message: string } {
  const employees = getEmployees();
  const cleanId = identifier.trim().toLowerCase();

  const emp = employees.find(
    (e) =>
      e.id.toLowerCase() === cleanId ||
      (e.email && e.email.toLowerCase() === cleanId) ||
      e.name.toLowerCase() === cleanId
  );

  if (!emp) {
    return { success: false, message: 'Employee ID or email not found in Ga-Rankuwa YMCA registry.' };
  }

  const expectedPass = emp.password || `${emp.name.split(' ')[0]}@2026`;
  if (passwordInput !== expectedPass) {
    return { success: false, message: 'Incorrect password for this staff profile.' };
  }

  setCurrentUser(emp);
  return { success: true, employee: emp, user: emp, message: `Welcome back, ${emp.name}!` };
}

export function registerEmployeeProfile(newEmpData: Omit<Employee, 'id'> & { id?: string }): { success: boolean; employee?: Employee; user?: Employee; message: string } {
  const employees = getEmployees();

  if (newEmpData.email) {
    const existing = employees.find((e) => e.email && e.email.toLowerCase() === newEmpData.email.toLowerCase());
    if (existing) {
      return { success: false, message: 'An employee profile with this email address already exists.' };
    }
  }

  const id = newEmpData.id || `ymca-${Date.now().toString().slice(-4)}`;
  const password = newEmpData.password || `${newEmpData.name.split(' ')[0]}@2026`;

  const newEmp: Employee = {
    ...newEmpData,
    id,
    password,
    biometricRegistered: true,
    registeredAt: new Date().toISOString(),
  };

  addEmployee(newEmp);
  setCurrentUser(newEmp);

  return { success: true, employee: newEmp, user: newEmp, message: `Employee profile successfully registered for ${newEmp.name}.` };
}

export function verifyEmployeePassword(id: string, pass: string): boolean {
  const emps = getEmployees();
  const emp = emps.find((e) => e.id === id);
  if (!emp) return false;
  return emp.password === pass;
}

export function resetEmployeesToDefaults(): void {
  saveEmployees(DEFAULT_EMPLOYEES);
}

// -------------------------------------------------------------
// CURRENT USER STATE
// -------------------------------------------------------------
export function getCurrentUser(): Employee | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  try {
    const user: Employee = JSON.parse(data);
    if (!user || !user.id) return null;
    const emps = getEmployees();
    const latest = emps.find(
      (e) => e.id === user.id || (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase())
    );
    return latest || user;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: Employee | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function logoutUser(): void {
  setCurrentUser(null);
}

// -------------------------------------------------------------
// GEOFENCES PUBLIC API
// -------------------------------------------------------------
export function getGeofences(): GeofenceLocation[] {
  const map = new Map<string, GeofenceLocation>();
  DEFAULT_GEOFENCES.forEach((geo) => map.set(geo.id, geo));

  for (const key of ALL_GEOFENCE_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: GeofenceLocation[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((geo) => {
            if (geo && geo.id) map.set(geo.id, geo);
          });
        }
      }
    } catch {}
  }
  return Array.from(map.values());
}

export function saveGeofences(geofences: GeofenceLocation[]): void {
  ALL_GEOFENCE_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(geofences)); } catch {}
  });

  geofences.forEach((geo) => {
    saveToFirestoreDoc('geofences', geo.id, geo);
  });

  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function resetGeofencesToDefaults(): void {
  saveGeofences(DEFAULT_GEOFENCES);
}

// -------------------------------------------------------------
// ATTENDANCE RECORDS (SIGN-INS & CLOCK-INS) PUBLIC API
// -------------------------------------------------------------
export function getAttendanceRecords(): AttendanceRecord[] {
  return getAttendanceRecordsFromLocalStorage();
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  ALL_RECORD_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(records)); } catch {}
  });

  records.forEach((rec) => {
    saveToFirestoreDoc('records', rec.id, rec);
  });

  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function addAttendanceRecord(record: AttendanceRecord): void {
  const current = getAttendanceRecords();
  const updated = [record, ...current.filter((r) => r.id !== record.id)];

  // Update localStorage immediately
  ALL_RECORD_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
  });

  // Save to Firestore in real-time
  saveToFirestoreDoc('records', record.id, record);

  // Dispatch live events
  knownRecordIds.add(record.id);
  window.dispatchEvent(new CustomEvent('geofence_clock_in_event', { detail: record }));
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function updateRecordStatus(recordId: string, status: AttendanceRecord['status']): void {
  const records = getAttendanceRecords();
  const target = records.find((r) => r.id === recordId);
  if (target) {
    target.status = status;
    saveToFirestoreDoc('records', recordId, target);
  }
  const updated = records.map((r) => (r.id === recordId ? { ...r, status } : r));
  ALL_RECORD_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
  });
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function exportRecordsToCSV(records: AttendanceRecord[]): void {
  if (!records || records.length === 0) return;
  const headers = [
    'Record ID',
    'Employee ID',
    'Employee Name',
    'Department',
    'Type',
    'Timestamp',
    'Location Name',
    'Latitude',
    'Longitude',
    'Geofence Verified',
    'Status',
    'Verification Method',
    'Notes',
  ];

  const csvRows = [
    headers.join(','),
    ...records.map((r) =>
      [
        `"${r.id}"`,
        `"${r.employeeId}"`,
        `"${r.employeeName}"`,
        `"${r.employeeDepartment}"`,
        `"${r.type}"`,
        `"${r.timestamp}"`,
        `"${r.locationName}"`,
        r.latitude,
        r.longitude,
        r.withinGeofence ? 'Yes' : 'No',
        `"${r.status}"`,
        `"${r.method}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `YMCA_Attendance_Log_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const resetStorageToDefaults = resetEmployeesToDefaults;

// -------------------------------------------------------------
// WORK REPORTS PUBLIC API
// -------------------------------------------------------------
export function getWorkReports(): EmployeeWorkReport[] {
  const map = new Map<string, EmployeeWorkReport>();
  for (const key of ALL_WORK_REPORT_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: EmployeeWorkReport[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((rep) => {
            if (rep && rep.id) map.set(rep.id, rep);
          });
        }
      }
    } catch {}
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.submittedAt || b.timestamp).getTime() - new Date(a.submittedAt || a.timestamp).getTime()
  );
}

export function saveWorkReports(reports: EmployeeWorkReport[]): void {
  ALL_WORK_REPORT_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(reports)); } catch {}
  });

  reports.forEach((rep) => {
    saveToFirestoreDoc('workReports', rep.id, rep);
  });

  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function saveWorkReport(report: EmployeeWorkReport): void {
  const current = getWorkReports();
  const updated = [report, ...current.filter((r) => r.id !== report.id)];
  saveWorkReports(updated);
}

export function deleteWorkReport(reportId: string): void {
  const current = getWorkReports();
  const updated = current.filter((r) => r.id !== reportId);
  ALL_WORK_REPORT_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
  });
  removeFromFirestoreDoc('workReports', reportId);
  window.dispatchEvent(new Event('geofence_storage_update'));
}

// -------------------------------------------------------------
// PRIVILEGE REQUESTS PUBLIC API
// -------------------------------------------------------------
export function getPrivilegeRequests(): PrivilegeRequest[] {
  const map = new Map<string, PrivilegeRequest>();
  for (const key of ALL_PRIVILEGE_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: PrivilegeRequest[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((req) => {
            if (req && req.id) map.set(req.id, req);
          });
        }
      }
    } catch {}
  }
  return Array.from(map.values());
}

export function savePrivilegeRequests(requests: PrivilegeRequest[]): void {
  ALL_PRIVILEGE_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(requests)); } catch {}
  });

  requests.forEach((req) => {
    saveToFirestoreDoc('privilegeRequests', req.id, req);
  });

  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function createPrivilegeRequest(
  requester: Employee,
  resourceName: string,
  requestedRole: string,
  reason: string,
  managerId: string,
  managerName: string
): PrivilegeRequest {
  const currentRequests = getPrivilegeRequests();
  const newId = `req-${Date.now().toString().slice(-6)}`;
  const nowISO = new Date().toISOString();

  const newRequest: PrivilegeRequest = {
    id: newId,
    requesterId: requester.id,
    requesterName: requester.name,
    requesterEmail: requester.email,
    requesterDepartment: requester.department,
    managerId: managerId || 'emp-100',
    managerName: managerName || 'Collen Madihlaba (IT Lead)',
    requestedRole: requestedRole,
    resourceName: resourceName,
    reason: reason,
    status: 'pending_manager',
    createdAt: nowISO,
    updatedAt: nowISO,
    history: [
      {
        id: `hist-${Date.now()}-1`,
        requestId: newId,
        timestamp: nowISO,
        action: 'Privilege Authorization Request Created',
        actorId: requester.id,
        actorName: requester.name,
        actorRole: requester.role || 'Standard User',
        previousStatus: 'none',
        newStatus: 'pending_manager',
        notes: `Requested privilege level '${requestedRole}' for resource '${resourceName}'. Assigned to manager '${managerName}'.`,
      },
    ],
  };

  const updated = [newRequest, ...currentRequests];
  savePrivilegeRequests(updated);
  return newRequest;
}

export function updateManagerApproval(
  requestId: string,
  decision: 'approved' | 'rejected',
  comments: string,
  manager: Employee
): PrivilegeRequest | null {
  const currentRequests = getPrivilegeRequests();
  const index = currentRequests.findIndex((r) => r.id === requestId);
  if (index === -1) return null;

  const target = currentRequests[index];
  const nowISO = new Date().toISOString();
  const newStatus = decision === 'approved' ? 'pending_it' : 'rejected';

  const updatedReq: PrivilegeRequest = {
    ...target,
    status: newStatus,
    updatedAt: nowISO,
    managerDecision: {
      decision: decision,
      decidedBy: `${manager.name} (${manager.role === 'manager' ? 'Center Manager' : manager.role})`,
      decidedAt: nowISO,
      comments: comments,
    },
    history: [
      ...target.history,
      {
        id: `hist-${Date.now()}-2`,
        requestId: requestId,
        timestamp: nowISO,
        action: decision === 'approved' ? 'Level 1: Manager Authorization Approved' : 'Level 1: Manager Rejected Authorization',
        actorId: manager.id,
        actorName: manager.name,
        actorRole: manager.role || 'Manager',
        previousStatus: target.status,
        newStatus: newStatus,
        notes: comments || (decision === 'approved' ? 'Manager approved request. Advanced to Level 2 IT Admin Pool.' : 'Manager rejected authorization.'),
      },
    ],
  };

  currentRequests[index] = updatedReq;
  savePrivilegeRequests(currentRequests);
  return updatedReq;
}

export function updateITApproval(
  requestId: string,
  decision: 'approved' | 'rejected',
  comments: string,
  itAdmin: Employee
): PrivilegeRequest | null {
  const currentRequests = getPrivilegeRequests();
  const index = currentRequests.findIndex((r) => r.id === requestId);
  if (index === -1) return null;

  const target = currentRequests[index];
  const nowISO = new Date().toISOString();
  const newStatus = decision === 'approved' ? 'approved' : 'rejected';

  const updatedReq: PrivilegeRequest = {
    ...target,
    status: newStatus,
    updatedAt: nowISO,
    itDecision: {
      decision: decision,
      decidedBy: `${itAdmin.name} (${itAdmin.role === 'super_admin' ? 'Super Admin' : 'IT Admin'})`,
      decidedAt: nowISO,
      comments: comments,
    },
    history: [
      ...target.history,
      {
        id: `hist-${Date.now()}-3`,
        requestId: requestId,
        timestamp: nowISO,
        action: decision === 'approved' ? 'Level 2: IT Technical Provisioning Complete & Approved' : 'Level 2: IT Provisioning Rejected',
        actorId: itAdmin.id,
        actorName: itAdmin.name,
        actorRole: itAdmin.role || 'IT Admin',
        previousStatus: target.status,
        newStatus: newStatus,
        notes: comments || (decision === 'approved' ? 'IT Admin completed technical provisioning and granted system access.' : 'IT Admin rejected technical provisioning.'),
      },
    ],
  };

  currentRequests[index] = updatedReq;

  if (decision === 'approved' && updatedReq.requestedRole) {
    const employees = getEmployees();
    const empIdx = employees.findIndex((e) => e.id === updatedReq.requesterId);
    if (empIdx !== -1) {
      employees[empIdx].role = updatedReq.requestedRole;
      saveEmployees(employees);
    }
  }

  savePrivilegeRequests(currentRequests);
  return updatedReq;
}

export function overrideRequestStatus(
  requestId: string,
  newStatus: 'pending_manager' | 'pending_it' | 'approved' | 'rejected',
  comments: string,
  superAdmin: Employee
): PrivilegeRequest | null {
  const currentRequests = getPrivilegeRequests();
  const index = currentRequests.findIndex((r) => r.id === requestId);
  if (index === -1) return null;

  const target = currentRequests[index];
  const nowISO = new Date().toISOString();

  const updatedReq: PrivilegeRequest = {
    ...target,
    status: newStatus,
    updatedAt: nowISO,
    history: [
      ...target.history,
      {
        id: `hist-${Date.now()}-override`,
        requestId: requestId,
        timestamp: nowISO,
        action: `Super Admin System Override -> ${newStatus.toUpperCase()}`,
        actorId: superAdmin.id,
        actorName: superAdmin.name,
        actorRole: 'Super Admin',
        previousStatus: target.status,
        newStatus: newStatus,
        notes: comments || 'Super Admin performed direct status override.',
      },
    ],
  };

  currentRequests[index] = updatedReq;

  if (newStatus === 'approved' && updatedReq.requestedRole) {
    const employees = getEmployees();
    const empIdx = employees.findIndex((e) => e.id === updatedReq.requesterId);
    if (empIdx !== -1) {
      employees[empIdx].role = updatedReq.requestedRole;
      saveEmployees(employees);
    }
  }

  savePrivilegeRequests(currentRequests);
  return updatedReq;
}

// -------------------------------------------------------------
// MEETINGS PUBLIC API
// -------------------------------------------------------------
export function getMeetings(): MeetingSession[] {
  const map = new Map<string, MeetingSession>();
  DEFAULT_MEETINGS.forEach((m) => map.set(m.id, m));

  for (const key of ALL_MEETING_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: MeetingSession[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((m) => {
            if (m && m.id) map.set(m.id, m);
          });
        }
      }
    } catch {}
  }
  return Array.from(map.values());
}

export function saveMeetings(meetings: MeetingSession[]): void {
  ALL_MEETING_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(meetings)); } catch {}
  });

  meetings.forEach((m) => {
    saveToFirestoreDoc('meetings', m.id, m);
  });

  window.dispatchEvent(new Event('geofence_meetings_update'));
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function addMeeting(meeting: MeetingSession): void {
  const current = getMeetings();
  const updated = [meeting, ...current.filter((m) => m.id !== meeting.id)];
  saveMeetings(updated);
}

export function updateMeeting(meeting: MeetingSession): void {
  const current = getMeetings();
  const idx = current.findIndex((m) => m.id === meeting.id);
  if (idx !== -1) {
    current[idx] = meeting;
    saveMeetings(current);
  } else {
    addMeeting(meeting);
  }
}

export function deleteMeeting(meetingId: string): void {
  const current = getMeetings();
  const updated = current.filter((m) => m.id !== meetingId);
  ALL_MEETING_KEYS.forEach((key) => {
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
  });
  removeFromFirestoreDoc('meetings', meetingId);
  window.dispatchEvent(new Event('geofence_meetings_update'));
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function saveMeetingMinutes(meetingId: string, minutes: any): void {
  const meetings = getMeetings();
  const meeting = meetings.find((m) => m.id === meetingId);
  if (meeting) {
    meeting.minutes = minutes;
    saveMeetings(meetings);
  }
}

export function sendMeetingMinutesToManagersAndStaff(meetingId: string, minutes: any): boolean {
  saveMeetingMinutes(meetingId, minutes);
  return true;
}

// -------------------------------------------------------------
// FULL BACKUP & RESTORE
// -------------------------------------------------------------
export function generateFullSystemBackupData(exportedBy: string): FullSystemBackupData {
  return {
    version: '2.5.0',
    exportedAt: new Date().toISOString(),
    exportedBy: exportedBy || 'System Admin',
    employees: getEmployees(),
    departments: getDepartments(),
    geofences: getGeofences(),
    attendanceRecords: getAttendanceRecords(),
    workReports: getWorkReports(),
    privilegeRequests: getPrivilegeRequests(),
    meetings: getMeetings(),
  };
}

export function downloadFullSystemBackup(exportedBy: string): void {
  const data = generateFullSystemBackupData(exportedBy);
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];

  const a = document.createElement('a');
  a.href = url;
  a.download = `YMCA_Full_System_Backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function restoreFullSystemBackup(jsonContent: string): { success: boolean; message: string; restoredCounts?: any } {
  try {
    const data: FullSystemBackupData = JSON.parse(jsonContent);

    if (!data.employees || !Array.isArray(data.employees)) {
      return { success: false, message: 'Invalid backup file structure: missing employees array.' };
    }

    if (data.employees.length > 0) {
      saveEmployees(data.employees);
    }
    if (data.departments && Array.isArray(data.departments)) {
      saveDepartments(data.departments);
    }
    if (data.geofences && Array.isArray(data.geofences)) {
      saveGeofences(data.geofences);
    }
    if (data.attendanceRecords && Array.isArray(data.attendanceRecords)) {
      saveAttendanceRecords(data.attendanceRecords);
    }
    if (data.workReports && Array.isArray(data.workReports)) {
      saveWorkReports(data.workReports);
    }
    if (data.privilegeRequests && Array.isArray(data.privilegeRequests)) {
      savePrivilegeRequests(data.privilegeRequests);
    }
    if (data.meetings && Array.isArray(data.meetings)) {
      saveMeetings(data.meetings);
    }

    window.dispatchEvent(new Event('geofence_storage_update'));

    const counts = {
      employees: data.employees.length,
      attendance: data.attendanceRecords ? data.attendanceRecords.length : 0,
      workReports: data.workReports ? data.workReports.length : 0,
      meetings: data.meetings ? data.meetings.length : 0,
    };

    return {
      success: true,
      message: `System successfully restored! Restored ${counts.employees} staff, ${counts.attendance} attendance logs, ${counts.workReports} work reports, and ${counts.meetings} meeting sessions.`,
      restoredCounts: counts,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to restore backup: ${err?.message || 'Invalid JSON format.'}`,
    };
  }
}

// Automatically start Firestore sync on initialization
initFirestoreSync();
