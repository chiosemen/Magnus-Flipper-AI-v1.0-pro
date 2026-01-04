'use client'

import { useState, useEffect } from 'react'

type Region = 'US' | 'UK'

interface RegionData {
  region: Region
  isLoading: boolean
  currency: string
  currencySymbol: string
}

export function useRegion(): RegionData {
  const [region, setRegion] = useState<Region>('US')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const detectRegion = () => {
      // Method 1: Check timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const ukTimezones = ['Europe/London', 'Europe/Dublin', 'Europe/Belfast']

      if (ukTimezones.some(tz => timezone.includes(tz) || timezone.includes('Europe/London'))) {
        return 'UK'
      }

      // Method 2: Check language/locale
      const language = navigator.language || (navigator.languages?.[0] as string) || ''
      if (language.includes('en-GB') || language.includes('en-IE')) {
        return 'UK'
      }

      // Method 3: Check for UK-specific locale indicators
      const locale = Intl.DateTimeFormat().resolvedOptions().locale
      if (locale?.includes('GB') || locale?.includes('IE')) {
        return 'UK'
      }

      // Default to US
      return 'US'
    }

    try {
      const detectedRegion = detectRegion()
      setRegion(detectedRegion)
    } catch (error) {
      console.warn('Region detection failed, defaulting to US:', error)
      setRegion('US')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const currencyData = {
    US: { currency: 'USD', currencySymbol: '$' },
    UK: { currency: 'GBP', currencySymbol: '£' },
  }

  return {
    region,
    isLoading,
    ...currencyData[region],
  }
}

// Optional: IP-based detection (more accurate, requires API)
export async function detectRegionByIP(): Promise<Region> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()

    const ukCountries = ['GB', 'UK', 'IE'] // Include Ireland
    if (ukCountries.includes(data.country_code)) {
      return 'UK'
    }
    return 'US'
  } catch (error) {
    console.warn('IP detection failed:', error)
    return 'US'
  }
}
