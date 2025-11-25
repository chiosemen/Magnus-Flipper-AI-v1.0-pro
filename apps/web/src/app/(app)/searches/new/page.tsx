'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { CATEGORIES, getManufacturersForCategory, getModelsForManufacturer } from '@magnus-flipper-ai/ui-config'
import type { Condition } from '@magnus-flipper-ai/core'
import { useSavedSearches } from '@/hooks/use-app-api'

const steps = ['Category', 'Manufacturer', 'Models', 'Filters', 'Review']
const conditions: Condition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']

export default function SavedSearchWizard() {
  const router = useRouter()
  const { create } = useSavedSearches()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [state, setState] = useState({
    name: 'My Flip Search',
    category: 'phones',
    manufacturer: '',
    models: [] as string[],
    minPrice: 0,
    maxPrice: 2000,
    radiusMiles: 50,
    conditions: ['GOOD', 'LIKE_NEW'] as Condition[],
    active: true,
  })

  const manufacturers = useMemo(
    () => getManufacturersForCategory(state.category),
    [state.category]
  )
  const modelSeries = useMemo(
    () => getModelsForManufacturer(state.manufacturer || manufacturers[0]?.id || ''),
    [state.manufacturer, manufacturers]
  )

  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1))
  const prev = () => setStep((s) => Math.max(0, s - 1))

  const toggleModel = (model: string) => {
    setState((prev) => ({
      ...prev,
      models: prev.models.includes(model)
        ? prev.models.filter((m) => m !== model)
        : [...prev.models, model],
    }))
  }

  const toggleCondition = (condition: Condition) => {
    setState((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }))
  }

  const handleCreate = async () => {
    setSaving(true)
    await create(state)
    setSaving(false)
    router.push('/saved-searches')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Search Wizard</h1>
          <p className="text-muted-foreground">Five quick steps to monitor your next flip.</p>
        </div>
        <Badge variant="secondary">Step {step + 1} / 5</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 neon-glow-hover">
          <CardHeader>
            <CardTitle>{steps[step]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CATEGORIES.map((category: { id: string; label: string }) => (
                  <button
                    key={category.id}
                    className={`rounded-xl border p-4 text-left transition ${
                      state.category === category.id
                        ? 'border-cyan-mint bg-cyan-mint/10'
                        : 'border-border/60 bg-muted/20 hover:border-cyan-mint/50'
                    }`}
                    onClick={() => setState((prev) => ({ ...prev, category: category.id }))}
                  >
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-semibold">{category.label}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {manufacturers.map((manu: { id: string; label: string }) => (
                  <button
                    key={manu.id}
                    className={`rounded-xl border p-4 text-left transition ${
                      state.manufacturer === manu.id
                        ? 'border-cyan-mint bg-cyan-mint/10'
                        : 'border-border/60 bg-muted/20 hover:border-cyan-mint/50'
                    }`}
                    onClick={() => setState((prev) => ({ ...prev, manufacturer: manu.id }))}
                  >
                    <p className="text-sm text-muted-foreground">Brand</p>
                    <p className="font-semibold">{manu.label}</p>
                  </button>
                ))}
                {manufacturers.length === 0 && (
                  <p className="text-muted-foreground">Select a category first.</p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {modelSeries.map((series: { series: string; models: string[] }) => (
                  <div key={series.series} className="rounded-xl border border-border/60 p-4">
                    <p className="font-semibold">{series.series}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {series.models.map((model: string) => (
                        <button
                          key={model}
                          onClick={() => toggleModel(model)}
                          className={`rounded-full px-3 py-2 text-sm transition ${
                            state.models.includes(model)
                              ? 'bg-cyan-mint/20 text-cyan-mint border border-cyan-mint/60'
                              : 'bg-muted/40 text-muted-foreground border border-border/60 hover:border-cyan-mint/50'
                          }`}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {modelSeries.length === 0 && (
                  <p className="text-muted-foreground">Choose a manufacturer to see models.</p>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Name</label>
                  <Input
                    value={state.name}
                    onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="NYC iPhone flips"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Radius (miles)</label>
                  <input
                    type="range"
                    min={1}
                    max={250}
                    value={state.radiusMiles}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, radiusMiles: Number(e.target.value) }))
                    }
                    className="w-full accent-cyan-mint"
                  />
                  <p className="text-xs text-muted-foreground">{state.radiusMiles} miles</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Min price</label>
                  <Input
                    type="number"
                    value={state.minPrice}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, minPrice: Number(e.target.value) }))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Max price</label>
                  <Input
                    type="number"
                    value={state.maxPrice}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))
                    }
                    placeholder="2000"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((condition) => (
                      <button
                        key={condition}
                        onClick={() => toggleCondition(condition)}
                        className={`rounded-full px-3 py-2 text-sm transition ${
                          state.conditions.includes(condition)
                            ? 'bg-cyan-mint/20 text-cyan-mint border border-cyan-mint/60'
                            : 'bg-muted/40 text-muted-foreground border border-border/60 hover:border-cyan-mint/50'
                        }`}
                      >
                        {condition.toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Switch
                    checked={state.active}
                    onChange={(e) => setState((prev) => ({ ...prev, active: e.target.checked }))}
                    label={state.active ? 'Active' : 'Paused'}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{state.name}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-semibold">{state.category}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Manufacturer</p>
                    <p className="font-semibold">{state.manufacturer || 'Any'}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Models</p>
                    <p className="font-semibold">
                      {state.models.length ? state.models.join(', ') : 'Any'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-semibold">
                      ${state.minPrice} - ${state.maxPrice}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Radius</p>
                    <p className="font-semibold">{state.radiusMiles} miles</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">Condition</p>
                    <p className="font-semibold">
                      {state.conditions.map((c) => c.toLowerCase()).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle>Step controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {steps.map((label, index) => (
                <div key={label} className="flex items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                      index === step
                        ? 'border-cyan-mint bg-cyan-mint/20 text-cyan-mint'
                        : index < step
                        ? 'border-green-500 bg-green-500/20 text-green-400'
                        : 'border-border/60 bg-muted/20 text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="mx-1 h-[1px] w-6 bg-border/60" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={step === 0} onClick={prev}>
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={next}>Next</Button>
              ) : (
                <Button onClick={handleCreate} disabled={saving}>
                  {saving ? 'Saving...' : 'Create search'}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Wired to POST /api/saved-searches with Supabase JWT auth header.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
