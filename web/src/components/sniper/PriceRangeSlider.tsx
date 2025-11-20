'use client';

import React, { useState } from 'react';

interface PriceRangeSliderProps {
  minPrice: number | null;
  maxPrice: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
}

export function PriceRangeSlider({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: PriceRangeSliderProps) {
  const [noMin, setNoMin] = useState(minPrice === null);
  const [noMax, setNoMax] = useState(maxPrice === null);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Price Range
      </label>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              placeholder="Min"
              value={noMin ? '' : (minPrice || '')}
              onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : null)}
              disabled={noMin}
              className={`
                w-full pl-7 pr-3 py-2 border rounded-lg
                ${noMin ? 'bg-gray-100 text-gray-400' : 'bg-white'}
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              `}
            />
          </div>
          <label className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={noMin}
              onChange={(e) => {
                setNoMin(e.target.checked);
                if (e.target.checked) onMinChange(null);
              }}
              className="rounded text-indigo-500"
            />
            <span className="text-xs text-gray-500">No min</span>
          </label>
        </div>

        <span className="text-gray-400">—</span>

        <div className="flex-1">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              placeholder="Max"
              value={noMax ? '' : (maxPrice || '')}
              onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : null)}
              disabled={noMax}
              className={`
                w-full pl-7 pr-3 py-2 border rounded-lg
                ${noMax ? 'bg-gray-100 text-gray-400' : 'bg-white'}
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              `}
            />
          </div>
          <label className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={noMax}
              onChange={(e) => {
                setNoMax(e.target.checked);
                if (e.target.checked) onMaxChange(null);
              }}
              className="rounded text-indigo-500"
            />
            <span className="text-xs text-gray-500">No max</span>
          </label>
        </div>
      </div>
    </div>
  );
}
