import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Key, 
  Smartphone, 
  PlusCircle, 
  Lock, 
  ShieldCheck, 
  AlertOctagon,
  Users,
  MapPin,
  QrCode,
  Cpu,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  isCurrentDeviceAuthorized, 
  registerCurrentDevice, 
  registerITDepartmentDevice,
  getRegisteredDevices, 
  getITSystemConfig,
  MASTER_PIN 
} from '../utils/deviceManager';
import { getEmployees } from '../utils/storage';
import { getAppAuthorizations, verifyUserPin } from '../utils/pinAuthManager';
import { PINAuthModal } from './PINAuthModal';

interface ManagerAccessGuardProps {
  title: string;
  description: string;
  icon?: 'employees' | 'locations' | 'kiosk' | 'manager';
  children: React.ReactNode;
}

export const ManagerAccessGuard: React.FC<ManagerAccessGuardProps> = ({
  title,
  description,
  icon = 'manager',
  children
}) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'standard' | 'it_dept'>('it_dept');

  // Form states
  const [pinInput, setPinInput] = useState<string>('');
  const [customDeviceLabel, setCustomDeviceLabel] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // IT Staff selection
  const [employees, setEmployees] = useState(getEmployees());
  const [selectedITStaffId, setSelectedITStaffId] = useState<string>('');

  const [registeredDevices, setRegisteredDevices] = useState(getRegisteredDevices());
  const itConfig = getITSystemConfig();

  const checkAuthorization = () => {
    setIsAuthorized(isCurrentDeviceAuthorized());
    setRegisteredDevices(getRegisteredDevices());
  };

  useEffect(() => {
    checkAuthorization();
    setEmployees(getEmployees());
    window.addEventListener('geofence_device_update', checkAuthorization);
    return () => window.removeEventListener('geofence_device_update', checkAuthorization);
  }, []);

  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  const itStaffList = employees.filter(
    (e) => e.department === 'IT & Systems Security' || e.role.toLowerCase().includes('it')
  );

  const handleAuthorizeDevice = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    const cleanInput = pinInput.trim();
    if (!cleanInput) {
      setPinError('Security Passkey / PIN is required.');
      return;
    }

    // Check if input matches an authorized PIN (e.g., 0001 or 0002)
    const authorizations = getAppAuthorizations();
    const matched = authorizations.find((a) => a.pin_hash === cleanInput);

    if (matched) {
      const res = verifyUserPin(matched.user_name, cleanInput);
      if (res.success) {
        setPinInput('');
        setCustomDeviceLabel('');
        checkAuthorization();
        return;
      }
    }

    if (authMode === 'it_dept') {
      const selectedStaff = itStaffList.find((s) => s.id === selectedITStaffId);
      const staffName = selectedStaff ? selectedStaff.name : 'Collen Madihlaba (IT Lead)';
      
      const result = registerITDepartmentDevice(
        cleanInput,
        staffName,
        customDeviceLabel.trim() || undefined
      );

      if (result.success) {
        setPinInput('');
        setCustomDeviceLabel('');
        checkAuthorization();
      } else {
        setPinError(result.message);
      }
    } else {
      const result = registerCurrentDevice(cleanInput, customDeviceLabel.trim() || undefined);
      if (result.success) {
        setPinInput('');
        setCustomDeviceLabel('');
        checkAuthorization();
      } else {
        setPinError(result.message);
      }
    }
  };

  if (isAuthorized) {
    return <>{children}</>;
  }

  const renderIcon = () => {
    switch (icon) {
      case 'employees':
        return <Users className="w-8 h-8 text-indigo-400" />;
      case 'locations':
        return <MapPin className="w-8 h-8 text-purple-400" />;
      case 'kiosk':
        return <QrCode className="w-8 h-8 text-pink-400" />;
      default:
        return <ShieldAlert className="w-8 h-8 text-indigo-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6 backdrop-blur-md relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-950 border border-indigo-500/30 flex items-center justify-center shadow-inner">
            {renderIcon()}
          </div>

          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Device Authorization Required</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Authorization Mode Selector */}
        <div className="relative z-10 max-w-md mx-auto flex p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode('it_dept')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              authMode === 'it_dept'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 text-indigo-300" />
            <span>IT Dept Full App Edit</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthMode('standard')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              authMode === 'standard'
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4 text-purple-300" />
            <span>Standard Manager PIN</span>
          </button>
        </div>

        {/* Authorization Form */}
        <div className="relative z-10">
          <form
            onSubmit={handleAuthorizeDevice}
            className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 max-w-md mx-auto space-y-4 text-left shadow-2xl"
          >
            <div className="flex items-center space-x-3 text-white pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {authMode === 'it_dept' ? <Cpu className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">
                  {authMode === 'it_dept' ? 'IT Department Full System Access' : 'Authorize Manager Station'}
                </h3>
                <p className="text-xs text-slate-400">
                  {authMode === 'it_dept'
                    ? 'Grants full admin access & app editing authority'
                    : `Slot ${registeredDevices.length + 1} of 5 Available`}
                </p>
              </div>
            </div>

            {/* IT Staff Selection if in IT Mode */}
            {authMode === 'it_dept' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-indigo-300">
                  IT Department Personnel (Optional)
                </label>
                <select
                  value={selectedITStaffId}
                  onChange={(e) => setSelectedITStaffId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Default IT Admin (Collen Madihlaba)</option>
                  {itStaffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} — {staff.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {authMode === 'it_dept' ? 'IT Security Passkey / Password *' : 'Master Manager PIN *'}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder={
                      authMode === 'it_dept'
                        ? 'Enter IT Security Passkey'
                        : 'Enter Master Manager PIN'
                    }
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-white"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Restricted access area. Passkeys are issued by IT Department.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Workstation / Device Label (Optional)
                </label>
                <input
                  type="text"
                  value={customDeviceLabel}
                  onChange={(e) => setCustomDeviceLabel(e.target.value)}
                  placeholder="e.g., IT Command Laptop 1"
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 leading-relaxed font-medium">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 border border-indigo-400/30 hover:border-indigo-300 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {authMode === 'it_dept'
                    ? 'Authorize Device with IT Full Edit Access'
                    : 'Authorize Manager Device'}
                </span>
              </button>

              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPinModal(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verify Authorized Profile PIN</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* PIN Auth Modal */}
        <PINAuthModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={() => checkAuthorization()}
        />

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-center space-x-2">
          <Smartphone className="w-4 h-4 text-slate-400" />
          <span>Ga-Rankuwa YMCA IT & Security Department • Full Access Enabled</span>
        </div>
      </div>
    </div>
  );
};
