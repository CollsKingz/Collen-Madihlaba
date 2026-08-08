import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { YMCALogo } from './YMCALogo';
import { verifyEmployeePassword, logoutUser } from '../utils/storage';
import { isFullAccessActive, getAppAuthorizations } from '../utils/pinAuthManager';
import { motion } from 'motion/react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Clock,
  LogOut,
  Sparkles,
  Eye,
  EyeOff,
  Settings,
  Check,
  ShieldAlert
} from 'lucide-react';

interface AppLockoutScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  currentUser: Employee | null;
  onSwitchUser?: () => void;
  autoLockMinutes: number;
  onUpdateAutoLockMinutes: (mins: number) => void;
}

export const AppLockoutScreen: React.FC<AppLockoutScreenProps> = ({
  isLocked,
  onUnlock,
  currentUser,
  onSwitchUser,
  autoLockMinutes,
  onUpdateAutoLockMinutes
}) => {
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('en-ZA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isLocked) return null;

  const handleAttemptUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const inputClean = passwordInput.trim();

    if (!inputClean) {
      setErrorMsg('Please enter your staff password or security PIN.');
      return;
    }

    // 1. Master/Manager PIN Overrides (0001, 0002, 1234, 000000, admin123)
    const masterPins = ['0001', '0002', '1234', '000000', 'admin123', 'admin', 'ymca2026'];
    const isAuthPin = getAppAuthorizations().some((a) => a.pin_hash === inputClean);

    if (masterPins.includes(inputClean) || isAuthPin) {
      setSuccessMsg('Master Security Override Verified! Unlocking system...');
      setTimeout(() => {
        setPasswordInput('');
        setErrorMsg(null);
        setSuccessMsg(null);
        setFailedAttempts(0);
        onUnlock();
      }, 500);
      return;
    }

    // 2. Check current employee password if available
    if (currentUser) {
      const isPasswordOk = verifyEmployeePassword(currentUser.id, inputClean);
      if (isPasswordOk) {
        setSuccessMsg(`Welcome back, ${currentUser.name}! System unlocked.`);
        setTimeout(() => {
          setPasswordInput('');
          setErrorMsg(null);
          setSuccessMsg(null);
          setFailedAttempts(0);
          onUnlock();
        }, 500);
        return;
      }
    }

    // 3. Fallback check for any valid password/PIN
    const newFailCount = failedAttempts + 1;
    setFailedAttempts(newFailCount);

    if (newFailCount >= 3) {
      setErrorMsg(
        `Incorrect password (${newFailCount} attempts). Tip: Use code 000000, 1234, or your profile password.`
      );
    } else {
      setErrorMsg('Invalid password or PIN. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="max-w-md w-full bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500" />

        {/* Lockout Header & Clock */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold animate-pulse">
            <Lock className="w-3.5 h-3.5" />
            <span>APP SYSTEM LOCKED</span>
          </div>

          <div className="flex justify-center">
            <YMCALogo size="lg" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ga-Rankuwa YMCA
            </h2>
            <p className="text-xs text-indigo-300 font-medium">
              Staff Attendance & Biometric Portal
            </p>
          </div>

          {/* Digital Clock */}
          <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 text-center space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-300 tracking-wider flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>{currentTime || '12:00:00'}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{currentDate}</p>
          </div>
        </div>

        {/* Current User Profile Card */}
        {currentUser && (
          <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-xl object-cover border-2 border-indigo-400/50 shadow-md shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-xs font-extrabold text-white truncate">
                  {currentUser.name}
                </h3>
                <p className="text-[11px] text-indigo-300 truncate">
                  {currentUser.role} • {currentUser.department}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onSwitchUser) {
                  onSwitchUser();
                } else {
                  logoutUser();
                  window.location.reload();
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0"
              title="Switch Staff Account"
            >
              <LogOut className="w-3 h-3 text-rose-400" />
              <span>Switch</span>
            </button>
          </div>
        )}

        {/* Unlock Form */}
        <form onSubmit={handleAttemptUnlock} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Enter Password or Security PIN *
              </label>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>Timer Settings</span>
              </button>
            </div>

            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                id="input-lockout-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Staff password or PIN (e.g. 000000)"
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Use profile password or security PIN.</span>
              <span className="text-indigo-300 font-mono">Master Code: 000000</span>
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Unlock Helper Button */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setPasswordInput('000000');
                handleAttemptUnlock();
              }}
              className="px-3 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Auto-Fill Code (000000)</span>
            </button>

            <button
              id="btn-submit-unlock"
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock System</span>
            </button>
          </div>
        </form>

        {/* Auto-Lock Timer Settings Dropdown */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auto-Lock Inactivity Timer</span>
              </span>
              <span className="text-[10px] text-indigo-300 font-mono">
                {autoLockMinutes === 0 ? 'Disabled' : `${autoLockMinutes} mins`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { mins: 1, label: '1 min' },
                { mins: 5, label: '5 min' },
                { mins: 15, label: '15 min' },
                { mins: 0, label: 'Never' }
              ].map((opt) => (
                <button
                  key={`autolock-${opt.mins}`}
                  type="button"
                  onClick={() => onUpdateAutoLockMinutes(opt.mins)}
                  className={`py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    autoLockMinutes === opt.mins
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              System will lock automatically if no mouse or touch activity is detected.
            </p>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};
