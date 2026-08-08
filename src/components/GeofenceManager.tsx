import React, { useState, useEffect } from 'react';
import { GeofenceLocation } from '../types';
import { getGeofences, saveGeofences } from '../utils/storage';
import { MapPin, Plus, Trash2, Edit3, Check, X, ShieldCheck, Compass } from 'lucide-react';

export const GeofenceManager: React.FC = () => {
  const [geofences, setGeofences] = useState<GeofenceLocation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New location form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newLat, setNewLat] = useState<number>(37.7749);
  const [newLng, setNewLng] = useState<number>(-122.4194);
  const [newRadius, setNewRadius] = useState<number>(150);

  useEffect(() => {
    setGeofences(getGeofences());
  }, []);

  const handleCreateGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newLoc: GeofenceLocation = {
      id: `geo-${Date.now()}`,
      name: newName,
      address: newAddress || 'Company Branch Office',
      lat: Number(newLat),
      lng: Number(newLng),
      radiusMeters: Number(newRadius),
      active: true,
    };

    const updated = [...geofences, newLoc];
    setGeofences(updated);
    saveGeofences(updated);

    // Reset form
    setNewName('');
    setNewAddress('');
    setShowAddForm(false);
  };

  const handleDeleteGeofence = (id: string) => {
    if (geofences.length <= 1) {
      alert('You must keep at least one active geofence location.');
      return;
    }
    const updated = geofences.filter((g) => g.id !== id);
    setGeofences(updated);
    saveGeofences(updated);
  };

  const handleToggleActive = (id: string) => {
    const updated = geofences.map((g) => (g.id === id ? { ...g, active: !g.active } : g));
    setGeofences(updated);
    saveGeofences(updated);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-white">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Geofence Zone Perimeter Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Office Geofence Setup
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Define GPS coordinates and allowed distance radiuses for employee check-ins.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Office Location</span>
        </button>
      </div>

      {/* Add Geofence Form Modal / Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreateGeofence}
          className="bg-slate-900/90 rounded-2xl border border-indigo-500/30 p-6 shadow-2xl space-y-4"
        >
          <h3 className="font-bold text-base text-indigo-300">New Geofenced Office Zone</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Office Name:</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Northside R&D Hub"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Street Address:</label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="e.g. 500 Enterprise Way, CA 94105"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Latitude:</label>
              <input
                type="number"
                step="0.0001"
                required
                value={newLat}
                onChange={(e) => setNewLat(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Longitude:</label>
              <input
                type="number"
                step="0.0001"
                required
                value={newLng}
                onChange={(e) => setNewLng(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Allowed Radius (Meters):</label>
              <input
                type="number"
                required
                min={20}
                max={2000}
                value={newRadius}
                onChange={(e) => setNewRadius(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              Save Geofence Zone
            </button>
          </div>
        </form>
      )}

      {/* Geofence List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {geofences.map((geo) => (
          <div
            key={geo.id}
            className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{geo.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{geo.address}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleActive(geo.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                    geo.active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {geo.active ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Coordinates:</span>
                  <span className="text-indigo-300">{geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Allowed Perimeter:</span>
                  <span className="text-emerald-400 font-bold">{geo.radiusMeters} Meters</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800/80">
              <button
                onClick={() => handleDeleteGeofence(geo.id)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Delete Geofence"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
