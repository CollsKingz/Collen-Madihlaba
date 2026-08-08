import React, { useState } from 'react';
import { AttendanceRecord } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { ShieldCheck, ShieldAlert, Sparkles, TrendingUp, Cpu, CheckCircle2, XCircle, Activity, BarChart2 } from 'lucide-react';

interface FaceScanAnalyticsChartProps {
  records: AttendanceRecord[];
}

export const FaceScanAnalyticsChart: React.FC<FaceScanAnalyticsChartProps> = ({ records }) => {
  const [chartView, setChartView] = useState<'overall' | 'shift' | 'department' | 'score_range'>('overall');

  // Compute key stats
  const totalScans = records.length;
  const successfulScans = records.filter(r => r.faceVerified && r.status !== 'flagged_face').length;
  const failedScans = records.filter(r => !r.faceVerified || r.status === 'flagged_face').length;

  const successRate = totalScans > 0 ? Math.round((successfulScans / totalScans) * 1000) / 10 : 0;
  const failureRate = totalScans > 0 ? Math.round((failedScans / totalScans) * 1000) / 10 : 0;

  const avgConfidenceScore = totalScans > 0
    ? (records.reduce((acc, r) => acc + (r.faceMatchScore || 0), 0) / totalScans).toFixed(1)
    : '0.0';

  // Chart Data Generators
  const getOverallData = () => [
    {
      name: 'Verified Success',
      count: successfulScans,
      percentage: successRate,
      fill: '#10b981', // emerald-500
    },
    {
      name: 'Failed / Flagged',
      count: failedScans,
      percentage: failureRate,
      fill: '#ef4444', // red-500
    },
  ];

  const getShiftData = () => {
    const shifts: ('morning' | 'afternoon' | 'night' | 'overtime')[] = ['morning', 'afternoon', 'night', 'overtime'];
    return shifts.map(shift => {
      const shiftRecs = records.filter(r => (r.shiftType || 'morning') === shift);
      const success = shiftRecs.filter(r => r.faceVerified && r.status !== 'flagged_face').length;
      const failed = shiftRecs.filter(r => !r.faceVerified || r.status === 'flagged_face').length;
      const label = shift.charAt(0).toUpperCase() + shift.slice(1);
      return {
        category: label,
        'Verified Success': success,
        'Failed / Flagged': failed,
        total: shiftRecs.length,
      };
    });
  };

  const getDepartmentData = () => {
    const departments = Array.from(new Set<string>(records.map(r => r.employeeDepartment || 'General')));
    if (departments.length === 0) return [];

    return departments.map((dept: string) => {
      const deptRecs = records.filter(r => (r.employeeDepartment || 'General') === dept);
      const success = deptRecs.filter(r => r.faceVerified && r.status !== 'flagged_face').length;
      const failed = deptRecs.filter(r => !r.faceVerified || r.status === 'flagged_face').length;
      // Truncate long dept names for axis readability
      const shortName: string = dept.length > 18 ? dept.substring(0, 16) + '...' : dept;
      return {
        category: shortName,
        fullName: dept,
        'Verified Success': success,
        'Failed / Flagged': failed,
        total: deptRecs.length,
      };
    });
  };

  const getScoreRangeData = () => {
    const highMatch = records.filter(r => (r.faceMatchScore || 0) >= 90 && r.faceVerified && r.status !== 'flagged_face').length;
    const moderateMatch = records.filter(r => (r.faceMatchScore || 0) >= 75 && (r.faceMatchScore || 0) < 90 && r.faceVerified).length;
    const lowMatch = records.filter(r => (r.faceMatchScore || 0) < 75 || !r.faceVerified || r.status === 'flagged_face').length;

    return [
      {
        category: 'High (90-100%)',
        'Verified Success': highMatch,
        'Failed / Flagged': 0,
        fill: '#10b981',
      },
      {
        category: 'Moderate (75-89%)',
        'Verified Success': moderateMatch,
        'Failed / Flagged': 0,
        fill: '#f59e0b',
      },
      {
        category: 'Low / Fail (<75%)',
        'Verified Success': 0,
        'Failed / Flagged': lowMatch,
        fill: '#ef4444',
      },
    ];
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 text-white">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-semibold">
              <span style={{ color: entry.color || entry.fill }}>
                {entry.name}:
              </span>
              <span className="font-mono">{entry.value} scans</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-6 text-white">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-base text-slate-100">Face Scan Verification Metrics</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                REAL-TIME
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live biometric authentication success and failure rates across all employee clock-ins
            </p>
          </div>
        </div>

        {/* Chart View Toggle Controls */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setChartView('overall')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              chartView === 'overall'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overall Outcome
          </button>
          <button
            onClick={() => setChartView('shift')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              chartView === 'shift'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Shift
          </button>
          <button
            onClick={() => setChartView('department')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              chartView === 'department'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            By Department
          </button>
          <button
            onClick={() => setChartView('score_range')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              chartView === 'score_range'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Confidence Range
          </button>
        </div>
      </div>

      {/* Real-time Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Success Rate
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {successRate}%
            </span>
            <span className="text-[10px] text-slate-500 block">{successfulScans} verified scans</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-red-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Failure / Flagged Rate
            </span>
            <span className="text-xl sm:text-2xl font-black text-red-400 font-mono">
              {failureRate}%
            </span>
            <span className="text-[10px] text-slate-500 block">{failedScans} flagged scans</span>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Avg Match Score
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
              {avgConfidenceScore}%
            </span>
            <span className="text-[10px] text-slate-500 block">Biometric confidence</span>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Face Checks
            </span>
            <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono">
              {totalScans}
            </span>
            <span className="text-[10px] text-slate-500 block">Processed clock-ins</span>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Real-Time Bar Chart Rendering Area */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>
              {chartView === 'overall' && 'Overall Face Scan Verification Success vs Failure'}
              {chartView === 'shift' && 'Face Scan Success & Failure Rates by Shift Type'}
              {chartView === 'department' && 'Face Scan Verification Breakdown by Department'}
              {chartView === 'score_range' && 'Face Scan Distribution by Biometric Confidence Score'}
            </span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Updated in real-time</span>
        </div>

        <div className="w-full h-64 sm:h-72">
          {totalScans === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Activity className="w-8 h-8 text-slate-600 animate-pulse" />
              <p className="text-xs">No face scan verification records logged yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'overall' ? (
                <BarChart data={getOverallData()} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={50}>
                    {getOverallData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chartView === 'score_range' ? (
                <BarChart data={getScoreRangeData()} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Verified Success" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                  <Bar dataKey="Failed / Flagged" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              ) : (
                <BarChart
                  data={chartView === 'shift' ? getShiftData() : getDepartmentData()}
                  margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                  />
                  <Bar dataKey="Verified Success" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar dataKey="Failed / Flagged" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
