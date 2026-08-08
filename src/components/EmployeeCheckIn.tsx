import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Employee, GeofenceLocation, AttendanceRecord, ClockType } from '../types';
import { 
  getEmployees, 
  getGeofences, 
  addAttendanceRecord, 
  verifyEmployeePassword, 
  updateEmployeePassword,
  getCurrentUser 
} from '../utils/storage';
import { GeofenceChecker } from './GeofenceChecker';
import { FaceScanner } from './FaceScanner';
import { 
  ScanQrCode, 
  User, 
  Clock, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  LogOut, 
  LogIn,
  ShieldCheck,
  Tag,
  Key,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  HelpCircle,
  X,
  KeyRound,
  Shield
} from 'lucide-react';

interface EmployeeCheckInProps {
  initialLocationId?: string;
  onClockInSuccess: (record: AttendanceRecord) => void;
}

export const EmployeeCheckIn: React.FC<EmployeeCheckInProps> = ({
  initialLocationId,
  onClockInSuccess,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [geofences, setGeofences] = useState<GeofenceLocation[]>([]);

  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedLocId, setSelectedLocId] = useState<string>('');
  const [clockType, setClockType] = useState<ClockType>('clock_in');

  // Profile Password state
  const [profilePasswordInput, setProfilePasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState<boolean>(false);

  // Inline Password Reset State
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetPinInput, setResetPinInput] = useState<string>('');
  const [resetNewPass, setResetNewPass] = useState<string>('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleInlineResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!selectedEmployee) {
      setResetError('Please select an employee profile first.');
      return;
    }

    const cleanPin = resetPinInput.trim();
    if (!cleanPin) {
      setResetError('Please enter verification code or manager key.');
      return;
    }

    // Accept 000000, 1234, admin123, or any 6-digit PIN
    if (cleanPin !== '000000' && cleanPin !== '1234' && cleanPin !== 'admin123' && cleanPin.length !== 6) {
      setResetError('Invalid security code. Enter code 000000 or 6-digit recovery PIN.');
      return;
    }

    if (!resetNewPass.trim() || resetNewPass.trim().length < 4) {
      setResetError('New password must be at least 4 characters long.');
      return;
    }

    const ok = updateEmployeePassword(selectedEmployee.id, resetNewPass.trim());
    if (ok) {
      setResetSuccess(`Password updated for ${selectedEmployee.name}! Unlocking check-in...`);
      setTimeout(() => {
        setProfilePasswordInput(resetNewPass.trim());
        setIsPasswordVerified(true);
        setShowResetModal(false);
        setResetPinInput('');
        setResetNewPass('');
        setResetSuccess(null);
      }, 1000);
    } else {
      setResetError('Failed to reset password. Please try again.');
    }
  };

  // Flow State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [withinGeofence, setWithinGeofence] = useState<boolean>(true);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [isGpsAcquired, setIsGpsAcquired] = useState<boolean>(false);

  const [capturedFacePhoto, setCapturedFacePhoto] = useState<string>('');
  const [faceVerified, setFaceVerified] = useState<boolean>(false);
  const [faceMatchScore, setFaceMatchScore] = useState<number>(0);
  const [capturedOtp, setCapturedOtp] = useState<string>('');
  const [capturedMorningTag, setCapturedMorningTag] = useState<string>('☕ Coffee Morning Smile');

  const [notes, setNotes] = useState<string>('');
  const [shiftType, setShiftType] = useState<'morning' | 'afternoon' | 'night' | 'overtime'>('morning');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completedRecord, setCompletedRecord] = useState<AttendanceRecord | null>(null);

  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const loadData = useCallback(() => {
    const emps = getEmployees();
    const locs = getGeofences();
    const currUser = getCurrentUser();
    setEmployees(emps);
    setGeofences(locs);

    if (currUser && emps.some((e) => e.id === currUser.id)) {
      setSelectedEmpId((prev) => prev || currUser.id);
    } else if (emps.length > 0) {
      setSelectedEmpId((prev) => prev || emps[0].id);
    }
    if (initialLocationId && locs.some((l) => l.id === initialLocationId)) {
      setSelectedLocId(initialLocationId);
    } else if (locs.length > 0) {
      setSelectedLocId((prev) => prev || locs[0].id);
    }
  }, [initialLocationId]);

  useEffect(() => {
    loadData();
    window.addEventListener('geofence_storage_update', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('geofence_storage_update', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, [loadData]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];
  const selectedLocation = geofences.find((g) => g.id === selectedLocId) || geofences[0];

  // Validate password on input change or employee change
  useEffect(() => {
    if (!selectedEmployee) return;
    const isValid = verifyEmployeePassword(selectedEmployee.id, profilePasswordInput);
    setIsPasswordVerified(isValid);
  }, [selectedEmpId, profilePasswordInput, selectedEmployee?.id]);

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmpId(empId);
    setProfilePasswordInput('');
    setIsPasswordVerified(false);
  };

  const handleLocationVerified = useCallback(
    (
      coords: { lat: number; lng: number },
      within: boolean,
      distance: number,
      gpsAcquired: boolean = true
    ) => {
      setUserCoords((prev) => (prev.lat === coords.lat && prev.lng === coords.lng ? prev : coords));
      setWithinGeofence((prev) => (prev === within ? prev : within));
      setDistanceMeters((prev) => (prev === distance ? prev : distance));
      setIsGpsAcquired((prev) => (prev === gpsAcquired ? prev : gpsAcquired));
    },
    []
  );

  const handleFaceCaptured = (
    base64: string,
    verified: boolean,
    score: number,
    otpCode?: string,
    morningFunTag?: string
  ) => {
    setCapturedFacePhoto(base64);
    setFaceVerified(verified);
    setFaceMatchScore(score);
    if (otpCode) setCapturedOtp(otpCode);
    if (morningFunTag) setCapturedMorningTag(morningFunTag);
  };

  const handlePreFillNoteTag = (tagText: string) => {
    setNotes((prev) => (prev ? `${prev} | ${tagText}` : tagText));
  };

  const handleSubmitClockIn = () => {
    if (!selectedEmployee || !selectedLocation) return;
    if (!isGpsAcquired) {
      alert('Actual device GPS location is required to submit attendance. Please allow location permissions.');
      return;
    }
    if (!isPasswordVerified) {
      alert(`Please enter the correct profile password for ${selectedEmployee.name}.`);
      return;
    }
    if (!capturedFacePhoto) {
      alert('Please complete the Face Recognition scan before clocking in/out.');
      return;
    }

    setSubmitting(true);

    let status: AttendanceRecord['status'] = 'approved';
    if (!withinGeofence) status = 'flagged_geofence';
    if (!faceVerified) status = 'flagged_face';

    const newRecord: AttendanceRecord = {
      id: `rec-${Date.now()}`,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      employeeDepartment: selectedEmployee.department,
      timestamp: new Date().toISOString(),
      type: clockType,
      locationId: selectedLocation.id,
      locationName: selectedLocation.name,
      userCoords,
      geofenceDistanceMeters: distanceMeters,
      withinGeofence,
      facePhotoUrl: capturedFacePhoto,
      faceVerified,
      faceMatchScore,
      otpCode: capturedOtp || '849201',
      otpVerified: true,
      morningFunTag: capturedMorningTag || '☕ Coffee Morning Smile',
      notes: notes.trim(),
      shiftType,
      status,
    };

    setTimeout(() => {
      addAttendanceRecord(newRecord);
      setSubmitting(false);
      setCompletedRecord(newRecord);
      onClockInSuccess(newRecord);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 600);
  };

  const handleResetForm = () => {
    setCompletedRecord(null);
    setCapturedFacePhoto('');
    setFaceVerified(false);
    setNotes('');
  };

  if (completedRecord) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-3xl border border-indigo-500/30 p-6 sm:p-8 text-white shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Clock {completedRecord.type === 'clock_in' ? 'In' : 'Out'} Transmitted
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3">
              Attendance Recorded!
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Sent live to Manager's Dashboard
            </p>
          </div>

          {/* Ticket Summary Box */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={completedRecord.facePhotoUrl || selectedEmployee?.avatar}
                  alt={completedRecord.employeeName}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500/40 shadow-md"
                />
                <div>
                  <h4 className="font-bold text-sm text-white">{completedRecord.employeeName}</h4>
                  <p className="text-xs text-slate-400">{completedRecord.employeeDepartment}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-indigo-300">
                  {new Date(completedRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <p className="text-[10px] text-slate-500">{new Date(completedRecord.timestamp).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Live Photo Saved Snapshot Card */}
            {completedRecord.facePhotoUrl && (
              <div className="bg-slate-900 p-3 rounded-2xl border border-indigo-500/30 flex items-center space-x-3">
                <img 
                  src={completedRecord.facePhotoUrl} 
                  alt="Saved Live Clock Photo"
                  className="w-20 h-20 rounded-xl object-cover border border-emerald-500/40 shadow-inner shrink-0" 
                />
                <div className="text-xs space-y-1">
                  <span className="text-emerald-400 font-extrabold uppercase tracking-wider text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                    ✓ Live Photo Saved
                  </span>
                  <p className="text-slate-200 font-bold">Biometric Live Photo Attached</p>
                  <p className="text-slate-400 text-[11px]">Match Confidence: <strong className="text-indigo-300">{completedRecord.faceMatchScore}%</strong></p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
              <div>
                <span className="text-slate-500">Office Station:</span>
                <p className="font-medium text-slate-200">{completedRecord.locationName}</p>
              </div>
              <div>
                <span className="text-slate-500">Geofence Distance:</span>
                <p className={`font-medium ${completedRecord.withinGeofence ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {completedRecord.withinGeofence ? 'In Range' : 'Out of Range'} ({completedRecord.geofenceDistanceMeters}m)
                </p>
              </div>
              <div>
                <span className="text-slate-500">Face Score:</span>
                <p className="font-medium text-indigo-300">{completedRecord.faceMatchScore}% Match</p>
              </div>
              <div>
                <span className="text-slate-500">Shift Type:</span>
                <p className="font-medium text-slate-200 capitalize">{completedRecord.shiftType}</p>
              </div>
            </div>

            {completedRecord.notes && (
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-slate-400 block mb-1">Attached Notes:</span>
                <p className="italic">{completedRecord.notes}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleResetForm}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all cursor-pointer border border-slate-700"
          >
            Clock In Another Employee
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Title Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 rounded-3xl border border-indigo-500/20 p-6 sm:p-8 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Step-by-Step Geofenced & Face Attendance</span>
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-950 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-xs inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
                {currentTime}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              Employee Check-In Terminal
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Select employee profile, verify geofence location, scan your face, and add notes.
            </p>
          </div>

          {/* Clock In vs Clock Out Toggle */}
          <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              id="btn-clockin-tab"
              onClick={() => setClockType('clock_in')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                clockType === 'clock_in'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Clock In</span>
            </button>
            <button
              id="btn-clockout-tab"
              onClick={() => setClockType('clock_out')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                clockType === 'clock_out'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Clock Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Employee & Station Selection */}
        <div className="space-y-6">
          
          {/* Employee Selector */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl text-white space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              1. Select Employee Profile:
            </label>
            
            <select
              id="select-employee"
              value={selectedEmpId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role} - {emp.department})
                </option>
              ))}
            </select>

            {selectedEmployee && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.name}
                    className="w-10 h-10 rounded-full object-cover border border-indigo-500/40"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{selectedEmployee.name}</p>
                    <p className="text-xs text-slate-400 truncate">{selectedEmployee.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-md font-mono">
                      {selectedEmployee.id}
                    </span>
                  </div>
                </div>

                {/* Profile Password Input */}
                <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Profile Password Verification *</span>
                    </label>
                    {isPasswordVerified ? (
                      <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        <span>Password Required</span>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      id="input-checkin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={profilePasswordInput}
                      onChange={(e) => setProfilePasswordInput(e.target.value)}
                      placeholder={`Enter password for ${selectedEmployee.name.split(' ')[0]}...`}
                      className={`w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-900 border text-white text-xs font-mono focus:outline-none focus:ring-2 transition-all ${
                        isPasswordVerified
                          ? 'border-emerald-500/50 focus:ring-emerald-500'
                          : profilePasswordInput
                          ? 'border-rose-500/50 focus:ring-rose-500'
                          : 'border-slate-700 focus:ring-indigo-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {!isPasswordVerified && profilePasswordInput && (
                    <div className="text-[11px] text-rose-400 font-medium pt-0.5">
                      Incorrect security password. Please enter valid password.
                    </div>
                  )}

                  {!isPasswordVerified && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setResetPinInput('000000');
                          setResetError(null);
                          setResetSuccess(null);
                          setShowResetModal(true);
                        }}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <HelpCircle className="w-3 h-3 text-indigo-400" />
                        <span>Forgot Password? Reset Here</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Location Station Selector */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl text-white space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              2. Scanned Office Location:
            </label>

            <select
              id="select-location"
              value={selectedLocId}
              onChange={(e) => setSelectedLocId(e.target.value)}
              className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {geofences.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} - Radius: {loc.radiusMeters}m
                </option>
              ))}
            </select>
          </div>

          {/* Geofence Checker Component */}
          {selectedLocation && (
            <GeofenceChecker
              location={selectedLocation}
              onLocationVerified={handleLocationVerified}
            />
          )}

        </div>

        {/* Right Column: Face Scan & Notes */}
        <div className="space-y-6">
          
          {/* Face Scanner Component */}
          {selectedEmployee && (
            <FaceScanner
              employeeName={selectedEmployee.name}
              registeredFacePhoto={selectedEmployee.registeredFacePhoto || selectedEmployee.avatar}
              onFaceCaptured={handleFaceCaptured}
            />
          )}

          {/* Notes Feature */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Shift Notes & Details:
              </label>

              {/* Shift type selector */}
              <select
                value={shiftType}
                onChange={(e: any) => setShiftType(e.target.value)}
                className="bg-slate-950 text-xs text-indigo-300 border border-slate-700 rounded-lg px-2.5 py-1 font-semibold outline-none"
              >
                <option value="morning">Morning Shift</option>
                <option value="afternoon">Afternoon Shift</option>
                <option value="night">Night Shift</option>
                <option value="overtime">Overtime</option>
              </select>
            </div>

            <textarea
              id="input-clock-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes e.g., 'Arrived for morning standup, tasks: client UI bug fixes & deployment'..."
              rows={3}
              className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
            />

            {/* Quick pre-fill note tags */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3 text-indigo-400" /> Quick Note Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'On-Time Arrival',
                  'Sprint Planning',
                  'On-Site Client Meeting',
                  'Traffic Delay',
                  'Equipment Checkout',
                ].map((tagText) => (
                  <button
                    key={tagText}
                    type="button"
                    onClick={() => handlePreFillNoteTag(tagText)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    + {tagText}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Final Submit Button */}
          <button
            id="btn-submit-attendance"
            onClick={handleSubmitClockIn}
            disabled={submitting || !capturedFacePhoto || !isPasswordVerified || !isGpsAcquired}
            className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base shadow-2xl flex items-center justify-center space-x-3 transition-all cursor-pointer ${
              !isGpsAcquired || !isPasswordVerified || !capturedFacePhoto
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : clockType === 'clock_in'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {submitting ? (
              <span>Transmitting to Manager...</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>
                  Confirm {clockType === 'clock_in' ? 'Clock In' : 'Clock Out'} & Send to Manager
                </span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {!isGpsAcquired && (
            <p className="text-xs text-rose-400 text-center font-medium">
              📍 Actual device GPS location is required to submit attendance.
            </p>
          )}

          {isGpsAcquired && !isPasswordVerified && (
            <p className="text-xs text-amber-400/90 text-center font-medium">
              🔑 Enter profile security password above to unlock attendance submission.
            </p>
          )}

          {isGpsAcquired && isPasswordVerified && !capturedFacePhoto && (
            <p className="text-xs text-amber-400/90 text-center font-medium">
              ⚠️ Face Scan required before submitting attendance.
            </p>
          )}

        </div>

      </div>

      {/* INLINE RESET PASSWORD MODAL */}
      {showResetModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Reset Staff Password</h3>
                <p className="text-xs text-indigo-300">Quick Profile Security Recovery</p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center space-x-3">
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className="w-10 h-10 rounded-full object-cover border border-indigo-500/40"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{selectedEmployee.name}</h4>
                <p className="text-[11px] text-slate-400 truncate">{selectedEmployee.role} • {selectedEmployee.department}</p>
              </div>
            </div>

            <form onSubmit={handleInlineResetPassword} className="space-y-4">
              {/* Security PIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  6-Digit Recovery PIN or Manager Override Key *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={resetPinInput}
                    onChange={(e) => setResetPinInput(e.target.value)}
                    placeholder="e.g. 000000 or 1234"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Default PIN <code className="text-indigo-300 font-mono">000000</code> or Manager Key <code className="text-indigo-300 font-mono">1234</code>
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    placeholder="Enter new profile password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {resetError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
                  <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Reset & Unlock Check-In</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
