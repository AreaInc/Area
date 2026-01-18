import { Github, Slack, Mail, MessageSquare, Database, Cloud, Send, Calendar } from 'lucide-react'

export const MOCK_SERVICES = [
  { id: 'github', name: 'GitHub', icon: <Github size={32} />, description: 'Connect to repositories and issues' },
  { id: 'slack', name: 'Slack', icon: <Slack size={32} />, description: 'Send messages and alerts' },
  { id: 'gmail', name: 'Gmail', icon: <Mail size={32} />, description: 'Send and receive emails' },
  { id: 'discord', name: 'Discord', icon: <MessageSquare size={32} />, description: 'Bot integration and webhooks' },
  { id: 'telegram', name: 'Telegram', icon: <Send size={32} />, description: 'Send bot messages to chats' },
  { id: 'postgres', name: 'PostgreSQL', icon: <Database size={32} />, description: 'Connect to your database' },
  { id: 'google-calendar', name: 'Google Calendar', icon: <Calendar size={32} />, description: 'Manage events and schedules' },
  { id: 'aws', name: 'AWS', icon: <Cloud size={32} />, description: 'Cloud infrastructure services' },
]
