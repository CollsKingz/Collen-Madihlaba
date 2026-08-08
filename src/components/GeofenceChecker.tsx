import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeofenceLocation } from '../types';
import { checkGeofence, formatDistance } from '../utils/geofence';
import { MapPin, Navigation, CheckCircle2, AlertTriangle, Compass, RefreshCw, ShieldAlert, Satellite } from 'lucide-react';

interface GeofenceCheckerProps {
  location: GeofenceLocation;
  onLocationVerified: (
    coords: { lat: number; lng: number },
    withinGeofence: boolean,
    distanceMeters: number,
    gpsAcquired: boolean
  ) => void;
}

export const GeofenceChecker: React.FC<GeofenceCheckerProps> = ({
  location,
  onLocationVerified,
}) => {
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [gpsAcquired, setGpsAcquired] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRealGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser or device.');
      setGpsLoading(false);
      setGpsAcquired(false);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserCoords(coords);
        setGpsAccuracy(pos.coords.accuracy);
        setGpsAcquired(true);
        setLastUpdated(new Date());
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsAcquired(false);
        let errorMsg = 'Failed to acquire GPS location.';
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'GPS Location Permission Denied. Please enable location access in your browser or device settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS Satellite position unavailable. Ensure your device GPS/Location service is turned on.';
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'GPS Request Timed Out. Please check your network & GPS signal and retry.';
        }
        setGpsError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  // Fetch real GPS on mount and whenever selected location changes
  useEffect(() => {
    fetchRealGPS();
  }, [fetchRealGPS, location.id]);

  // Compute geofence status whenever userCoords or location changes
  const result = userCoords
    ? checkGeofence(userCoords.lat, userCoords.lng, location)
    : { withinGeofence: false, distanceMeters: 0 };

  // Store callback in ref to prevent infinite re-render loops
  const onLocationVerifiedRef = useRef(onLocationVerified);
  useEffect(() => {
    onLocationVerifiedRef.current = onLocationVerified;
  }, [onLocationVerified]);

  useEffect(() => {
    if (gpsAcquired && userCoords) {
      onLocationVerifiedRef.current(userCoords, result.withinGeofence, result.distanceMeters, true);
    } else {
      onLocationVerifiedRef.current({ lat: 0, lng: 0 }, false, 0, false);
    }
  }, [
    userCoords?.lat,
    userCoords?.lng,
    location.id,
    gpsAcquired,
    result.withinGeofence,
    result.distanceMeters,
  ]);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5 text-white">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
              <span>Actual Device GPS Scan</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                Required
              </span>
            </h3>
            <p className="text-xs text-slate-400">{location.name} ({location.radiusMeters}m radius)</p>
          </div>
        </div>

        {/* Status Pill */}
        {gpsAcquired && (
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              result.withinGeofence
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {result.withinGeofence ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inside Zone ({formatDistance(result.distanceMeters)})</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Outside Radius ({formatDistance(result.distanceMeters)})</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* GPS Acquiring Loading State */}
      {gpsLoading && (
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full animate-bounce">
            <Satellite className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-200">Acquiring Actual Satellite GPS Signal...</p>
            <p className="text-xs text-slate-400 mt-1">
              Please allow browser location access prompt if requested.
            </p>
          </div>
        </div>
      )}

      {/* GPS Error State */}
      {!gpsLoading && (gpsError || !gpsAcquired) && (
        <div className="bg-rose-950/40 p-5 rounded-2xl border border-rose-500/40 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-200">Actual GPS Location Required</h4>
              <p className="text-xs text-rose-300/80 leading-relaxed">
                {gpsError || 'Device GPS location could not be verified.'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              id="btn-retry-gps"
              onClick={fetchRealGPS}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Retry Actual Device GPS</span>
            </button>
          </div>
        </div>
      )}

      {/* GPS Success & Distance Gauge */}
      {!gpsLoading && gpsAcquired && userCoords && (
        <div className="space-y-4">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Target Radius: {location.radiusMeters}m</span>
              <span>Your Distance: <strong className={result.withinGeofence ? 'text-emerald-400' : 'text-amber-400'}>{result.distanceMeters}m</strong></span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  result.withinGeofence
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-amber-500 to-rose-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(10, (result.distanceMeters / (location.radiusMeters * 2)) * 100))}%`,
                }}
              />
            </div>

            <p className="text-xs text-slate-400 text-center">
              {result.withinGeofence
                ? '✅ Real GPS position confirmed inside authorized office perimeter.'
                : '⚠️ Real GPS position is outside designated office radius. Clock-in will be flagged for review.'}
            </p>
          </div>

          {/* GPS Telemetry Box */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>LAT: {userCoords.lat.toFixed(6)}, LNG: {userCoords.lng.toFixed(6)}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                {gpsAccuracy && <span>Accuracy: ±{Math.round(gpsAccuracy)}m</span>}
                {lastUpdated && <span>Updated: {lastUpdated.toLocaleTimeString()}</span>}
              </div>
            </div>

            <button
              id="btn-refresh-gps"
              onClick={fetchRealGPS}
              disabled={gpsLoading}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh GPS</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
