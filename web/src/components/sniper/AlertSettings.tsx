'use client';

import React from 'react';

interface AlertSettingsProps {
  filterByUndervalue: boolean;
  onFilterToggle: (enabled: boolean) => void;
  undervalueThreshold: number;
  onThresholdChange: (value: number) => void;
  maxAlertsPerDay: number;
  onMaxAlertsChange: (value: number) => void;
}

const alertCapOptions = [5, 10, 25, 50, 100];

export function AlertSettings({
  filterByUndervalue,
  onFilterToggle,
  undervalueThreshold,
  onThresholdChange,
  maxAlertsPerDay,
  onMaxAlertsChange,
}: AlertSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Alert Logic</h3>

      {/* Undervalue filter toggle */}
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Only show deals below market price
          </span>
          <button
            type="button"
            onClick={() => onFilterToggle(!filterByUndervalue)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${filterByUndervalue ? 'bg-indigo-500' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${filterByUndervalue ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </label>

        {filterByUndervalue && (
          <div className="pl-4 border-l-2 border-indigo-200">
            <label className="block text-sm text-gray-600 mb-2">
              Minimum discount: {undervalueThreshold}%
            </label>
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={undervalueThreshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10%</span>
              <span>30%</span>
              <span>50%</span>
            </div>
          </div>
        )}
      </div>

      {/* Max alerts per day */}
      <div>
        <label className="block text-sm text-gray-600 mb-2">
          Max alerts per day
        </label>
        <div className="flex gap-2">
          {alertCapOptions.map((cap) => (
            <button
              key={cap}
              type="button"
              onClick={() => onMaxAlertsChange(cap)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${maxAlertsPerDay === cap
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {cap}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Limit notifications to avoid alert fatigue
        </p>
      </div>
    </div>
  );
}
