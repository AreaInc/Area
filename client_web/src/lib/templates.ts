import type { TriggerConfig, ActionConfig } from '@area/shared';

export const QUICK_TEMPLATES: {
  name: string;
  description: string;
  trigger: TriggerConfig;
  action: ActionConfig;
}[] = [
    {
      name: 'Public webhook → Discord',
      description: 'Start from an unauthenticated webhook and fan out to a Discord channel.',
      trigger: {
        provider: 'webhook',
        triggerId: 'incoming-webhook',
        config: { path: '/hooks/public', secret: '' },
      },
      action: {
        provider: 'discord',
        actionId: 'send-webhook',
        config: {
          webhookUrl: 'https://discord.com/api/webhooks/xxx/yyy',
          content: 'Hello from AREA!',
        },
      },
    },
    {
      name: 'Cron (hourly) → Gmail send',
      description: 'Run every hour and send a status email through Gmail.',
      trigger: {
        provider: 'scheduler',
        triggerId: 'cron',
        config: { cron: '0 * * * *' },
      },
      action: {
        provider: 'gmail',
        actionId: 'send-email',
        config: {
          to: 'you@example.com',
          subject: 'Hourly ping from AREA',
          body: 'This is a scheduled notification.',
        },
      },
    },
    {
      name: 'Gmail inbound → Gmail auto-reply',
      description: 'Use Gmail receive trigger to auto-reply to matching emails.',
      trigger: {
        provider: 'gmail',
        triggerId: 'receive-email',
        config: { from: '' },
      },
      action: {
        provider: 'gmail',
        actionId: 'send-email',
        config: {
          to: '{{from}}',
          subject: 'Re: {{subject}}',
          body: 'Thanks for reaching out!',
        },
      },
    },
    {
      name: 'One-shot Execution',
      description: 'Run a workflow exactly once immediately upon activation.',
      trigger: {
        provider: 'scheduler',
        triggerId: 'on-activation',
        config: {},
      },
      action: {
        provider: 'discord',
        actionId: 'send-webhook',
        config: {
          webhookUrl: '',
          content: 'One-shot workflow executed!',
        },
      },
    },
  ];
