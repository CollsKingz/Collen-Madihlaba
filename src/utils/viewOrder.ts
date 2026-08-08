import { ViewMode } from '../types';
import {
  ScanQrCode,
  Monitor,
  Users,
  Camera,
  FileText,
  ShieldCheck,
  QrCode,
  MapPin,
  Video,
  LucideIcon
} from 'lucide-react';

export interface ViewNavItem {
  id: ViewMode;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  isRestricted?: boolean;
  colorClass?: string;
  badgeType?: 'pending' | 'approvals';
}

export const VIEW_NAVIGATION_LIST: ViewNavItem[] = [
  {
    id: 'checkin',
    label: 'Clock In / Out',
    shortLabel: 'Clock',
    icon: ScanQrCode,
  },
  {
    id: 'guide',
    label: 'App Tutorial & Guide',
    shortLabel: 'Tutorial',
    icon: Video,
    colorClass: 'text-amber-400',
  },
  {
    id: 'manager',
    label: 'Manager Laptop',
    shortLabel: 'Manager',
    icon: Monitor,
    isRestricted: true,
    badgeType: 'pending',
  },
  {
    id: 'employees',
    label: 'Employees Directory',
    shortLabel: 'Staff',
    icon: Users,
    isRestricted: true,
  },
  {
    id: 'work_reports',
    label: 'Shift Proof Reports',
    shortLabel: 'Proof',
    icon: Camera,
    colorClass: 'text-pink-400',
  },
  {
    id: 'reports',
    label: 'Attendance Summary',
    shortLabel: 'Reports',
    icon: FileText,
  },
  {
    id: 'approvals',
    label: 'Approvals Workflow',
    shortLabel: 'Approvals',
    icon: ShieldCheck,
    colorClass: 'text-emerald-400',
    badgeType: 'approvals',
  },
  {
    id: 'meetings',
    label: 'Meetings & Live Video Call',
    shortLabel: 'Meetings',
    icon: Video,
    colorClass: 'text-indigo-400',
  },
  {
    id: 'qr_kiosk',
    label: 'Station QR Display',
    shortLabel: 'QR Kiosk',
    icon: QrCode,
    isRestricted: true,
  },
  {
    id: 'geofences',
    label: 'Geofences Config',
    shortLabel: 'Geofence',
    icon: MapPin,
    isRestricted: true,
  },
];

export function getViewIndex(view: ViewMode): number {
  const index = VIEW_NAVIGATION_LIST.findIndex((item) => item.id === view);
  return index >= 0 ? index : 0;
}

export function getNextView(currentView: ViewMode): ViewMode {
  const currentIndex = getViewIndex(currentView);
  const nextIndex = (currentIndex + 1) % VIEW_NAVIGATION_LIST.length;
  return VIEW_NAVIGATION_LIST[nextIndex].id;
}

export function getPrevView(currentView: ViewMode): ViewMode {
  const currentIndex = getViewIndex(currentView);
  const prevIndex = (currentIndex - 1 + VIEW_NAVIGATION_LIST.length) % VIEW_NAVIGATION_LIST.length;
  return VIEW_NAVIGATION_LIST[prevIndex].id;
}
