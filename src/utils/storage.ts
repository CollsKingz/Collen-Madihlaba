import {
  AttendanceRecord,
  Employee,
  GeofenceLocation,
  EmployeeWorkReport,
  PrivilegeRequest,
  ApprovalAuditEntry,
  MeetingSession,
  MeetingMinutes,
  FullSystemBackupData
} from '../types';

const EMPLOYEES_KEY = 'geoface_employees_v7';
const GEOFENCES_KEY = 'geoface_geofences_v7';
const RECORDS_KEY = 'geoface_records_v7';
const WORK_REPORTS_KEY = 'geoface_work_reports_v7';
const PRIVILEGE_REQUESTS_KEY = 'geoface_privilege_requests_v7';
const MEETINGS_KEY = 'geoface_meetings_v1';

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

const DEPARTMENTS_KEY = 'geoface_departments_v5';

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

export function getDepartments(): string[] {
  const set = new Set<string>();

  // 1. Gather departments from all department keys
  for (const key of ALL_DEPARTMENT_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          parsed.forEach((d) => {
            if (typeof d === 'string' && d.trim()) set.add(d.trim());
          });
        }
      }
    } catch (e) {
      console.warn('Error reading department key:', key, e);
    }
  }

  // 2. Include default departments
  DEFAULT_DEPARTMENTS.forEach((d) => set.add(d.trim()));

  // 3. Include departments assigned to registered employees
  try {
    const emps = getEmployees();
    emps.forEach((emp) => {
      if (emp.department && emp.department.trim()) {
        set.add(emp.department.trim());
      }
    });
  } catch (e) {
    console.warn('Error reading employees for departments:', e);
  }

  const result = Array.from(set);

  // Sync back to all department keys
  ALL_DEPARTMENT_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(result));
    } catch (e) {
      console.error('Error saving departments:', e);
    }
  });

  return result;
}

export function saveDepartments(departments: string[]): void {
  const cleaned = departments.map((d) => d.trim()).filter(Boolean);
  const unique = Array.from(new Set(cleaned));

  ALL_DEPARTMENT_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(unique));
    } catch (e) {
      console.error('Error saving departments:', e);
    }
  });

  window.dispatchEvent(new Event('geofence_departments_update'));
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function addDepartment(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const current = getDepartments();
  if (current.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
    return false;
  }
  const updated = [...current, trimmed];
  saveDepartments(updated);
  return true;
}

export function updateDepartment(oldName: string, newName: string): boolean {
  const trimmedNew = newName.trim();
  if (!trimmedNew || oldName === trimmedNew) return false;
  const current = getDepartments();
  const index = current.findIndex(d => d === oldName);
  if (index === -1) return false;
  
  current[index] = trimmedNew;
  saveDepartments(current);

  // Update employees assigned to old department
  const employees = getEmployees();
  let empUpdated = false;
  employees.forEach(emp => {
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
  const filtered = current.filter(d => d !== deptName);
  if (filtered.length === current.length) return false;
  saveDepartments(filtered);
  return true;
}

export function resetDepartmentsToDefaults(): void {
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(DEFAULT_DEPARTMENTS));
  window.dispatchEvent(new Event('geofence_departments_update'));
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export const YMCA_DEPARTMENTS = DEFAULT_DEPARTMENTS;

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

export function getEmployees(): Employee[] {
  const map = new Map<string, Employee>();

  // 1. Gather stored profiles from all keys in chronological order (oldest to newest)
  for (const key of ALL_EMPLOYEE_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: Employee[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((emp) => {
            if (emp && emp.id && emp.name) {
              const validated: Employee = {
                ...emp,
                password: emp.password || `${emp.name.split(' ')[0] || 'User'}@2026`,
              };
              const existing = map.get(emp.id);
              if (existing) {
                // Merge so newer key's profile and credentials override older key's profile
                map.set(emp.id, { ...existing, ...validated });
              } else {
                map.set(emp.id, validated);
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading employee key:', key, e);
    }
  }

  // 2. Only if NO employee profiles exist in ANY storage key, seed with default initial profiles
  if (map.size === 0) {
    DEFAULT_EMPLOYEES.forEach((emp) => {
      map.set(emp.id, emp);
    });
  }

  const result = Array.from(map.values());

  // 3. Keep all employee keys in sync with consolidated profiles
  ALL_EMPLOYEE_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(result));
    } catch (e) {
      console.error('Error storing consolidated employees:', e);
    }
  });

  return result;
}

export function saveEmployees(employees: Employee[]): void {
  // Sync to all employee storage keys so switching versions never loses registered profiles
  ALL_EMPLOYEE_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(employees));
    } catch (e) {
      console.error('Error saving employees to key:', key, e);
    }
  });
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function addEmployee(employee: Employee): void {
  const current = getEmployees();
  if (!employee.password) {
    const firstName = employee.name.split(' ')[0] || 'User';
    employee.password = `${firstName}@2026`;
  }
  const updated = [employee, ...current];
  saveEmployees(updated);
}

export function updateEmployee(employee: Employee): void {
  const current = getEmployees();
  const updated = current.map((emp) => (emp.id === employee.id ? employee : emp));
  saveEmployees(updated);
}

export function verifyEmployeePassword(employeeId: string, inputPass: string): boolean {
  const emps = getEmployees();
  const target = emps.find((e) => e.id === employeeId);
  if (!target) return false;
  const validPass = target.password || `${target.name.split(' ')[0]}@2026`;
  return inputPass.trim() === validPass.trim();
}

export function updateEmployeePassword(employeeId: string, newPass: string): boolean {
  const emps = getEmployees();
  const targetIndex = emps.findIndex((e) => e.id === employeeId);
  if (targetIndex === -1) return false;
  emps[targetIndex].password = newPass.trim();
  saveEmployees(emps);
  return true;
}

export function deleteEmployee(employeeId: string): void {
  const current = getEmployees();
  const updated = current.filter((emp) => emp.id !== employeeId);
  saveEmployees(updated);
}

const CURRENT_USER_KEY = 'geofence_current_user_v1';

export function getCurrentUser(): Employee | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  try {
    const user: Employee = JSON.parse(data);
    if (!user || !user.id) return null;
    const emps = getEmployees();
    const latest = emps.find((e) => e.id === user.id || (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase()));
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
  window.dispatchEvent(new Event('geofence_user_session_update'));
}

export function logoutUser(): void {
  setCurrentUser(null);
}

export function loginEmployee(
  identifier: string,
  pass: string
): { success: boolean; user?: Employee; message: string } {
  const emps = getEmployees();
  const cleanId = identifier.trim().toLowerCase();
  const target = emps.find(
    (e) =>
      e.id.toLowerCase() === cleanId ||
      e.email.toLowerCase() === cleanId ||
      e.name.toLowerCase() === cleanId
  );

  if (!target) {
    return {
      success: false,
      message: 'Account not found with provided Email or Employee ID. Please check or register a new profile.',
    };
  }

  const validPass = target.password || `${target.name.split(' ')[0]}@2026`;
  if (pass.trim() !== validPass.trim()) {
    return {
      success: false,
      message: `Incorrect security password for ${target.name}. Please try again.`,
    };
  }

  setCurrentUser(target);
  return {
    success: true,
    user: target,
    message: `Welcome back, ${target.name}! Successfully logged into YMCA Staff Portal.`,
  };
}

export function registerEmployeeProfile(
  newProfile: Omit<Employee, 'id'> & { id?: string }
): { success: boolean; user?: Employee; message: string } {
  const emps = getEmployees();
  const cleanEmail = newProfile.email ? newProfile.email.trim().toLowerCase() : '';

  // Check if profile with this email or ID already exists
  const existingEmailIndex = emps.findIndex(
    (e) => (cleanEmail && e.email.trim().toLowerCase() === cleanEmail) || (newProfile.id && e.id === newProfile.id)
  );

  const facePhoto = newProfile.registeredFacePhoto || newProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
  const firstName = newProfile.name.trim().split(' ')[0] || 'Staff';

  if (existingEmailIndex !== -1) {
    // Update existing profile details and sign in
    const existing = emps[existingEmailIndex];
    const updated: Employee = {
      ...existing,
      name: newProfile.name.trim() || existing.name,
      email: newProfile.email.trim() || existing.email,
      role: newProfile.role.trim() || existing.role,
      department: newProfile.department || existing.department,
      password: newProfile.password?.trim() || existing.password || `${firstName}@2026`,
      avatar: facePhoto,
      registeredFacePhoto: facePhoto,
      biometricRegistered: true,
      registeredAt: existing.registeredAt || new Date().toISOString(),
    };
    emps[existingEmailIndex] = updated;
    saveEmployees(emps);
    setCurrentUser(updated);
    return {
      success: true,
      user: updated,
      message: `Profile updated and logged in! Welcome back, ${updated.name}.`,
    };
  }

  // Create new staff profile
  const empId = newProfile.id || `emp-${Date.now().toString(36)}`;
  const fullProfile: Employee = {
    ...newProfile,
    id: empId,
    email: newProfile.email ? newProfile.email.trim() : `${firstName.toLowerCase()}.${Date.now().toString(36)}@garankuwaymca.org.za`,
    name: newProfile.name.trim(),
    role: newProfile.role.trim() || 'YMCA Staff Member',
    department: newProfile.department || 'Youth & Community Development',
    password: newProfile.password?.trim() || `${firstName}@2026`,
    avatar: facePhoto,
    registeredFacePhoto: facePhoto,
    biometricRegistered: true,
    registeredAt: new Date().toISOString(),
  };

  addEmployee(fullProfile);
  setCurrentUser(fullProfile);
  return {
    success: true,
    user: fullProfile,
    message: `Profile successfully created! Welcome to Ga-Rankuwa YMCA, ${fullProfile.name}.`,
  };
}

export function getGeofences(): GeofenceLocation[] {
  const map = new Map<string, GeofenceLocation>();

  // 1. Seed defaults
  DEFAULT_GEOFENCES.forEach((geo) => map.set(geo.id, geo));

  // 2. Read from all geofence keys
  for (const key of ALL_GEOFENCE_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: GeofenceLocation[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((geo) => {
            if (geo && geo.id) {
              const existing = map.get(geo.id);
              if (existing) {
                map.set(geo.id, { ...existing, ...geo });
              } else {
                map.set(geo.id, geo);
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading geofence key:', key, e);
    }
  }

  const result = Array.from(map.values());

  ALL_GEOFENCE_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(result));
    } catch (e) {
      console.error('Error saving geofences:', e);
    }
  });

  return result;
}

export function saveGeofences(geofences: GeofenceLocation[]): void {
  ALL_GEOFENCE_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(geofences));
    } catch (e) {
      console.error('Error saving geofences:', e);
    }
  });
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function getAttendanceRecords(): AttendanceRecord[] {
  const map = new Map<string, AttendanceRecord>();

  for (const key of ALL_RECORD_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: AttendanceRecord[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((rec) => {
            if (rec && rec.id) {
              const existing = map.get(rec.id);
              if (existing) {
                map.set(rec.id, { ...existing, ...rec });
              } else {
                map.set(rec.id, rec);
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading attendance records key:', key, e);
    }
  }

  const result = Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  ALL_RECORD_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(result));
    } catch (e) {
      console.error('Error saving attendance records:', e);
    }
  });

  return result;
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  ALL_RECORD_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving attendance records:', e);
    }
  });
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function addAttendanceRecord(record: AttendanceRecord): void {
  const current = getAttendanceRecords();
  const updated = [record, ...current.filter((r) => r.id !== record.id)];
  saveAttendanceRecords(updated);

  // Dispatch custom event for real-time manager feed update
  window.dispatchEvent(new CustomEvent('geofence_clock_in_event', { detail: record }));
}

export function updateRecordStatus(recordId: string, status: AttendanceRecord['status']): void {
  const records = getAttendanceRecords();
  const updated = records.map((r) => (r.id === recordId ? { ...r, status } : r));
  saveAttendanceRecords(updated);
}

export function exportRecordsToCSV(records: AttendanceRecord[]): void {
  const headers = [
    'ID',
    'Timestamp',
    'Employee Name',
    'Department',
    'Clock Type',
    'Location Name',
    'Within Geofence',
    'Distance (m)',
    'Face Match %',
    'Status',
    'Notes',
  ];

  const rows = records.map((r) => [
    r.id,
    new Date(r.timestamp).toLocaleString(),
    `"${r.employeeName}"`,
    `"${r.employeeDepartment}"`,
    r.type.toUpperCase(),
    `"${r.locationName}"`,
    r.withinGeofence ? 'YES' : 'NO',
    r.geofenceDistanceMeters,
    `${r.faceMatchScore}%`,
    r.status.toUpperCase(),
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `GeoFace_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function resetEmployeesToDefaults(): Employee[] {
  const current = getEmployees();
  const map = new Map<string, Employee>();
  DEFAULT_EMPLOYEES.forEach((emp) => map.set(emp.id, emp));
  current.forEach((emp) => map.set(emp.id, emp));
  const merged = Array.from(map.values());
  saveEmployees(merged);
  window.dispatchEvent(new Event('geofence_storage_update'));
  return merged;
}

export const resetStorageToDefaults = resetEmployeesToDefaults;

export function getWorkReports(): EmployeeWorkReport[] {
  const map = new Map<string, EmployeeWorkReport>();

  for (const key of ALL_WORK_REPORT_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: EmployeeWorkReport[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((rep) => {
            if (rep && rep.id) {
              const existing = map.get(rep.id);
              if (existing) {
                map.set(rep.id, { ...existing, ...rep });
              } else {
                map.set(rep.id, rep);
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading work reports key:', key, e);
    }
  }

  const result = Array.from(map.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  ALL_WORK_REPORT_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(result));
    } catch (e) {
      console.error('Error saving work reports:', e);
    }
  });

  return result;
}

export function saveWorkReports(reports: EmployeeWorkReport[]): void {
  ALL_WORK_REPORT_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(reports));
    } catch (e) {
      console.error('Error saving work reports:', e);
    }
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
  saveWorkReports(updated);
}

// -------------------------------------------------------------
// PRIVILEGE REQUESTS & MULTI-TIER APPROVAL STORAGE HANDLERS
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
            if (req && req.id) {
              map.set(req.id, req);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading privilege requests key:', key, e);
    }
  }

  const result = Array.from(map.values());

  ALL_PRIVILEGE_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(result));
    } catch (e) {
      console.error('Error saving privilege requests:', e);
    }
  });

  return result;
}

export function savePrivilegeRequests(requests: PrivilegeRequest[]): void {
  ALL_PRIVILEGE_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(requests));
    } catch (e) {
      console.error('Error saving privilege requests:', e);
    }
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

  // If approved and requested a role upgrade, update employee's role in system registry!
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
// MEETINGS & LIVE VIDEO CONFERENCE STORAGE HANDLERS
// -------------------------------------------------------------

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
    minutes: {
      id: 'min-101',
      meetingId: 'meet-101',
      meetingTitle: 'YMCA Board of Directors Quarterly Governance Review',
      preparedBy: 'Collen Madihlaba (IT Lead & Super Admin)',
      preparedById: 'emp-100',
      date: new Date().toISOString().split('T')[0],
      attendees: ['Adv. Tebogo Molefe', 'Collen Madihlaba', 'Sibusiso Dlamini'],
      apologies: ['Center Finance Officer'],
      agendaItems: [
        'Quarterly Geofence Attendance & Compliance Audit',
        'Staff Elevated Privileges & Security Review',
        'Outing & Field Work Proof Photos Review',
        'Center Facilities & Digital Infrastructure Expansion'
      ],
      discussionSummary: 'Board approved the new Biometric Face & Geofence system rollout across Zone 1 and Zone 4 complexes. Unanimous vote on elevated privilege audits and mandatory field proof photo submission.',
      actionItems: [
        {
          id: 'act-1',
          task: 'Distribute monthly attendance report archive to Board Members',
          assignee: 'Collen Madihlaba',
          deadline: '2026-08-15',
          status: 'pending',
        },
        {
          id: 'act-2',
          task: 'Verify all field outing work reports contain 5 proof photos',
          assignee: 'Sibusiso Dlamini',
          deadline: '2026-08-12',
          status: 'completed',
        },
      ],
      boardResolutions: [
        'Resolution 2026-08/A: Mandatory Biometric Check-in enforced for all center staff.',
        'Resolution 2026-08/B: Board Members granted full real-time oversight access.'
      ],
      sentAt: new Date().toISOString(),
      sentToRoles: ['board_member', 'manager', 'super_admin', 'it_admin'],
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'meet-102',
    title: 'Weekly Staff Alignment & Shift Operations Sync',
    category: 'Staff Briefing',
    scheduledTime: new Date(Date.now() - 1800000).toISOString(),
    durationMinutes: 45,
    status: 'live',
    hostId: 'emp-mgr-1',
    hostName: 'Sibusiso Dlamini (Manager)',
    meetingLink: 'https://garankuwaymca.org.za/meet/weekly-staff-sync',
    participants: [
      {
        id: 'emp-mgr-1',
        name: 'Sibusiso Dlamini',
        role: 'manager',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        isVideoOn: true,
        isAudioOn: true,
        isHandRaised: false,
        isScreenSharing: true,
      },
      {
        id: 'emp-100',
        name: 'Collen Madihlaba',
        role: 'super_admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        isVideoOn: true,
        isAudioOn: true,
        isHandRaised: true,
      },
    ],
    minutes: {
      id: 'min-102',
      meetingId: 'meet-102',
      meetingTitle: 'Weekly Staff Alignment & Shift Operations Sync',
      preparedBy: 'Sibusiso Dlamini',
      preparedById: 'emp-mgr-1',
      date: new Date().toISOString().split('T')[0],
      attendees: ['Sibusiso Dlamini', 'Collen Madihlaba'],
      agendaItems: ['Morning shift geofence arrivals', 'Field work outing logs', 'IT app updates'],
      discussionSummary: 'Reviewed morning arrival metrics. 98.2% on-time rate achieved this week.',
      actionItems: [],
    },
    createdAt: new Date().toISOString(),
  },
];

export function getMeetings(): MeetingSession[] {
  const map = new Map<string, MeetingSession>();

  // 1. Seed defaults
  DEFAULT_MEETINGS.forEach((m) => map.set(m.id, m));

  // 2. Read from all meeting keys
  for (const key of ALL_MEETING_KEYS) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const list: MeetingSession[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((m) => {
            if (m && m.id) {
              const existing = map.get(m.id);
              if (existing) {
                map.set(m.id, { ...existing, ...m });
              } else {
                map.set(m.id, m);
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading meetings key:', key, e);
    }
  }

  const result = Array.from(map.values());

  ALL_MEETING_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(result));
    } catch (e) {
      console.error('Error saving meetings:', e);
    }
  });

  return result;
}

export function saveMeetings(meetings: MeetingSession[]): void {
  ALL_MEETING_KEYS.forEach((key) => {
    try {
      localStorage.setItem(key, JSON.stringify(meetings));
    } catch (e) {
      console.error('Error saving meetings:', e);
    }
  });
  window.dispatchEvent(new Event('geofence_meetings_update'));
  window.dispatchEvent(new Event('geofence_storage_update'));
}

export function addMeeting(meeting: MeetingSession): void {
  const current = getMeetings();
  const updated = [meeting, ...current];
  saveMeetings(updated);
}

export function updateMeeting(meeting: MeetingSession): void {
  const current = getMeetings();
  const updated = current.map((m) => (m.id === meeting.id ? meeting : m));
  saveMeetings(updated);
}

export function deleteMeeting(meetingId: string): void {
  const current = getMeetings();
  const updated = current.filter((m) => m.id !== meetingId);
  saveMeetings(updated);
}

export function saveMeetingMinutes(meetingId: string, minutes: MeetingMinutes): void {
  const meetings = getMeetings();
  const index = meetings.findIndex((m) => m.id === meetingId);
  if (index === -1) return;
  meetings[index].minutes = minutes;
  saveMeetings(meetings);
}

export function sendMeetingMinutesToManagersAndStaff(meetingId: string, minutes: MeetingMinutes): boolean {
  const meetings = getMeetings();
  const index = meetings.findIndex((m) => m.id === meetingId);
  if (index === -1) return false;

  const updatedMinutes: MeetingMinutes = {
    ...minutes,
    sentAt: new Date().toISOString(),
    sentToRoles: ['manager', 'board_member', 'super_admin', 'it_admin', 'standard'],
  };

  meetings[index].minutes = updatedMinutes;
  saveMeetings(meetings);

  // Dispatch custom distribution event
  window.dispatchEvent(
    new CustomEvent('geofence_meeting_minutes_sent', {
      detail: { meetingTitle: meetings[index].title, minutes: updatedMinutes },
    })
  );

  return true;
}

// -------------------------------------------------------------
// MANAGER & ADMIN ELEVATED PRIVILEGE EDITING
// -------------------------------------------------------------

export function updateEmployeeElevatedPrivileges(
  employeeId: string,
  newRole: string,
  department: string,
  newPassword?: string
): { success: boolean; employee?: Employee; message: string } {
  const employees = getEmployees();
  const index = employees.findIndex((e) => e.id === employeeId);
  if (index === -1) {
    return { success: false, message: 'Employee record not found.' };
  }

  const target = employees[index];
  const updated: Employee = {
    ...target,
    role: newRole,
    department: department || target.department,
    password: newPassword && newPassword.trim() ? newPassword.trim() : target.password,
  };

  employees[index] = updated;
  saveEmployees(employees);

  return {
    success: true,
    employee: updated,
    message: `Elevated privileges for ${updated.name} updated to '${newRole}' in ${updated.department}.`,
  };
}

// -------------------------------------------------------------
// FULL SYSTEM BACKUP & RESTORE UTILITIES
// -------------------------------------------------------------

export function generateFullSystemBackupData(exportedBy: string): FullSystemBackupData {
  return {
    exportDate: new Date().toISOString(),
    exportedBy: exportedBy || 'Collen Madihlaba (System Admin)',
    version: 'Ga-Rankuwa YMCA v7.0',
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
      localStorage.setItem(RECORDS_KEY, JSON.stringify(data.attendanceRecords));
    }
    if (data.workReports && Array.isArray(data.workReports)) {
      localStorage.setItem(WORK_REPORTS_KEY, JSON.stringify(data.workReports));
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


