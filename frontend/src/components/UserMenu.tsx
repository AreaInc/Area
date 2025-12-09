import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  User as UserIcon,
  LogOut,
  Link2,
  Settings,
  MoreVertical
} from 'lucide-react'
import clsx from 'clsx'
import { useAppSelector } from '../store/hooks'
import { signOut } from '../lib/auth-client'

export function UserMenu() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const user = useAppSelector((state) => state.auth.user)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    setIsUserMenuOpen(false)
    navigate({ to: '/login' })
  }

  if (!user) return null

  return (
    <div className="p-4 border-t border-border relative">
      {/* User Menu Popover */}
      {isUserMenuOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div
              className="fixed inset-0 z-10"
              onClick={() => setIsUserMenuOpen(false)}
          />
          <div className="absolute bottom-full left-4 right-4 mb-2 z-20">
              <div className="bg-popover border border-border rounded-xl shadow-xl overflow-hidden p-1 animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <Link
                      to="/integrations"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                  >
                      <Link2 size={16} /> Integrations
                  </Link>
                  <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                  >
                      <Settings size={16} /> Profile
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full"
                  >
                      <LogOut size={16} /> Logout
                  </button>
              </div>
          </div>
        </>
      )}

      <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={clsx(
              "relative z-10 flex items-center gap-3 w-full p-2 rounded-xl transition-all border border-transparent",
              isUserMenuOpen ? "bg-accent border-border" : "hover:bg-accent/50"
          )}
      >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <UserIcon size={20} />
          </div>
          <div className="flex-1 text-left overflow-hidden">
              <div className="font-medium text-sm truncate text-foreground">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
          <MoreVertical size={16} className="text-muted-foreground" />
      </button>
    </div>
  )
}
