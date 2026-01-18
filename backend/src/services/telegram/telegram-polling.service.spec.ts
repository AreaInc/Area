import { Test, TestingModule } from "@nestjs/testing";
import { TelegramPollingService } from "./telegram-polling.service";
import { DRIZZLE } from "../../db/drizzle.module";
import { WorkflowsService } from "../workflows/workflows.service";
import { TriggerRegistryService } from "../registries/trigger-registry.service";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

describe("TelegramPollingService", () => {
  let service: TelegramPollingService;
  let dbMock: any;
  let workflowsServiceMock: any;
  let triggerRegistryMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };

    workflowsServiceMock = {
      triggerWorkflowExecution: jest.fn(),
    };

    triggerRegistryMock = {
      getAllMetadata: jest.fn(),
    };

    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramPollingService,
        { provide: DRIZZLE, useValue: dbMock },
        { provide: WorkflowsService, useValue: workflowsServiceMock },
        { provide: TriggerRegistryService, useValue: triggerRegistryMock },
      ],
    }).compile();

    service = module.get<TelegramPollingService>(TelegramPollingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.onModuleDestroy();
  });

  it("should start polling", () => {
    service.startPolling();
    service.stopPolling();
  });

  describe("poll", () => {
    it("should poll telegram API", async () => {
      dbMock.where.mockResolvedValue([
        {
          id: 1,
          triggerProvider: "telegram",
          isActive: true,
          triggerConfig: { botToken: "token123" },
          triggerId: "on-message",
        },
      ]);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          ok: true,
          result: [
            {
              update_id: 1,
              message: {
                message_id: 100,
                chat: { id: 123 },
                text: "hello",
                date: 1600000000,
              },
            },
          ],
        }),
      });

      await (service as any).poll();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/getUpdates"),
      );
      expect(workflowsServiceMock.triggerWorkflowExecution).toHaveBeenCalled();
    });

    it("should handle invalid token", async () => {
      dbMock.where.mockResolvedValue([
        {
          id: 1,
          triggerProvider: "telegram",
          isActive: true,
          triggerConfig: { botToken: "invalid" },
          triggerId: "on-message",
        },
      ]);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await (service as any).poll();
      // Should just log and return, no error thrown
      expect(global.fetch).toHaveBeenCalled();
    });
  });
  describe("Trigger Processing", () => {
    it("should process on-voice-message trigger", async () => {
      const wf = { id: 1, triggerId: "on-voice-message", triggerConfig: {} };
      const message = {
        message_id: 123,
        chat: { id: 456 },
        from: { id: 789 },
        date: 100000,
        voice: { duration: 10, mime_type: "audio/ogg", file_id: "voice1" },
      };
      await (service as any).processMessage("token", message, [wf]);
      expect(
        workflowsServiceMock.triggerWorkflowExecution,
      ).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          duration: 10,
          mimeType: "audio/ogg",
        }),
      );
    });

    it("should process on-video-message trigger", async () => {
      const wf = { id: 1, triggerId: "on-video-message", triggerConfig: {} };
      const message = {
        message_id: 123,
        chat: { id: 456 },
        from: { id: 789 },
        date: 100000,
        video: { duration: 20, mime_type: "video/mp4", file_id: "video1" },
      };
      await (service as any).processMessage("token", message, [wf]);
      expect(
        workflowsServiceMock.triggerWorkflowExecution,
      ).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          duration: 20,
          mimeType: "video/mp4",
        }),
      );
    });

    it("should process on-video-message trigger (video note)", async () => {
      const wf = { id: 1, triggerId: "on-video-message", triggerConfig: {} };
      const message = {
        message_id: 123,
        chat: { id: 456 },
        from: { id: 789 },
        date: 100000,
        video_note: { duration: 5, file_id: "note1" },
      };
      await (service as any).processMessage("token", message, [wf]);
      expect(
        workflowsServiceMock.triggerWorkflowExecution,
      ).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          isVideoNote: true,
          duration: 5,
        }),
      );
    });

    it("should process on-start-dm trigger", async () => {
      const wf = { id: 1, triggerId: "on-start-dm", triggerConfig: {} };
      const message = {
        message_id: 123,
        chat: { id: 456, type: "private" },
        from: { id: 789, username: "user" },
        date: 100000,
        text: "/start",
      };
      await (service as any).processMessage("token", message, [wf]);
      expect(
        workflowsServiceMock.triggerWorkflowExecution,
      ).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          username: "user",
        }),
      );
    });

    it("should process on-pinned-message trigger", async () => {
      const wf = { id: 1, triggerId: "on-pinned-message", triggerConfig: {} };
      const message = {
        message_id: 123,
        chat: { id: 456 },
        from: { id: 789 },
        date: 100000,
        pinned_message: { message_id: 999, text: "Pinned" },
      };
      await (service as any).processMessage("token", message, [wf]);
      expect(
        workflowsServiceMock.triggerWorkflowExecution,
      ).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          pinnedText: "Pinned",
        }),
      );
    });

    it("should process on-new-member trigger", async () => {
      const wf = { id: 1, triggerId: "on-new-member", triggerConfig: {} };
      const message = {
        message_id: 123,
        chat: { id: 456 },
        from: { id: 789 },
        date: 100000,
        new_chat_members: [{ id: 101, username: "newbie" }],
      };
      await (service as any).processMessage("token", message, [wf]);
      expect(
        workflowsServiceMock.triggerWorkflowExecution,
      ).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          newUserId: 101,
        }),
      );
    });

    it("should process on-reply-message trigger", async () => {
      const wf = { id: 1, triggerId: "on-reply-message", triggerConfig: {} };
      const message = {
        message_id: 123,
        chat: { id: 456 },
        from: { id: 789 },
        date: 100000,
        reply_to_message: { message_id: 111, text: "Original" },
      };
      await (service as any).processMessage("token", message, [wf]);
      expect(
        workflowsServiceMock.triggerWorkflowExecution,
      ).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          replyToText: "Original",
        }),
      );
    });
  });
});
