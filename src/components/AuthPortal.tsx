import React, { useState, useEffect, useRef } from 'react';
import { Employee } from '../types';
import { YMCALogo } from './YMCALogo';
import { 
  getEmployees, 
  loginEmployee, 
  registerEmployeeProfile, 
  getDepartments,
  updateEmployeePassword
} from '../utils/storage';
import { getITSystemConfig } from '../utils/deviceManager';
import { 
  UserPlus, 
  LogIn, 
  ShieldCheck, 
  Key, 
  Mail, 
  User, 
  Building2, 
  Briefcase, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Sparkles,
  Camera,
  Cpu,
  Lock,
  Upload,
  X,
  RefreshCw,
  HelpCircle,
  ArrowLeft,
  Send,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

interface AuthPortalProps {
  onLoginSuccess: (user: Employee) => void;
}

const PRESET_AVATARS = [
  { label: 'Female Leader 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { label: 'Male Specialist 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Female Manager 2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { label: 'Male Coach 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { label: 'Female Coordinator 3', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { label: 'Male Admin 3', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
];

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('register');
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [staffSearchTerm, setStaffSearchTerm] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const itConfig = getITSystemConfig();

  // Sync registered employee profiles in real time
  useEffect(() => {
    const handleStorageUpdate = () => {
      setEmployees(getEmployees());
    };
    handleStorageUpdate();
    window.addEventListener('geofence_storage_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('geofence_storage_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPass, setShowLoginPass] = useState<boolean>(false);

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [forgotEmployee, setForgotEmployee] = useState<Employee | null>(null);
  const [forgotOtpCode, setForgotOtpCode] = useState<string>('');
  const [forgotInputOtp, setForgotInputOtp] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>('');
  const [showForgotNewPass, setShowForgotNewPass] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);

  // Registration form state
  const [departmentsList, setDepartmentsList] = useState<string[]>(() => getDepartments());
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regRole, setRegRole] = useState<string>('Staff Specialist');
  const [regDepartment, setRegDepartment] = useState<string>(() => getDepartments()[0] || 'Youth & Community Development');
  const [regPassword, setRegPassword] = useState<string>('');

  useEffect(() => {
    const handleDeptUpdate = () => {
      const depts = getDepartments();
      setDepartmentsList(depts);
      if (!depts.includes(regDepartment) && depts.length > 0) {
        setRegDepartment(depts[0]);
      }
    };
    window.addEventListener('geofence_departments_update', handleDeptUpdate);
    return () => window.removeEventListener('geofence_departments_update', handleDeptUpdate);
  }, [regDepartment]);
  const [regAvatar, setRegAvatar] = useState<string>(PRESET_AVATARS[0].url);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showWebcam, setShowWebcam] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);
  const [showRegPass, setShowRegPass] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setRegError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        setCustomPhotoUrl(dataUrl);
        setRegAvatar(dataUrl);
        setRegError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const startWebcam = async () => {
    try {
      setShowWebcam(true);
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'user' }, width: { ideal: 400 }, height: { ideal: 400 } } });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } } });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setRegError('Unable to access front camera. Please select or upload a photo file.');
      setShowWebcam(false);
    }
  };

  const captureWebcam = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCustomPhotoUrl(dataUrl);
        setRegAvatar(dataUrl);
        stopWebcam();
      }
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowWebcam(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError('Please enter your Email/ID and Password.');
      return;
    }

    const res = loginEmployee(loginIdentifier, loginPassword);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setLoginError(res.message);
    }
  };

  const handleRegisterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRegError(null);
    setRegSuccessMsg(null);

    let cleanName = regName.trim();
    if (!cleanName) {
      cleanName = 'YMCA Staff Member';
      setRegName(cleanName);
    }

    let cleanEmail = regEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      const emailPrefix = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      cleanEmail = `${emailPrefix}@garankuwaymca.org.za`;
      setRegEmail(cleanEmail);
    }

    let cleanPassword = regPassword.trim();
    if (!cleanPassword || cleanPassword.length < 3) {
      const firstName = cleanName.split(' ')[0] || 'Staff';
      cleanPassword = `${firstName}@2026`;
      setRegPassword(cleanPassword);
    }

    const facePhoto = customPhotoUrl || regAvatar || PRESET_AVATARS[0].url;

    const res = registerEmployeeProfile({
      name: cleanName,
      email: cleanEmail,
      role: regRole.trim() || 'YMCA Staff Member',
      department: regDepartment || departmentsList[0] || 'Youth & Community Development',
      password: cleanPassword,
      avatar: facePhoto,
      registeredFacePhoto: facePhoto,
      biometricRegistered: true,
      registeredAt: new Date().toISOString(),
    });

    if (res.success && res.user) {
      setRegSuccessMsg(res.message);
      // Instantly open portal
      onLoginSuccess(res.user);
    } else {
      setRegError(res.message || 'Failed to create profile. Please try again.');
    }
  };

  const handleQuickDemoLogin = (emp: Employee) => {
    const validPass = emp.password || `${emp.name.split(' ')[0]}@2026`;
    const res = loginEmployee(emp.id, validPass);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    }
  };

  const handleForgotLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);
    const cleanId = forgotIdentifier.trim().toLowerCase();
    if (!cleanId) {
      setForgotError('Please enter your Work Email address or Employee ID.');
      return;
    }
    const emps = getEmployees();
    const target = emps.find(
      (emp) =>
        emp.id.toLowerCase() === cleanId ||
        emp.email.toLowerCase() === cleanId ||
        emp.name.toLowerCase() === cleanId
    );

    if (!target) {
      setForgotError(`No registered staff account found matching "${forgotIdentifier}". Please verify your details or register a new profile.`);
      return;
    }

    setIsSendingOtp(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setForgotOtpCode(code);
      setForgotEmployee(target);
      setForgotStep(2);
      setIsSendingOtp(false);
      setForgotSuccessMsg(`6-Digit security verification code generated for ${target.name}.`);
    }, 500);
  };

  const handleForgotVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);
    const cleanInput = forgotInputOtp.trim();
    if (!cleanInput) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (cleanInput !== forgotOtpCode && cleanInput !== '000000') {
      setForgotError('Invalid security code. Please check the code dispatched above or click resend.');
      return;
    }
    setForgotStep(3);
    setForgotSuccessMsg('Security code verified! You may now set your new password.');
  };

  const handleForgotResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);

    if (!forgotNewPassword.trim() || forgotNewPassword.trim().length < 4) {
      setForgotError('New password must be at least 4 characters long.');
      return;
    }

    if (forgotNewPassword.trim() !== forgotConfirmPassword.trim()) {
      setForgotError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    if (!forgotEmployee) {
      setForgotError('Account context lost. Please restart password recovery.');
      return;
    }

    const ok = updateEmployeePassword(forgotEmployee.id, forgotNewPassword.trim());
    if (ok) {
      setForgotSuccessMsg(`Password successfully reset for ${forgotEmployee.name}! Redirecting to Sign In...`);
      setLoginIdentifier(forgotEmployee.email || forgotEmployee.id);
      setLoginPassword(forgotNewPassword.trim());
      setEmployees(getEmployees());

      setTimeout(() => {
        setMode('login');
        setForgotStep(1);
        setForgotIdentifier('');
        setForgotEmployee(null);
        setForgotOtpCode('');
        setForgotInputOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setForgotError(null);
        setForgotSuccessMsg(null);
      }, 1500);
    } else {
      setForgotError('Failed to update password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-x-hidden font-sans">
      
      {/* Background Decorative Glow (Fixed to viewport) */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none z-0" />

      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative z-10 backdrop-blur-xl">
        
        {/* Header Branding */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <YMCALogo size="xl" showText textClassName="text-2xl font-black text-white" subtext="Empowering Young People & Communities" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-300 border border-red-500/30 uppercase tracking-widest inline-flex items-center space-x-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>{itConfig.appName || 'Ga-Rankuwa YMCA'} Staff Portal</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Biometric Attendance & Staff Gateway
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Please register your profile or sign in to access geofenced attendance & work logs
            </p>
          </div>
        </div>

        {/* Auth Mode Toggle Tabs */}
        {mode === 'forgot' ? (
          <div className="flex items-center justify-between w-full p-2 bg-slate-950 rounded-2xl border border-indigo-500/30">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setForgotStep(1);
                setForgotError(null);
                setForgotSuccessMsg(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-800 hover:border-indigo-500/40 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Sign In</span>
            </button>
            <span className="text-xs font-extrabold text-indigo-400 px-3 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Password Recovery</span>
            </span>
          </div>
        ) : (
          <div className="flex p-1.5 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs font-bold">
            <button
              id="tab-mode-register"
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30 font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Profile</span>
            </button>

            <button
              id="tab-mode-login"
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30 font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Profile</span>
            </button>
          </div>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Quick Helper Banner */}
            <div className="flex items-center justify-between p-2 bg-indigo-950/40 rounded-xl border border-indigo-500/20 text-xs">
              <span className="text-[11px] text-indigo-300 font-medium flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quick Staff Profile Setup</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const sampleNames = ['Sibusiso Mkhize', 'Naledi Khumalo', 'Bongani Ndlovu', 'Tshiamo Dlamini', 'Kagiso Lekgothoane'];
                  const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
                  const clean = randomName.toLowerCase().replace(/\s+/g, '.');
                  setRegName(randomName);
                  setRegEmail(`${clean}@garankuwaymca.org.za`);
                  setRegRole('Program Specialist');
                  setRegDepartment(departmentsList[0] || 'Youth Development & Programs');
                  setRegPassword('Staff@2026');
                }}
                className="text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Auto-Fill Sample</span>
              </button>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  id="reg-input-name"
                  type="text"
                  value={regName}
                  onChange={(e) => {
                    const nameVal = e.target.value;
                    setRegName(nameVal);
                    if (!regEmail || regEmail.endsWith('@garankuwaymca.org.za')) {
                      const cleanName = nameVal.trim().toLowerCase().replace(/[^a-z0-9]/g, '.');
                      if (cleanName) {
                        setRegEmail(`${cleanName}@garankuwaymca.org.za`);
                      } else {
                        setRegEmail('');
                      }
                    }
                  }}
                  placeholder="e.g. Collen Madihlaba"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  id="reg-input-email"
                  type="text"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. c.madihlaba@garankuwaymca.org.za (auto-filled if empty)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Department & Role Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" />
                  <select
                    id="reg-input-department"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {departmentsList.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Role / Position
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    id="reg-input-role"
                    type="text"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    placeholder="e.g. Program Specialist"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Security Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Profile Security Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  id="reg-input-password"
                  type={showRegPass ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Set password or leave default (e.g. Staff@2026)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass(!showRegPass)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Used to unlock biometric attendance submission and work logs.
              </p>
            </div>

            {/* Hidden File Input & Canvas */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Profile Photo Upload Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Upload Profile Photo *
              </label>

              {/* Webcam Live Capture View */}
              {showWebcam ? (
                <div className="bg-slate-950 border-2 border-indigo-500 rounded-2xl p-4 text-center space-y-3 relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-48 h-48 mx-auto rounded-full object-cover border-2 border-indigo-400 bg-black"
                  />
                  <div className="flex items-center justify-center space-x-3">
                    <button
                      type="button"
                      onClick={captureWebcam}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopWebcam}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : customPhotoUrl ? (
                /* Selected / Uploaded Photo Preview */
                <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/40 flex items-center space-x-4">
                  <div className="relative group">
                    <img
                      src={customPhotoUrl}
                      alt="Uploaded Profile"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white">Custom Profile Photo</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        Ready
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Photo uploaded successfully. It will be used for biometric verification.
                    </p>
                    <div className="flex items-center space-x-3 mt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer flex items-center space-x-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Change Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomPhotoUrl(null);
                          setRegAvatar(PRESET_AVATARS[0].url);
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold underline cursor-pointer flex items-center space-x-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Drag & Drop Upload Zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer relative ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                      : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/80 hover:bg-slate-950'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2 text-indigo-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Drag & Drop your photo here, or <span className="text-indigo-400 underline">browse file</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports JPG, PNG, WebP format (Recommended clear face photo)
                  </p>

                  <div className="flex items-center justify-center space-x-2 mt-3 pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startWebcam();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Take Photo via Camera</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Optional Preset Sample Photos */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Or choose a sample staff photo:</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomPhotoUrl(null);
                        setRegAvatar(av.url);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                        regAvatar === av.url && !customPhotoUrl
                          ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105 opacity-100'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-10 object-cover rounded-lg" />
                      {regAvatar === av.url && !customPhotoUrl && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts */}
            {regError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{regSuccessMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="btn-submit-registration"
              type="submit"
              onClick={() => handleRegisterSubmit()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 border border-indigo-400/30 hover:border-indigo-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Profile & Enter App</span>
            </button>
          </form>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email / ID / Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Email or Employee ID *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  id="login-input-identifier"
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. c.madihlaba@garankuwaymca.org.za or emp-100"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Security Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Security Password *
                </label>
                <button
                  id="btn-forgot-password"
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(loginIdentifier || '');
                    setForgotStep(1);
                    setForgotError(null);
                    setForgotSuccessMsg(null);
                    setMode('forgot');
                  }}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Forgot Password?</span>
                </button>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  id="login-input-password"
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your profile password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              id="btn-submit-login"
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 border border-indigo-400/30 hover:border-indigo-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center space-x-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In & Open Portal</span>
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <div className="space-y-5 bg-slate-950/60 p-5 rounded-2xl border border-indigo-500/20">
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-800 text-xs">
              <div className={`flex items-center space-x-1.5 ${forgotStep >= 1 ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep >= 1 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-500'}`}>1</span>
                <span>Lookup</span>
              </div>
              <div className="w-8 h-px bg-slate-800" />
              <div className={`flex items-center space-x-1.5 ${forgotStep >= 2 ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep >= 2 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-500'}`}>2</span>
                <span>Verify Code</span>
              </div>
              <div className="w-8 h-px bg-slate-800" />
              <div className={`flex items-center space-x-1.5 ${forgotStep >= 3 ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep >= 3 ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-500'}`}>3</span>
                <span>New Password</span>
              </div>
            </div>

            {/* Step 1: Identify Account */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotLookup} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <span>Identify Registered Account</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enter your Work Email address or Employee ID below to locate your profile and receive a 6-digit security recovery PIN.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Email or Employee ID *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. c.madihlaba@garankuwaymca.org.za or emp-100"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {forgotError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isSendingOtp ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSendingOtp ? 'Locating Profile & Generating Code...' : 'Dispatch Verification Code'}</span>
                </button>
              </form>
            )}

            {/* Step 2: Verification Code Input */}
            {forgotStep === 2 && forgotEmployee && (
              <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
                {/* Employee Target Profile Card */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center space-x-3">
                  <img
                    src={forgotEmployee.registeredFacePhoto || forgotEmployee.avatar}
                    alt={forgotEmployee.name}
                    className="w-10 h-10 rounded-full object-cover border border-indigo-500/40"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{forgotEmployee.name}</h4>
                    <p className="text-[11px] text-indigo-300 truncate">{forgotEmployee.role} • {forgotEmployee.department}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{forgotEmployee.email || forgotEmployee.id}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    Verified Profile
                  </span>
                </div>

                {/* Simulated Security Dispatched Box */}
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-indigo-300 font-bold text-xs">
                    <span className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Security Code Dispatched</span>
                    </span>
                    <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded font-mono text-indigo-200">
                      Code: {forgotOtpCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Verification PIN generated for <strong className="text-white">{forgotEmployee.name}</strong>. Enter code <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-xs">{forgotOtpCode}</code> below (or backup code <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300 font-mono text-xs">000000</code>).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enter 6-Digit Security Code *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={forgotInputOtp}
                      onChange={(e) => setForgotInputOtp(e.target.value)}
                      placeholder={`e.g. ${forgotOtpCode}`}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono tracking-widest text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {forgotError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
                    <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span>{forgotSuccessMsg}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                      setForgotOtpCode(newCode);
                      setForgotSuccessMsg(`New security code generated: ${newCode}`);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-all cursor-pointer"
                  >
                    Resend Code
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Code & Proceed</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {forgotStep === 3 && forgotEmployee && (
              <form onSubmit={handleForgotResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Set New Security Password</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Identity confirmed for <strong className="text-white">{forgotEmployee.name}</strong>. Create a new security password for your profile below.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type={showForgotNewPass ? 'text' : 'password'}
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Enter new password (min 4 characters)"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                    >
                      {showForgotNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type={showForgotNewPass ? 'text' : 'password'}
                      required
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {forgotError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2">
                    <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span>{forgotSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Password & Return to Sign In</span>
                </button>
              </form>
            )}
          </div>
        )}

            {/* ALL REGISTERED STAFF PROFILES DIRECTORY */}
            <div className="pt-5 border-t border-slate-800 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    All Registered Staff Profiles ({employees.length})
                  </h3>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono font-semibold self-start sm:self-auto">
                  ● Live Sync
                </span>
              </div>

              {/* Search & Department Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={staffSearchTerm}
                  onChange={(e) => setStaffSearchTerm(e.target.value)}
                  placeholder="Search registered staff by name, role, email..."
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Departments ({employees.length})</option>
                  {departmentsList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Cards Grid */}
              {employees.filter((emp) => {
                const term = staffSearchTerm.toLowerCase().trim();
                const matchesSearch =
                  !term ||
                  emp.name.toLowerCase().includes(term) ||
                  emp.email.toLowerCase().includes(term) ||
                  emp.role.toLowerCase().includes(term) ||
                  emp.id.toLowerCase().includes(term) ||
                  emp.department.toLowerCase().includes(term);
                const matchesDept = selectedDeptFilter === 'all' || emp.department === selectedDeptFilter;
                return matchesSearch && matchesDept;
              }).length === 0 ? (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  No registered staff profiles match your search criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {employees
                    .filter((emp) => {
                      const term = staffSearchTerm.toLowerCase().trim();
                      const matchesSearch =
                        !term ||
                        emp.name.toLowerCase().includes(term) ||
                        emp.email.toLowerCase().includes(term) ||
                        emp.role.toLowerCase().includes(term) ||
                        emp.id.toLowerCase().includes(term) ||
                        emp.department.toLowerCase().includes(term);
                      const matchesDept = selectedDeptFilter === 'all' || emp.department === selectedDeptFilter;
                      return matchesSearch && matchesDept;
                    })
                    .map((emp) => (
                      <div
                        key={emp.id}
                        className="p-3 bg-slate-950 hover:bg-slate-800/60 rounded-2xl border border-slate-800/80 text-left flex flex-col justify-between space-y-2 transition-all group"
                      >
                        <div className="flex items-start space-x-3">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-10 h-10 rounded-xl object-cover border border-indigo-500/40 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                                {emp.name}
                              </h4>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded">
                                {emp.id}
                              </span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400 truncate">{emp.role}</p>
                            <p className="text-[10px] text-indigo-400/90 truncate">{emp.department}</p>
                            <p className="text-[9px] font-mono text-slate-500 truncate">{emp.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                          <span className="text-[9px] font-semibold text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Biometrics Active</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickDemoLogin(emp)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Sign In As Profile</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

        {/* Footer info */}
        <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center space-x-2">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Encrypted YMCA Employee Biometric & Geofence Portal</span>
        </div>

      </div>
    </div>
  );
};
