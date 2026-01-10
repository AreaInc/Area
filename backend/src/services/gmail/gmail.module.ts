import { Module, OnModuleInit } from '@nestjs/common';
import { ReceiveEmailTrigger } from './triggers/receive-email.trigger';
import { SendEmailAction } from './actions/send-email.action';
import { TriggerRegistryService } from '../registries/trigger-registry.service';
import { ActionRegistryService } from '../registries/action-registry.service';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [WorkflowsModule],
  providers: [ReceiveEmailTrigger, SendEmailAction],
  exports: [ReceiveEmailTrigger, SendEmailAction],
})
export class GmailModule implements OnModuleInit {
  constructor(
    private readonly receiveEmailTrigger: ReceiveEmailTrigger,
    private readonly sendEmailAction: SendEmailAction,
    private readonly triggerRegistry: TriggerRegistryService,
    private readonly actionRegistry: ActionRegistryService,
  ) {}

  onModuleInit() {
    console.log('[GmailModule] Registering Gmail triggers...');
    this.triggerRegistry.register(this.receiveEmailTrigger);
    console.log('[GmailModule] Registered trigger: gmail:receive-email');

    console.log('[GmailModule] Registering Gmail actions...');
    this.actionRegistry.register(this.sendEmailAction);
    console.log('[GmailModule] Registered action: gmail:send-email');

    console.log('[GmailModule] Gmail module initialized successfully');
  }
}
