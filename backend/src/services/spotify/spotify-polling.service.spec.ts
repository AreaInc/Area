import { Test, TestingModule } from "@nestjs/testing";
import { SpotifyPollingService } from "./spotify-polling.service";
import { DRIZZLE } from "../../db/drizzle.module";
import {
  NewTrackPlayedTrigger,
  NewLikedSongTrigger,
} from "./triggers/spotify-triggers";
import { WorkflowsService } from "../workflows/workflows.service";
import { SpotifyClient } from "./spotify-client";
import { Logger } from "@nestjs/common";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

// Mock SpotifyClient instance
const mockSpotifyClientInstance = {
  getRecentlyPlayed: jest.fn(),
  getLikedTracks: jest.fn(),
};

jest.mock("./spotify-client", () => ({
  SpotifyClient: jest.fn().mockImplementation(() => mockSpotifyClientInstance),
}));

// Helper to create a thenable query mock that supports chaining
const createQueryMock = (result: any) => {
  const query: any = Promise.resolve(result);
  const methods = [
    "select",
    "from",
    "where",
    "orderBy",
    "limit",
    "insert",
    "values",
    "returning",
    "update",
    "set",
    "delete",
    "execute",
    "innerJoin",
    "leftJoin",
    "rightJoin",
    "fullJoin",
  ];
  methods.forEach((m) => {
    query[m] = jest.fn().mockReturnValue(query);
  });
  return query;
};

describe("SpotifyPollingService", () => {
  let service: SpotifyPollingService;
  let dbMock: any;
  let trackTriggerMock: any;
  let likedTriggerMock: any;
  let workflowsServiceMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockImplementation(() => createQueryMock([])),
      update: jest.fn().mockImplementation(() => createQueryMock([])),
    };

    trackTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };

    likedTriggerMock = {
      getRegistrations: jest.fn().mockReturnValue(new Map()),
    };

    workflowsServiceMock = {
      triggerWorkflowExecution: jest.fn().mockResolvedValue({}),
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  describe("Lifecycle", () => {
    it("should start polling on init", async () => {
      const startSpy = jest.spyOn(service, "startPolling").mockResolvedValue();
      await service.onModuleInit();
      expect(startSpy).toHaveBeenCalled();
    });

    it("should stop polling on destroy", () => {
      const stopSpy = jest.spyOn(service, "stopPolling");
      service.onModuleDestroy();
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe("startPolling", () => {
    it("should not start if already polling", async () => {
      const pollSpy = jest
        .spyOn(service as any, "poll")
        .mockResolvedValue(undefined);
      await service.startPolling();
      await service.startPolling();
      expect(pollSpy).toHaveBeenCalledTimes(1);
    });

    it("should set interval and poll", async () => {
      const pollSpy = jest
        .spyOn(service as any, "poll")
        .mockResolvedValue(undefined);
      await service.startPolling();
      expect(pollSpy).toHaveBeenCalled();
      jest.advanceTimersByTime(5000);
      expect(pollSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("poll", () => {
    const mockWorkflows = [
      { id: 1, userId: "u1" },
      { id: 2, userId: "u1" },
    ];
    const mockCredentials = [
      {
        id: 10,
        userId: "u1",
        serviceProvider: "spotify",
        updatedAt: new Date(100),
        accessToken: "a",
        expiresAt: new Date(),
      },
      {
        id: 11,
        userId: "u1",
        serviceProvider: "spotify",
        updatedAt: new Date(200),
        accessToken: "b",
        expiresAt: new Date(),
      },
    ];

    it("should return early if no registrations", async () => {
      await (service as any).poll();
      expect(dbMock.select).not.toHaveBeenCalled();
    });

    it("should process registrations and trigger checkCredential", async () => {
      trackTriggerMock.getRegistrations.mockReturnValue(
        new Map([[1, { credentialsId: 10 }]]),
      );
      likedTriggerMock.getRegistrations.mockReturnValue(new Map([[2, {}]]));

      dbMock.select.mockImplementationOnce(() =>
        createQueryMock(mockWorkflows),
      ); // workflows
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock(mockCredentials),
      ); // credentials

      const checkSpy = jest
        .spyOn(service as any, "checkCredential")
        .mockResolvedValue(undefined);

      await (service as any).poll();

      expect(checkSpy).toHaveBeenCalled();
      // cred 11 is default (newer updatedAt), cred 10 is explicit
      expect(checkSpy).toHaveBeenCalledWith(
        mockCredentials.find((c) => c.id === 10),
        { tracks: [1], likes: [] },
      );
      expect(checkSpy).toHaveBeenCalledWith(
        mockCredentials.find((c) => c.id === 11),
        { tracks: [], likes: [2] },
      );
    });

    it("should return early if userIds empty", async () => {
      trackTriggerMock.getRegistrations.mockReturnValue(new Map([[1, {}]]));
      dbMock.select.mockImplementationOnce(() => createQueryMock([])); // No workflows match -> empty result

      await (service as any).poll();
      expect(dbMock.select).toHaveBeenCalledTimes(1);
    });

    it("should handle registration with missing workflow", async () => {
      trackTriggerMock.getRegistrations.mockReturnValue(new Map([[99, {}]]));
      dbMock.select.mockImplementationOnce(() => createQueryMock([])); // no workflows
      const checkSpy = jest.spyOn(service as any, "checkCredential");
      await (service as any).poll();
      expect(checkSpy).not.toHaveBeenCalled();
    });

    it("should handle credential fallback/mismatch", async () => {
      // wf owned by u1, but reg says cred 20 (which belongs to u2)
      trackTriggerMock.getRegistrations.mockReturnValue(
        new Map([[1, { credentialsId: 20 }]]),
      );
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u1" }]),
      );
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([
          { id: 20, userId: "u2", updatedAt: new Date() },
          { id: 10, userId: "u1", updatedAt: new Date() },
        ]),
      );

      const checkSpy = jest
        .spyOn(service as any, "checkCredential")
        .mockResolvedValue(undefined);
      await (service as any).poll();

      // Should fallback to u1's default cred (10)
      expect(checkSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: 10 }),
        expect.anything(),
      );
    });
  });

  describe("checkCredential", () => {
    const mockCred = {
      id: 10,
      userId: "u1",
      pollingState: null,
      accessToken: "at",
      refreshToken: "rt",
      expiresAt: new Date(),
    };

    it("should avoid concurrent processing for same credential", async () => {
      (service as any).processingCredentials.add(10);
      await (service as any).checkCredential(mockCred, {
        tracks: [1],
        likes: [],
      });
      expect(
        mockSpotifyClientInstance.getRecentlyPlayed,
      ).not.toHaveBeenCalled();
    });

    describe("Recently Played", () => {
      it("should initialize state on first run", async () => {
        mockSpotifyClientInstance.getRecentlyPlayed.mockResolvedValue({
          items: [{ played_at: "2023-01-01T10:00:00Z", track: { id: "t1" } }],
        });

        await (service as any).checkCredential(mockCred, {
          tracks: [1],
          likes: [],
        });

        expect(dbMock.update).toHaveBeenCalled();
        expect(
          workflowsServiceMock.triggerWorkflowExecution,
        ).not.toHaveBeenCalled();
      });

      it("should not update state if no items found on first run", async () => {
        mockSpotifyClientInstance.getRecentlyPlayed.mockResolvedValue({
          items: [],
        });
        await (service as any).checkCredential(mockCred, {
          tracks: [1],
          likes: [],
        });
        expect(dbMock.update).not.toHaveBeenCalled();
      });

      it("should trigger workflows for new tracks and update state", async () => {
        const credWithState = {
          ...mockCred,
          pollingState: {
            lastPlayedAt: new Date("2023-01-01T10:00:00Z").getTime(),
          },
        };
        mockSpotifyClientInstance.getRecentlyPlayed.mockResolvedValue({
          items: [
            {
              played_at: "2023-01-01T11:00:00Z",
              track: {
                id: "t2",
                name: "T2",
                artists: [{ name: "A2" }],
                album: { name: "Al2" },
                uri: "u2",
              },
            },
            {
              played_at: "2023-01-01T10:30:00Z",
              track: {
                id: "t1",
                name: "T1",
                artists: [{ name: "A1" }],
                album: { name: "Al1" },
                uri: "u1",
              },
            },
          ],
        });

        await (service as any).checkCredential(credWithState, {
          tracks: [1],
          likes: [],
        });

        expect(
          workflowsServiceMock.triggerWorkflowExecution,
        ).toHaveBeenCalledTimes(2);
        // Sorted: t1 then t2
        expect(
          workflowsServiceMock.triggerWorkflowExecution,
        ).toHaveBeenNthCalledWith(
          1,
          1,
          expect.objectContaining({ trackId: "t1" }),
        );
        expect(
          workflowsServiceMock.triggerWorkflowExecution,
        ).toHaveBeenNthCalledWith(
          2,
          1,
          expect.objectContaining({ trackId: "t2" }),
        );

        expect(dbMock.update).toHaveBeenCalledWith(expect.anything());
      });

      it("should log error if recently played fetch fails", async () => {
        mockSpotifyClientInstance.getRecentlyPlayed.mockRejectedValue(
          new Error("API Fail"),
        );
        const loggerSpy = jest
          .spyOn(Logger.prototype, "error")
          .mockImplementation();
        await (service as any).checkCredential(mockCred, {
          tracks: [1],
          likes: [],
        });
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error polling recently played"),
        );
      });
    });

    describe("Liked Songs", () => {
      it("should initialize state on first run", async () => {
        mockSpotifyClientInstance.getLikedTracks.mockResolvedValue({
          items: [{ track: { id: "t1" } }],
        });

        await (service as any).checkCredential(mockCred, {
          tracks: [],
          likes: [1],
        });

        expect(dbMock.update).toHaveBeenCalled();
        expect(
          workflowsServiceMock.triggerWorkflowExecution,
        ).not.toHaveBeenCalled();
      });

      it("should trigger workflows for new liked songs", async () => {
        const credWithState = {
          ...mockCred,
          pollingState: { lastLikedIds: ["t0"] },
        };
        mockSpotifyClientInstance.getLikedTracks.mockResolvedValue({
          items: [
            {
              track: {
                id: "t1",
                name: "T1",
                artists: [{ name: "A1" }],
                album: { name: "Al1" },
                uri: "u1",
              },
              added_at: "2023",
            },
          ],
        });

        await (service as any).checkCredential(credWithState, {
          tracks: [],
          likes: [1],
        });

        expect(
          workflowsServiceMock.triggerWorkflowExecution,
        ).toHaveBeenCalledWith(1, expect.objectContaining({ trackId: "t1" }));
        expect(dbMock.update).toHaveBeenCalled();
      });

      it("should log error if liked tracks fetch fails", async () => {
        mockSpotifyClientInstance.getLikedTracks.mockRejectedValue(
          new Error("API Fail"),
        );
        const loggerSpy = jest
          .spyOn(Logger.prototype, "error")
          .mockImplementation();
        await (service as any).checkCredential(mockCred, {
          tracks: [],
          likes: [1],
        });
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining("Error polling liked tracks"),
        );
      });
    });

    it("should log fatal error and clean up processing set", async () => {
      const SpotifyClientMock = require("./spotify-client").SpotifyClient;
      SpotifyClientMock.mockImplementationOnce(() => {
        throw new Error("Constructor Fail");
      });

      const loggerSpy = jest
        .spyOn(Logger.prototype, "error")
        .mockImplementation();

      await (service as any).checkCredential(mockCred, {
        tracks: [1],
        likes: [],
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Fatal polling error"),
      );
      expect((service as any).processingCredentials.has(10)).toBe(false);
    });
  });
});
