import React, { useState, useEffect, useRef } from 'react';
import { EmployeeWorkReport, ProofPhoto, Employee } from '../types';
import { getWorkReports, saveWorkReport, deleteWorkReport, getEmployees, verifyEmployeePassword, getDepartments, getCurrentUser, getAttendanceRecords } from '../utils/storage';
import { exportAllWorkReportsToCSV } from '../utils/exportUtils';
import { EmployeeExportModal } from './EmployeeExportModal';
import { 
  FileText, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Filter, 
  Building2, 
  User, 
  Calendar, 
  MapPin, 
  Sparkles, 
  X, 
  Maximize2, 
  Clock, 
  ShieldCheck, 
  Image as ImageIcon,
  Check,
  Send,
  Eye,
  EyeOff,
  Download,
  Navigation,
  Compass,
  Briefcase,
  Key,
  Lock
} from 'lucide-react';

export const WorkReportManager: React.FC = () => {
  const [reports, setReports] = useState<EmployeeWorkReport[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedReportTypeFilter, setSelectedReportTypeFilter] = useState<string>('All');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Submission Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [department, setDepartment] = useState<string>(() => getDepartments()[0] || 'Youth & Community Development');
  const [locationName, setLocationName] = useState<string>('Ga-Rankuwa YMCA Main Center');

  // Profile Password state for Work Report submission
  const [reportPasswordInput, setReportPasswordInput] = useState<string>('');
  const [showReportPassword, setShowReportPassword] = useState<boolean>(false);
  const [isReportPassVerified, setIsReportPassVerified] = useState<boolean>(false);

  // Report Type & Outing state
  const [reportType, setReportType] = useState<'daily_shift' | 'outing_field_work'>('daily_shift');
  const [outingDestination, setOutingDestination] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [outingReason, setOutingReason] = useState<string>('');
  
  // Typing section state
  const [shiftSummary, setShiftSummary] = useState<string>('');
  const [tasksCompleted, setTasksCompleted] = useState<string>('');
  const [challengesEncountered, setChallengesEncountered] = useState<string>('');

  // Proof Photos state (Minimum 5 required)
  const [photos, setPhotos] = useState<ProofPhoto[]>([]);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [reportCameraStream, setReportCameraStream] = useState<MediaStream | null>(null);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);

  // Lightbox / Detail Modal state
  const [viewingReport, setViewingReport] = useState<EmployeeWorkReport | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Ensure camera stream is attached once videoRef mounts
  useEffect(() => {
    if (isCameraActive && reportCameraStream && videoRef.current) {
      videoRef.current.srcObject = reportCameraStream;
      videoRef.current.play().catch((e) => console.warn('Video play error:', e));
    }
  }, [isCameraActive, reportCameraStream]);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('geofence_storage_update', loadData);
    window.addEventListener('storage', loadData);

    const syncInterval = setInterval(() => {
      loadData();
    }, 2000);

    return () => {
      window.removeEventListener('geofence_storage_update', loadData);
      window.removeEventListener('storage', loadData);
      clearInterval(syncInterval);
    };
  }, []);

  const loadData = () => {
    const loadedReports = getWorkReports();
    setReports(loadedReports);
    const loadedEmployees = getEmployees();
    setEmployees(loadedEmployees);
    const currUser = getCurrentUser();
    if (currUser && loadedEmployees.some((e) => e.id === currUser.id)) {
      setSelectedEmployeeId(currUser.id);
      setEmployeeName(currUser.name);
      setDepartment(currUser.department || getDepartments()[0] || 'Youth & Community Development');
      const validPass = currUser.password || `${currUser.name.split(' ')[0]}@2026`;
      setReportPasswordInput(validPass);
      setIsReportPassVerified(true);
    } else if (loadedEmployees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(loadedEmployees[0].id);
      setEmployeeName(loadedEmployees[0].name);
      setDepartment(loadedEmployees[0].department || getDepartments()[0] || 'Youth & Community Development');
    }
  };

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) {
      setEmployeeName(emp.name);
      setDepartment(emp.department || getDepartments()[0] || 'Youth & Community Development');
    }
    setReportPasswordInput('');
    setIsReportPassVerified(false);
  };

  useEffect(() => {
    if (!selectedEmployeeId) {
      setIsReportPassVerified(true);
      return;
    }
    const isValid = verifyEmployeePassword(selectedEmployeeId, reportPasswordInput);
    setIsReportPassVerified(isValid);
  }, [selectedEmployeeId, reportPasswordInput]);

  // Photo handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const newPhoto: ProofPhoto = {
            id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            url: result,
            caption: `Proof photo ${photos.length + 1} - ${file.name.replace(/\.[^/.]+$/, "")}`,
            uploadedAt: new Date().toISOString()
          };
          setPhotos((prev) => [...prev, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startLiveCamera = async () => {
    try {
      setCameraNotice(null);
      setIsCameraActive(true);
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } }
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }
      if (stream) {
        setReportCameraStream(stream);
      }
    } catch (err) {
      console.warn('Front camera failed:', err);
      setIsCameraActive(false);
      setCameraNotice('Live front camera permission restricted. Please upload photo files below.');
      fileInputRef.current?.click();
    }
  };

  const stopLiveCamera = () => {
    if (reportCameraStream) {
      reportCameraStream.getTracks().forEach((track) => track.stop());
      setReportCameraStream(null);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photoUrl = canvas.toDataURL('image/jpeg', 0.85);
      const newPhoto: ProofPhoto = {
        id: 'photo-cam-' + Date.now(),
        url: photoUrl,
        caption: `Live camera snapshot #${photos.length + 1}`,
        uploadedAt: new Date().toISOString()
      };
      setPhotos((prev) => [...prev, newPhoto]);
      showToast(`Snapshot #${photos.length + 1} captured!`);
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const updatePhotoCaption = (photoId: string, caption: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, caption } : p)));
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setReportType('daily_shift');
    setOutingDestination('');
    setArrivalTime('08:30 AM');
    setOutingReason('');
    setShiftSummary('');
    setTasksCompleted('');
    setChallengesEncountered('');
    setPhotos([]);
  };

  const handleCloseModal = () => {
    stopLiveCamera();
    setIsModalOpen(false);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeName.trim()) {
      showToast('Please enter or select an employee name.');
      return;
    }

    if (selectedEmployeeId && !isReportPassVerified) {
      showToast(`Please enter the correct profile security password for ${employeeName}.`);
      return;
    }

    if (reportType === 'outing_field_work') {
      if (!outingDestination.trim()) {
        showToast('Outing Report Requirement: Please enter the destination location visited.');
        return;
      }
      if (!arrivalTime.trim()) {
        showToast('Outing Report Requirement: Please specify your arrival time at the location.');
        return;
      }
      if (!outingReason.trim()) {
        showToast('Outing Report Requirement: Please provide the reason for trip / field assignment.');
        return;
      }
    }

    if (!shiftSummary.trim() || !tasksCompleted.trim()) {
      showToast('Please complete the shift summary and deliverables typing section.');
      return;
    }

    if (photos.length < 5) {
      showToast(`Policy Requirement: Minimum of 5 proof photos required. You have attached ${photos.length}/5.`);
      return;
    }

    const newReport: EmployeeWorkReport = {
      id: 'wr-' + Date.now(),
      employeeId: selectedEmployeeId || 'emp-custom-' + Date.now(),
      employeeName,
      employeeDepartment: department,
      timestamp: new Date().toISOString(),
      reportType,
      outingDestination: reportType === 'outing_field_work' ? outingDestination : undefined,
      arrivalTime: reportType === 'outing_field_work' ? arrivalTime : undefined,
      outingReason: reportType === 'outing_field_work' ? outingReason : undefined,
      locationName: reportType === 'outing_field_work' ? `${outingDestination} (Outing)` : locationName,
      shiftSummary,
      tasksCompleted,
      challengesEncountered,
      photos,
      status: 'submitted'
    };

    saveWorkReport(newReport);
    handleCloseModal();
    showToast(
      reportType === 'outing_field_work'
        ? `Outing Field Report with ${photos.length} proof photos submitted successfully!`
        : `Daily report with ${photos.length} proof photos submitted successfully!`
    );
  };

  const handleDeleteReport = (id: string, name: string) => {
    if (window.confirm(`Delete daily report for ${name}?`)) {
      deleteWorkReport(id);
      if (viewingReport?.id === id) setViewingReport(null);
      showToast('Report deleted.');
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesDept = selectedDeptFilter === 'All' || r.employeeDepartment.toLowerCase() === selectedDeptFilter.toLowerCase();
    const matchesType = 
      selectedReportTypeFilter === 'All' ? true :
      selectedReportTypeFilter === 'outing_field_work' ? r.reportType === 'outing_field_work' :
      r.reportType !== 'outing_field_work';
    return matchesDept && matchesType;
  });

  const handleDownloadWorkReportsCSV = () => {
    if (filteredReports.length === 0) {
      showToast('No work reports found to export.');
      return;
    }
    const dateStr = new Date().toISOString().split('T')[0];
    const deptTag = selectedDeptFilter === 'All' ? 'ALL_DEPTS' : selectedDeptFilter.replace(/\s+/g, '_');
    const filename = `GaRankuwa_YMCA_Work_Reports_${deptTag}_${dateStr}.csv`;
    exportAllWorkReportsToCSV(filteredReports, filename);
    showToast(`Downloaded CSV for ${filteredReports.length} work reports.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Notification */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-indigo-400/30 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="text-sm font-semibold">{toastNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3">
              <span className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <FileText className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Employee Daily Work Reports
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Shift activity documentation & visual photo verification across all Ga-Rankuwa YMCA departments
                </p>
              </div>
            </div>

            {/* Policy Badge */}
            <div className="mt-4 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Mandatory Proof Requirement: Minimum 5 Photos per Daily Shift Report</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-download-work-reports-csv"
              onClick={handleDownloadWorkReportsCSV}
              className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              title="Download CSV spreadsheet of current work reports"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>Download CSV</span>
            </button>

            <button
              id="btn-export-work-reports"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 font-bold text-xs border border-slate-700 shadow-md transition-all cursor-pointer"
              title="Download employee work reports in CSV, Excel, JSON, TXT, or PDF"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>More Formats</span>
            </button>

            <button
              id="btn-open-submit-report"
              onClick={handleOpenModal}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Submit Daily Work Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Department & Report Type Filter Bar */}
      <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Department Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Department:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedDeptFilter('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedDeptFilter === 'All'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                All ({reports.length})
              </button>
              {getDepartments().map((dept) => {
                const count = reports.filter((r) => r.employeeDepartment === dept).length;
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDeptFilter(dept)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedDeptFilter === dept
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {dept} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Report Type Filter */}
          <div className="flex items-center space-x-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Navigation className="w-3.5 h-3.5 text-purple-400" />
              <span>Report Type:</span>
            </span>
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSelectedReportTypeFilter('All')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedReportTypeFilter === 'All'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Reports
              </button>
              <button
                onClick={() => setSelectedReportTypeFilter('daily_shift')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedReportTypeFilter === 'daily_shift'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                In-Center Shift
              </button>
              <button
                onClick={() => setSelectedReportTypeFilter('outing_field_work')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                  selectedReportTypeFilter === 'outing_field_work'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3 text-purple-300" />
                <span>Field Outing ({reports.filter(r => r.reportType === 'outing_field_work').length})</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Reports Feed Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No Reports Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            No work or outing reports found for the selected filter criteria. Submit a new report with minimum 5 proof photos!
          </p>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Report</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const isOuting = report.reportType === 'outing_field_work';
            return (
              <div
                key={report.id}
                className={`bg-slate-900/80 border rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between group ${
                  isOuting 
                    ? 'border-purple-500/30 hover:border-purple-500/60 hover:shadow-purple-500/10' 
                    : 'border-slate-800 hover:border-indigo-500/40 hover:shadow-indigo-500/10'
                }`}
              >
                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full p-0.5 flex-shrink-0 ${
                        isOuting 
                          ? 'bg-gradient-to-tr from-purple-500 to-pink-500' 
                          : 'bg-gradient-to-tr from-indigo-500 to-purple-500'
                      }`}>
                        <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center font-bold text-indigo-300 text-xs uppercase">
                          {report.employeeName.substring(0, 2)}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {report.employeeName}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-indigo-400 font-medium mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{report.employeeDepartment}</span>
                        </div>
                      </div>
                    </div>

                    {isOuting ? (
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1">
                        <Navigation className="w-3 h-3 text-purple-400" />
                        <span>Outing Field Report</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                        <FileText className="w-3 h-3 text-indigo-400" />
                        <span>In-Center Shift</span>
                      </span>
                    )}
                  </div>

                  {/* Date & Location */}
                  <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(report.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300 truncate max-w-[150px]">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="truncate">{report.outingDestination || report.locationName}</span>
                    </div>
                  </div>

                  {/* Outing Specific Card Details Banner */}
                  {isOuting && (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 flex items-center space-x-1">
                          <Compass className="w-3.5 h-3.5 text-purple-400" />
                          <span>Field Outing Details</span>
                        </span>
                        {report.arrivalTime && (
                          <span className="text-[10px] font-bold text-amber-300 flex items-center space-x-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Arrived: {report.arrivalTime}</span>
                          </span>
                        )}
                      </div>
                      {report.outingDestination && (
                        <div>
                          <span className="text-slate-400 text-[10px] block">Destination Visited:</span>
                          <span className="text-white font-semibold block truncate">{report.outingDestination}</span>
                        </div>
                      )}
                      {report.outingReason && (
                        <div>
                          <span className="text-slate-400 text-[10px] block">Reason for Trip:</span>
                          <span className="text-purple-200 text-[11px] line-clamp-1 italic">{report.outingReason}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shift Summary Teaser */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shift Overview</span>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {report.shiftSummary}
                    </p>
                  </div>

                  {/* Photo Proof Preview (5 Photos Grid) */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Proof Photos ({report.photos.length})</span>
                      </span>
                      <span className="text-indigo-400 text-[10px]">Click image to view</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {report.photos.slice(0, 5).map((photo, index) => (
                        <div
                          key={photo.id || index}
                          onClick={() => {
                            setViewingReport(report);
                            setActivePhotoIndex(index);
                          }}
                          className="relative aspect-square rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 cursor-pointer group/img"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action buttons footer */}
                <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setViewingReport(report);
                      setActivePhotoIndex(0);
                    }}
                    className="flex items-center space-x-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Report ({report.photos.length} Proofs)</span>
                  </button>

                  <button
                    onClick={() => handleDeleteReport(report.id, report.employeeName)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= SUBMIT REPORT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Submit Work / Outing Report</h3>
                  <p className="text-xs text-slate-400">Complete typing section & attach a minimum of 5 proof photos</p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitReport} className="p-6 space-y-6">

              {/* REPORT TYPE SELECTOR TABS */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Report Type *
                </label>
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setReportType('daily_shift')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      reportType === 'daily_shift'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-indigo-300" />
                    <span>In-Center Daily Shift</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('outing_field_work')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      reportType === 'outing_field_work'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Navigation className="w-4 h-4 text-purple-300" />
                    <span>Outing / Field Work Trip</span>
                  </button>
                </div>
              </div>

              {/* OUTING SPECIFIC FIELDS SECTION */}
              {reportType === 'outing_field_work' && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-4 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-purple-300">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Outing & Field Work Details (Required for Outside Work)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Outing Location / Destination */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Outing Destination / Location Visited *
                      </label>
                      <input
                        type="text"
                        value={outingDestination}
                        onChange={(e) => setOutingDestination(e.target.value)}
                        placeholder="e.g. Soshanguve Youth Center / Zone 4 Sports Hub"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        required={reportType === 'outing_field_work'}
                      />
                    </div>

                    {/* Arrival Time */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Arrival Time at Outing Site *
                      </label>
                      <input
                        type="text"
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(e.target.value)}
                        placeholder="e.g. 08:30 AM"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        required={reportType === 'outing_field_work'}
                      />
                    </div>

                    {/* Reason for Trip */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Reason for Trip / Outside Work Purpose *
                      </label>
                      <input
                        type="text"
                        value={outingReason}
                        onChange={(e) => setOutingReason(e.target.value)}
                        placeholder="e.g. Off-site community outreach campaign, inter-YMCA youth sports tournament, external training workshop"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                        required={reportType === 'outing_field_work'}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Employee & Department Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Employee Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Employee Name / Roster Select *
                  </label>
                  {employees.length > 0 ? (
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => handleSelectEmployee(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.department})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      placeholder="Enter employee full name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  )}
                </div>

                {/* Profile Password Input */}
                {selectedEmployeeId && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-indigo-300 flex items-center space-x-1">
                        <Key className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Profile Password *</span>
                      </label>
                      {isReportPassVerified ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Required</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showReportPassword ? 'text' : 'password'}
                        value={reportPasswordInput}
                        onChange={(e) => setReportPasswordInput(e.target.value)}
                        placeholder={`Enter password for ${employeeName.split(' ')[0]}...`}
                        className={`w-full bg-slate-950 border rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-slate-200 focus:outline-none font-mono transition-all ${
                          isReportPassVerified
                            ? 'border-emerald-500/50 focus:border-emerald-500'
                            : reportPasswordInput
                            ? 'border-rose-500/50 focus:border-rose-500'
                            : 'border-slate-800 focus:border-indigo-500'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowReportPassword(!showReportPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showReportPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Department Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Department *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  >
                    {getDepartments().map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Home Facility Location Name */}
                {reportType === 'daily_shift' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      YMCA Work Facility / Site *
                    </label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                )}
              </div>

              {/* TYPING SECTION */}
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <FileText className="w-4 h-4" />
                  <span>Report Typing Section</span>
                </div>

                {/* Shift Overview */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    1. Shift Overview / Activity Summary *
                  </label>
                  <textarea
                    rows={3}
                    value={shiftSummary}
                    onChange={(e) => setShiftSummary(e.target.value)}
                    placeholder="Provide a general summary of activities completed during your shift or outing..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                    required
                  />
                </div>

                {/* Tasks Completed */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    2. Tasks & Deliverables Completed (Bullet Points) *
                  </label>
                  <textarea
                    rows={3}
                    value={tasksCompleted}
                    onChange={(e) => setTasksCompleted(e.target.value)}
                    placeholder="• Opened facility & checked safety equipment&#10;• Conducted youth training session for 25 attendees&#10;• Completed administrative filing log"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                    required
                  />
                </div>

                {/* Challenges / Blockers */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    3. Challenges / Blockers Encountered (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={challengesEncountered}
                    onChange={(e) => setChallengesEncountered(e.target.value)}
                    placeholder="Any equipment delays, internet issues, or facility items requiring maintenance..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* PROOF PHOTOS SECTION (MINIMUM 5 REQUIRED) */}
              <div className="space-y-4 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span>Upload Proof Photos (Minimum 5 Required)</span>
                  </div>

                  <div className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 ${
                    photos.length >= 5 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {photos.length >= 5 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>{photos.length} / 5 Proof Photos</span>
                  </div>
                </div>

                {/* Policy Notice Banner */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start space-x-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Proof Policy Requirement: </span>
                    <span>
                      Each daily shift or field outing report must be backed by at least 5 clear proof photos (e.g., location selfies, venue setups, attendance logs, team activities).
                    </span>
                  </div>
                </div>

                {/* Photo Upload & Camera Action Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Upload Proof Photos from File</span>
                  </button>

                  <button
                    type="button"
                    onClick={isCameraActive ? stopLiveCamera : startLiveCamera}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-purple-400" />
                    <span>{isCameraActive ? 'Close Live Camera' : 'Take Live Camera Photo'}</span>
                  </button>
                </div>

                {/* Live Camera Feed if Active */}
                {isCameraActive && (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-purple-500/40 aspect-video flex items-center justify-center">
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
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={captureCameraPhoto}
                      className="absolute bottom-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Snap Proof Photo #{photos.length + 1}</span>
                    </button>
                  </div>
                )}

                {/* Camera Warning Notice */}
                {cameraNotice && (
                  <p className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    {cameraNotice}
                  </p>
                )}

                {/* Photos List Preview Grid */}
                {photos.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-semibold text-slate-300">
                      Attached Photos Preview ({photos.length} total):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {photos.map((photo, index) => (
                        <div
                          key={photo.id}
                          className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 flex items-start space-x-3 relative group"
                        >
                          <img
                            src={photo.url}
                            alt={`Proof ${index + 1}`}
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-slate-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                              Photo #{index + 1} Proof
                            </span>
                            <input
                              type="text"
                              value={photo.caption}
                              onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                              placeholder="Enter photo caption..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Footer Button */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={photos.length < 5 || !shiftSummary.trim() || !tasksCompleted.trim()}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
                    photos.length >= 5 && shiftSummary.trim() && tasksCompleted.trim()
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25 hover:scale-105'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {photos.length < 5
                      ? `Attach ${5 - photos.length} More Photo(s) to Submit`
                      : reportType === 'outing_field_work'
                      ? `Submit Outing Report (${photos.length} Proof Photos)`
                      : `Submit Daily Report (${photos.length} Proof Photos)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX / FULL REPORT VIEW MODAL ================= */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                    {viewingReport.employeeDepartment}
                  </span>
                  {viewingReport.reportType === 'outing_field_work' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30 flex items-center space-x-1">
                      <Navigation className="w-3 h-3 text-purple-400" />
                      <span>Field Outing</span>
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  {viewingReport.reportType === 'outing_field_work' ? 'Outing Field Work Report' : 'Daily Work Report'} - {viewingReport.employeeName}
                </h3>
              </div>

              <button
                onClick={() => setViewingReport(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* Meta information bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Timestamp</span>
                  <span className="text-slate-200 font-semibold">{new Date(viewingReport.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Location</span>
                  <span className="text-slate-200 font-semibold">{viewingReport.locationName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Proof Status</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{viewingReport.photos.length} Verified Photos Attached</span>
                  </span>
                </div>
              </div>

              {/* OUTING DETAILS BANNER IN LIGHTBOX IF OUTING REPORT */}
              {viewingReport.reportType === 'outing_field_work' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-purple-300">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Field Outing & Trip Record Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Destination Visited</span>
                      <span className="text-white font-bold text-sm">{viewingReport.outingDestination || viewingReport.locationName}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Arrival Time</span>
                      <span className="text-amber-300 font-bold text-sm flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{viewingReport.arrivalTime || 'Not specified'}</span>
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Reason for Trip / Purpose</span>
                      <p className="text-purple-100 font-medium leading-relaxed mt-0.5">{viewingReport.outingReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Typing Section Details */}
              <div className="space-y-4">
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                  <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Shift / Trip Summary</h5>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{viewingReport.shiftSummary}</p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                  <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Tasks & Deliverables Completed</h5>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-line">{viewingReport.tasksCompleted}</p>
                </div>

                {viewingReport.challengesEncountered && (
                  <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                    <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Challenges / Notes</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">{viewingReport.challengesEncountered}</p>
                  </div>
                )}
              </div>

              {/* Photos Gallery Lightbox Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Work Proof Photo Gallery ({viewingReport.photos.length} Photos)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Viewing photo {activePhotoIndex + 1} of {viewingReport.photos.length}
                  </span>
                </div>

                {/* Main active photo display */}
                {viewingReport.photos[activePhotoIndex] && (
                  <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                    <img
                      src={viewingReport.photos[activePhotoIndex].url}
                      alt={viewingReport.photos[activePhotoIndex].caption}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />

                    {/* Caption Overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-md p-3 border-t border-slate-800 text-center">
                      <p className="text-xs font-semibold text-white">
                        {viewingReport.photos[activePhotoIndex].caption}
                      </p>
                    </div>
                  </div>
                )}

                {/* Thumbnail strip */}
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 pt-2">
                  {viewingReport.photos.map((photo, idx) => (
                    <button
                      key={photo.id || idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activePhotoIndex === idx
                          ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Verified Ga-Rankuwa YMCA Staff Proof Record
              </span>

              <button
                onClick={() => setViewingReport(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Reports Modal */}
      <EmployeeExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        employees={employees}
        attendanceRecords={getAttendanceRecords()}
        workReports={reports}
        initialEmployeeId="all"
      />

    </div>
  );
};
