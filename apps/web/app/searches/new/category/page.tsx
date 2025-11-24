'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWizard } from '@/lib/wizard-context'
import { CATEGORIES } from '@magnus-flipper-ai/ui-config'
import { ChevronRight, Smartphone, Laptop, Car, Bike, Tv, Camera, Gamepad, WashingMachine, Sofa, Watch } from 'lucide-react'

const iconMap: Record<string, any> = {
  smartphone: Smartphone,
  laptop: Laptop,
  car: Car,
  bike: Bike,
  tv: Tv,
  camera: Camera,
  gamepad: Gamepad,
  'washing-machine': WashingMachine,
  sofa: Sofa,
  watch: Watch,
}

export default function CategoryStep() {
  const router = useRouter()
  const { data, updateData } = useWizard()

  const handleSelect = (categoryId: string) => {
    updateData({ category: categoryId, manufacturer: undefined, models: [] })
    router.push('/searches/new/manufacturer')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">What are you looking to flip?</h2>
          <p className="text-muted-foreground mb-6">
            Choose a category to start monitoring marketplaces
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((category) => {
              const Icon = iconMap[category.icon] || Smartphone
              const isSelected = data.category === category.id

              return (
                <button
                  key={category.id}
                  onClick={() => handleSelect(category.id)}
                  className={`group relative flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all hover:border-cyan-mint/60 hover:bg-muted/50 ${
                    isSelected ? 'border-cyan-mint bg-cyan-mint/10' : 'border-border'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br transition-all ${
                    isSelected
                      ? 'from-cyan-mint/20 to-indigo-blue/20'
                      : 'from-muted to-muted/50 group-hover:from-cyan-mint/10 group-hover:to-indigo-blue/10'
                  }`}>
                    <Icon className={`h-6 w-6 ${isSelected ? 'text-cyan-mint' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{category.label}</h3>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => router.push('/searches')} variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  )
}
