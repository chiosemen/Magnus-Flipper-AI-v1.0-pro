'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import type { MarketplaceSite, Condition } from '@magnus-flipper-ai/core'

export interface WizardData {
  name?: string
  category?: string
  manufacturer?: string
  models?: string[]
  minPrice?: number
  maxPrice?: number
  radiusMiles?: number
  locationCity?: string
  conditions?: Condition[]
  sites?: MarketplaceSite[]
  maxResultsPerRun?: number
}

interface WizardContextValue {
  data: WizardData
  updateData: (updates: Partial<WizardData>) => void
  resetData: () => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WizardData>({})

  const updateData = (updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const resetData = () => {
    setData({})
  }

  return (
    <WizardContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider')
  }
  return context
}
