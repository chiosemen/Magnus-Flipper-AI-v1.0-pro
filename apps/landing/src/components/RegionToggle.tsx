'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

interface RegionToggleProps {
  currentRegion: 'US' | 'UK'
  onRegionChange: (region: 'US' | 'UK') => void
}

export default function RegionToggle({ currentRegion, onRegionChange }: RegionToggleProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-carbon-900 border border-carbon-800 hover:border-carbon-700 transition-colors"
      >
        <Globe className="w-4 h-4 text-carbon-400" />
        <span className="text-sm text-carbon-300">
          {currentRegion === 'UK' ? '\ud83c\uddec\ud83c\udde7 UK' : '\ud83c\uddfa\ud83c\uddf8 US'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-carbon-900 border border-carbon-800 rounded-lg overflow-hidden shadow-xl z-50">
          <button
            onClick={() => { onRegionChange('US'); setIsOpen(false) }}
            className={'w-full px-4 py-2 text-left text-sm hover:bg-carbon-800 transition-colors flex items-center gap-2 ' +
              (currentRegion === 'US' ? 'text-flipper-400' : 'text-carbon-300')}
          >
            \ud83c\uddfa\ud83c\uddf8 United States
          </button>
          <button
            onClick={() => { onRegionChange('UK'); setIsOpen(false) }}
            className={'w-full px-4 py-2 text-left text-sm hover:bg-carbon-800 transition-colors flex items-center gap-2 ' +
              (currentRegion === 'UK' ? 'text-flipper-400' : 'text-carbon-300')}
          >
            \ud83c\uddec\ud83c\udde7 United Kingdom
          </button>
        </div>
      )}
    </div>
  )
}
