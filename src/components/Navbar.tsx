import React, { useState, useEffect } from 'react';
import { ViewMode, Employee } from '../types';
import { YMCALogo } from './YMCALogo';
import { motion } from 'motion/react';
import {
  Clock,
  Lock,
  LogOut,
  Key,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sun,
  Moon,
  ShieldAlert
} from 'lucide-react';
import { isCurrentDeviceAuthorized, getITSystemConfig, ITSystemConfig } from '../utils/deviceManager';
import { getPrivilegeRequests } from '../utils/storage';
import { isFullAccessActive } from '../utils/pinAuthManager';
import { PINAuthModal } from './PINAuthModal';
import { PasswordManagementModal } from './PasswordManagementModal';
import {
  VIEW_NAVIGATION_LIST,
  getViewIndex,
  getNextView,
  getPrevView
} from '../utils/viewOrder';

interface NavbarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  pendingCount?: number;
  currentUser?: Employee | null;
  onLogout?: () => void;
  onLockApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  pendingCount = 0,
  currentUser,
  onLogout,
  onLockApp
}) => {
  const [time, setTime] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [hasFullAccess, setHasFullAccess] = useState<boolean>(isFullAccessActive());
  const [itConfig, setItConfig] = useState<ITSystemConfig>(() => getITSystemConfig());

  // Bright / Dark Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('geofence_app_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('geofence_app_theme', newTheme);
    window.dispatchEvent(new Event('geofence_theme_change'));
  };

  const currentNavIndex = getViewIndex(currentView);
  const currentNavItem = VIEW_NAVIGATION_LIST[currentNavIndex];

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthorized(isCurrentDeviceAuthorized());
      setHasFullAccess(isFullAccessActive());
      setItConfig(getITSystemConfig());
    };
    checkAuth();

    window.addEventListener('geofence_device_update', checkAuth);
    window.addEventListener('app_authorizations_update', checkAuth);
    return () => {
      window.removeEventListener('geofence_device_update', checkAuth);
      window.removeEventListener('app_authorizations_update', checkAuth);
    };
  }, []);

  useEffect(() => {
    const updateApprovals = () => {
      const reqs = getPrivilegeRequests();
      const count = reqs.filter((r) => r.status === 'pending_manager' || r.status === 'pending_it').length;
      setPendingApprovalsCount(count);
    };
    updateApprovals();

    window.addEventListener('geofence_storage_update', updateApprovals);
    return () => window.removeEventListener('geofence_storage_update', updateApprovals);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Top Glass Navigation Bar (Desktop & Tablet Header) */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand & Logo */}
            <div
              className="flex items-center space-x-2.5 cursor-pointer shrink-0"
              onClick={() => onSelectView('checkin')}
            >
              <YMCALogo size="md" />
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    {itConfig.appName || 'Ga-Rankuwa YMCA'}
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase rounded-full bg-red-600/20 border border-red-500/30 text-red-300">
                    Attendance
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                  {itConfig.centerSubtitle || 'Official Staff Geofence & Biometric Portal'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation View Switcher with Animated Pill */}
            <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800/90 shadow-inner">
              {VIEW_NAVIGATION_LIST.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;

                let badgeCount = 0;
                if (item.badgeType === 'pending') badgeCount = pendingCount;
                if (item.badgeType === 'approvals') badgeCount = pendingApprovalsCount;

                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => onSelectView(item.id)}
                    className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="desktopNavActivePill"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/25 z-0"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}

                    <span className="relative z-10 flex items-center space-x-1.5">
                      <Icon className={`w-3.5 h-3.5 ${item.colorClass || ''}`} />
                      <span>{item.shortLabel}</span>
                      {item.isRestricted && !isAuthorized && (
                        <Lock className="w-2.5 h-2.5 text-amber-300" />
                      )}
                      {badgeCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                          {badgeCount}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile / Compact Slide Navigator Bar (Middle Header on Small Screens) */}
            <div className="lg:hidden flex items-center bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800 text-xs">
              <button
                id="btn-prev-page-slide-top"
                onClick={() => onSelectView(getPrevView(currentView))}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Previous Page Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1.5 px-2 text-indigo-300 font-semibold text-[11px] truncate max-w-[120px] sm:max-w-[180px]">
                <Layers className="w-3 h-3 text-purple-400 animate-pulse shrink-0" />
                <span className="truncate">{currentNavItem.shortLabel}</span>
                <span className="text-[10px] text-slate-500 font-mono">({currentNavIndex + 1}/8)</span>
              </div>

              <button
                id="btn-next-page-slide-top"
                onClick={() => onSelectView(getNextView(currentView))}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Next Page Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right Action Badges: Theme Toggle, Password & Security, PIN Auth, Clock & Profile */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              
              {/* Bright / Dark Mode Theme Toggle Button */}
              <button
                id="nav-btn-theme-toggle"
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-all cursor-pointer"
                title={theme === 'dark' ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-400" />
                )}
              </button>

              {/* Lock App / System Lockout Button */}
              {onLockApp && (
                <button
                  id="nav-btn-lock-app"
                  onClick={onLockApp}
                  className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Lock application screen immediately"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Lock App</span>
                </button>
              )}

              {/* Password & Security Button */}
              <button
                id="nav-btn-password-reset"
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-[11px] sm:text-xs font-bold transition-all cursor-pointer"
                title="Change password or ask IT to reset"
              >
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Password</span>
              </button>

              {/* PIN Auth / Security Button */}
              <button
                id="nav-btn-pin-auth"
                onClick={() => setShowPinModal(true)}
                className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  hasFullAccess
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-sm shadow-emerald-900/50'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                }`}
                title="Verify 4-digit PIN for full administrative access or self-service PIN change"
              >
                <Key className={`w-3.5 h-3.5 ${hasFullAccess ? 'text-emerald-400' : 'text-indigo-400'}`} />
                <span className="hidden sm:inline">
                  {hasFullAccess ? 'Full Access' : 'PIN Auth'}
                </span>
              </button>

              {/* Time display */}
              <div className="hidden xl:flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300">
                <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>{time}</span>
              </div>

              {/* User Profile */}
              {currentUser ? (
                <div className="flex items-center space-x-1.5 bg-slate-950/90 pl-1.5 pr-2 py-1 rounded-xl border border-indigo-500/30">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover border border-indigo-400/50"
                  />
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[9px] text-indigo-300 truncate max-w-[100px]">
                      {currentUser.role}
                    </div>
                  </div>
                  {onLogout && (
                    <button
                      id="nav-btn-logout"
                      onClick={onLogout}
                      title="Sign Out"
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </header>

      {/* Floating Bottom Navigation Bar for Mobile & Tablet Devices */}
      <nav className="fixed bottom-3 left-3 right-3 z-40 lg:hidden bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl p-1.5 flex items-center justify-between space-x-1 overflow-x-auto scrollbar-none">
        <button
          id="btn-prev-page-slide-bottom"
          onClick={() => onSelectView(getPrevView(currentView))}
          className="p-2 rounded-xl bg-slate-800/90 text-indigo-300 hover:text-white shrink-0 cursor-pointer"
          title="Previous Page Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
          {VIEW_NAVIGATION_LIST.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;

            let badgeCount = 0;
            if (item.badgeType === 'pending') badgeCount = pendingCount;
            if (item.badgeType === 'approvals') badgeCount = pendingApprovalsCount;

            return (
              <button
                key={`mobile-${item.id}`}
                id={`mobile-nav-btn-${item.id}`}
                onClick={() => onSelectView(item.id)}
                className={`relative flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActivePill"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md shadow-indigo-500/30 z-0"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <span className="relative z-10 flex items-center space-x-1">
                  <Icon className={`w-3.5 h-3.5 ${item.colorClass || ''}`} />
                  <span className="text-[11px]">{item.shortLabel}</span>
                  {badgeCount > 0 && (
                    <span className="px-1 py-0.2 rounded-full bg-rose-500 text-white text-[8px] font-black animate-pulse">
                      {badgeCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <button
          id="btn-next-page-slide-bottom"
          onClick={() => onSelectView(getNextView(currentView))}
          className="p-2 rounded-xl bg-slate-800/90 text-indigo-300 hover:text-white shrink-0 cursor-pointer"
          title="Next Page Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>

      {/* PIN Security Verification Modal */}
      <PINAuthModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setIsAuthorized(isCurrentDeviceAuthorized());
          setHasFullAccess(isFullAccessActive());
        }}
      />

      {/* Password Change & IT Reset Modal */}
      <PasswordManagementModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        currentUser={currentUser || null}
      />
    </>
  );
};
