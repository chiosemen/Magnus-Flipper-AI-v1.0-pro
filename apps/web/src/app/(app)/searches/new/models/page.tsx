'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWizard } from '@/lib/wizard-context'
import { getModelsForManufacturer } from '../ui-config'
import { ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ModelsStep() {
  const router = useRouter()
  const { data, updateData } = useWizard()
  const [selectedModels, setSelectedModels] = useState<string[]>(data.models || [])

  useEffect(() => {
    if (!data.category || !data.manufacturer) {
      router.push('/searches/new/category')
    }
  }, [data.category, data.manufacturer, router])

  if (!data.category || !data.manufacturer) return null

  const modelSeries = getModelsForManufacturer(data.manufacturer)

  const handleToggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    )
  }

  const handleToggleSeries = (series: string[]) => {
    const allSelected = series.every((model) => selectedModels.includes(model))
    if (allSelected) {
      setSelectedModels((prev) => prev.filter((m) => !series.includes(m)))
    } else {
      setSelectedModels((prev) => {
        const merged = [...prev]
        series.forEach((model) => {
          if (!merged.includes(model)) {
            merged.push(model)
          }
        })
        return merged
      })
    }
  }

  const handleContinue = () => {
    updateData({ models: selectedModels })
    router.push('/searches/new/filters')
  }

  const handleSkip = () => {
    updateData({ models: [] })
    router.push('/searches/new/filters')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Select specific models (optional)</h2>
            <div className="flex gap-2">
              <Badge variant="outline">{data.category}</Badge>
              <Badge variant="outline">{data.manufacturer}</Badge>
            </div>
          </div>
          <p className="text-muted-foreground mb-6">
            Choose which models to monitor, or skip to monitor all models
            {selectedModels.length > 0 && (
              <span className="ml-2 text-cyan-mint">
                • {selectedModels.length} selected
              </span>
            )}
          </p>

          {modelSeries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No specific models configured for this manufacturer yet.
              </p>
              <p className="text-sm text-muted-foreground">
                You&apos;ll monitor all models from this manufacturer.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {modelSeries.map((series) => {
                const allSelected = series.models.every((model) =>
                  selectedModels.includes(model)
                )
                const someSelected = series.models.some((model) =>
                  selectedModels.includes(model)
                )

                return (
                  <div key={series.series} className="space-y-3">
                    <button
                      onClick={() => handleToggleSeries(series.models)}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 w-full text-left transition-all hover:border-cyan-mint/60 hover:bg-muted/50"
                    >
                      <div className="flex h-5 w-5 items-center justify-center">
                        {allSelected ? (
                          <CheckSquare className="h-5 w-5 text-cyan-mint" />
                        ) : someSelected ? (
                          <div className="h-5 w-5 rounded border-2 border-cyan-mint bg-cyan-mint/20" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-semibold">{series.series}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {series.models.length} models
                      </Badge>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-8">
                      {series.models.map((model) => {
                        const isSelected = selectedModels.includes(model)

                        return (
                          <button
                            key={model}
                            onClick={() => handleToggleModel(model)}
                            className={cn(
                              'flex items-center gap-3 rounded-lg border px-4 py-2 text-left text-sm transition-all',
                              isSelected
                                ? 'border-cyan-mint/60 bg-cyan-mint/10'
                                : 'border-border/60 bg-muted/20 hover:border-cyan-mint/40 hover:bg-muted/40'
                            )}
                          >
                            <div className="flex h-4 w-4 items-center justify-center">
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-cyan-mint" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <span>{model}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={() => router.push('/searches/new/manufacturer')} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleSkip} variant="outline">
            Skip (All Models)
          </Button>
          <Button onClick={handleContinue} disabled={selectedModels.length === 0}>
            Continue
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
