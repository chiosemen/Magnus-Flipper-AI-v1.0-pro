'use client';

import React from 'react';

interface LocationPickerProps {
  location: string;
  onLocationChange: (location: string) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
}

const radiusOptions = [5, 10, 25, 50, 100, 250];

export function LocationPicker({
  location,
  onLocationChange,
  radius,
  onRadiusChange,
}: LocationPickerProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Location & Radius
      </label>
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Enter city, zip code, or address"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    onLocationChange(`${position.coords.latitude}, ${position.coords.longitude}`);
                  },
                  (error) => {
                    console.error('Geolocation error:', error);
                  }
                );
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500"
            title="Use my location"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <select
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {radiusOptions.map((r) => (
            <option key={r} value={r}>
              {r} km
            </option>
          ))}
        </select>
      </div>
      {location && (
        <p className="text-xs text-gray-500">
          Searching within {radius}km of {location}
        </p>
      )}
    </div>
  );
}
