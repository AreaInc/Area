import { Module, OnModuleInit } from "@nestjs/common";
import { TriggerRegistryService } from "../registries/trigger-registry.service";
import { ActionRegistryService } from "../registries/action-registry.service";
import { WorkflowsModule } from "../workflows/workflows.module";
import { DrizzleModule } from "../../db/drizzle.module";
import { CreateEventAction } from "./actions/create-event.action";
import { QuickAddAction } from "./actions/quick-add.action";

import { NewEventTrigger } from "./triggers/new-event.trigger";
import { EventCancelledTrigger } from "./triggers/event-cancelled.trigger";
import { GoogleCalendarPollingService } from "./google-calendar-polling.service";
@Module({
    imports: [WorkflowsModule, DrizzleModule],
    providers: [
        CreateEventAction,
        QuickAddAction,
        NewEventTrigger,
        EventCancelledTrigger,
        GoogleCalendarPollingService,
    ],
    exports: [
        CreateEventAction,
        QuickAddAction,
        NewEventTrigger,
        EventCancelledTrigger,
        GoogleCalendarPollingService,
    ],
})
export class GoogleCalendarModule implements OnModuleInit {
    constructor(
        private readonly triggerRegistry: TriggerRegistryService,
        private readonly actionRegistry: ActionRegistryService,
        private readonly createEventAction: CreateEventAction,
        private readonly quickAddAction: QuickAddAction,
        private readonly newEventTrigger: NewEventTrigger,
        private readonly eventCancelledTrigger: EventCancelledTrigger,
    ) { }

    onModuleInit() {
        console.log("[GoogleCalendarModule] Initializing...");

        this.actionRegistry.register(this.createEventAction);
        console.log("[GoogleCalendarModule] Registered action: google-calendar:create-event");

        this.actionRegistry.register(this.quickAddAction);
        console.log("[GoogleCalendarModule] Registered action: google-calendar:quick-add");

        this.triggerRegistry.register(this.newEventTrigger);
        console.log("[GoogleCalendarModule] Registered trigger: google-calendar:new-event");

        this.triggerRegistry.register(this.eventCancelledTrigger);
        console.log("[GoogleCalendarModule] Registered trigger: google-calendar:event-cancelled");

        console.log("[GoogleCalendarModule] Initialized.");
    }
}
