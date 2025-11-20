'use client';

import React from 'react';

interface MarketplaceOption {
  id: string;
  label: string;
  logo: string;
  speed: 'Fast' | 'Medium' | 'Slow';
  coverage: string;
}

interface MarketplaceSelectorProps {
  selected: string;
  onChange: (marketplace: string) => void;
}

const marketplaces: MarketplaceOption[] = [
  { id: 'facebook', label: 'FB Marketplace', logo: '📘', speed: 'Fast', coverage: '95%' },
  { id: 'gumtree', label: 'Gumtree', logo: '🌳', speed: 'Medium', coverage: '80%' },
  { id: 'ebay', label: 'eBay', logo: '🛒', speed: 'Fast', coverage: '99%' },
  { id: 'vinted', label: 'Vinted', logo: '👗', speed: 'Fast', coverage: '90%' },
  { id: 'craigslist', label: 'Craigslist', logo: '📋', speed: 'Slow', coverage: '70%' },
];

export function MarketplaceSelector({ selected, onChange }: MarketplaceSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Select Marketplace
      </label>
      <div className="flex flex-wrap gap-3">
        {marketplaces.map((marketplace) => (
          <button
            key={marketplace.id}
            type="button"
            onClick={() => onChange(marketplace.id)}
            className={`
              relative flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
              ${selected === marketplace.id
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
              }
            `}
            title={`Coverage: ${marketplace.coverage} | Speed: ${marketplace.speed}`}
          >
            <span className="text-xl">{marketplace.logo}</span>
            <span className="font-medium">{marketplace.label}</span>
            {selected === marketplace.id && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-xs text-gray-500">
          {marketplaces.find(m => m.id === selected)?.speed} scan speed • {marketplaces.find(m => m.id === selected)?.coverage} coverage
        </p>
      )}
    </div>
  );
}
