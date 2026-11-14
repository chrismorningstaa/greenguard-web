import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, ShieldX, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [accessDenied, setAccessDenied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setAccessDenied(false)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.'
      if (msg.toLowerCase().includes('restricted') || msg.toLowerCase().includes('mao')) {
        setAccessDenied(true)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E5128] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Access Denied Banner */}
        {accessDenied && (
          <div className="mb-4 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-red-600 px-5 py-4 flex items-start gap-3">
              <ShieldX size={22} className="text-white shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Access Denied</p>
                <p className="text-red-100 text-xs mt-0.5">This account is not authorized to use the MAO dashboard.</p>
              </div>
              <button onClick={() => setAccessDenied(false)} className="text-red-200 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-3 bg-red-50">
              <p className="text-xs text-red-700">
                Only <strong>Municipal Agriculture Office officers</strong> may sign in here. If you are a farmer, please use the <strong>GreenGuard mobile app</strong> instead.
              </p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E5128] mb-3">
              <Leaf size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">GreenGuard</h1>
            <p className="text-sm text-gray-500 mt-1">MAO Officer Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128] focus:border-transparent"
                placeholder="officer@municipality.gov.ph"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#1E5128] hover:bg-[#2D6A4F] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Access restricted to Municipal Agriculture Office personnel
          </p>
        </div>
      </div>
    </div>
  )
}
