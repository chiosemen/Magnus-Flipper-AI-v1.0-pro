'use client'

import { usePathname } from 'next/navigation'
import { WizardProvider } from '@/lib/wizard-context'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  { id: 1, name: 'Category', path: '/searches/new/category' },
  { id: 2, name: 'Manufacturer', path: '/searches/new/manufacturer' },
  { id: 3, name: 'Models', path: '/searches/new/models' },
  { id: 4, name: 'Filters', path: '/searches/new/filters' },
  { id: 5, name: 'Review', path: '/searches/new/review' },
]

function WizardStepper() {
  const pathname = usePathname()

  const currentStepIndex = steps.findIndex((step) => pathname?.startsWith(step.path))
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : 1

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-center gap-2">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.id
          const isComplete = currentStep > step.id

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    isComplete && 'border-cyan-mint bg-cyan-mint/20 text-cyan-mint',
                    isActive && 'border-indigo-blue bg-indigo-blue/20 text-indigo-blue',
                    !isActive && !isComplete && 'border-border bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isActive && 'text-foreground',
                    !isActive && 'text-muted-foreground hidden sm:inline'
                  )}
                >
                  {step.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-8 sm:w-16 transition-colors',
                    currentStep > step.id ? 'bg-cyan-mint' : 'bg-border'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default function NewSearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <WizardProvider>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Search</h1>
          <p className="text-muted-foreground">
            Set up alerts for marketplace flips in just a few steps
          </p>
        </div>
        <WizardStepper />
        {children}
      </div>
    </WizardProvider>
  )
}
