import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Eye, 
  EyeOff, 
  Sparkles,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { 
  getAppAuthorizations, 
  verifyUserPin, 
  updateUserPin, 
  isFullAccessActive, 
  getFullAccessSessionDetails, 
  setFullAccessSession,
  AppAuthorization 
} from '../utils/pinAuthManager';

interface PINAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'verify' | 'change_pin';
}

export const PINAuthModal: React.FC<PINAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'verify',
}) => {
  const [tab, setTab] = useState<'verify' | 'change_pin'>(initialTab);
  const [authorizations, setAuthorizations] = useState<AppAuthorization[]>(getAppAuthorizations());
  const [sessionDetails, setSessionDetails] = useState(getFullAccessSessionDetails());

  // Verification state
  const [selectedUser, setSelectedUser] = useState<string>('Phuthegi Florence Mashigo');
  const [verifyPin, setVerifyPin] = useState<string>('');
  const [showVerifyPin, setShowVerifyPin] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState<string | null>(null);

  // Change PIN state
  const [changeUser, setChangeUser] = useState<string>('Phuthegi Florence Mashigo');
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [showCurrentPin, setShowCurrentPin] = useState<boolean>(false);
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshState = () => {
    setAuthorizations(getAppAuthorizations());
    setSessionDetails(getFullAccessSessionDetails());
  };

  useEffect(() => {
    refreshState();
    window.addEventListener('app_authorizations_update', refreshState);
    return () => window.removeEventListener('app_authorizations_update', refreshState);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setVerifyError(null);
      setVerifySuccessMsg(null);
      setChangeError(null);
      setToastMessage(null);
      setVerifyPin('');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifySuccessMsg(null);

    if (!selectedUser) {
      setVerifyError('Please select a profile.');
      return;
    }

    if (!verifyPin.trim()) {
      setVerifyError('Please enter your 4-digit PIN.');
      return;
    }

    const result = verifyUserPin(selectedUser, verifyPin.trim());
    if (result.success) {
      setVerifySuccessMsg(result.message);
      setVerifyPin('');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } else {
      setVerifyError(result.message);
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);
    setToastMessage(null);

    const result = updateUserPin(
      changeUser,
      currentPin.trim(),
      newPin.trim(),
      confirmNewPin.trim()
    );

    if (result.success) {
      setToastMessage('PIN successfully updated');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      refreshState();
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    } else {
      setChangeError(result.message);
    }
  };

  const handleRevokeSession = () => {
    setFullAccessSession(false);
    refreshState();
    setVerifySuccessMsg('Full administrative access session signed out.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Administrative PIN Security Portal</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>PIN Verification & Authorization</span>
          </h2>
          <p className="text-xs text-slate-400">
            Verify your 4-digit PIN to unlock full system access or update your authorization PIN.
          </p>
        </div>

        {/* Active Full Access Banner */}
        {isFullAccessActive() && sessionDetails && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                  <span>Full Administrative Access Active</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </span>
                <p className="text-[11px] text-slate-300 font-medium">
                  Active User: <strong className="text-white">{sessionDetails.userName}</strong> ({sessionDetails.role})
                </p>
              </div>
            </div>
            <button
              onClick={handleRevokeSession}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Lock Access
            </button>
          </div>
        )}

        {/* Success Toast Confirmation */}
        {toastMessage && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-950/50 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('verify')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              tab === 'verify'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4 text-indigo-300" />
            <span>1. PIN Verification</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('change_pin')}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              tab === 'change_pin'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4 text-purple-300" />
            <span>2. Self-Service PIN Update</span>
          </button>
        </div>

        {/* TAB 1: VERIFY PIN */}
        {tab === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            
            {/* User Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Authorized Profile *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {authorizations.map((auth) => (
                  <button
                    key={auth.user_name}
                    type="button"
                    onClick={() => setSelectedUser(auth.user_name)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      selectedUser === auth.user_name
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${selectedUser === auth.user_name ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-white">{auth.user_name}</h4>
                        <p className="text-[10px] text-indigo-300 font-semibold">
                          Role: <span className="text-amber-300">{auth.role}</span>
                        </p>
                      </div>
                    </div>
                    {selectedUser === auth.user_name && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                        Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 4-Digit PIN Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter 4-Digit Security PIN *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showVerifyPin ? 'text' : 'password'}
                  required
                  maxLength={4}
                  value={verifyPin}
                  onChange={(e) => setVerifyPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-digit PIN"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowVerifyPin(!showVerifyPin)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-white"
                >
                  {showVerifyPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Authorized personnel only. Contact IT Department for PIN credentials.
              </p>
            </div>

            {verifyError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifySuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{verifySuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 border border-indigo-400/30 hover:border-indigo-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>Verify PIN & Grant Full Access</span>
            </button>
          </form>
        )}

        {/* TAB 2: CHANGE PIN (SELF-SERVICE) */}
        {tab === 'change_pin' && (
          <form onSubmit={handleChangePinSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Profile to Update *
              </label>
              <select
                value={changeUser}
                onChange={(e) => setChangeUser(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                {authorizations.map((auth) => (
                  <option key={auth.user_name} value={auth.user_name}>
                    {auth.user_name} ({auth.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Current PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                1. Current 4-Digit PIN *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showCurrentPin ? 'text' : 'password'}
                  required
                  maxLength={4}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter current PIN"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New 4-Digit PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                2. New 4-Digit PIN *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showNewPin ? 'text' : 'password'}
                  required
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new 4-digit PIN"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New 4-Digit PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                3. Confirm New 4-Digit PIN *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showNewPin ? 'text' : 'password'}
                  required
                  maxLength={4}
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter new 4-digit PIN"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {changeError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{changeError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center space-x-2 mt-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Update Authorization PIN</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
