import { useState } from 'react'
import { User, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authClient, useSession } from '../../lib/auth-client'
import { useNavigate } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function ProfileSettings() {
  const { data: session } = useSession()
  const user = session?.user
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Note: AlertDialog controls its own open state usually, but for async action we might control it or just blocking.
  // We can use the open prop if we want manual control, but standard Trigger works well.

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
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            This is how others will see you on the site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback className="text-2xl">
                        {user.name?.slice(0, 2).toUpperCase() || <User size={32} />}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h3 className="font-medium text-lg">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
            </div>

            {message && (
                <Alert variant={message.type === 'error' ? "destructive" : "default"} className={message.type === 'success' ? "border-emerald-500/50 text-emerald-500 dark:border-emerald-500/20" : ""}>
                    {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    <AlertTitle>{message.type === 'error' ? "Error" : "Success"}</AlertTitle>
                    <AlertDescription>
                        {message.text}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-2">
                <Label htmlFor="display-name">Display Name</Label>
                <div className="flex gap-4">
                     <Input
                        id="display-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="max-w-md"
                      />
                      <Button onClick={handleUpdate} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                    This is your public display name.
                </p>
            </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 size={20} />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions regarding your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. All your data will be permanently removed.
            </p>
            
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isLoading ? 'Deleting...' : 'Continue'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}