import React, { useState, useEffect } from 'react';
import { Employee, PrivilegeRequest, ApprovalStatus, UserRole } from '../types';
import { 
  getPrivilegeRequests, 
  createPrivilegeRequest, 
  updateManagerApproval, 
  updateITApproval, 
  overrideRequestStatus, 
  getEmployees 
} from '../utils/storage';
import { YMCALogo } from './YMCALogo';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  UserCheck, 
  Cpu, 
  Crown, 
  User, 
  ArrowRight, 
  FileText, 
  History, 
  MessageSquare, 
  Check, 
  Lock, 
  Unlock,
  ChevronRight,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { PINChangeSection } from './PINChangeSection';

interface ApprovalsDashboardProps {
  currentUser: Employee;
}

export const ApprovalsDashboard: React.FC<ApprovalsDashboardProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<PrivilegeRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeTab, setActiveTab] = useState<'manager_queue' | 'it_queue' | 'my_requests' | 'audit_log' | 'change_pin'>('manager_queue');
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New Request Form Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [resourceName, setResourceName] = useState('Manager Attendance Dashboard & Staff Shift Approvals');
  const [requestedRole, setRequestedRole] = useState<string>('manager');
  const [reason, setReason] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');

  // Decision Modal State
  const [selectedRequest, setSelectedRequest] = useState<PrivilegeRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<'manager_approve' | 'manager_reject' | 'it_approve' | 'it_reject' | 'override' | null>(null);
  const [decisionComments, setDecisionComments] = useState('');
  const [overrideStatus, setOverrideStatus] = useState<ApprovalStatus>('approved');

  // History Detail Modal State
  const [detailRequest, setDetailRequest] = useState<PrivilegeRequest | null>(null);

  const loadData = () => {
    const reqs = getPrivilegeRequests();
    setRequests(reqs);
    const emps = getEmployees();
    setEmployees(emps);
  };

  useEffect(() => {
    loadData();

    // Default tab based on user role
    if (currentUser.role === 'super_admin' || currentUser.role === 'it_admin') {
      setActiveTab('it_queue');
    } else if (currentUser.role === 'manager') {
      setActiveTab('manager_queue');
    } else {
      setActiveTab('my_requests');
    }

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('geofence_storage_update', handleStorageChange);
    return () => window.removeEventListener('geofence_storage_update', handleStorageChange);
  }, [currentUser]);

  // Role detection helpers
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isITAdmin = currentUser.role === 'it_admin' || isSuperAdmin;
  const isManager = currentUser.role === 'manager' || isSuperAdmin;

  // Managers in system for user to select
  const availableManagers = employees.filter((e) => e.role === 'manager' || e.role === 'super_admin');

  // Queue counts
  const pendingManagerRequests = requests.filter((r) => r.status === 'pending_manager');
  const pendingITRequests = requests.filter((r) => r.status === 'pending_it');
  const myRequestsList = requests.filter((r) => r.requesterId === currentUser.id);

  // Filtered lists
  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const mgr = employees.find((e) => e.id === selectedManagerId) || availableManagers[0];
    const mgrName = mgr ? mgr.name : 'Collen Madihlaba (IT Lead)';
    const mgrId = mgr ? mgr.id : 'emp-100';

    createPrivilegeRequest(
      currentUser,
      resourceName,
      requestedRole,
      reason,
      mgrId,
      mgrName
    );

    setShowNewModal(false);
    setReason('');
    setActiveTab('my_requests');
    loadData();
  };

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !decisionAction) return;

    if (decisionAction === 'manager_approve') {
      updateManagerApproval(selectedRequest.id, 'approved', decisionComments, currentUser);
    } else if (decisionAction === 'manager_reject') {
      updateManagerApproval(selectedRequest.id, 'rejected', decisionComments, currentUser);
    } else if (decisionAction === 'it_approve') {
      updateITApproval(selectedRequest.id, 'approved', decisionComments, currentUser);
    } else if (decisionAction === 'it_reject') {
      updateITApproval(selectedRequest.id, 'rejected', decisionComments, currentUser);
    } else if (decisionAction === 'override') {
      overrideRequestStatus(selectedRequest.id, overrideStatus, decisionComments, currentUser);
    }

    setSelectedRequest(null);
    setDecisionAction(null);
    setDecisionComments('');
    loadData();
  };

  const getRoleBadge = (roleStr: string) => {
    switch (roleStr) {
      case 'super_admin':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-300 inline-flex items-center space-x-1">
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span>Super Admin</span>
          </span>
        );
      case 'it_admin':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-500/20 border border-blue-500/40 text-blue-300 inline-flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>IT Admin</span>
          </span>
        );
      case 'manager':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 inline-flex items-center space-x-1">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Center Manager</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300 inline-flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Standard User</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'pending_manager':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 border border-amber-500/40 text-amber-300 inline-flex items-center space-x-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Level 1: Pending Manager</span>
          </span>
        );
      case 'pending_it':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/15 border border-blue-500/40 text-blue-300 inline-flex items-center space-x-1.5 shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Level 2: Pending IT Provisioning</span>
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 inline-flex items-center space-x-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fully Approved & Provisioned</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/15 border border-rose-500/40 text-rose-300 inline-flex items-center space-x-1.5 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Authorization Rejected</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-4">
            <YMCALogo size="lg" />
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-red-600/20 text-red-300 border border-red-500/30">
                  Security & Access Control
                </span>
                <span className="text-xs text-slate-400 font-mono">• Multi-Tier Hierarchy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Role Authorization & Approval Workflow
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
                Multi-level authorization architecture: Level 1 (Manager Approval) → Level 2 (IT Technical Provisioning) → System Privilege Grant.
              </p>
            </div>
          </div>

          {/* Current User Role Identity Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 min-w-[280px] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium border-b border-slate-800 pb-2">
              <span>Current Session Identity</span>
              {getRoleBadge(currentUser.role)}
            </div>
            <div className="flex items-center space-x-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-700"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{currentUser.name}</h4>
                <p className="text-[11px] text-slate-400 truncate">{currentUser.department}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Tier Flow Visual Stepper */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-3 relative z-10">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold">1</div>
            <div>
              <h5 className="text-xs font-bold text-white">1. User Request</h5>
              <p className="text-[10px] text-slate-400">Staff submits access application</p>
            </div>
          </div>

          <div className="bg-indigo-950/40 rounded-xl p-3 border border-indigo-800/40 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <h5 className="text-xs font-bold text-indigo-200">2. Level 1: Manager</h5>
              <p className="text-[10px] text-indigo-300/80">Designated manager authorizes</p>
            </div>
          </div>

          <div className="bg-blue-950/40 rounded-xl p-3 border border-blue-800/40 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <h5 className="text-xs font-bold text-blue-200">3. Level 2: IT Admin</h5>
              <p className="text-[10px] text-blue-300/80">Technical provisioning pool</p>
            </div>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-800/40 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">4</div>
            <div>
              <h5 className="text-xs font-bold text-emerald-200">4. Granted Status</h5>
              <p className="text-[10px] text-emerald-300/80">Permissions provisioned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Level 1: Manager Queue */}
          <button
            onClick={() => setActiveTab('manager_queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'manager_queue'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Level 1: Manager Queue</span>
            {pendingManagerRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                {pendingManagerRequests.length}
              </span>
            )}
          </button>

          {/* Level 2: IT Provisioning Queue */}
          <button
            onClick={() => setActiveTab('it_queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'it_queue'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Level 2: IT Provisioning Queue</span>
            {pendingITRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-400 text-slate-950 text-[10px] font-black">
                {pendingITRequests.length}
              </span>
            )}
          </button>

          {/* My Submitted Requests */}
          <button
            onClick={() => setActiveTab('my_requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'my_requests'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>My Submitted Requests</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
              {myRequestsList.length}
            </span>
          </button>

          {/* Complete Audit Log */}
          <button
            onClick={() => setActiveTab('audit_log')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'audit_log'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Audit Trail Log</span>
          </button>

          {/* Change Authorization PIN Tab */}
          <button
            onClick={() => setActiveTab('change_pin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'change_pin'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-900 text-indigo-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Change Authorization PIN</span>
          </button>
        </div>

        {/* Primary Action Button: Request Elevated Privilege */}
        <button
          onClick={() => {
            setSelectedManagerId(availableManagers[0]?.id || 'emp-100');
            setShowNewModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold flex items-center space-x-2 shadow-lg shadow-red-600/25 transition-all cursor-pointer transform hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Apply For Elevated Privilege</span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search request ID, requester name, or resource..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-semibold">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Request Statuses</option>
            <option value="pending_manager">Level 1: Pending Manager</option>
            <option value="pending_it">Level 2: Pending IT</option>
            <option value="approved">Fully Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* TAB CONTENTS */}

      {/* TAB 1: MANAGER QUEUE (LEVEL 1) */}
      {activeTab === 'manager_queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Level 1: Manager Authorization Queue</h2>
            </div>
            {!isManager && (
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full font-semibold">
                View Mode (Manager Authorization privileges required for action)
              </span>
            )}
          </div>

          {pendingManagerRequests.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
              <h3 className="text-base font-bold text-white">No Pending Level 1 Requests</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All submitted privilege applications have been authorized or reviewed by managers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingManagerRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-5 shadow-lg space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
                        ID: {req.id}
                      </span>
                      <h3 className="text-base font-extrabold text-white mt-0.5">{req.resourceName}</h3>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Requester:</span>
                      <span className="font-bold text-white">{req.requesterName} ({req.requesterDepartment})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Designated Manager:</span>
                      <span className="font-bold text-indigo-300">{req.managerName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Target Role Privilege:</span>
                      {getRoleBadge(req.requestedRole)}
                    </div>
                    <div className="pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-400 block mb-1">Business Justification / Reason:</span>
                      <p className="text-slate-200 italic font-medium bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        "{req.reason}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setDetailRequest(req)}
                      className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 underline cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>View Audit Timeline</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setDecisionAction('manager_reject');
                          setDecisionComments('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setDecisionAction('manager_approve');
                          setDecisionComments('');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authorize (Pass to Level 2 IT)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IT PROVISIONING QUEUE (LEVEL 2) */}
      {activeTab === 'it_queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Level 2: IT Technical Provisioning Pool</h2>
            </div>
            {!isITAdmin && (
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full font-semibold">
                View Mode (IT Administrator privileges required for technical provisioning)
              </span>
            )}
          </div>

          {pendingITRequests.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-blue-400 mx-auto opacity-80" />
              <h3 className="text-base font-bold text-white">No Level 2 Requests Awaiting Provisioning</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All manager-authorized requests have been technical provisioned by the IT Security team.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingITRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-900 border border-blue-500/40 hover:border-blue-500/80 rounded-2xl p-5 shadow-lg space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                        ID: {req.id}
                      </span>
                      <h3 className="text-base font-extrabold text-white mt-0.5">{req.resourceName}</h3>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  {/* Level 1 Manager Decision Banner */}
                  {req.managerDecision && (
                    <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Level 1 Manager Approved: {req.managerDecision.decidedBy}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] italic">
                        "{req.managerDecision.comments || 'Manager approved authorization.'}"
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Requester:</span>
                      <span className="font-bold text-white">{req.requesterName} ({req.requesterDepartment})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Role Privilege Target:</span>
                      {getRoleBadge(req.requestedRole)}
                    </div>
                    <div className="pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-400 block mb-1">Requester Justification:</span>
                      <p className="text-slate-300 font-medium">"{req.reason}"</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setDetailRequest(req)}
                      className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 underline cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Audit History</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setDecisionAction('it_reject');
                          setDecisionComments('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setDecisionAction('it_approve');
                          setDecisionComments('');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Provision Access & Grant</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY SUBMITTED REQUESTS */}
      {activeTab === 'my_requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">My Submitted Authorization Applications</h2>
            <span className="text-xs text-slate-400">Total: {myRequestsList.length} Requests</span>
          </div>

          {myRequestsList.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-white">No Applications Submitted Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You currently have standard staff access. Need elevated permissions or resource authorization? Submit a privilege application.
              </p>
              <button
                onClick={() => {
                  setSelectedManagerId(availableManagers[0]?.id || 'emp-100');
                  setShowNewModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Apply For Elevated Privilege
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequestsList.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-indigo-400 font-bold">#{req.id}</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(req.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-white mt-0.5">{req.resourceName}</h3>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Privilege</span>
                      <div className="mt-1">{getRoleBadge(req.requestedRole)}</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Designated Level 1 Manager</span>
                      <span className="font-bold text-white block mt-1">{req.managerName}</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Business Reason</span>
                      <p className="text-slate-300 truncate mt-1">"{req.reason}"</p>
                    </div>
                  </div>

                  {/* Level Decisions Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Level 1 status */}
                    <div className={`p-3 rounded-xl border ${req.managerDecision ? 'bg-indigo-950/40 border-indigo-500/30' : 'bg-slate-950/60 border-slate-800'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">Level 1: Manager Authorization</span>
                        {req.managerDecision ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.managerDecision.decision === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {req.managerDecision.decision.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-bold">PENDING</span>
                        )}
                      </div>
                      {req.managerDecision && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          "{req.managerDecision.comments || 'No comment provided'}" — {req.managerDecision.decidedBy}
                        </p>
                      )}
                    </div>

                    {/* Level 2 status */}
                    <div className={`p-3 rounded-xl border ${req.itDecision ? 'bg-blue-950/40 border-blue-500/30' : 'bg-slate-950/60 border-slate-800'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">Level 2: IT Provisioning</span>
                        {req.itDecision ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.itDecision.decision === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {req.itDecision.decision.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold">
                            {req.status === 'pending_it' ? 'AWAITING IT' : 'N/A'}
                          </span>
                        )}
                      </div>
                      {req.itDecision && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          "{req.itDecision.comments || 'Provisioned by IT'}" — {req.itDecision.decidedBy}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setDetailRequest(req)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-semibold cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>View Detailed Audit Log Timeline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMPLETE AUDIT LOG TABLE */}
      {activeTab === 'audit_log' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">System Role & Privilege Audit Trail</h2>
              <p className="text-xs text-slate-400">Recording all requester entries, manager authorization events, IT provisioning, and status changes.</p>
            </div>
            {isSuperAdmin && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-xs font-extrabold flex items-center space-x-1">
                <Crown className="w-3.5 h-3.5" />
                <span>Super Admin Override Mode Active</span>
              </span>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Req ID & Date</th>
                    <th className="py-3.5 px-4">Requester</th>
                    <th className="py-3.5 px-4">Requested Resource / Role</th>
                    <th className="py-3.5 px-4">Level 1: Manager</th>
                    <th className="py-3.5 px-4">Level 2: IT Admin</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Audit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-4 font-mono">
                        <span className="font-bold text-indigo-400 block">#{req.id}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-white block">{req.requesterName}</span>
                        <span className="text-[10px] text-slate-400">{req.requesterDepartment}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-200 block truncate max-w-[200px]" title={req.resourceName}>
                          {req.resourceName}
                        </span>
                        <div className="mt-1">{getRoleBadge(req.requestedRole)}</div>
                      </td>

                      <td className="py-4 px-4">
                        {req.managerDecision ? (
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.managerDecision.decision === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                              {req.managerDecision.decision.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[120px]" title={req.managerDecision.decidedBy}>
                              {req.managerDecision.decidedBy}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-400 text-[10px] font-bold">Pending Manager</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {req.itDecision ? (
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.itDecision.decision === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                              {req.itDecision.decision.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[120px]" title={req.itDecision.decidedBy}>
                              {req.itDecision.decidedBy}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-bold">
                            {req.status === 'pending_it' ? 'Pending IT' : 'N/A'}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(req.status)}
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setDecisionAction('override');
                              setOverrideStatus('approved');
                              setDecisionComments('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 border border-purple-500/40 text-[11px] font-bold transition-all cursor-pointer"
                            title="Super Admin Direct Status Override"
                          >
                            Override
                          </button>
                        )}
                        <button
                          onClick={() => setDetailRequest(req)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SELF-SERVICE PIN CHANGE */}
      {activeTab === 'change_pin' && (
        <PINChangeSection defaultUserName={currentUser.name} />
      )}

      {/* NEW REQUEST MODAL FORM */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Apply for Elevated Privilege</h3>
                  <p className="text-xs text-slate-400">Multi-tier authorization request routing</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Requested Resource or System Permission *
                </label>
                <select
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Manager Attendance Dashboard & Staff Shift Approvals">
                    Manager Attendance Dashboard & Staff Shift Approvals
                  </option>
                  <option value="Geofence Radius Location Editor & Kiosk Provisioning">
                    Geofence Radius Location Editor & Kiosk Provisioning
                  </option>
                  <option value="Workplace Proof Reports Auditor & Photo Reviewer">
                    Workplace Proof Reports Auditor & Photo Reviewer
                  </option>
                  <option value="IT System Administration & User Directory Provisioning">
                    IT System Administration & User Directory Provisioning
                  </option>
                  <option value="Off-Site Community Outing & Field Trip Coordinator">
                    Off-Site Community Outing & Field Trip Coordinator
                  </option>
                  <option value="Financial & Budget Ledger Audit Rights">
                    Financial & Budget Ledger Audit Rights
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Role Level *
                </label>
                <select
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="manager">Manager (Center Level 1 Approval Rights)</option>
                  <option value="it_admin">IT Admin (Technical Provisioning & Security)</option>
                  <option value="super_admin">Super Admin (System Override Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Designated Level 1 Manager (For Authorization) *
                </label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableManagers.map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name} ({mgr.role === 'super_admin' ? 'Super Admin' : 'Center Manager'} - {mgr.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Business Justification & Detailed Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you require this elevated access (e.g. Managing weekend youth outreach programs, configuring sports complex kiosks)..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-indigo-400 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Automatic Authorization Flow</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Your request will first be sent to your designated Manager for Level 1 authorization. Once authorized, it will automatically route to the IT Admin Pool for Level 2 technical provisioning.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-xl shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECISION ACTION MODAL (MANAGER / IT / OVERRIDE) */}
      {selectedRequest && decisionAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white">
                {decisionAction === 'manager_approve' && 'Level 1: Manager Authorization Approval'}
                {decisionAction === 'manager_reject' && 'Level 1: Manager Reject Application'}
                {decisionAction === 'it_approve' && 'Level 2: IT Admin Provisioning & Grant'}
                {decisionAction === 'it_reject' && 'Level 2: IT Admin Reject Technical Provisioning'}
                {decisionAction === 'override' && 'Super Admin Direct Status Override'}
              </h3>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setDecisionAction(null);
                }}
                className="text-slate-400 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Request ID:</span>
                <span className="font-mono font-bold text-indigo-400">#{selectedRequest.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Requester:</span>
                <span className="font-bold text-white">{selectedRequest.requesterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resource Requested:</span>
                <span className="font-bold text-slate-200">{selectedRequest.resourceName}</span>
              </div>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
              {decisionAction === 'override' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Select Override Status *
                  </label>
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value as ApprovalStatus)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none"
                  >
                    <option value="approved">Approved (Fully Granted)</option>
                    <option value="pending_it">Pending IT (Level 2 Pool)</option>
                    <option value="pending_manager">Pending Manager (Level 1 Pool)</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Audit Log Comments / Decision Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                  placeholder="Enter formal decision notes, technical provisioning details, or rejection compliance notes..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setDecisionAction(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={`px-6 py-2 text-white font-extrabold rounded-xl shadow-lg cursor-pointer ${
                    decisionAction.includes('reject')
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  }`}
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED AUDIT HISTORY MODAL */}
      {detailRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <History className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-black text-white">Privilege Request Audit Trail</h3>
                  <p className="text-xs text-slate-400">Request #{detailRequest.id} — {detailRequest.resourceName}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailRequest(null)}
                className="text-slate-400 hover:text-white font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Requester</span>
                <span className="font-bold text-white block mt-0.5">{detailRequest.requesterName}</span>
                <span className="text-slate-400 text-[11px]">{detailRequest.requesterDepartment}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Status</span>
                <div className="mt-1">{getStatusBadge(detailRequest.status)}</div>
              </div>
            </div>

            {/* Event Timeline Stepper */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Event Timeline & Decision Audit Logs</h4>
              <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
                {detailRequest.history.map((entry, idx) => (
                  <div key={entry.id || idx} className="relative group">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-slate-900 ring-4 ring-slate-900" />
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white">{entry.action}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span>Actor: <strong className="text-indigo-300">{entry.actorName}</strong> ({entry.actorRole})</span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 italic">
                          "{entry.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setDetailRequest(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
