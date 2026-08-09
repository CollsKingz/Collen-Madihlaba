import React, { useState, useEffect, useRef } from 'react';
import { Employee } from '../types';
import { 
  getEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee, 
  saveEmployees, 
  resetEmployeesToDefaults, 
  updateEmployeePassword, 
  getDepartments,
  getAttendanceRecords,
  getWorkReports,
  downloadFullSystemBackup,
  restoreFullSystemBackup,
  updateEmployeeElevatedPrivileges
} from '../utils/storage';
import { DepartmentManagerModal } from './DepartmentManagerModal';
import { EmployeeExportModal } from './EmployeeExportModal';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Search, 
  Check, 
  X, 
  Camera, 
  AlertTriangle,
  Building2,
  Mail,
  Briefcase,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Settings,
  Download
} from 'lucide-react';

export const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>(() => getDepartments());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Modal controls
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportEmpId, setExportEmpId] = useState<string>('all');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Quick Password Modal State
  const [passModalEmployee, setPassModalEmployee] = useState<Employee | null>(null);
  const [newQuickPassword, setNewQuickPassword] = useState('');
  const [showQuickPass, setShowQuickPass] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: 'Youth & Community Development',
    avatar: '',
    password: '',
  });
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Camera capture state for new/edited profile photo
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Toast notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Attach camera stream whenever videoRef mounts or cameraStream updates
  useEffect(() => {
    if (isCapturingCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => console.warn('Video play error:', err));
    }
  }, [isCapturingCamera, cameraStream]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = () => {
    setEmployees(getEmployees());
    setDepartmentsList(getDepartments());
  };

  useEffect(() => {
    loadData();
    const handleStorageUpdate = () => loadData();
    const handleDeptUpdate = () => setDepartmentsList(getDepartments());
    window.addEventListener('geofence_storage_update', handleStorageUpdate);
    window.addEventListener('geofence_departments_update', handleDeptUpdate);
    return () => {
      window.removeEventListener('geofence_storage_update', handleStorageUpdate);
      window.removeEventListener('geofence_departments_update', handleDeptUpdate);
    };
  }, []);

  // Merge stored departments with any custom employee department strings
  const allDepartments = Array.from(
    new Set([...departmentsList, ...employees.map(e => e.department).filter(Boolean)])
  );

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      role: '',
      department: 'Youth & Community Development',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      password: '',
    });
    setShowFormPassword(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      role: emp.role,
      department: emp.department,
      avatar: emp.avatar,
      password: emp.password || `${emp.name.split(' ')[0]}@2026`,
    });
    setShowFormPassword(false);
    setIsAddModalOpen(true);
  };

  const openQuickPassModal = (emp: Employee) => {
    setPassModalEmployee(emp);
    setNewQuickPassword(emp.password || `${emp.name.split(' ')[0]}@2026`);
    setShowQuickPass(false);
  };

  const handleStartCamera = async () => {
    try {
      setIsCapturingCamera(true);
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
      if (stream) {
        setCameraStream(stream);
      }
    } catch (err) {
      console.warn('Front camera access denied or unavailable:', err);
      setIsCapturingCamera(false);
      const fileInput = document.getElementById('avatar-file-input');
      if (fileInput) {
        fileInput.click();
      }
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const photoUrl = canvas.toDataURL('image/jpeg', 0.85);
      setFormData(prev => ({ ...prev, avatar: photoUrl }));
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCapturingCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData(prev => ({ ...prev, avatar: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim()) {
      alert('Please fill in employee name and role.');
      return;
    }

    const assignedPassword = formData.password.trim() || `${formData.name.trim().split(' ')[0]}@2026`;

    if (editingEmployee) {
      const updated: Employee = {
        ...editingEmployee,
        name: formData.name.trim(),
        email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@garankuwaymca.org.za`,
        role: formData.role.trim(),
        department: formData.department.trim(),
        avatar: formData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        password: assignedPassword,
      };
      updateEmployee(updated);
      showToast(`Updated profile & password for ${updated.name}`);
    } else {
      const newEmp: Employee = {
        id: `ymca-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@garankuwaymca.org.za`,
        role: formData.role.trim(),
        department: formData.department.trim(),
        avatar: formData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        password: assignedPassword,
      };
      addEmployee(newEmp);
      showToast(`Successfully added profile & password for ${newEmp.name}`);
    }

    stopCamera();
    setIsAddModalOpen(false);
    loadData();
  };

  const handleSaveQuickPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passModalEmployee) return;
    if (!newQuickPassword.trim()) {
      alert('Password cannot be blank.');
      return;
    }

    updateEmployeePassword(passModalEmployee.id, newQuickPassword.trim());
    showToast(`Security password updated for ${passModalEmployee.name}!`);
    setPassModalEmployee(null);
    loadData();
  };

  const handleRestoreDefaultStaff = () => {
    if (window.confirm('Restore default staff profiles (Collen, Tebogo, Sibusiso)? All registered staff profiles will be safely preserved.')) {
      resetEmployeesToDefaults();
      loadData();
      showToast('Default staff profiles refreshed! All registered profiles preserved.');
    }
  };

  const handleEraseConfirm = () => {
    if (!deletingEmployee) return;
    deleteEmployee(deletingEmployee.id);
    showToast(`Erased employee profile for ${deletingEmployee.name}`);
    setDeletingEmployee(null);
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-bounce">
          <UserCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-pink-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Ga-Rankuwa YMCA Staff Directory
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  {employees.length} Profiles Registered
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Manage staff profiles, add new personnel, or erase inactive profiles for biometric check-in.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-export-reports-all"
              onClick={() => {
                setExportEmpId('all');
                setIsExportModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 font-semibold text-xs border border-emerald-500/30 shadow-md transition-all cursor-pointer"
              title="Download Employee Reports in CSV, Excel, JSON, TXT, or PDF"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Reports</span>
            </button>

            <button
              id="btn-manage-departments-modal"
              onClick={() => setIsDeptModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-semibold text-xs border border-indigo-500/30 shadow-md transition-all cursor-pointer"
              title="Manager Department Editor: Add, Edit, Rename or Delete Departments"
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Manage Departments</span>
            </button>

            <button
              id="btn-full-backup-system"
              onClick={() => downloadFullSystemBackup('Center Manager')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs shadow-md transition-all cursor-pointer"
              title="Backup entire database: Staff, Attendance Logs, Work Reports, Geofences, Meetings"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Full System Backup (.JSON)</span>
            </button>

            <label className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 font-semibold text-xs shadow-md transition-all cursor-pointer">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Restore Backup File</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const content = event.target?.result as string;
                    if (content) {
                      const res = restoreFullSystemBackup(content);
                      alert(res.message);
                      if (res.success) {
                        setEmployees(getEmployees());
                      }
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>

            <button
              id="btn-restore-default-staff"
              onClick={handleRestoreDefaultStaff}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-semibold text-xs border border-indigo-500/30 shadow-md transition-all cursor-pointer"
              title="Ensure default staff profiles exist without removing registered staff"
            >
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>Sync & Restore Default Staff</span>
            </button>

            <button
              id="btn-add-employee-modal"
              onClick={openAddModal}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all text-sm transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            id="input-search-employees"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employees by name, role, email or ID..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div>
          <select
            id="select-dept-filter"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
          >
            <option value="all">All Departments ({employees.length})</option>
            {allDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-300">No Employee Profiles Found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchTerm || selectedDept !== 'all'
              ? 'Try adjusting your search criteria or department filter.'
              : 'Click "Add New Employee" to register staff for Ga-Rankuwa YMCA.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              id={`emp-card-${emp.id}`}
              className="group bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/50 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:shadow-indigo-500/10 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-all pointer-events-none" />

              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/30 group-hover:border-indigo-400 shadow-md transition-all"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {emp.name}
                      </h3>
                      <span className="text-xs font-mono text-indigo-400/90 font-medium">
                        ID: {emp.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span className="font-medium text-slate-200">{emp.role}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>{emp.department}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400 truncate">
                    <Mail className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex flex-col space-y-1.5 pt-1 text-[11px]">
                    <div className="flex items-center justify-between text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold">Facial Biometrics Enrolled</span>
                      </div>
                      <span className="text-[10px] font-mono">Verified ✓</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        <Lock className="w-3 h-3" />
                        <span className="font-medium">Password Protected</span>
                      </div>
                      <span className="text-slate-500 font-mono">
                        {emp.password ? `••••••••` : 'Set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons: Export, Edit, Password & Erase */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 grid grid-cols-4 gap-1">
                <button
                  id={`btn-export-${emp.id}`}
                  onClick={() => {
                    setExportEmpId(emp.id);
                    setIsExportModalOpen(true);
                  }}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 text-[11px] font-medium border border-emerald-500/30 transition-all cursor-pointer"
                  title="Export reports in all formats (CSV, Excel, JSON, TXT, PDF)"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>Export</span>
                </button>

                <button
                  id={`btn-edit-${emp.id}`}
                  onClick={() => openEditModal(emp)}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700/50 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-indigo-400" />
                  <span>Edit</span>
                </button>

                <button
                  id={`btn-pass-${emp.id}`}
                  onClick={() => openQuickPassModal(emp)}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-[11px] font-medium border border-indigo-500/30 transition-all cursor-pointer"
                  title="Manage Employee Profile Password"
                >
                  <Key className="w-3 h-3 text-indigo-400" />
                  <span>Pass</span>
                </button>

                <button
                  id={`btn-erase-${emp.id}`}
                  onClick={() => setDeletingEmployee(emp)}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-[11px] font-medium border border-rose-500/30 transition-all cursor-pointer"
                  title="Erase Employee Profile"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Erase</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingEmployee ? 'Edit Employee Profile' : 'Register Ga-Rankuwa YMCA Employee'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Provide complete staff profile details for face verification.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setIsAddModalOpen(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Photo Preview / Capture */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Profile Photo / Biometric Reference
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <div className="relative">
                    <img
                      src={formData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt="Avatar Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-md"
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    {isCapturingCamera ? (
                      <div className="space-y-2">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          onLoadedMetadata={() => {
                            if (videoRef.current) {
                              videoRef.current.play().catch(() => {});
                            }
                          }}
                          className="w-full h-36 rounded-xl bg-black object-cover"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCapturePhoto}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center space-x-1"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Snap Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={handleStartCamera}
                          className="w-full py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium text-xs flex items-center justify-center space-x-1.5"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Take Live Photo with Camera</span>
                        </button>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                          <div className="w-full py-1.5 px-3 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-center text-xs font-medium">
                            Upload Photo File
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kagiso Motsepe"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. k.motsepe@garankuwaymca.org.za"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Role & Elevated Privilege */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Elevated System Access Privilege Level
                </label>
                <select
                  value={
                    ['manager', 'super_admin', 'it_admin', 'board_member', 'standard'].includes(formData.role)
                      ? formData.role
                      : 'custom'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') {
                      setFormData({ ...formData, role: val });
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-2 cursor-pointer font-medium"
                >
                  <option value="standard">Standard Staff Member (Check-in & Reports)</option>
                  <option value="manager font-bold">Center Manager / Supervisor (Full Approvals & Staff Reports Download)</option>
                  <option value="board_member">YMCA Board Member (Executive Oversight & Governance)</option>
                  <option value="it_admin">IT Lead & Technical Security Officer</option>
                  <option value="super_admin">Super Administrator (Full System Override)</option>
                  <option value="custom">Custom Job Title / Custom Role...</option>
                </select>

                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Job Title Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Youth Officer / Field Coordinator / Manager"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                >
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Profile Password */}
              <div className="space-y-1 bg-slate-950/70 p-3 rounded-xl border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-indigo-300 flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Profile Security Password *</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Min 4 chars</span>
                </div>
                <div className="relative">
                  <input
                    id="input-employee-password"
                    type={showFormPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter initial security password"
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Employees will enter this profile password when clocking in or submitting work reports.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-employee-profile"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-indigo-500/25 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEmployee ? 'Update Profile' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ERASE CONFIRMATION MODAL */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center relative overflow-hidden">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Erase Employee Profile?</h3>
              <p className="text-xs text-slate-400 mt-2">
                Are you sure you want to erase <strong className="text-white">{deletingEmployee.name}</strong> ({deletingEmployee.role}) from the Ga-Rankuwa YMCA personnel directory?
              </p>
              <div className="mt-3 bg-rose-950/40 border border-rose-500/20 rounded-xl p-3 text-left text-[11px] text-rose-300 space-y-1">
                <p>• Employee ID: {deletingEmployee.id}</p>
                <p>• Department: {deletingEmployee.department}</p>
                <p>• The profile will be permanently deleted from biometric verification lists.</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeletingEmployee(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
              >
                Cancel Keep Profile
              </button>
              <button
                id="btn-confirm-erase"
                onClick={handleEraseConfirm}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-medium shadow-lg shadow-rose-500/25 flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Erase</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PASSWORD MODAL */}
      {passModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Set Profile Security Password</h3>
                  <p className="text-xs text-slate-400">{passModalEmployee.name} ({passModalEmployee.id})</p>
                </div>
              </div>
              <button
                onClick={() => setPassModalEmployee(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPassword} className="space-y-4">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    New Security Password *
                  </label>
                  <span className="text-[11px] text-indigo-400 font-mono">Profile Security</span>
                </div>
                <div className="relative">
                  <input
                    id="input-quick-password"
                    type={showQuickPass ? 'text' : 'password'}
                    required
                    value={newQuickPassword}
                    onChange={(e) => setNewQuickPassword(e.target.value)}
                    placeholder="Enter new profile password..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickPass(!showQuickPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showQuickPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Must be at least 4 characters long. Required during attendance clock-in and work report submissions.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPassModalEmployee(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-quick-pass"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium shadow-lg shadow-indigo-500/25 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Manager Modal for Manager Editing */}
      <DepartmentManagerModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onDepartmentsUpdated={loadData}
      />

      {/* Employee Report Export Modal (CSV, Excel, JSON, TXT, PDF) */}
      <EmployeeExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        employees={employees}
        attendanceRecords={getAttendanceRecords()}
        workReports={getWorkReports()}
        initialEmployeeId={exportEmpId}
      />

    </div>
  );
};
