import React, { useState } from 'react';
import { Employee, AttendanceRecord, EmployeeWorkReport } from '../types';
import {
  exportEmployeeToCSV,
  exportEmployeeToExcel,
  exportEmployeeToJSON,
  exportEmployeeToTXT,
  exportEmployeeToPDFPrint,
} from '../utils/exportUtils';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  User,
  Check,
  FileCode,
  Sparkles,
  Building2,
  Calendar
} from 'lucide-react';

interface EmployeeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  workReports: EmployeeWorkReport[];
  initialEmployeeId?: string;
}

export const EmployeeExportModal: React.FC<EmployeeExportModalProps> = ({
  isOpen,
  onClose,
  employees,
  attendanceRecords,
  workReports,
  initialEmployeeId,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    initialEmployeeId || employees[0]?.id || 'all'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedEmpId(initialEmployeeId || employees[0]?.id || 'all');
    }
  }, [isOpen, initialEmployeeId, employees]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  const getFilteredRecords = (empId: string) => {
    if (empId === 'all') return attendanceRecords;
    return attendanceRecords.filter((r) => r.employeeId === empId);
  };

  const getFilteredReports = (empId: string) => {
    if (empId === 'all') return workReports;
    return workReports.filter((r) => r.employeeId === empId);
  };

  const currentRecords = getFilteredRecords(selectedEmpId);
  const currentReports = getFilteredReports(selectedEmpId);

  const targetName = selectedEmpId === 'all' ? 'All Staff Members' : selectedEmployee?.name || 'Employee';

  const handleExport = (format: 'csv' | 'excel' | 'json' | 'txt' | 'print') => {
    const dummyEmp: Employee = selectedEmployee || {
      id: 'all',
      name: 'All Ga-Rankuwa YMCA Staff',
      email: 'all.staff@garankuwaymca.org.za',
      department: 'All Departments',
      role: 'Staff Collective',
      biometricRegistered: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    };

    if (format === 'csv') {
      exportEmployeeToCSV(dummyEmp, currentRecords, currentReports);
      showToast(`Downloaded CSV report for ${targetName}`);
    } else if (format === 'excel') {
      exportEmployeeToExcel(dummyEmp, currentRecords, currentReports);
      showToast(`Downloaded Excel (.xls) report for ${targetName}`);
    } else if (format === 'json') {
      exportEmployeeToJSON(dummyEmp, currentRecords, currentReports);
      showToast(`Downloaded JSON data file for ${targetName}`);
    } else if (format === 'txt') {
      exportEmployeeToTXT(dummyEmp, currentRecords, currentReports);
      showToast(`Downloaded TXT summary report for ${targetName}`);
    } else if (format === 'print') {
      exportEmployeeToPDFPrint(dummyEmp, currentRecords, currentReports);
      showToast(`Opened printable document window for ${targetName}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-6 text-white relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Download Employee Reports</h2>
              <p className="text-xs text-slate-400">Export records in CSV, Excel, JSON, TXT, or PDF format</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Select Employee Target */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Select Employee:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {currentRecords.length} clock-ins | {currentReports.length} reports
            </span>
          </label>

          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">🌟 All Staff Members (Full YMCA Roster Summary)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                👤 {emp.name} — {emp.department} ({emp.role})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Employee Preview Summary Card */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedEmployee ? (
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500/40"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-extrabold text-sm">
                YMCA
              </div>
            )}
            <div>
              <div className="font-bold text-white text-sm">{targetName}</div>
              <div className="text-xs text-slate-400">
                {selectedEmployee ? `${selectedEmployee.department} • ${selectedEmployee.role}` : 'All Staff Activity'}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-extrabold text-indigo-300">{currentRecords.length} Logs</div>
            <div className="text-[10px] text-emerald-400 font-semibold">{currentReports.length} Shift Reports</div>
          </div>
        </div>

        {/* Export Formats Grid */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Choose Export Format:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* CSV */}
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300">CSV File (.csv)</div>
                  <div className="text-[10px] text-slate-400">Standard spreadsheet table</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </button>

            {/* EXCEL */}
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300">Excel Workbook (.xls)</div>
                  <div className="text-[10px] text-slate-400">Formatted multi-sheet Excel</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </button>

            {/* JSON */}
            <button
              onClick={() => handleExport('json')}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300">JSON Data (.json)</div>
                  <div className="text-[10px] text-slate-400">Structured raw data format</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </button>

            {/* TXT */}
            <button
              onClick={() => handleExport('txt')}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300">Text Summary (.txt)</div>
                  <div className="text-[10px] text-slate-400">Clean text summary document</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </button>

          </div>
        </div>

        {/* Print / PDF Full Width Action */}
        <div className="pt-2">
          <button
            onClick={() => handleExport('print')}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-purple-200" />
            <span>Open Printable PDF Document View</span>
          </button>
        </div>

      </div>
    </div>
  );
};
