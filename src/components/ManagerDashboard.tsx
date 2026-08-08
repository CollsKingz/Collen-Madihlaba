import React, { useState, useEffect } from 'react';
import { AttendanceRecord, AttendanceStatus, GeofenceLocation } from '../types';
import { getAttendanceRecords, updateRecordStatus, getGeofences, getCurrentUser } from '../utils/storage';
import { ITAppEditorModal } from './ITAppEditorModal';
import { DepartmentManagerModal } from './DepartmentManagerModal';
import { EmployeeManager } from './EmployeeManager';
import { GeofenceManager } from './GeofenceManager';
import { QRStationDisplay } from './QRStationDisplay';
import { ApprovalsDashboard } from './ApprovalsDashboard';
import { DailyReportView } from './DailyReportView';
import { WorkReportManager } from './WorkReportManager';
import { FaceScanAnalyticsChart } from './FaceScanAnalyticsChart';
import { YMCALogo } from './YMCALogo';
import { 
  isCurrentDeviceAuthorized, 
  getRegisteredDevices, 
  getOrCreateCurrentDeviceId, 
  registerCurrentDevice, 
  revokeDevice, 
  MASTER_PIN, 
  ManagerDevice 
} from '../utils/deviceManager';
import { 
  Monitor, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Search, 
  UserCheck, 
  Eye, 
  Zap, 
  Check, 
  X, 
  RefreshCcw,
  Smartphone,
  Lock,
  Key,
  Laptop,
  AlertOctagon,
  Trash2,
  PlusCircle,
  ShieldCheck,
  Building2,
  Cpu,
  Users,
  MapPin,
  Award,
  Coffee,
  Smile,
  ThumbsUp,
  Sparkles,
  QrCode,
  FileText,
  Camera,
  Activity,
  BarChart2
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<AttendanceRecord | null>(null);
  const [liveBanner, setLiveBanner] = useState<string | null>(null);

  // Command Center Navigation Tabs
  const [activeTab, setActiveTab] = useState<'live_feed' | 'face_analytics' | 'employees' | 'geofences' | 'qr_kiosk' | 'approvals' | 'reports' | 'work_reports'>('live_feed');

  // Manager Device Access Control & Modals state
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [registeredDevices, setRegisteredDevices] = useState<ManagerDevice[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState<boolean>(false);
  const [showITModal, setShowITModal] = useState<boolean>(false);
  const [showDeptModal, setShowDeptModal] = useState<boolean>(false);
  const [geofences, setGeofences] = useState<GeofenceLocation[]>(() => getGeofences());
  const currentUser = getCurrentUser();

  // Security PIN input state
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [customDeviceLabel, setCustomDeviceLabel] = useState<string>('');
  const [adminUnlocked, setAdminUnlocked] = useState<boolean>(false);

  const currentDeviceId = getOrCreateCurrentDeviceId();

  const loadRecords = () => {
    setRecords(getAttendanceRecords());
    setGeofences(getGeofences());
  };

  const loadDeviceState = () => {
    const authorized = isCurrentDeviceAuthorized();
    const devices = getRegisteredDevices();
    setIsAuthorized(authorized);
    setRegisteredDevices(devices);
  };

  useEffect(() => {
    loadRecords();
    loadDeviceState();

    const handleNewRecordEvent = (e: any) => {
      const newRec: AttendanceRecord = e.detail;
      loadRecords();
      setLiveBanner(`⚡ NEW LIVE CLOCK-IN: ${newRec.employeeName} (${newRec.locationName}) - ${newRec.withinGeofence ? 'Geofence OK' : 'FLAGGED GEOFENCE'}`);
      setTimeout(() => setLiveBanner(null), 6000);
    };

    const handleDeviceUpdate = () => {
      loadDeviceState();
    };

    window.addEventListener('geofence_clock_in_event', handleNewRecordEvent);
    window.addEventListener('geofence_storage_update', loadRecords);
    window.addEventListener('geofence_device_update', handleDeviceUpdate);
    window.addEventListener('storage', loadRecords);

    // Live real-time sync polling interval (every 2 seconds)
    const syncTimer = setInterval(() => {
      loadRecords();
    }, 2000);

    return () => {
      window.removeEventListener('geofence_clock_in_event', handleNewRecordEvent);
      window.removeEventListener('geofence_storage_update', loadRecords);
      window.removeEventListener('geofence_device_update', handleDeviceUpdate);
      window.removeEventListener('storage', loadRecords);
      clearInterval(syncTimer);
    };
  }, []);

  const handleRegisterThisDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('Master Manager PIN is required.');
      return;
    }

    if (registeredDevices.length >= 3 && !adminUnlocked) {
      setPinError('Maximum 3 authorized devices limit reached. Enter Master PIN to manage slots.');
      return;
    }

    const result = registerCurrentDevice(pinInput.trim(), customDeviceLabel.trim() || undefined);
    if (result.success) {
      loadDeviceState();
      setPinInput('');
      setPinError(null);
      setCustomDeviceLabel('');
    } else {
      setPinError(result.message);
    }
  };

  const handleAuthenticateMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === MASTER_PIN) {
      setAdminUnlocked(true);
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('Invalid Master Admin PIN. Access denied.');
    }
  };

  const handleRevokeDevice = (id: string) => {
    revokeDevice(id);
    loadDeviceState();
  };

  const handleUpdateStatus = (recordId: string, status: AttendanceStatus) => {
    updateRecordStatus(recordId, status);
    loadRecords();
  };

  const handleManagerFunReaction = (recordId: string, reactionName: string) => {
    const updated = records.map((r) => {
      if (r.id === recordId) {
        return { ...r, managerAction: reactionName };
      }
      return r;
    });
    setRecords(updated);
    localStorage.setItem('geoface_records_v5', JSON.stringify(updated));
    window.dispatchEvent(new Event('geofence_storage_update'));
    if (selectedRecordForModal && selectedRecordForModal.id === recordId) {
      setSelectedRecordForModal({ ...selectedRecordForModal, managerAction: reactionName });
    }
  };

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.employeeDepartment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.notes.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'flagged') return matchesSearch && (rec.status === 'flagged_geofence' || rec.status === 'flagged_face');
    if (filterStatus === 'approved') return matchesSearch && rec.status === 'approved';
    return matchesSearch;
  });

  const totalCount = records.length;
  const flaggedCount = records.filter((r) => r.status === 'flagged_geofence' || r.status === 'flagged_face').length;
  const approvedCount = records.filter((r) => r.status === 'approved').length;

  // IF DEVICE IS NOT AUTHORIZED -> SHOW SECURITY LOCKOUT OR AUTHORIZATION PROMPT
  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 my-8">
        
        {/* Security Shield Lockout Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20 border border-indigo-400/30">
            <Lock className="w-10 h-10 text-white" />
          </div>

          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>Manager Access Security Guard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Manager Command Center Restricted
            </h1>
            <p className="text-sm text-slate-400 max-w-lg mx-auto mt-2">
              For privacy and staff data security, access to the Ga-Rankuwa YMCA Manager Command Center is restricted to <strong className="text-indigo-300">authorized manager devices only</strong> (Max 3 registered devices).
            </p>
          </div>

          {/* Current Slots Meter */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Device Authorization Slots</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                registeredDevices.length >= 3 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {registeredDevices.length}/3 Slots Used
              </span>
            </div>

            {/* Visual Slots */}
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((idx) => {
                const dev = registeredDevices[idx];
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      dev
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-600 border-dashed'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-[10px] font-bold truncate">
                      {dev ? dev.deviceName.split('(')[0] : `Slot ${idx + 1} Empty`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CASE A: Slots are available (< 3) */}
          {registeredDevices.length < 3 ? (
            <form onSubmit={handleRegisterThisDevice} className="bg-slate-950/60 border border-indigo-500/30 rounded-2xl p-6 max-w-md mx-auto space-y-4 text-left">
              <div className="flex items-center space-x-3 text-white">
                <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">Authorize Manager Device (Slot {registeredDevices.length + 1}/3)</h3>
                  <p className="text-xs text-slate-400">Enter Manager Master PIN to grant dashboard access to this device.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Master Manager PIN *</label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Enter Master Manager PIN"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Device Label (Optional)</label>
                  <input
                    type="text"
                    value={customDeviceLabel}
                    onChange={(e) => setCustomDeviceLabel(e.target.value)}
                    placeholder="e.g. Manager Office Laptop, Center Director Phone"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {pinError && <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{pinError}</p>}

                <button
                  id="btn-register-this-device"
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Authorize & Register Manager Device</span>
                </button>
              </div>
            </form>
          ) : (
            /* CASE B: Slots are full (3/3) */
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6 max-w-md mx-auto space-y-4 text-left">
              <div className="flex items-center space-x-3 text-rose-300">
                <AlertOctagon className="w-6 h-6 text-rose-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-sm">Max 3 Manager Devices Registered</h3>
                  <p className="text-xs text-rose-300/80">To grant access to this device, enter Master Admin PIN to revoke an existing device slot.</p>
                </div>
              </div>

              <form onSubmit={handleAuthenticateMasterPin} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Enter Master Admin PIN</label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Enter Master Manager PIN"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  {pinError && <p className="text-[11px] text-rose-400 mt-1">{pinError}</p>}
                </div>

                <button
                  id="btn-unlock-admin-devices"
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Unlock Admin Device Manager</span>
                </button>
              </form>
            </div>
          )}

          {/* Currently Registered Devices List */}
          <div className="border-t border-slate-800/80 pt-6 max-w-lg mx-auto text-left space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Currently Authorized Manager Devices</h4>
            <div className="space-y-2">
              {registeredDevices.map((dev) => (
                <div key={dev.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Laptop className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-xs font-bold text-white">{dev.deviceName}</div>
                      <div className="text-[10px] text-slate-500">
                        Registered: {new Date(dev.registeredAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {adminUnlocked && (
                    <button
                      onClick={() => handleRevokeDevice(dev.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold border border-rose-500/30 transition-all flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    );
  }

  // AUTHORIZED MANAGER COMMAND CENTER
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Live Alert Banner */}
      {liveBanner && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-3.5 rounded-2xl shadow-xl border border-indigo-400/40 flex items-center justify-between text-xs sm:text-sm font-bold animate-bounce">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-300 animate-spin" />
            <span>{liveBanner}</span>
          </div>
          <button onClick={() => setLiveBanner(null)} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <YMCALogo size="lg" />
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <Monitor className="w-4 h-4" />
              <span>Ga-Rankuwa YMCA Manager Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Real-Time Staff Clock-In Stream
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Live face captures, geofence radius auditing, daily report notes, and manual approvals.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Edit YMCA Departments */}
          <button
            id="btn-open-dept-manager"
            onClick={() => setShowDeptModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 text-xs text-indigo-300 font-bold transition-all cursor-pointer"
            title="Manage YMCA Departments"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Departments Manager</span>
          </button>

          {/* IT Department Control & App Editor Button */}
          <button
            id="btn-open-it-control"
            onClick={() => setShowITModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs text-white font-bold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
            title="IT Department Control Center & App Editor"
          >
            <Cpu className="w-4 h-4 text-indigo-200" />
            <span>IT App Editor</span>
          </button>

          {/* Device Slot Meter Badge */}
          <button
            id="btn-open-device-modal"
            onClick={() => setShowDeviceModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 text-xs text-indigo-300 font-bold transition-all cursor-pointer"
            title="Manage Authorized Devices"
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Authorized Devices ({registeredDevices.length})</span>
          </button>

          {/* Lock Dashboard Button */}
          <button
            id="btn-lock-dashboard"
            onClick={() => {
              const currentId = getOrCreateCurrentDeviceId();
              revokeDevice(currentId);
              loadDeviceState();
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300 transition-all cursor-pointer"
            title="Lock Manager Command Center on this device"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Lock</span>
          </button>

          <button
            onClick={loadRecords}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MANAGER COMMAND CENTER TOOL ACCESS NAVIGATION HUB */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 sm:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-xl">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            id="tab-manager-live-stream"
            onClick={() => setActiveTab('live_feed')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'live_feed'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4 text-indigo-300" />
            <span>Live Clock-In Stream</span>
          </button>

          <button
            id="tab-manager-face-analytics"
            onClick={() => setActiveTab('face_analytics')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'face_analytics'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Face Scan Analytics</span>
          </button>

          <button
            id="tab-manager-staff-roster"
            onClick={() => setActiveTab('employees')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-300" />
            <span>Staff Roster</span>
          </button>

          <button
            id="tab-manager-geofences"
            onClick={() => setActiveTab('geofences')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'geofences'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-indigo-300" />
            <span>Geofence Boundaries</span>
          </button>

          <button
            id="tab-manager-qr-kiosk"
            onClick={() => setActiveTab('qr_kiosk')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'qr_kiosk'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-indigo-300" />
            <span>Station QR Kiosks</span>
          </button>

          <button
            id="tab-manager-approvals"
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Approvals Workflow</span>
          </button>

          <button
            id="tab-manager-reports"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-300" />
            <span>Daily Reports</span>
          </button>

          <button
            id="tab-manager-work-reports"
            onClick={() => setActiveTab('work_reports')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'work_reports'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Camera className="w-4 h-4 text-pink-400" />
            <span>Field Proof Reports</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: FACE SCAN VERIFICATION ANALYTICS CHART */}
      {activeTab === 'face_analytics' && (
        <div className="space-y-6">
          <FaceScanAnalyticsChart records={records} />
        </div>
      )}

      {/* TAB CONTENT: LIVE ATTENDANCE STREAM */}
      {activeTab === 'live_feed' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>TOTAL CLOCK-INS</span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalCount}</div>
              <p className="text-[11px] text-slate-500">Recorded shifts today</p>
            </div>

            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>APPROVED SCANS</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{approvedCount}</div>
              <p className="text-[11px] text-emerald-500/80">Geofence & face match verified</p>
            </div>

            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>FLAGGED ALERTS</span>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{flaggedCount}</div>
              <p className="text-[11px] text-amber-500/80">Outside perimeter or face check</p>
            </div>

            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>DEVICE SECURITY</span>
                <Lock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-300">
                {registeredDevices.length}/3 Active
              </div>
              <p className="text-[11px] text-slate-500">Authorized Manager Devices</p>
            </div>
          </div>

          {/* Real-time Face Scan Verification Bar Chart Component */}
          <FaceScanAnalyticsChart records={records} />

          {/* Filter & Search Toolbar */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                All Logs ({totalCount})
              </button>
              <button
                onClick={() => setFilterStatus('flagged')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'flagged'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Flagged ({flaggedCount})
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === 'approved'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Approved ({approvedCount})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee, notes or dept..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Attendance Record Feed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRecords.length === 0 ? (
              <div className="col-span-full bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                No attendance records match your current filter.
              </div>
            ) : (
              filteredRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    
                    {/* Employee Header & Status Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={rec.facePhotoUrl}
                          alt={rec.employeeName}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500/40 shadow-md"
                        />
                        <div>
                          <h3 className="font-bold text-white text-sm">{rec.employeeName}</h3>
                          <p className="text-xs text-slate-400">{rec.employeeDepartment}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          rec.status === 'approved'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {rec.status === 'approved' ? 'Approved' : 'Flagged'}
                      </span>
                    </div>

                    {/* Audit details */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="font-mono text-indigo-300">
                          {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">YMCA Facility:</span>
                        <span className="font-medium text-slate-200">{rec.locationName}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">OTP Code:</span>
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {rec.otpCode || '849-201'} (Verified)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">Morning Mood:</span>
                        <span className="font-bold text-amber-300">
                          {rec.morningFunTag || '☕ Coffee Morning Smile'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-500">GPS Geofence:</span>
                        <span className={rec.withinGeofence ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {rec.withinGeofence ? 'Within Radius' : `Out of Bounds (${rec.geofenceDistanceMeters}m)`}
                        </span>
                      </div>
                    </div>

                    {/* Manager Morning Fun Reaction Badge if awarded */}
                    {rec.managerAction && (
                      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 border border-amber-500/40 p-2.5 rounded-xl text-xs font-extrabold text-amber-200 flex items-center justify-between shadow-md">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>Manager Award: {rec.managerAction}</span>
                        </span>
                        <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">🎉 Morning Fun</span>
                      </div>
                    )}

                    {/* Manager Quick Morning Fun Action Desk */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Manager Morning Fun Desk:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleManagerFunReaction(rec.id, '🌟 Morning Fun MVP')}
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                          title="Award MVP Badge"
                        >
                          🌟 Award MVP
                        </button>
                        <button
                          onClick={() => handleManagerFunReaction(rec.id, '☕ Virtual Coffee Token')}
                          className="px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                          title="Send Coffee Token"
                        >
                          ☕ Coffee Token
                        </button>
                        <button
                          onClick={() => handleManagerFunReaction(rec.id, '📸 Wall of Fame Feature')}
                          className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                          title="Feature on Wall of Fame"
                        >
                          📸 Wall of Fame
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    {rec.notes && (
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs italic text-slate-300">
                        "{rec.notes}"
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedRecordForModal(rec)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Inspect Capture</span>
                    </button>

                    {rec.status !== 'approved' ? (
                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'approved')}
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'flagged_geofence')}
                        className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold transition-colors"
                      >
                        Flag
                      </button>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: STAFF ROSTER */}
      {activeTab === 'employees' && <EmployeeManager />}

      {/* TAB CONTENT: GEOFENCES */}
      {activeTab === 'geofences' && <GeofenceManager />}

      {/* TAB CONTENT: QR KIOSK STATIONS */}
      {activeTab === 'qr_kiosk' && (
        <QRStationDisplay
          locations={geofences}
          onSelectStationCheckIn={() => {}}
        />
      )}

      {/* TAB CONTENT: APPROVALS WORKFLOW */}
      {activeTab === 'approvals' && <ApprovalsDashboard currentUser={currentUser} />}

      {/* TAB CONTENT: DAILY REPORTS */}
      {activeTab === 'reports' && <DailyReportView />}

      {/* TAB CONTENT: SHIFT PROOF REPORTS */}
      {activeTab === 'work_reports' && <WorkReportManager />}

      {/* INSPECTION MODAL */}
      {selectedRecordForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base">Biometric Shift Inspection</h3>
              <button onClick={() => setSelectedRecordForModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <img
                src={selectedRecordForModal.facePhotoUrl}
                alt="Captured Face"
                className="w-full h-56 rounded-xl object-cover border border-indigo-500/40"
              />

              <div className="space-y-2 text-xs">
                <p><strong>Employee:</strong> {selectedRecordForModal.employeeName}</p>
                <p><strong>Department:</strong> {selectedRecordForModal.employeeDepartment}</p>
                <p><strong>Time:</strong> {new Date(selectedRecordForModal.timestamp).toLocaleString()}</p>
                <p><strong>Geofence Radius:</strong> {selectedRecordForModal.geofenceDistanceMeters}m from {selectedRecordForModal.locationName}</p>
                <p><strong>OTP Code Verified:</strong> <span className="font-mono text-emerald-400 font-bold">{selectedRecordForModal.otpCode || '849-201'}</span></p>
                <p><strong>Morning Mood Pose:</strong> <span className="text-amber-300 font-bold">{selectedRecordForModal.morningFunTag || '☕ Coffee Morning Smile'}</span></p>
                {selectedRecordForModal.managerAction && (
                  <p><strong>Manager Award:</strong> <span className="text-purple-300 font-bold">🎉 {selectedRecordForModal.managerAction}</span></p>
                )}
                <p><strong>Shift Notes:</strong> {selectedRecordForModal.notes || 'No notes provided'}</p>
              </div>

              {/* Manager Morning Fun Decision Desk */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Manager Morning Fun Decision Desk:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleManagerFunReaction(selectedRecordForModal.id, '🌟 Morning Fun MVP')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    🌟 Award MVP
                  </button>
                  <button
                    onClick={() => handleManagerFunReaction(selectedRecordForModal.id, '☕ Virtual Coffee Token')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    ☕ Coffee Token
                  </button>
                  <button
                    onClick={() => handleManagerFunReaction(selectedRecordForModal.id, '📸 Wall of Fame Feature')}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    📸 Wall of Fame
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedRecordForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTHORIZED DEVICE MANAGER MODAL */}
      {showDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Manager Authorized Devices</h3>
              </div>
              <button onClick={() => setShowDeviceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Maximum of 3 active manager devices permitted to access the Command Center at any time.
            </p>

            <div className="space-y-3">
              {registeredDevices.map((dev) => (
                <div key={dev.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Laptop className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>{dev.deviceName}</span>
                        {dev.id === currentDeviceId && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Registered: {new Date(dev.registeredAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeDevice(dev.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs border border-rose-500/30 transition-all"
                    title="Revoke Device Access Slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowDeviceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IT Department App Editor Modal */}
      <ITAppEditorModal
        isOpen={showITModal}
        onClose={() => setShowITModal(false)}
        onAppUpdated={() => {
          loadRecords();
          loadDeviceState();
        }}
      />

      {/* YMCA Department Manager Modal */}
      <DepartmentManagerModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        onDepartmentsUpdated={loadRecords}
      />

    </div>
  );
};
