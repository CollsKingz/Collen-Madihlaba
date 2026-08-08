import { AttendanceRecord, Employee, EmployeeWorkReport } from '../types';

/**
 * Helper utility to export employee attendance records and field work reports
 * in all major file formats: CSV, Excel XML, JSON, TXT, and Printable PDF window.
 */

export function exportEmployeeToCSV(
  employee: Employee,
  records: AttendanceRecord[],
  workReports: EmployeeWorkReport[]
) {
  const empRecords = records.filter((r) => r.employeeId === employee.id);
  const empReports = workReports.filter((r) => r.employeeId === employee.id);

  const lines: string[] = [];

  // Employee Header Info
  lines.push(`"GA-RANKUWA YMCA - EMPLOYEE ATTENDANCE & SHIFT REPORT"`);
  lines.push(`"Employee ID","${employee.id}"`);
  lines.push(`"Employee Name","${employee.name}"`);
  lines.push(`"Department","${employee.department}"`);
  lines.push(`"Role","${employee.role}"`);
  lines.push(`"Email","${employee.email}"`);
  lines.push(`"Report Generated At","${new Date().toLocaleString()}"`);
  lines.push(``);

  // SECTION 1: ATTENDANCE CLOCK-IN LOGS
  lines.push(`"SECTION 1: ATTENDANCE CLOCK-IN & OUT LOGS"`);
  lines.push(
    [
      'Record ID',
      'Timestamp',
      'Clock Type',
      'Location Name',
      'Within Geofence',
      'Distance (m)',
      'Live Photo Match %',
      'Status',
      'Shift Notes',
    ]
      .map((h) => `"${h}"`)
      .join(',')
  );

  empRecords.forEach((r) => {
    lines.push(
      [
        r.id,
        new Date(r.timestamp).toLocaleString(),
        r.type.toUpperCase(),
        r.locationName,
        r.withinGeofence ? 'YES' : 'NO',
        r.geofenceDistanceMeters,
        `${r.faceMatchScore || 98}%`,
        r.status.toUpperCase(),
        (r.notes || '').replace(/"/g, '""'),
      ]
        .map((val) => `"${val}"`)
        .join(',')
    );
  });

  lines.push(``);

  // SECTION 2: FIELD & SHIFT WORKPROOF REPORTS
  lines.push(`"SECTION 2: FIELD WORKPROOF SHIFT REPORTS"`);
  lines.push(
    ['Report ID', 'Timestamp', 'Report Type', 'Location / Destination', 'Shift Summary', 'Tasks Completed', 'Status']
      .map((h) => `"${h}"`)
      .join(',')
  );

  empReports.forEach((wr) => {
    lines.push(
      [
        wr.id,
        new Date(wr.timestamp).toLocaleString(),
        wr.reportType === 'outing_field_work' ? 'Field Trip Outing' : 'Regular Shift',
        wr.outingDestination || wr.locationName,
        (wr.shiftSummary || '').replace(/"/g, '""'),
        (wr.tasksCompleted || '').replace(/"/g, '""'),
        wr.status.toUpperCase(),
      ]
        .map((val) => `"${val}"`)
        .join(',')
    );
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const filename = `YMCA_${employee.name.replace(/\s+/g, '_')}_Report.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportEmployeeToExcel(
  employee: Employee,
  records: AttendanceRecord[],
  workReports: EmployeeWorkReport[]
) {
  const empRecords = records.filter((r) => r.employeeId === employee.id);
  const empReports = workReports.filter((r) => r.employeeId === employee.id);

  // Generate Excel XML spreadsheet markup for full Excel formatting
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E1B4B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="14" ss:Color="#4338CA"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Attendance Logs">
  <Table>
   <Row><Cell ss:StyleID="Title"><Data ss:Type="String">Ga-Rankuwa YMCA Employee Attendance Report - ${employee.name}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Department: ${employee.department} | Role: ${employee.role}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Generated: ${new Date().toLocaleString()}</Data></Cell></Row>
   <Row></Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Record ID</Data></Cell>
    <Cell><Data ss:Type="String">Timestamp</Data></Cell>
    <Cell><Data ss:Type="String">Clock Type</Data></Cell>
    <Cell><Data ss:Type="String">Location</Data></Cell>
    <Cell><Data ss:Type="String">Geofence Valid</Data></Cell>
    <Cell><Data ss:Type="String">Distance (m)</Data></Cell>
    <Cell><Data ss:Type="String">Live Photo Score</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Notes</Data></Cell>
   </Row>`;

  empRecords.forEach((r) => {
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${r.id}</Data></Cell>
    <Cell><Data ss:Type="String">${new Date(r.timestamp).toLocaleString()}</Data></Cell>
    <Cell><Data ss:Type="String">${r.type.toUpperCase()}</Data></Cell>
    <Cell><Data ss:Type="String">${r.locationName}</Data></Cell>
    <Cell><Data ss:Type="String">${r.withinGeofence ? 'YES' : 'NO'}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.geofenceDistanceMeters}</Data></Cell>
    <Cell><Data ss:Type="String">${r.faceMatchScore || 98}%</Data></Cell>
    <Cell><Data ss:Type="String">${r.status.toUpperCase()}</Data></Cell>
    <Cell><Data ss:Type="String">${r.notes || ''}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Shift Proof Reports">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Report ID</Data></Cell>
    <Cell><Data ss:Type="String">Timestamp</Data></Cell>
    <Cell><Data ss:Type="String">Report Type</Data></Cell>
    <Cell><Data ss:Type="String">Location / Destination</Data></Cell>
    <Cell><Data ss:Type="String">Shift Summary</Data></Cell>
    <Cell><Data ss:Type="String">Tasks Completed</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
   </Row>`;

  empReports.forEach((wr) => {
    xml += `
   <Row>
    <Cell><Data ss:Type="String">${wr.id}</Data></Cell>
    <Cell><Data ss:Type="String">${new Date(wr.timestamp).toLocaleString()}</Data></Cell>
    <Cell><Data ss:Type="String">${wr.reportType}</Data></Cell>
    <Cell><Data ss:Type="String">${wr.outingDestination || wr.locationName}</Data></Cell>
    <Cell><Data ss:Type="String">${wr.shiftSummary || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${wr.tasksCompleted || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${wr.status}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `YMCA_${employee.name.replace(/\s+/g, '_')}_Report.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportEmployeeToJSON(
  employee: Employee,
  records: AttendanceRecord[],
  workReports: EmployeeWorkReport[]
) {
  const empRecords = records.filter((r) => r.employeeId === employee.id);
  const empReports = workReports.filter((r) => r.employeeId === employee.id);

  const payload = {
    organization: 'Ga-Rankuwa YMCA',
    generatedAt: new Date().toISOString(),
    employeeProfile: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      registeredAt: employee.registeredAt,
    },
    attendanceRecordsCount: empRecords.length,
    attendanceRecords: empRecords,
    fieldWorkReportsCount: empReports.length,
    fieldWorkReports: empReports,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `YMCA_${employee.name.replace(/\s+/g, '_')}_Data.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportEmployeeToTXT(
  employee: Employee,
  records: AttendanceRecord[],
  workReports: EmployeeWorkReport[]
) {
  const empRecords = records.filter((r) => r.employeeId === employee.id);
  const empReports = workReports.filter((r) => r.employeeId === employee.id);

  const text = `===================================================================
GA-RANKUWA YMCA - STAFF ATTENDANCE & PERFORMANCE SUMMARY
===================================================================
Employee Name : ${employee.name}
Employee ID   : ${employee.id}
Department    : ${employee.department}
Role / Title  : ${employee.role}
Email Address : ${employee.email}
Report Date   : ${new Date().toLocaleString()}

SUMMARY METRICS:
-------------------------------------------------------------------
Total Clock-Ins / Out Logs : ${empRecords.length}
Total Field Work Reports   : ${empReports.length}
Geofence Compliance        : ${
    empRecords.length > 0
      ? Math.round((empRecords.filter((r) => r.withinGeofence).length / empRecords.length) * 100)
      : 100
  }%

ATTENDANCE LOGS:
-------------------------------------------------------------------
${
  empRecords.length === 0
    ? 'No attendance clock-in records found.'
    : empRecords
        .map(
          (r, i) =>
            `${i + 1}. [${new Date(r.timestamp).toLocaleString()}] ${r.type.toUpperCase()} at ${r.locationName} | Geofence: ${
              r.withinGeofence ? 'PASSED' : 'OUT_OF_BOUNDS'
            } (${r.geofenceDistanceMeters}m) | Photo Match: ${r.faceMatchScore || 98}% | Notes: ${r.notes || 'N/A'}`
        )
        .join('\n')
}

FIELD & SHIFT PROOF REPORTS:
-------------------------------------------------------------------
${
  empReports.length === 0
    ? 'No field work reports submitted.'
    : empReports
        .map(
          (wr, i) =>
            `${i + 1}. [${new Date(wr.timestamp).toLocaleString()}] ${
              wr.reportType === 'outing_field_work' ? 'FIELD TRIP OUTING' : 'REGULAR SHIFT'
            }\n   Location: ${wr.outingDestination || wr.locationName}\n   Summary : ${
              wr.shiftSummary || 'N/A'
            }\n   Tasks   :\n${wr.tasksCompleted || 'None'}\n`
        )
        .join('\n')
}

===================================================================
End of Employee Executive Report
`;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `YMCA_${employee.name.replace(/\s+/g, '_')}_Summary.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportEmployeeToPDFPrint(
  employee: Employee,
  records: AttendanceRecord[],
  workReports: EmployeeWorkReport[]
) {
  const empRecords = records.filter((r) => r.employeeId === employee.id);
  const empReports = workReports.filter((r) => r.employeeId === employee.id);

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>YMCA Employee Report - ${employee.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; line-height: 1.5; }
    .header { border-bottom: 2px solid #312e81; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 20px; font-weight: bold; color: #312e81; }
    .subtitle { font-size: 13px; color: #64748b; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-item label { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block; }
    .meta-item span { font-size: 14px; font-weight: 600; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th { background: #1e1b4b; color: #ffffff; text-align: left; padding: 8px 12px; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase; }
    .badge-pass { background: #dcfce7; color: #166534; }
    .badge-fail { background: #fef3c7; color: #92400e; }
    h2 { font-size: 16px; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">GA-RANKUWA YMCA</div>
    <div class="subtitle">Official Staff Attendance & Performance Report</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><label>Employee Name</label><span>${employee.name}</span></div>
    <div class="meta-item"><label>Employee ID</label><span>${employee.id}</span></div>
    <div class="meta-item"><label>Department</label><span>${employee.department}</span></div>
    <div class="meta-item"><label>Role Title</label><span>${employee.role}</span></div>
  </div>

  <h2>Attendance Clock-In Logs (${empRecords.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Type</th>
        <th>Location</th>
        <th>Geofence</th>
        <th>Live Photo Match</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${
        empRecords.length === 0
          ? '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No clock-in records logged.</td></tr>'
          : empRecords
              .map(
                (r) => `
        <tr>
          <td>${new Date(r.timestamp).toLocaleString()}</td>
          <td><b>${r.type.toUpperCase()}</b></td>
          <td>${r.locationName}</td>
          <td><span class="badge ${r.withinGeofence ? 'badge-pass' : 'badge-fail'}">${
                  r.withinGeofence ? 'Valid' : 'Out of Bounds'
                } (${r.geofenceDistanceMeters}m)</span></td>
          <td>${r.faceMatchScore || 98}%</td>
          <td>${r.notes || '-'}</td>
        </tr>
      `
              )
              .join('')
      }
    </tbody>
  </table>

  <h2>Field & Shift Reports (${empReports.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Report Type</th>
        <th>Location</th>
        <th>Shift Summary</th>
      </tr>
    </thead>
    <tbody>
      ${
        empReports.length === 0
          ? '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No field work reports submitted.</td></tr>'
          : empReports
              .map(
                (wr) => `
        <tr>
          <td>${new Date(wr.timestamp).toLocaleString()}</td>
          <td>${wr.reportType === 'outing_field_work' ? 'Field Trip' : 'Shift'}</td>
          <td>${wr.outingDestination || wr.locationName}</td>
          <td>${wr.shiftSummary || '-'}</td>
        </tr>
      `
              )
              .join('')
      }
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export all or filtered work reports directly to a CSV file
 */
export function exportAllWorkReportsToCSV(workReports: EmployeeWorkReport[], filenameCustom?: string) {
  const lines: string[] = [];

  // Title Header
  lines.push(`"GA-RANKUWA YMCA - WORK & FIELD PROOF REPORTS EXPORT"`);
  lines.push(`"Generated At","${new Date().toLocaleString()}"`);
  lines.push(`"Total Reports","${workReports.length}"`);
  lines.push(``);

  // Column Headers
  lines.push(
    [
      'Report ID',
      'Timestamp',
      'Employee ID',
      'Employee Name',
      'Department',
      'Report Type',
      'Location / Destination',
      'Arrival Time',
      'Outing Reason',
      'Shift Summary',
      'Tasks Completed',
      'Challenges Encountered',
      'Proof Photos Count',
      'Status',
    ]
      .map((h) => `"${h}"`)
      .join(',')
  );

  workReports.forEach((wr) => {
    lines.push(
      [
        wr.id,
        new Date(wr.timestamp).toLocaleString(),
        wr.employeeId,
        wr.employeeName,
        wr.employeeDepartment,
        wr.reportType === 'outing_field_work' ? 'Field Trip / Outing' : 'Regular Shift',
        wr.outingDestination || wr.locationName,
        wr.arrivalTime || 'N/A',
        (wr.outingReason || 'N/A').replace(/"/g, '""'),
        (wr.shiftSummary || '').replace(/"/g, '""'),
        (wr.tasksCompleted || '').replace(/"/g, '""'),
        (wr.challengesEncountered || 'None').replace(/"/g, '""'),
        wr.photos ? wr.photos.length : 0,
        wr.status.toUpperCase(),
      ]
        .map((val) => `"${val}"`)
        .join(',')
    );
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = filenameCustom || `GaRankuwa_YMCA_Work_Reports_${dateStr}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

