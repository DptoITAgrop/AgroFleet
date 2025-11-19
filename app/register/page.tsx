'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client' // tu helper

export default function RegisterPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validaciones simples
    if (!email.includes('@')) return setMessage('❌ Email no válido')
    if (fullName.trim().length < 3) return setMessage('❌ Escribe tu nombre completo')
    if (password.length < 6) return setMessage('❌ La contraseña debe tener al menos 6 caracteres')

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 👇 Guardamos metadata que leerá el trigger
        data: { full_name: fullName, phone },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)

    if (error) setMessage(`❌ ${error.message}`)
    else setMessage('✅ Revisa tu correo para confirmar la cuenta.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-4">Registrar empleado</h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="nombre@empresa.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="Nombre y apellidos"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="+34 600 000 000"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        {message && <p className="text-center text-sm mt-3">{message}</p>}

        <p className="text-center text-sm mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
