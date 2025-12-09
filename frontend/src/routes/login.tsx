import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { signIn } from '../lib/auth-client'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector((state) => state.auth.isLoading)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    dispatch(loginStart())

    try {
      const result = await signIn.email({
        email,
        password,
        fetchOptions: {
          onError: (ctx) => {
            const errorMsg = ctx.error.message || 'Invalid email or password'
            setError(errorMsg)
            dispatch(loginFailure(errorMsg))
          },
        },
      })

      if (result.error) {
        const errorMsg = result.error.message || 'Invalid email or password'
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
      const errorMsg = err?.message || 'Invalid email or password'
      setError(errorMsg)
      dispatch(loginFailure(errorMsg))
      console.error('Login error:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">Sign in to your automation dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

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
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primary/80">
            Create one
          </Link>
        </div>
      </div>
    </div>
  )
}
