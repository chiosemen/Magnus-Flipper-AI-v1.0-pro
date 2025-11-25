'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWizard } from '@/lib/wizard-context'
import { getManufacturersForCategory } from '@magnus-flipper-ai/ui-config'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'

export default function ManufacturerStep() {
  const router = useRouter()
  const { data, updateData } = useWizard()

  useEffect(() => {
    if (!data.category) {
      router.push('/searches/new/category')
    }
  }, [data.category, router])

  if (!data.category) return null

  const manufacturers = getManufacturersForCategory(data.category)

  const handleSelect = (manufacturerId: string) => {
    updateData({ manufacturer: manufacturerId, models: [] })
    router.push('/searches/new/models')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Choose a manufacturer</h2>
            <Badge variant="outline">{data.category}</Badge>
          </div>
          <p className="text-muted-foreground mb-6">
            Select which brand you want to monitor
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {manufacturers.map((manufacturer) => {
              const isSelected = data.manufacturer === manufacturer.id

              return (
                <button
                  key={manufacturer.id}
                  onClick={() => handleSelect(manufacturer.id)}
                  className={`group relative flex flex-col items-center gap-3 rounded-lg border-2 p-4 text-center transition-all hover:border-cyan-mint/60 hover:bg-muted/50 ${
                    isSelected ? 'border-cyan-mint bg-cyan-mint/10' : 'border-border'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-mint">
                      <Check className="h-4 w-4 text-black" />
                    </div>
                  )}
                  <div className={`flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br transition-all ${
                    isSelected
                      ? 'from-cyan-mint/20 to-indigo-blue/20'
                      : 'from-muted to-muted/50 group-hover:from-cyan-mint/10 group-hover:to-indigo-blue/10'
                  }`}>
                    <span className="text-2xl font-bold">{manufacturer.label[0]}</span>
                  </div>
                  <span className="font-semibold text-sm">{manufacturer.label}</span>
                </button>
              )
            })}
          </div>

          {manufacturers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No manufacturers available for this category yet.
              </p>
              <Button onClick={() => router.push('/searches/new/category')} variant="outline" className="mt-4">
                Choose Different Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={() => router.push('/searches/new/category')} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => router.push('/searches/new/models')}
          disabled={!data.manufacturer}
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
