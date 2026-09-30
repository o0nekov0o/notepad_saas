'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.user) router.push('/dashboard')
    })
  }, [router])

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const login = async () => {
    setLoading(true)
    const { error } = await authClient.signIn.email({ email, password })
    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push('/dashboard')
  }

  const signUp = async () => {
    setLoading(true)
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: email.split('@')[0],
    })
    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
        <h1 className="font-bold text-lg">Notepad SaaS</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-blue-500 hover:underline transition">
          Demo
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">
          Un éditeur de notes <span className="text-blue-500">intelligent</span>
        </h1>
        <p className="text-gray-600 max-w-xl mb-8 animate-fade-in-up delay-100">
          Naviguez entre vos notes comme dans un IDE. Multi-onglets, recherche avancée et navigation contextuelle pour une productivité maximale.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-600 hover:scale-[1.02] active:scale-[0.98] transition animate-fade-in-up delay-200"
        >
          Tester l’application
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 px-6 py-12 bg-white border-t">
        <div className="p-4 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-2">Multi-onglets</h3>
          <p className="text-sm text-gray-600">Travaillez sur plusieurs notes en parallèle comme dans Notepad++.</p>
        </div>
        <div className="p-4 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-2">Recherche avancée</h3>
          <p className="text-sm text-gray-600">Recherchez dans une note ou dans l’ensemble de vos notes.</p>
        </div>
        <div className="p-4 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-2">Navigation intelligente</h3>
          <p className="text-sm text-gray-600">Accédez aux notes proches grâce au système de batch contextuel.</p>
        </div>
      </div>

      <div className="flex justify-center px-4 py-10 bg-gray-50">
        <div className="bg-white shadow-xl rounded-xl p-6 w-80 flex flex-col gap-3 animate-fade-in-up">
          <h2 className="text-center font-semibold mb-2">Accéder à votre espace</h2>
          <input
            ref={emailRef}
            type="email"
            placeholder="Email"
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            onChange={(event) => setPassword(event.target.value)}
          />
          <button onClick={login} disabled={loading} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          <button onClick={signUp} disabled={loading} className="bg-gray-200 p-2 rounded hover:bg-gray-300 transition">
            Créer un compte
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 pb-6">
        Projet portfolio — Next.js / Neon
      </div>
    </div>
  )
}