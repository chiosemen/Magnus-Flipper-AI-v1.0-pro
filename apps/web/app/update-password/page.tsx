'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function UpdatePassword() {
  const supabase = supabaseBrowser()
  const [password, setPassword] = useState('')

  const handleUpdate = async () => {
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) alert('Password updated. You can now log in.')
  }

  return (
    <div>
      <h1>Set new password</h1>
      <input
        type="password"
        placeholder="New password"
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleUpdate}>Update password</button>
    </div>
  )
}
