import { Injectable } from '@nestjs/common';
import { ITrigger, TriggerType } from '../../../common/types/trigger.interface';

@Injectable()
export class ReceiveEmailTrigger implements ITrigger {
  id = 'receive-email';
  name = 'Receive Email';
  description = 'Triggers when a new email is received in Gmail';
  serviceProvider = 'gmail';
  triggerType = TriggerType.EVENT;
  requiresCredentials = true;

  configSchema = {
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'Filter emails from this sender (optional)',
      },
      subject: {
        type: 'string',
        description: 'Filter emails with this subject pattern (optional)',
      },
      labelIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter emails with these label IDs (optional)',
      },
    },
  };

  outputSchema = {
    type: 'object',
    properties: {
      messageId: { type: 'string' },
      threadId: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      subject: { type: 'string' },
      body: { type: 'string' },
      htmlBody: { type: 'string' },
      date: { type: 'string' },
      attachments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            mimeType: { type: 'string' },
            size: { type: 'number' },
            attachmentId: { type: 'string' },
          },
        },
      },
    },
  };

  private workflowRegistrations = new Map<number, { config: Record<string, any>; credentialsId?: number }>();

  async register(workflowId: number, config: Record<string, any>, credentialsId?: number): Promise<void> {
    console.log(`[ReceiveEmailTrigger] Registering trigger for workflow ${workflowId}`, {
      config,
      credentialsId,
    });

    this.workflowRegistrations.set(workflowId, { config, credentialsId });

    // In a real implementation, here you would:
    // 1. Set up Gmail Push API watch for the user's mailbox
    // 2. Configure the Pub/Sub subscription to send notifications to your webhook
    // 3. Store the watch information to allow unregistering later

    console.log(`[ReceiveEmailTrigger] Trigger registered successfully for workflow ${workflowId}`);
  }

  async unregister(workflowId: number): Promise<void> {
    console.log(`[ReceiveEmailTrigger] Unregistering trigger for workflow ${workflowId}`);

    // Remove the registration
    this.workflowRegistrations.delete(workflowId);

    // In a real implementation, here you would:
    // 1. Stop the Gmail Push API watch for this workflow
    // 2. Clean up any Pub/Sub subscriptions

    console.log(`[ReceiveEmailTrigger] Trigger unregistered successfully for workflow ${workflowId}`);
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    // Basic validation - you can add more sophisticated validation here
    if (config.from && typeof config.from !== 'string') {
      throw new Error('Invalid "from" field: must be a string');
    }

    if (config.subject && typeof config.subject !== 'string') {
      throw new Error('Invalid "subject" field: must be a string');
    }

    if (config.labelIds && !Array.isArray(config.labelIds)) {
      throw new Error('Invalid "labelIds" field: must be an array');
    }

    return true;
  }

  matchesConfig(emailData: any, config: Record<string, any>): boolean {
    if (config.from) {
      const fromPattern = config.from.toLowerCase();
      if (!emailData.from?.toLowerCase().includes(fromPattern)) {
        return false;
      }
    }

    if (config.subject) {
      const subjectPattern = config.subject.toLowerCase();
      if (!emailData.subject?.toLowerCase().includes(subjectPattern)) {
        return false;
      }
    }

    return true;
  }

  getMatchingWorkflows(emailData: any): number[] {
    const matchingWorkflows: number[] = [];

    for (const [workflowId, registration] of this.workflowRegistrations.entries()) {
      if (this.matchesConfig(emailData, registration.config)) {
        matchingWorkflows.push(workflowId);
      }
    }

    return matchingWorkflows;
  }
}
