import React, { useState, useEffect } from 'react';
import { ViewMode, GeofenceLocation, AttendanceRecord, Employee } from './types';
import { getGeofences, getAttendanceRecords, getCurrentUser, logoutUser } from './utils/storage';
import { Navbar } from './components/Navbar';
import { EmployeeCheckIn } from './components/EmployeeCheckIn';
import { ManagerDashboard } from './components/ManagerDashboard';
import { EmployeeManager } from './components/EmployeeManager';
import { QRStationDisplay } from './components/QRStationDisplay';
import { DailyReportView } from './components/DailyReportView';
import { WorkReportManager } from './components/WorkReportManager';
import { GeofenceManager } from './components/GeofenceManager';
import { ManagerAccessGuard } from './components/ManagerAccessGuard';
import { AuthPortal } from './components/AuthPortal';
import { ApprovalsDashboard } from './components/ApprovalsDashboard';
import { AppTutorialGuide } from './components/AppTutorialGuide';
import { AppLockoutScreen } from './components/AppLockoutScreen';
import { MeetingsManager } from './components/MeetingsManager';
import { motion, AnimatePresence } from 'motion/react';
import {
  VIEW_NAVIGATION_LIST,
  getViewIndex,
  getNextView,
  getPrevView
} from './utils/viewOrder';
import { ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => getCurrentUser());
  const [currentView, setCurrentView] = useState<ViewMode>('checkin');
  const [direction, setDirection] = useState<number>(1);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [geofences, setGeofences] = useState<GeofenceLocation[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Theme Mode State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('geofence_app_theme') as 'dark' | 'light') || 'dark';
  });

  // App Lockout State
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    return localStorage.getItem('geofence_app_locked') === 'true';
  });

  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('geofence_autolock_mins');
    return saved !== null ? parseInt(saved, 10) : 10;
  });

  // Inactivity Auto-Lockout Listener
  useEffect(() => {
    if (autoLockMinutes <= 0 || !currentUser) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsAppLocked(true);
        localStorage.setItem('geofence_app_locked', 'true');
      }, autoLockMinutes * 60 * 1000);
    };

    resetTimer();

    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [autoLockMinutes, currentUser]);

  useEffect(() => {
    const handleThemeChange = () => {
      const saved = (localStorage.getItem('geofence_app_theme') as 'dark' | 'light') || 'dark';
      setTheme(saved);
    };

    window.addEventListener('geofence_theme_change', handleThemeChange);
    return () => window.removeEventListener('geofence_theme_change', handleThemeChange);
  }, []);

  useEffect(() => {
    const handleUserUpdate = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener('geofence_user_session_update', handleUserUpdate);
    return () => window.removeEventListener('geofence_user_session_update', handleUserUpdate);
  }, []);

  useEffect(() => {
    const locs = getGeofences();
    setGeofences(locs);

    // Check if loaded via QR code scan link parameters
    const params = new URLSearchParams(window.location.search);
    const locParam = params.get('loc');
    if (locParam) {
      setSelectedLocationId(locParam);
      handleSelectView('checkin');
    }

    // Calculate pending/flagged records
    const records = getAttendanceRecords();
    const flagged = records.filter(
      (r) => r.status === 'flagged_geofence' || r.status === 'flagged_face'
    ).length;
    setPendingCount(flagged);

    const handleStorageUpdate = () => {
      const updatedRecords = getAttendanceRecords();
      const updatedFlagged = updatedRecords.filter(
        (r) => r.status === 'flagged_geofence' || r.status === 'flagged_face'
      ).length;
      setPendingCount(updatedFlagged);
      setGeofences(getGeofences());
    };

    window.addEventListener('geofence_storage_update', handleStorageUpdate);
    window.addEventListener('geofence_clock_in_event', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    // Real-time synchronization interval (every 2 seconds)
    const syncInterval = setInterval(() => {
      handleStorageUpdate();
    }, 2000);

    return () => {
      window.removeEventListener('geofence_storage_update', handleStorageUpdate);
      window.removeEventListener('geofence_clock_in_event', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      clearInterval(syncInterval);
    };
  }, []);

  const handleSelectView = (newView: ViewMode) => {
    if (newView === currentView) return;
    const oldIdx = getViewIndex(currentView);
    const newIdx = getViewIndex(newView);
    setDirection(newIdx > oldIdx ? 1 : -1);
    setCurrentView(newView);
  };

  const handleStationSelectCheckIn = (locId: string) => {
    setSelectedLocationId(locId);
    handleSelectView('checkin');
  };

  const handleClockInSuccess = (_record: AttendanceRecord) => {
    // Refresh pending count
    const records = getAttendanceRecords();
    const flagged = records.filter(
      (r) => r.status === 'flagged_geofence' || r.status === 'flagged_face'
    ).length;
    setPendingCount(flagged);
  };

  // If user is not logged in / registered, present the Registration & Login Portal
  if (!currentUser) {
    return (
      <AuthPortal
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  const currentNavIdx = getViewIndex(currentView);
  const currentNavItem = VIEW_NAVIGATION_LIST[currentNavIdx];

  // Motion Variants for Page Slide Transitions
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '50%' : '-50%',
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 280, damping: 28 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-50%' : '50%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 280, damping: 28 },
        opacity: { duration: 0.18 },
      },
    }),
  };

  return (
    <div
      className={`min-h-screen font-sans selection:bg-indigo-500 selection:text-white flex flex-col overflow-x-hidden relative transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-slate-100 text-slate-900'
          : 'bg-slate-950 text-slate-100 dark'
      }`}
    >
      {/* Fixed Viewport Background Ambient Glows & Grid (Does not clip during scroll) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      {/* Top Glass Navigation Bar */}
      <Navbar
        currentView={currentView}
        onSelectView={handleSelectView}
        pendingCount={pendingCount}
        currentUser={currentUser}
        onLogout={() => {
          logoutUser();
          setCurrentUser(null);
        }}
        onLockApp={() => {
          setIsAppLocked(true);
          localStorage.setItem('geofence_app_locked', 'true');
        }}
      />

      {/* Page Slide Indicator Banner for PC & Mobile */}
      <div className="bg-slate-900/60 border-b border-slate-800/60 py-1.5 px-4 relative z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          {/* Active Page Slide Info */}
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Page Slide {currentNavIdx + 1} of {VIEW_NAVIGATION_LIST.length}:</span>
              <span className="text-indigo-300 font-extrabold">{currentNavItem.label}</span>
            </span>
          </div>

          {/* Quick Slide Navigation Dots & Arrows */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-prev-page-slide-banner"
              onClick={() => handleSelectView(getPrevView(currentView))}
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer flex items-center space-x-0.5 text-[11px]"
              title="Slide to Previous Page (Swipe Right)"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Prev Slide</span>
            </button>

            {/* Slide Dots */}
            <div className="flex items-center space-x-1 px-1">
              {VIEW_NAVIGATION_LIST.map((item, idx) => (
                <button
                  key={`dot-${item.id}`}
                  onClick={() => handleSelectView(item.id)}
                  title={`Slide to ${item.label}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentNavIdx
                      ? 'w-5 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm shadow-indigo-500/50'
                      : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            <button
              id="btn-next-page-slide-banner"
              onClick={() => handleSelectView(getNextView(currentView))}
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer flex items-center space-x-0.5 text-[11px]"
              title="Slide to Next Page (Swipe Left)"
            >
              <span className="hidden sm:inline">Next Slide</span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main View Container with Smooth AnimatePresence Slide & Touch Pan Support */}
      <main className="flex-1 pb-24 lg:pb-16 relative z-10 w-full overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentView}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            onPanEnd={(_e, info) => {
              // Touch / Drag Swipe detection: swipe left (>50px) -> Next; swipe right (<-50px) -> Prev
              if (info.offset.x < -60) {
                handleSelectView(getNextView(currentView));
              } else if (info.offset.x > 60) {
                handleSelectView(getPrevView(currentView));
              }
            }}
            className="w-full h-full"
          >
            {currentView === 'checkin' && (
              <EmployeeCheckIn
                initialLocationId={selectedLocationId}
                onClockInSuccess={handleClockInSuccess}
              />
            )}

            {currentView === 'guide' && <AppTutorialGuide />}

            {currentView === 'manager' && <ManagerDashboard />}

            {currentView === 'employees' && (
              <ManagerAccessGuard
                title="Staff Roster & Employee Directory Restricted"
                description="Managing YMCA employee records, registration, and staff profiles is restricted to authorized Manager devices only."
                icon="employees"
              >
                <EmployeeManager />
              </ManagerAccessGuard>
            )}

            {currentView === 'qr_kiosk' && (
              <ManagerAccessGuard
                title="Station QR Kiosk Configuration Restricted"
                description="Displaying and configuring station QR scan kiosks for staff clock-in terminals is restricted to authorized Manager devices only."
                icon="kiosk"
              >
                <QRStationDisplay
                  locations={geofences}
                  onSelectStationCheckIn={handleStationSelectCheckIn}
                />
              </ManagerAccessGuard>
            )}

            {currentView === 'reports' && <DailyReportView />}

            {currentView === 'work_reports' && <WorkReportManager />}

            {currentView === 'approvals' && <ApprovalsDashboard currentUser={currentUser} />}

            {currentView === 'meetings' && (
              <MeetingsManager
                currentUser={currentUser || undefined}
                userRole={(currentUser?.role as any) || 'manager'}
              />
            )}

            {currentView === 'geofences' && (
              <ManagerAccessGuard
                title="Geofence Location Boundary Manager Restricted"
                description="Configuring center locations, GPS coordinates, and geofence radii is strictly restricted to authorized Manager devices only."
                icon="locations"
              >
                <GeofenceManager />
              </ManagerAccessGuard>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 print:hidden mb-12 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Ga-Rankuwa YMCA • Geofence & AI Biometric Staff Portal
          </span>
          <span className="text-slate-600 font-mono">
            Touch Swipe Page Slides Enabled (PC & Mobile)
          </span>
        </div>
      </footer>

      {/* App Lockout Overlay Screen */}
      <AppLockoutScreen
        isLocked={isAppLocked}
        onUnlock={() => {
          setIsAppLocked(false);
          localStorage.removeItem('geofence_app_locked');
        }}
        currentUser={currentUser}
        onSwitchUser={() => {
          logoutUser();
          setCurrentUser(null);
          setIsAppLocked(false);
          localStorage.removeItem('geofence_app_locked');
        }}
        autoLockMinutes={autoLockMinutes}
        onUpdateAutoLockMinutes={(mins) => {
          setAutoLockMinutes(mins);
          localStorage.setItem('geofence_autolock_mins', mins.toString());
        }}
      />
    </div>
  );
}
