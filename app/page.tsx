'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const signUp = async () => {
    await supabase.auth.signUp({ email, password })
    alert('Check your email')
  }

  const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    console.log('DATA:', data)
    console.log('ERROR:', error)

    if (error) {
      alert(error.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="p-10">
      <input placeholder="email" onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="password" type="password" onChange={(e) => setPassword(e.target.value)} />

      <button onClick={signUp}>Sign up</button>
      <button onClick={login}>Login</button>
    </div>
  )
}