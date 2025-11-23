'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [email, setEmail] = useState('founder@magnus.ai')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Profile, theme, and account controls.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button>Save profile</Button>
          </CardContent>
        </Card>

        <Card className="neon-glow-hover">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Switch
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              label={darkMode ? 'Dark mode' : 'Light mode'}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="neon-glow-hover">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Delete your account and purge data across Supabase and alert worker queues.
          </p>
          <Button variant="destructive">Delete account</Button>
        </CardContent>
      </Card>
    </div>
  )
}
