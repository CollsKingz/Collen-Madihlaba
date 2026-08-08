export interface AppAuthorization {
  user_name: string;
  role: 'Manager' | 'IT_Specialist' | string;
  pin_hash: string;
  is_full_access: boolean;
  updated_at: string;
}

const AUTHORIZATIONS_KEY = 'app_authorizations_v2';
const FULL_ACCESS_SESSION_KEY = 'app_full_access_session_v2';

export const INITIAL_AUTHORIZATIONS: AppAuthorization[] = [
  {
    user_name: 'Collen Madihlaba',
    role: 'IT_Specialist',
    pin_hash: '0002',
    is_full_access: true,
    updated_at: new Date().toISOString(),
  },
  {
    user_name: 'Phuthegi Florence Mashigo',
    role: 'Manager',
    pin_hash: '0001',
    is_full_access: true,
    updated_at: new Date().toISOString(),
  },
];

export function getAppAuthorizations(): AppAuthorization[] {
  const data = localStorage.getItem(AUTHORIZATIONS_KEY);
  if (!data) {
    localStorage.setItem(AUTHORIZATIONS_KEY, JSON.stringify(INITIAL_AUTHORIZATIONS));
    return INITIAL_AUTHORIZATIONS;
  }
  try {
    const list: AppAuthorization[] = JSON.parse(data);
    let modified = false;

    // Ensure seed profiles exist and enforce master PIN 0001 for Manager & 0002 for IT
    INITIAL_AUTHORIZATIONS.forEach((initUser) => {
      const existingIdx = list.findIndex(
        (u) => u.user_name.toLowerCase() === initUser.user_name.toLowerCase()
      );
      if (existingIdx === -1) {
        list.push(initUser);
        modified = true;
      } else {
        // Enforce latest required PIN hash mapping if role matches
        if (initUser.role === 'Manager' && list[existingIdx].pin_hash !== '0001') {
          list[existingIdx].pin_hash = '0001';
          modified = true;
        } else if (initUser.role === 'IT_Specialist' && list[existingIdx].pin_hash !== '0002') {
          list[existingIdx].pin_hash = '0002';
          modified = true;
        }
      }
    });

    if (modified) {
      localStorage.setItem(AUTHORIZATIONS_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    localStorage.setItem(AUTHORIZATIONS_KEY, JSON.stringify(INITIAL_AUTHORIZATIONS));
    return INITIAL_AUTHORIZATIONS;
  }
}

export function saveAppAuthorizations(auths: AppAuthorization[]): void {
  localStorage.setItem(AUTHORIZATIONS_KEY, JSON.stringify(auths));
  window.dispatchEvent(new Event('app_authorizations_update'));
}

export function verifyUserPin(
  userName: string,
  pin: string
): { success: boolean; message: string; user?: AppAuthorization } {
  const auths = getAppAuthorizations();
  const cleanName = userName.trim().toLowerCase();
  const cleanPin = pin.trim();

  const found = auths.find((u) => u.user_name.toLowerCase() === cleanName);
  if (!found) {
    return {
      success: false,
      message: `User profile "${userName}" was not found in the authorization database.`,
    };
  }

  if (found.pin_hash !== cleanPin) {
    return {
      success: false,
      message: `Incorrect PIN entered for ${found.user_name}. Access denied.`,
    };
  }

  // Grant complete administrative access & persist session authorization
  setFullAccessSession(true, found.user_name, found.role);

  return {
    success: true,
    message: `PIN verified! Full administrative access granted for ${found.user_name} (${found.role}).`,
    user: found,
  };
}

export function updateUserPin(
  userName: string,
  currentPin: string,
  newPin: string,
  confirmNewPin: string
): { success: boolean; message: string } {
  const cleanName = userName.trim();
  const cleanCurrent = currentPin.trim();
  const cleanNew = newPin.trim();
  const cleanConfirm = confirmNewPin.trim();

  const auths = getAppAuthorizations();
  const idx = auths.findIndex((u) => u.user_name.toLowerCase() === cleanName.toLowerCase());

  if (idx === -1) {
    return {
      success: false,
      message: `User profile "${userName}" was not found in the authorization registry.`,
    };
  }

  const userRecord = auths[idx];

  // 1. Verify current PIN
  if (userRecord.pin_hash !== cleanCurrent) {
    return {
      success: false,
      message: 'Current PIN is incorrect. Please re-enter your active authorization PIN.',
    };
  }

  // 2. Validate that the new PIN is exactly 4 numerical digits
  if (!/^\d{4}$/.test(cleanNew)) {
    return {
      success: false,
      message: 'New PIN must be exactly 4 numerical digits (e.g., 1234).',
    };
  }

  // 3. Validate match with confirmation PIN
  if (cleanNew !== cleanConfirm) {
    return {
      success: false,
      message: 'New PIN and Confirm New PIN do not match.',
    };
  }

  // 4. Update the record in persistent storage
  auths[idx] = {
    ...userRecord,
    pin_hash: cleanNew,
    updated_at: new Date().toISOString(),
  };

  saveAppAuthorizations(auths);

  return {
    success: true,
    message: 'PIN successfully updated',
  };
}

export function isFullAccessActive(): boolean {
  const session = localStorage.getItem(FULL_ACCESS_SESSION_KEY);
  if (!session) return false;
  try {
    const parsed = JSON.parse(session);
    return Boolean(parsed && parsed.active);
  } catch {
    return false;
  }
}

export function getFullAccessSessionDetails(): { userName: string; role: string; activatedAt: string } | null {
  const session = localStorage.getItem(FULL_ACCESS_SESSION_KEY);
  if (!session) return null;
  try {
    const parsed = JSON.parse(session);
    if (parsed && parsed.active) {
      return {
        userName: parsed.userName || 'Authorized User',
        role: parsed.role || 'Administrator',
        activatedAt: parsed.activatedAt || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setFullAccessSession(active: boolean, userName?: string, role?: string): void {
  if (active) {
    localStorage.setItem(
      FULL_ACCESS_SESSION_KEY,
      JSON.stringify({
        active: true,
        userName: userName || 'Authorized Admin',
        role: role || 'Administrator',
        activatedAt: new Date().toISOString(),
      })
    );
  } else {
    localStorage.removeItem(FULL_ACCESS_SESSION_KEY);
  }
  window.dispatchEvent(new Event('app_authorizations_update'));
  window.dispatchEvent(new Event('geofence_device_update'));
}
