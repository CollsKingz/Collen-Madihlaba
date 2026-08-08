import React, { useState, useEffect } from 'react';
import { 
  getDepartments, 
  addDepartment, 
  updateDepartment, 
  deleteDepartment, 
  resetDepartmentsToDefaults, 
  getEmployees 
} from '../utils/storage';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  Layers, 
  Users,
  Sparkles
} from 'lucide-react';

interface DepartmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepartmentsUpdated?: () => void;
}

export const DepartmentManagerModal: React.FC<DepartmentManagerModalProps> = ({
  isOpen,
  onClose,
  onDepartmentsUpdated
}) => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editDeptInput, setEditDeptInput] = useState('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const loadDeptData = () => {
    setDepartments(getDepartments());
  };

  useEffect(() => {
    if (isOpen) {
      loadDeptData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => loadDeptData();
    window.addEventListener('geofence_departments_update', handleUpdate);
    return () => window.removeEventListener('geofence_departments_update', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  const employees = getEmployees();

  const getStaffCount = (deptName: string) => {
    return employees.filter(e => e.department === deptName).length;
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const ok = addDepartment(newDeptName.trim());
    if (ok) {
      showNotice(`Added department: "${newDeptName.trim()}"`);
      setNewDeptName('');
      loadDeptData();
      if (onDepartmentsUpdated) onDepartmentsUpdated();
    } else {
      showNotice(`Department "${newDeptName.trim()}" already exists!`);
    }
  };

  const handleStartRename = (dept: string) => {
    setEditingDept(dept);
    setEditDeptInput(dept);
  };

  const handleSaveRename = (oldName: string) => {
    if (!editDeptInput.trim() || editDeptInput.trim() === oldName) {
      setEditingDept(null);
      return;
    }
    const ok = updateDepartment(oldName, editDeptInput.trim());
    if (ok) {
      showNotice(`Renamed "${oldName}" to "${editDeptInput.trim()}"`);
      setEditingDept(null);
      loadDeptData();
      if (onDepartmentsUpdated) onDepartmentsUpdated();
    } else {
      showNotice('Failed to rename department.');
    }
  };

  const handleDelete = (deptName: string) => {
    const count = getStaffCount(deptName);
    const confirmMsg = count > 0 
      ? `Department "${deptName}" currently has ${count} staff member(s). Are you sure you want to delete this department?`
      : `Are you sure you want to delete "${deptName}" department?`;

    if (!window.confirm(confirmMsg)) return;

    const ok = deleteDepartment(deptName);
    if (ok) {
      showNotice(`Deleted department "${deptName}"`);
      loadDeptData();
      if (onDepartmentsUpdated) onDepartmentsUpdated();
    } else {
      showNotice('Cannot delete department. At least one department must remain.');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset departments list to YMCA default standards?')) {
      resetDepartmentsToDefaults();
      showNotice('Reset departments to default YMCA list.');
      loadDeptData();
      if (onDepartmentsUpdated) onDepartmentsUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-extrabold text-white">YMCA Departments Manager</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {departments.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Add, edit, or remove organizational units & department titles.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Bar */}
        {noticeMessage && (
          <div className="bg-indigo-600/20 border-b border-indigo-500/40 px-6 py-2.5 text-xs text-indigo-200 font-semibold flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{noticeMessage}</span>
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Add New Department Form */}
          <form onSubmit={handleAddDept} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Create New Department</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Facilities & Maintenance, Finance & Audit..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={!newDeptName.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dept</span>
              </button>
            </div>
          </form>

          {/* Existing Departments List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center space-x-1">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Existing YMCA Departments ({departments.length})</span>
              </span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                title="Reset to default YMCA departments"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="space-y-2">
              {departments.map((dept) => {
                const isEditing = editingDept === dept;
                const count = getStaffCount(dept);

                return (
                  <div
                    key={dept}
                    className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex items-center space-x-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editDeptInput}
                          onChange={(e) => setEditDeptInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(dept);
                            if (e.key === 'Escape') setEditingDept(null);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-indigo-500 text-white text-xs font-semibold focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(dept)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                          title="Save Rename"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDept(null)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-xs font-bold text-white">{dept}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-center space-x-1">
                            <Users className="w-2.5 h-2.5 text-indigo-300" />
                            <span>{count} staff</span>
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartRename(dept)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit / Rename Department"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(dept)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
