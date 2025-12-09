import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { Github, Slack, Mail, MessageSquare, Database, Cloud } from 'lucide-react'

export const Route = createFileRoute('/connections')({
  component: Connections,
})

const SERVICES = [
  { id: 'github', name: 'GitHub', icon: <Github size={32} />, description: 'Connect to repositories and issues' },
  { id: 'slack', name: 'Slack', icon: <Slack size={32} />, description: 'Send messages and alerts' },
  { id: 'gmail', name: 'Gmail', icon: <Mail size={32} />, description: 'Send and receive emails' },
  { id: 'discord', name: 'Discord', icon: <MessageSquare size={32} />, description: 'Bot integration and webhooks' },
  { id: 'postgres', name: 'PostgreSQL', icon: <Database size={32} />, description: 'Connect to your database' },
  { id: 'aws', name: 'AWS', icon: <Cloud size={32} />, description: 'Cloud infrastructure services' },
]

function Connections() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Connections</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <div key={service.id} className="bg-card border border-border rounded-xl p-6 hover:border-muted-foreground/20 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-muted rounded-lg text-foreground">
                  {service.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Not Connected</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-6">{service.description}</p>
              <button className="w-full py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors border border-border">
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
