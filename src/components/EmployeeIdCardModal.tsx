import React, { useRef } from 'react';
import { Employee } from '../types';
import { X, Printer, Download, ShieldCheck, QrCode, Building2, User, Mail, CheckCircle2, Award } from 'lucide-react';

interface EmployeeIdCardModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeIdCardModal: React.FC<EmployeeIdCardModalProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !employee) return null;

  const issueDate = employee.registeredAt
    ? new Date(employee.registeredAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
    : '2026-01-15';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popup windows to print the Employee ID Card.');
      return;
    }

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      JSON.stringify({ id: employee.id, name: employee.name, dept: employee.department, role: employee.role })
    )}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ga-Rankuwa YMCA ID Card - ${employee.name}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 20mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f8fafc;
              color: #0f172a;
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .id-card {
              width: 330px;
              height: 520px;
              background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
              border: 2px solid #6366f1;
              border-radius: 18px;
              padding: 20px;
              color: white;
              box-shadow: 0 10px 25px rgba(0,0,0,0.3);
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              overflow: hidden;
            }
            .id-card-header {
              text-align: center;
              border-b: 1px solid rgba(255,255,255,0.15);
              padding-bottom: 12px;
            }
            .brand-title {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 0.5px;
              color: #ffffff;
              margin: 0;
            }
            .brand-sub {
              font-size: 10px;
              color: #a5b4fc;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-top: 2px;
            }
            .photo-container {
              display: flex;
              justify-content: center;
              margin: 14px 0;
            }
            .photo {
              width: 110px;
              height: 110px;
              border-radius: 16px;
              object-fit: cover;
              border: 3px solid #818cf8;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            }
            .emp-name {
              font-size: 18px;
              font-weight: 700;
              text-align: center;
              color: #ffffff;
              margin: 0;
            }
            .emp-role {
              font-size: 12px;
              font-weight: 600;
              text-align: center;
              color: #818cf8;
              margin-top: 2px;
            }
            .info-grid {
              background: rgba(255,255,255,0.06);
              border-radius: 12px;
              padding: 10px;
              margin-top: 10px;
              font-size: 11px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .info-label {
              color: #94a3b8;
            }
            .info-value {
              font-weight: 600;
              color: #f1f5f9;
            }
            .qr-section {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px dashed rgba(255,255,255,0.2);
            }
            .qr-code {
              width: 55px;
              height: 55px;
              background: white;
              padding: 3px;
              border-radius: 8px;
            }
            .badge-verified {
              font-size: 9px;
              background: #059669;
              color: white;
              padding: 4px 8px;
              border-radius: 6px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .instructions {
              margin-top: 20px;
              font-size: 12px;
              color: #64748b;
            }
            @media print {
              .instructions { display: none; }
              body { background: white; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="id-card">
            <div class="id-card-header">
              <h1 class="brand-title">Ga-Rankuwa YMCA</h1>
              <div class="brand-sub">Official Employee Work ID Badge</div>
            </div>

            <div class="photo-container">
              <img src="${employee.avatar}" class="photo" alt="${employee.name}" />
            </div>

            <div>
              <h2 class="emp-name">${employee.name}</h2>
              <div class="emp-role">${employee.role}</div>
            </div>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Staff ID:</span>
                <span class="info-value">${employee.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Department:</span>
                <span class="info-value">${employee.department}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Issued Date:</span>
                <span class="info-value">${issueDate}</span>
              </div>
              <div class="info-row" style="margin-bottom: 0;">
                <span class="info-label">Biometrics:</span>
                <span class="info-value" style="color: #34d399;">Facial Enrolled ✓</span>
              </div>
            </div>

            <div class="qr-section">
              <img src="${qrCodeUrl}" class="qr-code" alt="QR Code" />
              <div style="text-align: right;">
                <div class="badge-verified">ACTIVE STAFF</div>
                <div style="font-size: 8px; color: #94a3b8; margin-top: 4px;">Zone 1 Main Center</div>
              </div>
            </div>
          </div>

          <div class="instructions">
            Printing official Ga-Rankuwa YMCA Staff ID Badge...
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 660; // 2x resolution
    canvas.height = 1040;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 660, 1040);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 660, 1040);

    // Border
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 640, 1020);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ga-Rankuwa YMCA', 330, 80);

    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('OFFICIAL EMPLOYEE WORK ID BADGE', 330, 115);

    // Divider
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 140);
    ctx.lineTo(620, 140);
    ctx.stroke();

    // Load photo
    const photoImg = new Image();
    photoImg.crossOrigin = 'anonymous';
    photoImg.onload = () => {
      // Photo Container
      ctx.save();
      ctx.beginPath();
      ctx.arc(330, 290, 110, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(photoImg, 220, 180, 220, 220);
      ctx.restore();

      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(330, 290, 110, 0, Math.PI * 2, true);
      ctx.stroke();

      // Name & Role
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(employee.name, 330, 460);

      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(employee.role, 330, 500);

      // Info Box Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.fillRect(50, 540, 560, 260);

      ctx.textAlign = 'left';
      ctx.font = '22px sans-serif';

      const rows = [
        { label: 'Staff ID:', val: employee.id },
        { label: 'Department:', val: employee.department },
        { label: 'Issue Date:', val: issueDate },
        { label: 'Biometrics:', val: 'Facial Enrolled ✓' },
      ];

      rows.forEach((row, idx) => {
        const y = 595 + idx * 52;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(row.label, 80, y);
        ctx.fillStyle = idx === 3 ? '#34d399' : '#ffffff';
        ctx.fillText(row.val, 260, y);
      });

      // Bottom Section
      ctx.fillStyle = '#059669';
      ctx.fillRect(400, 850, 190, 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ACTIVE STAFF', 495, 882);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText('Ga-Rankuwa Zone 1 Center', 495, 925);

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `YMCA_Work_ID_Card_${employee.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    photoImg.onerror = () => {
      // Fallback if image CORS fails
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `YMCA_Work_ID_Card_${employee.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    photoImg.src = employee.avatar;
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    JSON.stringify({ id: employee.id, name: employee.name, dept: employee.department, role: employee.role })
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Employee Work ID Badge</h3>
              <p className="text-xs text-slate-400">Ga-Rankuwa YMCA Official Credential</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Card Preview */}
        <div
          ref={cardRef}
          className="w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-4"
        >
          {/* Background decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card Title Header */}
          <div className="text-center border-b border-slate-800 pb-3">
            <div className="flex items-center justify-center space-x-2 text-indigo-400 font-extrabold text-sm uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Ga-Rankuwa YMCA</span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-semibold">
              Official Employee Work Credential
            </p>
          </div>

          {/* Employee Avatar & Name */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative">
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-400 shadow-xl"
              />
              <div
                className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-slate-900 shadow-md"
                title="Biometric Facial Verified"
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">{employee.name}</h4>
              <p className="text-xs font-semibold text-indigo-300">{employee.role}</p>
            </div>
          </div>

          {/* Employee Details Grid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Staff ID:</span>
              <span className="font-mono font-bold text-indigo-300">{employee.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Department:</span>
              <span className="font-medium text-slate-200">{employee.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Issue Date:</span>
              <span className="font-medium text-slate-300">{issueDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Biometrics:</span>
              <span className="font-semibold text-emerald-400">Facial Enrolled ✓</span>
            </div>
          </div>

          {/* QR Code & Status Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div className="bg-white p-1.5 rounded-lg shadow-md">
              <img src={qrCodeUrl} alt="Staff QR Verification" className="w-12 h-12" />
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-emerald-500/30 uppercase tracking-wider">
                Active Staff
              </span>
              <p className="text-[10px] text-slate-500">Zone 1 Main Center</p>
            </div>
          </div>
        </div>

        {/* Actions: Print & Download */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print ID Card</span>
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
