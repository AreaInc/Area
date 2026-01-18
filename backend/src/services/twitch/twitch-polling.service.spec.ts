import { Test } from "@nestjs/testing";
import { TwitchPollingService } from "./twitch-polling.service";
import { DRIZZLE } from "../../db/drizzle.module";
import { WorkflowsService } from "../workflows/workflows.service";
import {
  StreamStartedTrigger,
  StreamEndedTrigger,
  NewFollowerTrigger,
  ViewerCountThresholdTrigger,
} from "./triggers/twitch-triggers";
import { TestingModule as NestTestingModule } from "@nestjs/testing";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

jest.mock("./twitch-client", () => ({
  TwitchClient: jest.fn().mockImplementation(() => ({
    getUserInfo: jest.fn().mockResolvedValue({ id: "123", login: "testuser" }),
    getStreamInfo: jest.fn().mockResolvedValue({
      id: "stream1",
      user_id: "123",
      started_at: new Date().toISOString(),
      title: "Test Stream",
      viewer_count: 100,
    }),
    getFollowers: jest.fn().mockResolvedValue([
      {
        user_id: "follower1",
        user_name: "Follower 1",
        followed_at: new Date().toISOString(),
      },
    ]),
  })),
}));

describe("TwitchPollingService", () => {
  let service: TwitchPollingService;
  let dbMock: any;
  let workflowsServiceMock: any;
  let startedTriggerMock: any;
  let endedTriggerMock: any;
  let followerTriggerMock: any;
  let viewerTriggerMock: any;

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

    startedTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };
    endedTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };
    followerTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };
    viewerTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };

    const module: NestTestingModule = await Test.createTestingModule({
      providers: [
        TwitchPollingService,
        { provide: DRIZZLE, useValue: dbMock },
        { provide: WorkflowsService, useValue: workflowsServiceMock },
        { provide: StreamStartedTrigger, useValue: startedTriggerMock },
        { provide: StreamEndedTrigger, useValue: endedTriggerMock },
        { provide: NewFollowerTrigger, useValue: followerTriggerMock },
        { provide: ViewerCountThresholdTrigger, useValue: viewerTriggerMock },
      ],
    }).compile();

    service = module.get<TwitchPollingService>(TwitchPollingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.onModuleDestroy();
  });

  it("should start polling", async () => {
    const pollSpy = jest
      .spyOn(service as any, "poll")
      .mockResolvedValue(undefined);
    await service.onModuleInit();
    expect(pollSpy).toHaveBeenCalled();
  });

  it("should poll and detect stream started", async () => {
    startedTriggerMock.getRegistrations.mockReturnValue(
      new Map([[1, { credentialsId: 10 }]]),
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
          serviceProvider: "twitch",
          pollingState: { isLive: false }, // Previously offline
        },
      ]),
    });

    await (service as any).poll();

    expect(workflowsServiceMock.triggerWorkflowExecution).toHaveBeenCalled();
    expect(dbMock.update).toHaveBeenCalled(); // Update state to live
  });
});
