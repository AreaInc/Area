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
                { id: 1, triggerProvider: "telegram", isActive: true, triggerConfig: { botToken: "token123" }, triggerId: "on-message" }
            ]);

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    ok: true,
                    result: [
                        { update_id: 1, message: { message_id: 100, chat: { id: 123 }, text: "hello", date: 1600000000 } }
                    ]
                })
            });

            await (service as any).poll();

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/getUpdates"));
            expect(workflowsServiceMock.triggerWorkflowExecution).toHaveBeenCalled();
        });

        it("should handle invalid token", async () => {
            dbMock.where.mockResolvedValue([
                { id: 1, triggerProvider: "telegram", isActive: true, triggerConfig: { botToken: "invalid" }, triggerId: "on-message" }
            ]);

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 401,
                statusText: "Unauthorized"
            });

            await (service as any).poll();
            // Should just log and return, no error thrown
            expect(global.fetch).toHaveBeenCalled();
        });
    });
});
