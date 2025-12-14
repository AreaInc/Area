import { Module, Global, OnModuleInit } from "@nestjs/common";
import { ServiceRegistry } from "./service-registry";
import { CredentialsService } from "./credentials-service";
import { ActionsService } from "./actions-service";
import { ServicesService } from "./services-service";
import { WorkflowsService } from "./workflows-service";
import { WorkflowExecutionService } from "./workflow-execution-service";
import { GmailService } from "./gmail";

@Global()
@Module({
  providers: [
    ServiceRegistry,
    CredentialsService,
    ActionsService,
    ServicesService,
    WorkflowsService,
    WorkflowExecutionService,
  ],
  exports: [
    ServiceRegistry,
    CredentialsService,
    ActionsService,
    ServicesService,
    WorkflowsService,
    WorkflowExecutionService,
  ],
})
export class ServicesModule implements OnModuleInit {
  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    private readonly actionsService: ActionsService,
    private readonly servicesService: ServicesService,
  ) {}

  async onModuleInit() {
    const gmailService = new GmailService();
    this.serviceRegistry.register(gmailService);
    await this.servicesService.saveService(gmailService);

    const gmailActions = gmailService.getActions();
    for (const action of gmailActions) {
      await this.actionsService.saveActionMetadata(
        action.serviceProvider,
        action.id,
        action.name,
        action.description,
        action.type,
        action.inputSchema,
        action.outputSchema,
      );
    }
  }
}
