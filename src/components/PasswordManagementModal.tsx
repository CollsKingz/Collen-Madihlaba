import React, { useState } from 'react';
import { Employee } from '../types';
import { updateEmployeePassword, verifyEmployeePassword, createPrivilegeRequest, getEmployees } from '../utils/storage';
import {
  Key,
  ShieldAlert,
  CheckCircle2,
  Lock,
  RefreshCw,
  Send,
  X,
  User,
  Check,
  HelpCircle
} from 'lucide-react';

interface PasswordManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Employee | null;
}

export const PasswordManagementModal: React.FC<PasswordManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'change' | 'request_it' | 'admin_reset'>('change');

  // Change Password Form State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSuccess, setChangeSuccess] = useState<string | null>(null);

  // Request IT Reset State
  const [itReason, setItReason] = useState('');
  const [itSuccess, setItSuccess] = useState<string | null>(null);

  // Admin Quick Reset State
  const [allEmployees] = useState<Employee[]>(() => getEmployees());
  const [targetEmpId, setTargetEmpId] = useState<string>(allEmployees[0]?.id || '');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelfPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);
    setChangeSuccess(null);

    if (!currentUser) {
      setChangeError('No active employee session found. Please sign in first.');
      return;
    }

    if (!verifyEmployeePassword(currentUser.id, currentPasswordInput)) {
      setChangeError('Incorrect current password. Please check and try again.');
      return;
    }

    if (newPasswordInput.length < 4) {
      setChangeError('New password must be at least 4 characters long.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setChangeError('New password and confirmation do not match.');
      return;
    }

    const ok = updateEmployeePassword(currentUser.id, newPasswordInput);
    if (ok) {
      setChangeSuccess('Password successfully updated! Use your new password on your next login.');
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } else {
      setChangeError('Failed to update password. Please try again.');
    }
  };

  const handleRequestITReset = (e: React.FormEvent) => {
    e.preventDefault();
    setItSuccess(null);

    const requester = currentUser || {
      id: 'emp-guest',
      name: 'YMCA Staff Member',
      email: 'staff@garankuwaymca.org.za',
      department: 'General Operations',
      role: 'Staff Member',
      biometricRegistered: true,
      avatar: '',
    };

    createPrivilegeRequest(
      requester,
      'IT Password Reset Request',
      'password_reset',
      itReason || 'User requested password reset assistance from IT Support Team.',
      'emp-100',
      'IT Systems Administrator'
    );

    setItSuccess('Password reset request submitted to IT Admin & Management! You will be notified once processed.');
    setItReason('');
  };

  const handleAdminReset = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccess(null);

    if (!targetEmpId) return;
    if (!adminNewPassword.trim()) {
      alert('Please enter a new password.');
      return;
    }

    const ok = updateEmployeePassword(targetEmpId, adminNewPassword);
    if (ok) {
      const targetEmp = allEmployees.find((e) => e.id === targetEmpId);
      setAdminSuccess(`Password for ${targetEmp?.name || 'employee'} successfully reset!`);
      setAdminNewPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 text-white relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Password & Security Settings</h2>
              <p className="text-xs text-slate-400">Manage account passwords & IT reset requests</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('change')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'change'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Change Password
          </button>

          <button
            onClick={() => setActiveTab('request_it')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'request_it'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ask IT to Reset
          </button>

          {currentUser && (currentUser.role === 'manager' || currentUser.role === 'super_admin' || currentUser.role === 'it_admin') && (
            <button
              onClick={() => setActiveTab('admin_reset')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'admin_reset'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin Reset
            </button>
          )}
        </div>

        {/* TAB 1: SELF SERVICE CHANGE PASSWORD */}
        {activeTab === 'change' && (
          <form onSubmit={handleSelfPasswordChange} className="space-y-4">
            {changeError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{changeError}</span>
              </div>
            )}

            {changeSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{changeSuccess}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Current Password:</label>
              <input
                type="password"
                required
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                placeholder="Enter current security password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">New Password:</label>
              <input
                type="password"
                required
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Enter new security password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Confirm New Password:</label>
              <input
                type="password"
                required
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Re-type new password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-all cursor-pointer"
            >
              Update My Password
            </button>
          </form>
        )}

        {/* TAB 2: REQUEST IT RESET */}
        {activeTab === 'request_it' && (
          <form onSubmit={handleRequestITReset} className="space-y-4">
            {itSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{itSuccess}</span>
              </div>
            )}

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/20 space-y-1 text-xs">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Forgot password or need IT assistance?</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Submit a password reset request directly to the Ga-Rankuwa YMCA IT Systems Support Team.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Reason / Details for IT:</label>
              <textarea
                rows={3}
                value={itReason}
                onChange={(e) => setItReason(e.target.value)}
                placeholder="e.g. Forgot my password, account locked, or changing device..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit IT Password Reset Request</span>
            </button>
          </form>
        )}

        {/* TAB 3: ADMIN / MANAGER DIRECT RESET */}
        {activeTab === 'admin_reset' && (
          <form onSubmit={handleAdminReset} className="space-y-4">
            {adminSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{adminSuccess}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Select Employee Profile:</label>
              <select
                value={targetEmpId}
                onChange={(e) => setTargetEmpId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {allEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Set New Password:</label>
              <input
                type="text"
                required
                value={adminNewPassword}
                onChange={(e) => setAdminNewPassword(e.target.value)}
                placeholder="Enter new password for employee"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-all cursor-pointer"
            >
              Reset Employee Password
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
