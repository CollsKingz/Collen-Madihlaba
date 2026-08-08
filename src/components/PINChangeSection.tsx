import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { 
  getAppAuthorizations, 
  updateUserPin, 
  AppAuthorization 
} from '../utils/pinAuthManager';

interface PINChangeSectionProps {
  defaultUserName?: string;
}

export const PINChangeSection: React.FC<PINChangeSectionProps> = ({ defaultUserName }) => {
  const [authorizations, setAuthorizations] = useState<AppAuthorization[]>(getAppAuthorizations());
  const [selectedUser, setSelectedUser] = useState<string>(
    defaultUserName || 'Phuthegi Florence Mashigo'
  );
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  
  const [showCurrentPin, setShowCurrentPin] = useState<boolean>(false);
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshAuthorizations = () => {
    setAuthorizations(getAppAuthorizations());
  };

  useEffect(() => {
    refreshAuthorizations();
    window.addEventListener('app_authorizations_update', refreshAuthorizations);
    return () => window.removeEventListener('app_authorizations_update', refreshAuthorizations);
  }, []);

  useEffect(() => {
    if (defaultUserName && authorizations.some((a) => a.user_name === defaultUserName)) {
      setSelectedUser(defaultUserName);
    }
  }, [defaultUserName, authorizations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setToastMessage(null);

    const result = updateUserPin(
      selectedUser,
      currentPin.trim(),
      newPin.trim(),
      confirmNewPin.trim()
    );

    if (result.success) {
      setToastMessage('PIN successfully updated');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      refreshAuthorizations();
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          <KeyRound className="w-6 h-6 text-indigo-300" />
        </div>
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Self-Service PIN Management</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Change Authorization PIN
          </h3>
          <p className="text-xs text-slate-400">
            Update your 4-digit security PIN for administrative authorization & full app access.
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {toastMessage && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 rounded-2xl text-xs font-bold flex items-center space-x-3 shadow-xl shadow-emerald-950/60 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-emerald-100">Success Confirmation</h4>
            <p className="text-xs text-emerald-300 font-medium">{toastMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        
        {/* User Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Select User Profile *
          </label>
          <div className="relative">
            <UserCheck className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              {authorizations.map((auth) => (
                <option key={auth.user_name} value={auth.user_name}>
                  {auth.user_name} — ({auth.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. Current PIN */}
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
              placeholder="Enter current 4-digit PIN"
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

        {/* 2. New 4-Digit PIN */}
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
          <p className="text-[11px] text-slate-500 mt-1">Must be exactly 4 numerical digits.</p>
        </div>

        {/* 3. Confirm New 4-Digit PIN */}
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
              placeholder="Confirm new 4-digit PIN"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Update Authorization PIN</span>
        </button>

      </form>
    </div>
  );
};
