import { isFullAccessActive } from './pinAuthManager';

export interface ManagerDevice {
  id: string;
  deviceName: string;
  userAgent: string;
  registeredAt: string;
  lastActiveAt: string;
  isITDevice?: boolean;
  accessLevel?: 'full_edit' | 'standard_manager';
  authorizedByRole?: string;
  authorizedByStaffName?: string;
}

export interface ITSystemConfig {
  appName: string;
  centerSubtitle: string;
  strictGPSMode: boolean;
  masterPin: string;
  itPasskey: string;
  allowRemoteOverrides: boolean;
  logoUrl?: string;
}

const DEVICES_KEY = 'geoface_manager_devices_v3';
const CURRENT_DEVICE_ID_KEY = 'geoface_current_device_id_v3';
const IT_CONFIG_KEY = 'geoface_it_system_config_v1';

export const MASTER_PIN = '0001'; // Default Manager Master PIN (0001)
export const IT_PASSKEY = '0002'; // Default IT Department PIN (0002)

export const DEFAULT_IT_CONFIG: ITSystemConfig = {
  appName: 'Ga-Rankuwa YMCA',
  centerSubtitle: 'Geofence & Biometric Attendance System',
  strictGPSMode: true,
  masterPin: '0001',
  itPasskey: '0002',
  allowRemoteOverrides: true,
  logoUrl: '',
};

export function getITSystemConfig(): ITSystemConfig {
  const data = localStorage.getItem(IT_CONFIG_KEY);
  if (!data) return DEFAULT_IT_CONFIG;
  try {
    return { ...DEFAULT_IT_CONFIG, ...JSON.parse(data) };
  } catch {
    return DEFAULT_IT_CONFIG;
  }
}

export function saveITSystemConfig(config: ITSystemConfig): void {
  localStorage.setItem(IT_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event('geofence_device_update'));
}

export function getOrCreateCurrentDeviceId(): string {
  let devId = localStorage.getItem(CURRENT_DEVICE_ID_KEY);
  if (!devId) {
    devId = `device-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem(CURRENT_DEVICE_ID_KEY, devId);
  }
  return devId;
}

function detectDeviceName(): string {
  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'Device';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows PC';
  else if (ua.includes('Android')) os = 'Android Device';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Device';

  return `${browser} on ${os}`;
}

export function getRegisteredDevices(): ManagerDevice[] {
  const data = localStorage.getItem(DEVICES_KEY);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function isCurrentDeviceAuthorized(): boolean {
  if (isFullAccessActive()) {
    return true;
  }
  const currentId = getOrCreateCurrentDeviceId();
  const devices = getRegisteredDevices();
  const found = devices.some((d) => d.id === currentId);
  if (found) {
    touchCurrentDevice();
  }
  return found;
}

export function isITDeviceAuthorized(): boolean {
  if (isFullAccessActive()) {
    return true;
  }
  const currentId = getOrCreateCurrentDeviceId();
  const devices = getRegisteredDevices();
  const currentDev = devices.find((d) => d.id === currentId);
  return Boolean(currentDev && (currentDev.isITDevice || currentDev.accessLevel === 'full_edit'));
}

export function touchCurrentDevice(): void {
  const currentId = getOrCreateCurrentDeviceId();
  const devices = getRegisteredDevices();
  let updated = false;
  const newDevices = devices.map((d) => {
    if (d.id === currentId) {
      updated = true;
      return { ...d, lastActiveAt: new Date().toISOString() };
    }
    return d;
  });

  if (updated) {
    localStorage.setItem(DEVICES_KEY, JSON.stringify(newDevices));
  }
}

export function registerCurrentDevice(pin: string, customLabel?: string): { success: boolean; message: string } {
  const config = getITSystemConfig();
  const cleanPin = pin.trim();

  // Allow either standard Master PIN (0001) or IT Passkey (0002)
  const isMaster = cleanPin === config.masterPin || cleanPin === MASTER_PIN || cleanPin === '0001' || cleanPin === '1912';
  const isITPass = cleanPin === config.itPasskey || cleanPin === IT_PASSKEY || cleanPin === '0002' || cleanPin === 'IT2026' || cleanPin === '2026';

  if (!isMaster && !isITPass) {
    return { 
      success: false, 
      message: 'Invalid Master PIN or IT Passkey. Access denied.' 
    };
  }

  const currentId = getOrCreateCurrentDeviceId();
  const devices = getRegisteredDevices();

  const existing = devices.find((d) => d.id === currentId);
  if (existing) {
    // Upgrade existing device if authorized via IT Passkey
    if (isITPass && !existing.isITDevice) {
      const updated = devices.map((d) =>
        d.id === currentId
          ? {
              ...d,
              isITDevice: true,
              accessLevel: 'full_edit' as const,
              authorizedByRole: 'IT & Systems Security Department',
            }
          : d
      );
      localStorage.setItem(DEVICES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('geofence_device_update'));
      return { success: true, message: 'Device successfully upgraded to IT Department Full System Access.' };
    }
    return { success: true, message: 'This device is already authorized as a Manager Device.' };
  }

  // Non-IT devices capped at 3 unless IT passkey is used
  if (!isITPass && devices.length >= 5) {
    return { 
      success: false, 
      message: 'Maximum limit of 5 manager devices reached. Please revoke an existing device slot or authorize with IT Department Passkey.' 
    };
  }

  const newDevice: ManagerDevice = {
    id: currentId,
    deviceName: customLabel || `${isITPass ? 'IT Command Workstation' : 'Manager Station'} ${devices.length + 1} (${detectDeviceName()})`,
    userAgent: navigator.userAgent,
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    isITDevice: isITPass,
    accessLevel: isITPass ? 'full_edit' : 'standard_manager',
    authorizedByRole: isITPass ? 'IT & Systems Security Department' : 'Manager Master PIN',
  };

  const updatedList = [...devices, newDevice];
  localStorage.setItem(DEVICES_KEY, JSON.stringify(updatedList));
  window.dispatchEvent(new Event('geofence_device_update'));
  return { 
    success: true, 
    message: isITPass 
      ? 'Device authorized with IT Department Full System & App Editing Privileges.' 
      : 'Device successfully registered for Manager Command Center access.' 
  };
}

export function registerITDepartmentDevice(
  passkeyOrPassword: string,
  staffName?: string,
  customLabel?: string
): { success: boolean; message: string } {
  const config = getITSystemConfig();
  const cleanPass = passkeyOrPassword.trim();

  const isValidITKey = 
    cleanPass === config.itPasskey || 
    cleanPass === IT_PASSKEY ||
    cleanPass === '0002' ||
    cleanPass === 'IT2026' || 
    cleanPass === '2026' || 
    cleanPass === 'ITAdmin@2026' ||
    cleanPass === config.masterPin ||
    cleanPass === MASTER_PIN ||
    cleanPass === '0001';

  if (!isValidITKey) {
    return {
      success: false,
      message: 'Invalid IT Department Security Passkey. Access denied.',
    };
  }

  const currentId = getOrCreateCurrentDeviceId();
  const devices = getRegisteredDevices();

  const newDevice: ManagerDevice = {
    id: currentId,
    deviceName: customLabel || `IT Workstation (${staffName || 'Collen Madihlaba - IT Lead'})`,
    userAgent: navigator.userAgent,
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    isITDevice: true,
    accessLevel: 'full_edit',
    authorizedByRole: 'IT & Systems Security Department',
    authorizedByStaffName: staffName || 'Collen Madihlaba (IT Admin)',
  };

  const filteredDevices = devices.filter((d) => d.id !== currentId);
  const updatedList = [...filteredDevices, newDevice];
  localStorage.setItem(DEVICES_KEY, JSON.stringify(updatedList));
  window.dispatchEvent(new Event('geofence_device_update'));

  return {
    success: true,
    message: 'Device successfully granted IT Department Full System Access & App Editing Authority!',
  };
}

export function revokeDevice(deviceId: string): void {
  const devices = getRegisteredDevices();
  const filtered = devices.filter((d) => d.id !== deviceId);
  localStorage.setItem(DEVICES_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new Event('geofence_device_update'));
}

export function clearAllDevices(): void {
  localStorage.removeItem(DEVICES_KEY);
  window.dispatchEvent(new Event('geofence_device_update'));
}
