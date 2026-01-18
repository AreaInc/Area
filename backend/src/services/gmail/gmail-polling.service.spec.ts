import { Test, TestingModule } from "@nestjs/testing";
import { GmailPollingService } from "./gmail-polling.service";
import { DRIZZLE } from "../../db/drizzle.module";
import { ReceiveEmailTrigger } from "./triggers/receive-email.trigger";
import { WorkflowsService } from "../workflows/workflows.service";
import { google } from "googleapis";

jest.mock("../../db/drizzle.module", () => ({
    DRIZZLE: "DRIZZLE_TOKEN",
}));

jest.mock("googleapis", () => ({
    google: {
        auth: {
            OAuth2: jest.fn(),
        },
        gmail: jest.fn(),
    },
}));

jest.mock("./gmail-client", () => ({
    GmailClient: jest.fn().mockImplementation(() => ({
        getMessageDetails: jest.fn().mockReturnValue({
            id: "msg1",
            threadId: "thread1",
            from: "sender@test.com",
            subject: "Test Subject",
            body: "Test Body",
            date: new Date().toISOString(),
            attachments: [],
        }),
    })),
}));

describe("GmailPollingService", () => {
    let service: GmailPollingService;
    let dbMock: any;
    let triggerMock: any;
    let workflowsServiceMock: any;
    let oauth2Mock: any;
    let gmailMock: any;

    beforeEach(async () => {
        dbMock = {
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
        };

        triggerMock = {
            getRegistrations: jest.fn().mockReturnValue(new Map()),
            matchesConfig: jest.fn().mockReturnValue(true),
        };

        workflowsServiceMock = {
            triggerWorkflowExecution: jest.fn(),
        };

        oauth2Mock = {
            setCredentials: jest.fn(),
            refreshAccessToken: jest.fn().mockResolvedValue({
                credentials: { access_token: "new-access", expiry_date: Date.now() + 3600000 },
            }),
        };
        (google.auth.OAuth2 as unknown as jest.Mock).mockReturnValue(oauth2Mock);

        gmailMock = {
            users: {
                getProfile: jest.fn().mockResolvedValue({ data: { historyId: "100", emailAddress: "me@test.com" } }),
                history: {
                    list: jest.fn().mockResolvedValue({ data: { history: [] } })
                },
                messages: {
                    get: jest.fn().mockResolvedValue({ data: { payload: { headers: [] } } })
                }
            },
        };
        (google.gmail as unknown as jest.Mock).mockReturnValue(gmailMock);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GmailPollingService,
                { provide: DRIZZLE, useValue: dbMock },
                { provide: ReceiveEmailTrigger, useValue: triggerMock },
                { provide: WorkflowsService, useValue: workflowsServiceMock },
            ],
        }).compile();

        service = module.get<GmailPollingService>(GmailPollingService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        service.onModuleDestroy();
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    it("should start polling on init", async () => {
        const pollSpy = jest.spyOn(service as any, "pollAllRegistrations").mockResolvedValue(undefined);
        await service.onModuleInit();
        expect(pollSpy).toHaveBeenCalled();
    });

    describe("pollAllRegistrations", () => {
        it("should do nothing if no registrations", async () => {
            triggerMock.getRegistrations.mockReturnValue(new Map());
            await (service as any).pollAllRegistrations();
            expect(dbMock.select).not.toHaveBeenCalled();
        });

        it("should process registrations", async () => {
            triggerMock.getRegistrations.mockReturnValue(new Map([
                [1, { workflowId: 1, userId: "user1", config: { from: "test" } }]
            ]));

            // Mock DB responses
            // 1. workflows
            dbMock.from.mockReturnValueOnce({
                where: jest.fn().mockResolvedValue([{ id: 1, userId: "user1" }])
            });
            // 2. credentials
            dbMock.from.mockReturnValueOnce({
                where: jest.fn().mockResolvedValue([{
                    id: 10,
                    userId: "user1",
                    serviceProvider: "gmail",
                    accessToken: "token",
                    refreshToken: "refresh",
                    expiresAt: new Date(Date.now() + 3600000)
                }])
            });

            // Mock getting emails
            const checkEmailsSpy = jest.spyOn(service as any, "checkCredentialEmails");

            await (service as any).pollAllRegistrations();

            expect(checkEmailsSpy).toHaveBeenCalled();
        });
    });
});
