import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { GeofenceLocation } from '../types';
import { 
  QrCode, 
  MapPin, 
  RefreshCw, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Download,
  Printer
} from 'lucide-react';

interface QRStationDisplayProps {
  locations: GeofenceLocation[];
  onSelectStationCheckIn: (locationId: string) => void;
}

export const QRStationDisplay: React.FC<QRStationDisplayProps> = ({
  locations,
  onSelectStationCheckIn,
}) => {
  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || 'geo-1');
  const [qrCanvasUrl, setQrCanvasUrl] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const selectedLoc = locations.find((l) => l.id === selectedLocId) || locations[0];

  useEffect(() => {
    // Generate fresh session token
    const token = `QR-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now()}`;
    setSessionToken(token);

    const checkInUrl = `${window.location.origin}/?session=${token}&loc=${selectedLocId}`;

    QRCode.toDataURL(checkInUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCanvasUrl(url))
      .catch((err) => console.error('QR code error', err));
  }, [selectedLocId]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?session=${sessionToken}&loc=${selectedLocId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCanvasUrl) return;
    const link = document.createElement('a');
    link.href = qrCanvasUrl;
    link.download = `YMCA_QR_Station_${selectedLoc.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Print Station QR Code - ${selectedLoc.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; color: #0f172a; }
    .poster-card { max-width: 500px; margin: 0 auto; border: 4px solid #312e81; padding: 40px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .logo { font-size: 28px; font-weight: 900; color: #312e81; letter-spacing: -0.5px; }
    .subtitle { font-size: 14px; color: #4338ca; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    .station-name { font-size: 22px; font-weight: 800; margin-top: 24px; color: #0f172a; }
    .station-addr { font-size: 13px; color: #64748b; margin-top: 4px; }
    .qr-img { width: 300px; height: 300px; margin: 24px auto; border: 2px solid #e2e8f0; border-radius: 16px; padding: 12px; }
    .instructions { font-size: 14px; font-weight: 600; color: #334155; line-height: 1.6; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #cbd5e1; }
    .footer-badge { font-size: 11px; color: #64748b; margin-top: 20px; font-weight: 700; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="poster-card">
    <div class="logo">GA-RANKUWA YMCA</div>
    <div class="subtitle">Official Attendance & Clock-In Station</div>

    <div class="station-name">${selectedLoc.name}</div>
    <div class="station-addr">${selectedLoc.address} (Radius: ${selectedLoc.radiusMeters}m)</div>

    <img src="${qrCanvasUrl}" class="qr-img" alt="YMCA QR Code" />

    <div class="instructions">
      📲 <b>How to Clock In / Out:</b><br/>
      1. Scan this QR Code with your mobile phone camera.<br/>
      2. Take your Live Photo for AI Profile Verification.<br/>
      3. Your GPS location & attendance log will be registered automatically!
    </div>

    <div class="footer-badge">
      🔒 Protected by Geofence & AI Biometric Snapshot Verification
    </div>
  </div>

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
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Kiosk Card Frame */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 rounded-3xl border border-indigo-500/20 shadow-2xl p-6 sm:p-10 text-white relative overflow-hidden">
        
        {/* Glow backdrop effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left Side: Station Details */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Official Check-in Terminal</span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                Scan QR to Clock In
              </h2>
              <p className="mt-2 text-slate-400 text-sm sm:text-base">
                1. Point your smartphone camera at this QR code.
                <br />
                2. Open the link to verify your GPS location and scan your face.
              </p>
            </div>

            {/* Location selector dropdown */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                Select Office Station Location:
              </label>
              <select
                value={selectedLocId}
                onChange={(e) => setSelectedLocId(e.target.value)}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.address})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick launch simulation button */}
            <div className="pt-2">
              <button
                id="btn-simulate-qr-scan"
                onClick={() => onSelectStationCheckIn(selectedLocId)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Smartphone className="w-5 h-5" />
                <span>Simulate Phone Scanning This QR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right Side: Rendered QR Code Box */}
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-indigo-500/30 relative group">
              {qrCanvasUrl ? (
                <img
                  src={qrCanvasUrl}
                  alt="Station Check-In QR Code"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-xl"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              )}

              {/* Security badge over code */}
              <div className="mt-3 flex items-center justify-center gap-2 text-slate-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Dynamic Geofenced Token</span>
              </div>
            </div>

            {/* QR Download & Print Action Buttons */}
            <div className="mt-4 flex items-center space-x-2 w-full">
              <button
                id="btn-download-qr-code"
                onClick={handleDownloadQR}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 text-indigo-300 hover:bg-slate-800 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                title="Download QR Code image PNG"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download QR</span>
              </button>

              <button
                id="btn-print-qr-code"
                onClick={handlePrintQR}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/20 hover:scale-[1.02]"
                title="Print Station Poster QR Code"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Poster</span>
              </button>
            </div>

            {/* Copy direct link button */}
            <button
              onClick={handleCopyLink}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Link Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <span>Copy Direct Check-in Link</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
