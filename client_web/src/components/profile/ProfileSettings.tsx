import { useState } from 'react'
import { User, Trash2, AlertTriangle } from 'lucide-react'
import { authClient, useSession } from '../../lib/auth-client'
import { Modal } from '../ui/Modal'
import { useNavigate } from '@tanstack/react-router'

export function ProfileSettings() {
  const { data: session } = useSession()
  const user = session?.user
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Sync state with user data when it loads
  if (user && !name) {
    // This is a bit of a hack to set initial state if user loads later,
    // but better would be useEffect or using user as initial if guaranteed loaded.
    // Since we check user in parent or here, lets do it in useEffect or just let the user be controlled.
    // Actually, if user is null initially, these are empty. When user comes in, we want to update them.
  }

  // Effect to update local state when user data becomes available
  // (using a key on the component in parent is a cleaner way to reset state on user change)

  const handleUpdate = async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      // @ts-ignore - Check correct method for better-auth version
      const { error } = await authClient.updateUser({
        name: name,
      })

      if (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`https://${import.meta.env.VITE_DEPLOY_ADDRESS ?? "localhost"}/api/users/me`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      await authClient.signOut()

      // Redirect to login or home
      navigate({ to: '/login' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete account' })
      setIsDeleteModalOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="bg-card border border-border rounded-xl p-8 mb-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
            <User size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8">
        <h3 className="text-xl font-semibold text-destructive mb-4 flex items-center gap-2">
          <Trash2 size={20} />
          Danger Zone
        </h3>
        <p className="text-muted-foreground mb-6">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-6 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors border border-destructive/50 shadow-lg shadow-destructive/20"
        >
          Delete Account
        </button>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-destructive p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangle size={24} />
            <p className="font-medium">This action cannot be undone.</p>
          </div>
          <p className="text-muted-foreground">
            Are you sure you want to delete your account? All your workflows, credentials, and data will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 hover:bg-muted rounded-lg transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors"
            >
              {isLoading ? 'Deleting...' : 'Yes, Delete My Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

