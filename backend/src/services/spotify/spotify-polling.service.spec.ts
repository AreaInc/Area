import { Test, TestingModule } from "@nestjs/testing";
import { SpotifyPollingService } from "./spotify-polling.service";
import { DRIZZLE } from "../../db/drizzle.module";
import {
  NewTrackPlayedTrigger,
  NewLikedSongTrigger,
} from "./triggers/spotify-triggers";
import { WorkflowsService } from "../workflows/workflows.service";
import { SpotifyClient } from "./spotify-client";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

jest.mock("./spotify-client", () => ({
  SpotifyClient: jest.fn().mockImplementation(() => ({
    getRecentlyPlayed: jest.fn().mockResolvedValue({
      items: [
        {
          played_at: new Date().toISOString(),
          track: {
            id: "track1",
            name: "Test Track",
            artists: [{ name: "Test Artist" }],
            album: { name: "Test Album" },
            uri: "spotify:track:track1",
          },
        },
      ],
    }),
    getLikedTracks: jest.fn().mockResolvedValue({
      items: [
        {
          added_at: new Date().toISOString(),
          track: {
            id: "track2",
            name: "Liked Track",
            artists: [{ name: "Artist" }],
            album: { name: "Album" },
            uri: "spotify:track:track2",
          },
        },
      ],
    }),
  })),
}));

describe("SpotifyPollingService", () => {
  let service: SpotifyPollingService;
  let dbMock: any;
  let trackTriggerMock: any;
  let likedTriggerMock: any;
  let workflowsServiceMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    trackTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };

    likedTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };

    workflowsServiceMock = {
      triggerWorkflowExecution: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotifyPollingService,
        { provide: DRIZZLE, useValue: dbMock },
        { provide: NewTrackPlayedTrigger, useValue: trackTriggerMock },
        { provide: NewLikedSongTrigger, useValue: likedTriggerMock },
        { provide: WorkflowsService, useValue: workflowsServiceMock },
      ],
    }).compile();

    service = module.get<SpotifyPollingService>(SpotifyPollingService);
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

  it("should process recently played", async () => {
    trackTriggerMock.getRegistrations.mockReturnValue(
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
          serviceProvider: "spotify",
          pollingState: { lastPlayedAt: 0 },
        },
      ]),
    });

    const checkCredentialSpy = jest.spyOn(service as any, "checkCredential");
    await (service as any).poll();
    expect(checkCredentialSpy).toHaveBeenCalled();
  });
});
