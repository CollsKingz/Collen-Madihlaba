import { GeofenceLocation } from '../types';

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface GeofenceCheckResult {
  withinGeofence: boolean;
  distanceMeters: number;
  locationName: string;
  allowedRadiusMeters: number;
}

export function checkGeofence(
  userLat: number,
  userLng: number,
  targetLocation: GeofenceLocation
): GeofenceCheckResult {
  const distance = calculateDistanceMeters(
    userLat,
    userLng,
    targetLocation.lat,
    targetLocation.lng
  );
  return {
    withinGeofence: distance <= targetLocation.radiusMeters,
    distanceMeters: distance,
    locationName: targetLocation.name,
    allowedRadiusMeters: targetLocation.radiusMeters,
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}
