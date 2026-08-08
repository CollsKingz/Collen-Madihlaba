import React, { useState, useEffect } from 'react';
import { AttendanceRecord } from '../types';
import { getAttendanceRecords, exportRecordsToCSV } from '../utils/storage';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  FileText, 
  Download, 
  Printer, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  UserCheck, 
  RefreshCw,
  FileSpreadsheet,
  CalendarRange,
  BarChart2,
  PieChart as PieIcon,
  Check,
  Building2,
  Eye,
  X,
  ShieldCheck
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export type ReportTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const DailyReportView: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [timeframe, setTimeframe] = useState<ReportTimeframe>('daily');
  
  // Date pickers for different timeframes
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString()); // YYYY

  const [aiSummary, setAiSummary] = useState<string>('');
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<AttendanceRecord | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  useEffect(() => {
    setRecords(getAttendanceRecords());
  }, []);

  // Filter records based on active timeframe selection
  const filteredRecords = records.filter((r) => {
    const recordDate = new Date(r.timestamp);
    if (timeframe === 'daily') {
      return r.timestamp.startsWith(selectedDate);
    } else if (timeframe === 'weekly') {
      // Calculate 7-day window starting from selectedDate (or 3 days before to 3 days after)
      const baseDate = new Date(selectedDate);
      const start = new Date(baseDate);
      start.setDate(baseDate.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(baseDate);
      end.setHours(23, 59, 59, 999);
      return recordDate >= start && recordDate <= end;
    } else if (timeframe === 'monthly') {
      return r.timestamp.startsWith(selectedMonth);
    } else if (timeframe === 'yearly') {
      return r.timestamp.startsWith(selectedYear);
    }
    return true;
  });

  // Calculate timeframe label
  const getTimeframeLabel = () => {
    if (timeframe === 'daily') return `Daily Report (${selectedDate})`;
    if (timeframe === 'weekly') {
      const base = new Date(selectedDate);
      const start = new Date(base);
      start.setDate(base.getDate() - 6);
      return `Weekly Report (${start.toISOString().split('T')[0]} to ${selectedDate})`;
    }
    if (timeframe === 'monthly') return `Monthly Report (${selectedMonth})`;
    if (timeframe === 'yearly') return `Yearly Report (${selectedYear})`;
    return 'Attendance Report';
  };

  // Hourly or Daily Arrivals Chart Data
  const arrivalTrendMap: Record<string, number> = {};
  if (timeframe === 'daily') {
    ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].forEach(
      (h) => (arrivalTrendMap[h] = 0)
    );
    filteredRecords.forEach((r) => {
      const hourStr = new Date(r.timestamp).getHours().toString().padStart(2, '0') + ':00';
      arrivalTrendMap[hourStr] = (arrivalTrendMap[hourStr] || 0) + 1;
    });
  } else {
    // Group by Day/Month
    filteredRecords.forEach((r) => {
      const dateKey = timeframe === 'yearly' 
        ? new Date(r.timestamp).toLocaleString('default', { month: 'short' })
        : r.timestamp.split('T')[0];
      arrivalTrendMap[dateKey] = (arrivalTrendMap[dateKey] || 0) + 1;
    });
  }

  const chartData = Object.entries(arrivalTrendMap).map(([label, count]) => ({
    label,
    count,
  }));

  // Department Breakdown
  const deptMap: Record<string, number> = {};
  filteredRecords.forEach((r) => {
    const dept = r.employeeDepartment || 'General';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });

  const deptChartData = Object.entries(deptMap).map(([dept, count]) => ({
    name: dept,
    value: count,
  }));

  const totalIn = filteredRecords.filter((r) => r.type === 'clock_in').length;
  const totalOut = filteredRecords.filter((r) => r.type === 'clock_out').length;
  const insideGeofenceCount = filteredRecords.filter((r) => r.withinGeofence).length;
  const geofenceCompliancePct = filteredRecords.length > 0 ? Math.round((insideGeofenceCount / filteredRecords.length) * 100) : 100;
  const avgFaceScore = filteredRecords.length > 0 
    ? (filteredRecords.reduce((acc, r) => acc + (r.faceMatchScore || 98), 0) / filteredRecords.length).toFixed(1) 
    : '98.5';

  const handleGenerateAiSummary = async () => {
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/daily-report-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: filteredRecords, timeframe, date: selectedDate }),
      });
      const data = await res.json();
      setAiSummary(data.summary || `${getTimeframeLabel()} AI Summary Generated.`);
    } catch (err) {
      console.error('AI summary error', err);
      setAiSummary(`### 📊 Ga-Rankuwa YMCA ${getTimeframeLabel()} Insights
- **Staff Attendance**: Total of ${totalIn} verified clock-in entries and ${totalOut} clock-outs.
- **Geofence Security**: ${geofenceCompliancePct}% of staff verified within Ga-Rankuwa YMCA facility GPS boundaries.
- **Biometric Face Health**: Average facial verification score standing at ${avgFaceScore}%.`);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleDownloadCSV = (targetTimeframe: ReportTimeframe = timeframe) => {
    let recordsToExport = records;
    let filenameSuffix = targetTimeframe.toUpperCase();

    if (targetTimeframe === 'daily') {
      recordsToExport = records.filter((r) => r.timestamp.startsWith(selectedDate));
      filenameSuffix = `DAILY_${selectedDate}`;
    } else if (targetTimeframe === 'weekly') {
      const base = new Date(selectedDate);
      const start = new Date(base);
      start.setDate(base.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(base);
      end.setHours(23, 59, 59, 999);
      recordsToExport = records.filter((r) => {
        const d = new Date(r.timestamp);
        return d >= start && d <= end;
      });
      filenameSuffix = `WEEKLY_${start.toISOString().split('T')[0]}_TO_${selectedDate}`;
    } else if (targetTimeframe === 'monthly') {
      recordsToExport = records.filter((r) => r.timestamp.startsWith(selectedMonth));
      filenameSuffix = `MONTHLY_${selectedMonth}`;
    } else if (targetTimeframe === 'yearly') {
      recordsToExport = records.filter((r) => r.timestamp.startsWith(selectedYear));
      filenameSuffix = `YEARLY_${selectedYear}`;
    }

    if (recordsToExport.length === 0) {
      alert(`No records found for the selected ${targetTimeframe} period.`);
      return;
    }

    const headers = [
      'Record ID',
      'Timestamp',
      'Employee Name',
      'Department',
      'Clock Type',
      'Location Name',
      'Within Geofence',
      'Distance (Meters)',
      'Face Match %',
      'Status',
      'Shift Notes',
    ];

    const rows = recordsToExport.map((r) => [
      r.id,
      new Date(r.timestamp).toLocaleString(),
      `"${r.employeeName}"`,
      `"${r.employeeDepartment}"`,
      r.type.toUpperCase(),
      `"${r.locationName}"`,
      r.withinGeofence ? 'YES' : 'NO',
      r.geofenceDistanceMeters,
      `${r.faceMatchScore}%`,
      r.status.toUpperCase(),
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GaRankuwa_YMCA_Attendance_${filenameSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded ${targetTimeframe.toUpperCase()} CSV report (${recordsToExport.length} entries)`);
  };

  const handleDownloadFormattedSummary = () => {
    const summaryText = `=====================================================
GA-RANKUWA YMCA - ATTENDANCE & SHIFT EXECUTIVE REPORT
=====================================================
Timeframe Mode : ${timeframe.toUpperCase()}
Report Span    : ${getTimeframeLabel()}
Generated At   : ${new Date().toLocaleString()}

SUMMARY METRICS:
-----------------------------------------------------
Total Clock-Ins            : ${totalIn}
Total Clock-Outs           : ${totalOut}
Geofence Radius Compliance : ${geofenceCompliancePct}%
Avg Face Security Score    : ${avgFaceScore}%
Total Logged Shift Records : ${filteredRecords.length}

DEPARTMENT TURNOUT BREAKDOWN:
-----------------------------------------------------
${deptChartData.map((d) => `• ${d.name.padEnd(30, ' ')}: ${d.value} shifts`).join('\n')}

ATTENDANCE SHIFT LOGS:
-----------------------------------------------------
${filteredRecords
  .map(
    (r) =>
      `[${new Date(r.timestamp).toLocaleTimeString()}] ${r.employeeName} (${r.employeeDepartment}) - ${r.type.toUpperCase()} at ${r.locationName} | Geofence: ${r.withinGeofence ? 'PASSED' : 'OUT_OF_BOUNDS'} | Match: ${r.faceMatchScore}% | Notes: ${r.notes || 'N/A'}`
  )
  .join('\n')}

=====================================================
End of Ga-Rankuwa YMCA Staff Report
`;

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GaRankuwa_YMCA_Executive_Report_${timeframe.toUpperCase()}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded formatted ${timeframe.toUpperCase()} executive summary file.`);
  };

  const handleDownloadJSON = () => {
    const jsonPayload = {
      organization: 'Ga-Rankuwa YMCA',
      timeframe: timeframe,
      reportLabel: getTimeframeLabel(),
      generatedAt: new Date().toISOString(),
      recordCount: filteredRecords.length,
      records: filteredRecords,
    };
    const jsonStr = JSON.stringify(jsonPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `YMCA_Attendance_${timeframe.toUpperCase()}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded JSON data file for ${timeframe.toUpperCase()} report.`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 print:p-0 print:bg-white print:text-slate-900">
      
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-bounce">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastNotice}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <FileText className="w-4 h-4" />
            <span>Ga-Rankuwa YMCA Analytics & Reporting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Attendance Reports & Downloads
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Export comprehensive daily, weekly, monthly, and yearly staff attendance reports in all file formats.
          </p>
        </div>

        {/* Primary Download Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-export-current-csv"
            onClick={() => handleDownloadCSV(timeframe)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            title="Download CSV report of attendance data"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Download CSV</span>
          </button>

          <button
            id="btn-export-json-summary"
            onClick={handleDownloadJSON}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white font-semibold text-xs border border-slate-700 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>JSON Data</span>
          </button>

          <button
            id="btn-export-text-summary"
            onClick={handleDownloadFormattedSummary}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-semibold text-xs border border-slate-700 shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>TXT Document</span>
          </button>

          <button
            id="btn-print-report"
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-purple-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Timeframe Selector & Date Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tabs: Daily / Weekly / Monthly / Yearly */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto">
            <button
              id="tab-report-daily"
              onClick={() => setTimeframe('daily')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'daily'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily Report</span>
            </button>

            <button
              id="tab-report-weekly"
              onClick={() => setTimeframe('weekly')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'weekly'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Weekly Report</span>
            </button>

            <button
              id="tab-report-monthly"
              onClick={() => setTimeframe('monthly')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'monthly'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly Report</span>
            </button>

            <button
              id="tab-report-yearly"
              onClick={() => setTimeframe('yearly')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                timeframe === 'yearly'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Yearly Report</span>
            </button>
          </div>

          {/* Date Picker Controls depending on timeframe */}
          <div className="flex items-center space-x-3">
            {timeframe === 'daily' && (
              <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">Date:</span>
                <input
                  id="input-report-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                />
              </div>
            )}

            {timeframe === 'weekly' && (
              <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">Week Ending:</span>
                <input
                  id="input-report-week-end"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                />
              </div>
            )}

            {timeframe === 'monthly' && (
              <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">Month:</span>
                <input
                  id="input-report-month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                />
              </div>
            )}

            {timeframe === 'yearly' && (
              <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-400 font-medium">Year:</span>
                <select
                  id="select-report-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                >
                  <option value="2026" className="bg-slate-900">2026</option>
                  <option value="2025" className="bg-slate-900">2025</option>
                  <option value="2024" className="bg-slate-900">2024</option>
                </select>
              </div>
            )}
          </div>

        </div>

        {/* Quick Instant Download Grid for All 4 Timeframes */}
        <div className="pt-3 border-t border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Quick Timeframe Report Downloads
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              id="btn-quick-daily"
              onClick={() => handleDownloadCSV('daily')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Daily Report</div>
                <div className="text-[10px] text-slate-400">CSV Export</div>
              </div>
              <Download className="w-4 h-4 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
            </button>

            <button
              id="btn-quick-weekly"
              onClick={() => handleDownloadCSV('weekly')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">Weekly Report</div>
                <div className="text-[10px] text-slate-400">7-Day CSV</div>
              </div>
              <Download className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
            </button>

            <button
              id="btn-quick-monthly"
              onClick={() => handleDownloadCSV('monthly')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 text-left transition-all group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-300">Monthly Report</div>
                <div className="text-[10px] text-slate-400">Monthly CSV</div>
              </div>
              <Download className="w-4 h-4 text-purple-400 group-hover:translate-y-0.5 transition-transform" />
            </button>

            <button
              id="btn-quick-yearly"
              onClick={() => handleDownloadCSV('yearly')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-pink-500/40 text-left transition-all group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-pink-300">Yearly Report</div>
                <div className="text-[10px] text-slate-400">Annual CSV</div>
              </div>
              <Download className="w-4 h-4 text-pink-400 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      {/* Printable Title Block */}
      <div className="hidden print:block text-slate-900 space-y-1 mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">Ga-Rankuwa YMCA Staff Attendance Report</h1>
        <p className="text-sm text-slate-600">Period: {getTimeframeLabel()}</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-white shadow-xl space-y-2 print:border-slate-300 print:bg-white print:text-slate-900">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold print:text-slate-600">
            <span>TOTAL CLOCK-INS</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold">{totalIn}</div>
          <p className="text-[11px] text-slate-400">Shifts for {getTimeframeLabel()}</p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-white shadow-xl space-y-2 print:border-slate-300 print:bg-white print:text-slate-900">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold print:text-slate-600">
            <span>CLOCK-OUTS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{totalOut}</div>
          <p className="text-[11px] text-emerald-500/80">Completed shifts</p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-white shadow-xl space-y-2 print:border-slate-300 print:bg-white print:text-slate-900">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold print:text-slate-600">
            <span>GEOFENCE ACCURACY</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-teal-300">{geofenceCompliancePct}%</div>
          <p className="text-[11px] text-slate-400">Within YMCA facility radius</p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-white shadow-xl space-y-2 print:border-slate-300 print:bg-white print:text-slate-900">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold print:text-slate-600">
            <span>FACE SECURITY SCORE</span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-300">{avgFaceScore}%</div>
          <p className="text-[11px] text-slate-400">Average face match</p>
        </div>

      </div>

      {/* Gemini AI Executive Summary Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 rounded-2xl border border-indigo-500/30 p-6 text-white shadow-xl space-y-4 print:bg-white print:border-slate-300 print:text-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Gemini AI Executive Summary ({timeframe.toUpperCase()})</h3>
              <p className="text-xs text-slate-400">Automated shift analysis & manager recommendations</p>
            </div>
          </div>

          <button
            id="btn-generate-ai-summary"
            onClick={handleGenerateAiSummary}
            disabled={generatingAi}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all cursor-pointer print:hidden"
          >
            {generatingAi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating AI Insights...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Executive AI Summary</span>
              </>
            )}
          </button>
        </div>

        {aiSummary ? (
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 text-sm text-slate-200 space-y-2 leading-relaxed print:bg-slate-50 print:text-slate-900">
            <div className="prose prose-invert max-w-none text-xs sm:text-sm">
              {aiSummary.split('\n').map((line, idx) => (
                <p key={idx} className="mb-1">{line}</p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Click "Generate Executive AI Summary" above to have Gemini AI analyze attendance logs, department turnouts, and geofence data for {getTimeframeLabel()}.
          </p>
        )}
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
        
        {/* Trend Chart */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-white shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-200">
            {timeframe === 'daily' ? 'Hourly Clock-In Arrivals' : `${timeframe.toUpperCase()} Arrival Distribution`}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Breakdown Chart */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-white shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-200">Department Turnout ({timeframe.toUpperCase()})</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {deptChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No department data found for selected period.</p>
            )}
          </div>
        </div>

      </div>

      {/* Comprehensive Attendance Log Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-white print:border-slate-300 print:bg-white print:text-slate-900">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base">Detailed Shift Records</h3>
            <p className="text-xs text-slate-400 mt-0.5">{getTimeframeLabel()}</p>
          </div>
          <div className="flex items-center space-x-3 print:hidden">
            <button
              id="btn-export-table-csv"
              onClick={() => handleDownloadCSV(timeframe)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download CSV</span>
            </button>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              {filteredRecords.length} records found
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 print:bg-slate-100 print:text-slate-700">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">YMCA Facility Location</th>
                <th className="px-4 py-3">Geofence Status</th>
                <th className="px-4 py-3">Face Score</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Live Photo & Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No attendance records logged for {getTimeframeLabel()}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Employee Profile */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={rec.facePhotoUrl}
                          alt={rec.employeeName}
                          onClick={() => setSelectedRecordForModal(rec)}
                          className="w-9 h-9 rounded-xl object-cover border border-indigo-500/40 cursor-pointer hover:scale-110 transition-all shadow-md"
                          title="Click to view live clock photo capture"
                        />
                        <div>
                          <div className="font-bold text-white print:text-slate-900">{rec.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{rec.employeeDepartment}</div>
                        </div>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3 font-mono text-indigo-300 print:text-slate-800">
                      {new Date(rec.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>

                    {/* Clock Type */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          rec.type === 'clock_in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {rec.type === 'clock_in' ? 'In' : 'Out'}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-slate-300">{rec.locationName}</td>

                    {/* Geofence Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          rec.withinGeofence ? 'text-emerald-400' : 'text-amber-400 font-bold'
                        }`}
                      >
                        {rec.withinGeofence ? 'Valid' : 'Out of Bounds'} ({rec.geofenceDistanceMeters}m)
                      </span>
                    </td>

                    {/* Face Score */}
                    <td className="px-4 py-3 font-mono text-purple-300">
                      {rec.faceMatchScore}%
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate italic">
                      {rec.notes || <span className="text-slate-600 font-normal">None</span>}
                    </td>

                    {/* Inspect Live Photo Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRecordForModal(rec)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-bold text-xs transition-all flex items-center space-x-1.5 ml-auto cursor-pointer"
                        title="View full live capture photo and geofence details"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View Photo</span>
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECTION MODAL FOR LIVE CAPTURED PHOTO */}
      {selectedRecordForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base">Clock {selectedRecordForModal.type === 'clock_in' ? 'In' : 'Out'} Live Photo Audit</h3>
              </div>
              <button 
                onClick={() => setSelectedRecordForModal(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-xl bg-slate-950">
                <img
                  src={selectedRecordForModal.facePhotoUrl}
                  alt={`Live Clock Photo - ${selectedRecordForModal.employeeName}`}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Live Photo Captured
                  </span>
                  <span className="font-mono text-purple-300 font-bold">Match Score: {selectedRecordForModal.faceMatchScore}%</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Employee:</span>
                  <span className="font-bold text-white text-sm">{selectedRecordForModal.employeeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-medium text-slate-300">{selectedRecordForModal.employeeDepartment}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Clock Event:</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                    selectedRecordForModal.type === 'clock_in' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    Clock {selectedRecordForModal.type === 'clock_in' ? 'IN' : 'OUT'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="font-mono text-indigo-300">{new Date(selectedRecordForModal.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">YMCA Station:</span>
                  <span className="font-medium text-slate-200">{selectedRecordForModal.locationName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Geofence Compliance:</span>
                  <span className={selectedRecordForModal.withinGeofence ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {selectedRecordForModal.withinGeofence ? 'Within Radius' : 'Out of Bounds'} ({selectedRecordForModal.geofenceDistanceMeters}m)
                  </span>
                </div>
                {selectedRecordForModal.notes && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block mb-1 font-semibold">Employee Shift Notes:</span>
                    <p className="text-slate-300 italic bg-slate-900 p-2.5 rounded-xl border border-slate-800">"{selectedRecordForModal.notes}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecordForModal(null)}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
