import React, { useState, useEffect, useRef } from 'react';
import { 
  getITSystemConfig, 
  saveITSystemConfig, 
  getRegisteredDevices, 
  revokeDevice, 
  clearAllDevices,
  ITSystemConfig,
  ManagerDevice,
  isITDeviceAuthorized
} from '../utils/deviceManager';
import { getEmployees, resetStorageToDefaults, saveEmployees } from '../utils/storage';
import { Employee } from '../types';
import { YMCALogo } from './YMCALogo';
import { 
  ShieldCheck, 
  Settings, 
  Key, 
  Smartphone, 
  Trash2, 
  Save, 
  X, 
  RefreshCw, 
  Users, 
  Check, 
  Lock, 
  Cpu, 
  ShieldAlert,
  Edit3,
  Server,
  Globe,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  FileImage,
  Sparkles
} from 'lucide-react';

interface ITAppEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppUpdated?: () => void;
}

export const ITAppEditorModal: React.FC<ITAppEditorModalProps> = ({
  isOpen,
  onClose,
  onAppUpdated
}) => {
  const [config, setConfig] = useState<ITSystemConfig>(getITSystemConfig());
  const [devices, setDevices] = useState<ManagerDevice[]>(getRegisteredDevices());
  const [employees, setEmployees] = useState<Employee[]>(getEmployees());
  const [activeTab, setActiveTab] = useState<'app_branding' | 'security' | 'devices' | 'it_roster'>('app_branding');
  
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isITAuthorized, setIsITAuthorized] = useState<boolean>(isITDeviceAuthorized());

  // Form fields
  const [appName, setAppName] = useState(config.appName);
  const [centerSubtitle, setCenterSubtitle] = useState(config.centerSubtitle);
  const [strictGPSMode, setStrictGPSMode] = useState(config.strictGPSMode);
  const [masterPin, setMasterPin] = useState(config.masterPin);
  const [itPasskey, setItPasskey] = useState(config.itPasskey);
  const [allowRemoteOverrides, setAllowRemoteOverrides] = useState(config.allowRemoteOverrides);
  const [logoUrl, setLogoUrl] = useState<string>(config.logoUrl || '');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const latestCfg = getITSystemConfig();
      setConfig(latestCfg);
      setAppName(latestCfg.appName);
      setCenterSubtitle(latestCfg.centerSubtitle);
      setStrictGPSMode(latestCfg.strictGPSMode);
      setMasterPin(latestCfg.masterPin);
      setItPasskey(latestCfg.itPasskey);
      setAllowRemoteOverrides(latestCfg.allowRemoteOverrides);
      setLogoUrl(latestCfg.logoUrl || '');

      setDevices(getRegisteredDevices());
      setEmployees(getEmployees());
      setIsITAuthorized(isITDeviceAuthorized());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToastMsg = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image file is too large. Please select an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoUrl(result);
      showToastMsg('New logo uploaded! Preview generated below.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAppConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ITSystemConfig = {
      appName: appName.trim() || 'Ga-Rankuwa YMCA',
      centerSubtitle: centerSubtitle.trim() || 'Geofence & Biometric Attendance System',
      strictGPSMode,
      masterPin: masterPin.trim() || '0001',
      itPasskey: itPasskey.trim() || '0002',
      allowRemoteOverrides,
      logoUrl: logoUrl.trim(),
    };

    saveITSystemConfig(updated);
    setConfig(updated);
    showToastMsg('✅ App Logo & Branding Config Saved Successfully!');
    if (onAppUpdated) onAppUpdated();
  };

  const handleRevokeDevice = (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke device "${name}"?`)) {
      revokeDevice(id);
      setDevices(getRegisteredDevices());
      showToastMsg(`Device "${name}" revoked.`);
    }
  };

  const handleClearAllDevices = () => {
    if (confirm('CAUTION: Are you sure you want to clear ALL registered devices? You will need to re-authorize.')) {
      clearAllDevices();
      setDevices([]);
      showToastMsg('All device authorizations cleared.');
    }
  };

  const handleResetSystemDefaults = () => {
    if (confirm('Sync system records and ensure default profiles exist (all registered staff profiles will be safely preserved)?')) {
      resetStorageToDefaults();
      setEmployees(getEmployees());
      showToastMsg('System defaults synced. All registered staff profiles preserved.');
      if (onAppUpdated) onAppUpdated();
    }
  };

  const itStaff = employees.filter(
    (e) => e.department === 'IT & Systems Security' || e.role.toLowerCase().includes('it')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-white max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-white">IT Department Control Center</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-widest flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  <span>Full App Edit Access</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure application branding, security PINs, real GPS policies, & authorized device fleet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Save Toast */}
        {saveToast && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('app_branding')}
            className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'app_branding'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>App Branding & Title</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Security & PINs</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'devices'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Authorized Fleet ({devices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('it_roster')}
            className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'it_roster'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>IT Department Staff</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">

          {/* TAB 1: App Branding & Title */}
          {activeTab === 'app_branding' && (
            <form onSubmit={handleSaveAppConfig} className="space-y-4">
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2 text-indigo-300 pb-2 border-b border-slate-800">
                  <Edit3 className="w-4 h-4" />
                  <h3 className="text-sm font-bold">Edit Primary Application Identity</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Organization / Center Name
                  </label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. Ga-Rankuwa YMCA"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Portal Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    required
                    value={centerSubtitle}
                    onChange={(e) => setCenterSubtitle(e.target.value)}
                    placeholder="e.g. Geofence & Biometric Attendance System"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Official Logo & Branding Emblem Editor */}
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-indigo-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2 text-indigo-300">
                      <ImageIcon className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-white">Official Logo & Branding Emblem (IT Editable)</h4>
                    </div>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Revert to YMCA SVG Default</span>
                      </button>
                    )}
                  </div>

                  {/* Live Logo Preview Box */}
                  <div className="flex items-center space-x-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="p-1 bg-slate-900 rounded-xl border border-slate-700">
                      <YMCALogo customLogoUrl={logoUrl} size="lg" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Live Navigation & Kiosk Preview
                      </span>
                      <div className="text-sm font-black text-white truncate">{appName}</div>
                      <div className="text-xs text-indigo-300 truncate">{centerSubtitle}</div>
                    </div>
                  </div>

                  {/* Logo Source Controls: Upload File OR Enter URL */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Option 1: Upload Custom Logo Image File
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all"
                      >
                        <Upload className="w-4 h-4 text-indigo-400" />
                        <span>Choose & Upload Logo Image File (PNG / JPG / SVG)</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Option 2: Direct Image URL
                      </label>
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png or data:image/..."
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    {/* Logo Presets */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Quick IT Logo Presets:</span>
                      </label>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                            !logoUrl
                              ? 'bg-red-600/30 border-red-500/50 text-white'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          Classic YMCA Red Triangle
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLogoUrl(
                              'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&auto=format&fit=crop&q=80'
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-indigo-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Modern Shield Emblem
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLogoUrl(
                              'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=150&auto=format&fit=crop&q=80'
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 hover:text-white text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Ga-Rankuwa Youth Crest
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strict GPS Mode */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">Strict Device GPS Requirement</h4>
                    <p className="text-[11px] text-slate-400">
                      Mandates actual satellite device GPS position scan before attendance submission.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={strictGPSMode}
                    onChange={(e) => setStrictGPSMode(e.target.checked)}
                    className="w-5 h-5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save App Branding Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Security & PINs */}
          {activeTab === 'security' && (
            <form onSubmit={handleSaveAppConfig} className="space-y-4">
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2 text-indigo-300 pb-2 border-b border-slate-800">
                  <Key className="w-4 h-4" />
                  <h3 className="text-sm font-bold">System Master PINs & Security Keys</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Manager Master PIN
                    </label>
                    <input
                      type="text"
                      required
                      value={masterPin}
                      onChange={(e) => setMasterPin(e.target.value)}
                      placeholder="Standard 4-digit PIN"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Used for standard Manager device authorization.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      IT Department Passkey
                    </label>
                    <input
                      type="text"
                      required
                      value={itPasskey}
                      onChange={(e) => setItPasskey(e.target.value)}
                      placeholder="Enter IT Passkey"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono tracking-wider focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Grants Supreme Full Access & App Editing rights.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">Allow Remote IT Manager Overrides</h4>
                    <p className="text-[11px] text-slate-400">
                      Permits IT staff to approve flagged attendance records remotely.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowRemoteOverrides}
                    onChange={(e) => setAllowRemoteOverrides(e.target.checked)}
                    className="w-5 h-5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetSystemDefaults}
                  className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Factory System Reset</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Security PINs</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Authorized Devices Fleet */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>Authorized Manager & IT Workstations ({devices.length})</span>
                </h3>

                <button
                  onClick={handleClearAllDevices}
                  className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30 flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Revoke All Devices</span>
                </button>
              </div>

              {devices.length === 0 ? (
                <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 text-center space-y-2">
                  <Smartphone className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No authorized devices registered yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {devices.map((dev) => (
                    <div
                      key={dev.id}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-white">{dev.deviceName}</h4>
                          {dev.isITDevice ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                              IT Supreme Device
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                              Manager Station
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">ID: {dev.id}</p>
                        <p className="text-[10px] text-slate-500">
                          Registered: {new Date(dev.registeredAt).toLocaleDateString()} • Last Active: {new Date(dev.lastActiveAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRevokeDevice(dev.id, dev.deviceName)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: IT Department Staff */}
          {activeTab === 'it_roster' && (
            <div className="space-y-4">
              <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/30 space-y-1">
                <h3 className="text-xs font-bold text-indigo-200 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>IT & Systems Security Department Personnel</span>
                </h3>
                <p className="text-[11px] text-indigo-300/80">
                  Staff assigned to the IT & Systems Security department hold administrative authority across attendance rules, geofence definitions, and device authorizations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {itStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3"
                  >
                    <img
                      src={staff.avatar}
                      alt={staff.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/50 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{staff.name}</h4>
                      <p className="text-[11px] text-indigo-400 font-medium truncate">{staff.role}</p>
                      <p className="text-[10px] text-slate-400 truncate">{staff.email}</p>
                      <div className="mt-1 flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                        <span>ID: {staff.id}</span>
                        <span>Pass: ••••••••</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <span>Ga-Rankuwa YMCA • IT Department Control Center</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close IT Control Center
          </button>
        </div>

      </div>
    </div>
  );
};
