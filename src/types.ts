export type ClockType = 'clock_in' | 'clock_out';

export type AttendanceStatus = 'approved' | 'flagged_geofence' | 'flagged_face' | 'pending';

export type UserRole = 'super_admin' | 'it_admin' | 'manager' | 'standard' | 'board_member';

export type ApprovalStatus = 'pending_manager' | 'pending_it' | 'approved' | 'rejected';

export interface ApprovalAuditEntry {
  id: string;
  requestId: string;
  timestamp: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  previousStatus: ApprovalStatus | 'none';
  newStatus: ApprovalStatus;
  notes?: string;
}

export interface PrivilegeRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterDepartment: string;
  managerId: string;
  managerName: string;
  requestedRole: UserRole | string;
  resourceName: string;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  managerDecision?: {
    decision: 'approved' | 'rejected';
    decidedBy: string;
    decidedAt: string;
    comments?: string;
  };
  itDecision?: {
    decision: 'approved' | 'rejected';
    decidedBy: string;
    decidedAt: string;
    comments?: string;
  };
  history: ApprovalAuditEntry[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  department: string;
  avatar: string;
  registeredFacePhoto?: string;
  biometricRegistered?: boolean;
  registeredAt?: string;
  password?: string;
  managerId?: string;
  managerName?: string;
}

export interface GeofenceLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  timestamp: string; // ISO string
  type: ClockType;
  locationId: string;
  locationName: string;
  userCoords: {
    lat: number;
    lng: number;
  };
  latitude?: number;
  longitude?: number;
  method?: string;
  geofenceDistanceMeters: number;
  withinGeofence: boolean;
  facePhotoUrl: string; // Base64 or image URL captured during check-in
  faceVerified: boolean;
  faceMatchScore: number; // e.g. 98.5
  notes: string;
  shiftType: 'morning' | 'afternoon' | 'night' | 'overtime';
  status: AttendanceStatus;
  qrSessionToken?: string;
  otpCode?: string;
  otpVerified?: boolean;
  morningFunTag?: string;
  managerAction?: string;
}

export interface QRStationSession {
  token: string;
  locationId: string;
  locationName: string;
  createdAt: string;
  expiresAt: string;
}

export interface ProofPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface EmployeeWorkReport {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  timestamp: string; // ISO string
  submittedAt?: string;
  reportType?: 'daily_shift' | 'outing_field_work';
  outingDestination?: string; // Location visited during outing
  arrivalTime?: string; // Arrival time at outing location
  outingReason?: string; // Reason for trip / field work outside center
  shiftSummary: string;
  tasksCompleted: string;
  challengesEncountered?: string;
  photos: ProofPhoto[]; // Minimum of 5 proof photos
  locationName: string;
  status: 'submitted' | 'reviewed' | 'flagged';
}

export interface DailyReportMetrics {
  date: string;
  totalClockIns: number;
  totalClockOuts: number;
  totalHoursWorked: number;
  onTimePercentage: number;
  geofenceCompliancePercentage: number;
  faceMatchAvgScore: number;
  flaggedCount: number;
  departmentBreakdown: { department: string; count: number }[];
  hourlyArrivals: { hour: string; count: number }[];
}

export type ViewMode = 'checkin' | 'manager' | 'qr_kiosk' | 'reports' | 'work_reports' | 'geofences' | 'employees' | 'approvals' | 'meetings' | 'guide';

export interface MeetingParticipant {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isHandRaised: boolean;
  isScreenSharing?: boolean;
}

export interface MeetingActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  status: 'pending' | 'completed';
}

export interface MeetingMinutes {
  id: string;
  meetingId: string;
  meetingTitle: string;
  preparedBy: string;
  preparedById: string;
  date: string;
  attendees: string[];
  apologies?: string[];
  agendaItems: string[];
  discussionSummary: string;
  actionItems: MeetingActionItem[];
  boardResolutions?: string[];
  sentAt?: string;
  sentToRoles?: string[];
}

export interface MeetingSession {
  id: string;
  title: string;
  category: 'Board Meeting' | 'Executive Committee' | 'Staff Briefing' | 'IT & Operations' | 'General';
  scheduledTime: string;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  hostId: string;
  hostName: string;
  meetingLink: string;
  recordingUrl?: string;
  participants: MeetingParticipant[];
  minutes?: MeetingMinutes;
  createdAt: string;
}

export interface FullSystemBackupData {
  exportDate?: string;
  exportedAt?: string;
  exportedBy: string;
  version: string;
  employees: Employee[];
  departments: string[];
  geofences: GeofenceLocation[];
  attendanceRecords: AttendanceRecord[];
  workReports: EmployeeWorkReport[];
  privilegeRequests: PrivilegeRequest[];
  meetings: MeetingSession[];
}

