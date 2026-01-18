import { Test } from "@nestjs/testing";
import { GoogleCalendarPollingService } from "./google-calendar-polling.service";
import { DRIZZLE } from "../../db/drizzle.module";
import { WorkflowsService } from "../workflows/workflows.service";
import { NewEventTrigger } from "./triggers/new-event.trigger";
import { EventCancelledTrigger } from "./triggers/event-cancelled.trigger";
import { TestingModule as NestTestingModule } from "@nestjs/testing";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

jest.mock("./google-calendar-client", () => ({
  GoogleCalendarClient: jest.fn().mockImplementation(() => ({
    listEvents: jest.fn().mockResolvedValue({
      events: [
        {
          id: "event1",
          status: "confirmed",
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          summary: "New Event",
        },
      ],
      nextSyncToken: "newToken",
    }),
  })),
}));

describe("GoogleCalendarPollingService", () => {
  let service: GoogleCalendarPollingService;
  let dbMock: any;
  let workflowsServiceMock: any;
  let newEventTriggerMock: any;
  let eventCancelledTriggerMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    workflowsServiceMock = {
      triggerWorkflowExecution: jest.fn(),
    };

    newEventTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };
    eventCancelledTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };

    const module: NestTestingModule = await Test.createTestingModule({
      providers: [
        GoogleCalendarPollingService,
        { provide: DRIZZLE, useValue: dbMock },
        { provide: WorkflowsService, useValue: workflowsServiceMock },
        { provide: NewEventTrigger, useValue: newEventTriggerMock },
        { provide: EventCancelledTrigger, useValue: eventCancelledTriggerMock },
      ],
    }).compile();

    service = module.get<GoogleCalendarPollingService>(
      GoogleCalendarPollingService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.onModuleDestroy();
  });

  it("should start polling", async () => {
    const pollSpy = jest
      .spyOn(service as any, "pollAllRegistrations")
      .mockResolvedValue(undefined);
    await service.onModuleInit();
    expect(pollSpy).toHaveBeenCalled();
  });

  it("should process new events", async () => {
    newEventTriggerMock.getRegistrations.mockReturnValue(
      new Map([[1, { credentialsId: 10, config: {} }]]),
    );

    dbMock.from.mockReturnValueOnce({
      // workflows
      where: jest.fn().mockResolvedValue([{ id: 1, userId: "user1" }]),
    });

    dbMock.from.mockReturnValueOnce({
      // credentials
      where: jest.fn().mockResolvedValue([
        {
          id: 10,
          userId: "user1",
          serviceProvider: "google-calendar",
          accessToken: "token",
          lastHistoryId: "oldSyncToken",
        },
      ]),
    });

    await (service as any).pollAllRegistrations();

    expect(workflowsServiceMock.triggerWorkflowExecution).toHaveBeenCalled();
    expect(dbMock.update).toHaveBeenCalled(); // Update sync token
  });
});
