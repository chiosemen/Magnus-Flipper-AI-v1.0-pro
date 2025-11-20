'use client';

import React from 'react';

interface SummaryPanelProps {
  query: string;
  location: string;
  radius: number;
  marketplace: string;
  maxAlertsPerDay: number;
  telegramEnabled: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function SummaryPanel({
  query,
  location,
  radius,
  marketplace,
  maxAlertsPerDay,
  telegramEnabled,
  whatsappEnabled,
  emailEnabled,
  onSaveDraft,
  onSubmit,
  isSubmitting,
}: SummaryPanelProps) {
  // Estimate volume based on marketplace and query
  const estimatedVolume = marketplace === 'facebook' ? 15 : marketplace === 'ebay' ? 25 : 10;

  return (
    <div className="bg-white border rounded-xl p-6 sticky top-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Search Summary</h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
          Odds View
        </span>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div className="flex items-start gap-3">
          <span className="text-gray-400 mt-0.5">🔍</span>
          <div>
            <p className="text-xs text-gray-500">Search</p>
            <p className="text-sm font-medium text-gray-900">
              {query || 'Not set'} {location && `within ${radius}km of ${location}`}
            </p>
          </div>
        </div>

        {/* Expected volume */}
        <div className="flex items-start gap-3">
          <span className="text-gray-400 mt-0.5">📊</span>
          <div>
            <p className="text-xs text-gray-500">Expected volume</p>
            <p className="text-sm font-medium text-gray-900">
              ~{estimatedVolume} listings/day
            </p>
          </div>
        </div>

        {/* Alert cap */}
        <div className="flex items-start gap-3">
          <span className="text-gray-400 mt-0.5">🔔</span>
          <div>
            <p className="text-xs text-gray-500">Alert frequency cap</p>
            <p className="text-sm font-medium text-gray-900">
              {maxAlertsPerDay}/day
            </p>
          </div>
        </div>

        {/* Channels */}
        <div className="flex items-start gap-3">
          <span className="text-gray-400 mt-0.5">📡</span>
          <div>
            <p className="text-xs text-gray-500">Channels</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={telegramEnabled ? 'text-green-500' : 'text-gray-300'}>
                {telegramEnabled ? '✓' : '✗'} Telegram
              </span>
              <span className={whatsappEnabled ? 'text-green-500' : 'text-gray-300'}>
                {whatsappEnabled ? '✓' : '✗'} WhatsApp
              </span>
              <span className={emailEnabled ? 'text-green-500' : 'text-gray-300'}>
                {emailEnabled ? '✓' : '✗'} Email
              </span>
            </div>
          </div>
        </div>

        <hr className="my-4" />

        {/* Estimated stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Match rate</p>
            <p className="text-lg font-bold text-indigo-600">~23%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Avg profit</p>
            <p className="text-lg font-bold text-green-600">$47</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !query}
            className={`
              flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-colors
              ${isSubmitting || !query
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
              }
            `}
          >
            {isSubmitting ? 'Creating...' : 'Start Sniping'}
          </button>
        </div>
      </div>
    </div>
  );
}
