import { Test, TestingModule } from "@nestjs/testing";
import { YouTubePollingService } from "./youtube-polling.service";
import { DRIZZLE } from "../../db/drizzle.module";
import { WorkflowsService } from "../workflows/workflows.service";
import {
  NewLikedVideoTrigger,
  NewVideoFromChannelTrigger,
} from "./triggers/youtube-triggers";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

jest.mock("./youtube-client", () => ({
  YouTubeClient: jest.fn().mockImplementation(() => ({
    getLikedVideos: jest
      .fn()
      .mockResolvedValue([{ id: "vid1", snippet: { title: "Liked Video" } }]),
    getLatestUploads: jest.fn().mockResolvedValue([
      {
        id: "vid2", // Playlist Item ID
        contentDetails: { videoId: "video2" },
        snippet: { title: "Channel Upload" },
      },
    ]),
  })),
}));

describe("YouTubePollingService", () => {
  let service: YouTubePollingService;
  let dbMock: any;
  let workflowsServiceMock: any;
  let likedTriggerMock: any;
  let channelTriggerMock: any;

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

    likedTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };
    channelTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YouTubePollingService,
        { provide: DRIZZLE, useValue: dbMock },
        { provide: WorkflowsService, useValue: workflowsServiceMock },
        { provide: NewLikedVideoTrigger, useValue: likedTriggerMock },
        { provide: NewVideoFromChannelTrigger, useValue: channelTriggerMock },
      ],
    }).compile();

    service = module.get<YouTubePollingService>(YouTubePollingService);
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

  it("should process liked videos", async () => {
    likedTriggerMock.getRegistrations.mockReturnValue(
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
          serviceProvider: "youtube",
          pollingState: { lastLikedVideoId: "oldvid" },
        },
      ]),
    });

    await (service as any).poll();
    expect(workflowsServiceMock.triggerWorkflowExecution).toHaveBeenCalled();
    expect(dbMock.update).toHaveBeenCalled();
  });

  it("should process channel uploads", async () => {
    channelTriggerMock.getRegistrations.mockReturnValue(
      new Map([[1, { credentialsId: 10, config: { channelId: "ch1" } }]]),
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
          serviceProvider: "youtube",
          pollingState: { channelUploads: { ch1: "old_video" } },
        },
      ]),
    });

    await (service as any).poll();
    expect(workflowsServiceMock.triggerWorkflowExecution).toHaveBeenCalled();
  });
});
