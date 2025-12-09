import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { User, Trash2 } from 'lucide-react'

export const Route = createFileRoute('/profile')({
  component: Profile,
})

function Profile() {
  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

        <div className="bg-card border border-border rounded-xl p-8 mb-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
              <User size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">John Doe</h2>
              <p className="text-muted-foreground">john.doe@example.com</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Display Name</label>
              <input
                type="text"
                defaultValue="John Doe"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
              <input
                type="email"
                defaultValue="john.doe@example.com"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors">
              Save Changes
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
          <button className="px-6 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors border border-destructive/50 shadow-lg shadow-destructive/20">
            Delete Account
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
