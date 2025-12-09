import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { signUp } from '../lib/auth-client'
import { useAppDispatch } from '../store/hooks'
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice'

export const Route = createFileRoute('/register')({
  component: Register,
})

function Register() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    dispatch(loginStart())

    try {
      const result = await signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
        fetchOptions: {
          onError: (ctx) => {
            const errorMsg = ctx.error.message || 'Failed to create account'
            setError(errorMsg)
            dispatch(loginFailure(errorMsg))
          },
        },
      })

      if (result.error) {
        const errorMsg = result.error.message || 'Failed to create account. Please try again.'
        setError(errorMsg)
        dispatch(loginFailure(errorMsg))
        return
      }

      if (result.data?.user) {
        dispatch(loginSuccess({
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
          avatarUrl: result.data.user.image || undefined,
        }))
      }

      navigate({ to: '/dashboard' })
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create account. Please try again.'
      setError(errorMsg)
      dispatch(loginFailure(errorMsg))
      console.error('Registration error:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-muted-foreground">Start building your automations today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
