import { Test, TestingModule } from "@nestjs/testing";
import { OAuth2Service } from "./oauth2.service";
import { DRIZZLE } from "../../db/drizzle.module";
import { WorkflowsService } from "../workflows/workflows.service";
import { ServiceProvider } from "../../common/types/enums";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { google } from "googleapis";

// Mocks
jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

jest.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: jest.fn(),
    },
    oauth2: jest.fn(),
  },
}));

describe("OAuth2Service", () => {
  let service: OAuth2Service;
  let dbMock: any;
  let workflowsServiceMock: any;
  let oauth2ClientMock: any;
  let googleOauth2Mock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    workflowsServiceMock = {
      deactivateWorkflow: jest.fn(),
    };

    oauth2ClientMock = {
      generateAuthUrl: jest.fn().mockReturnValue("http://auth-url"),
      getToken: jest.fn().mockResolvedValue({
        tokens: {
          access_token: "access-token",
          refresh_token: "refresh-token",
          expiry_date: Date.now() + 3600,
          scope: "email profile",
        },
      }),
      setCredentials: jest.fn(),
      refreshAccessToken: jest.fn().mockResolvedValue({
        credentials: {
          access_token: "new-access",
          expiry_date: Date.now() + 3600,
        },
      }),
    };

    (google.auth.OAuth2 as unknown as jest.Mock).mockReturnValue(
      oauth2ClientMock,
    );

    googleOauth2Mock = {
      userinfo: {
        get: jest.fn().mockResolvedValue({
          data: { email: "test@example.com" },
        }),
      },
    };
    (google.oauth2 as unknown as jest.Mock).mockReturnValue(googleOauth2Mock);

    // Mock global fetch
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuth2Service,
        { provide: DRIZZLE, useValue: dbMock },
        { provide: WorkflowsService, useValue: workflowsServiceMock },
      ],
    }).compile();

    service = module.get<OAuth2Service>(OAuth2Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAuthUrl", () => {
    it("should return google auth url", async () => {
      dbMock.where.mockResolvedValue([
        {
          id: 1,
          userId: "user1",
          serviceProvider: ServiceProvider.GOOGLE,
          clientId: "cid",
          clientSecret: "sec",
        },
      ]);

      const result = await service.getAuthUrl("user1", 1);

      expect(result.authUrl).toBe("http://auth-url");
      expect(oauth2ClientMock.generateAuthUrl).toHaveBeenCalled();
      expect(result.state).toBeDefined();
    });

    it("should return spotify auth url", async () => {
      dbMock.where.mockResolvedValue([
        {
          id: 2,
          userId: "user1",
          serviceProvider: ServiceProvider.SPOTIFY,
          clientId: "cid",
          clientSecret: "sec",
        },
      ]);
      const result = await service.getAuthUrl("user1", 2);
      expect(result.authUrl).toContain("accounts.spotify.com");
    });

    it("should throw if unknown provider", async () => {
      dbMock.where.mockResolvedValue([
        {
          id: 99,
          userId: "user1",
          serviceProvider: "unknown",
          clientId: "cid",
          clientSecret: "sec",
        },
      ]);
      await expect(service.getAuthUrl("user1", 99)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("handleCallback", () => {
    it("should process google callback", async () => {
      // Setup state
      const state = "valid-state";
      (service as any).stateStore.set(state, {
        userId: "user1",
        credentialId: 1,
        timestamp: Date.now(),
      });

      dbMock.where.mockResolvedValue([
        {
          id: 1,
          userId: "user1",
          serviceProvider: ServiceProvider.GOOGLE,
          clientId: "cid",
          clientSecret: "sec",
        },
      ]);

      const result = await service.handleCallback("code", state);

      expect(result.success).toBe(true);
      expect(oauth2ClientMock.getToken).toHaveBeenCalledWith("code");
      expect(dbMock.update).toHaveBeenCalled();
    });

    it("should throw if state is invalid", async () => {
      await expect(service.handleCallback("code", "invalid")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("refreshToken", () => {
    it("should refresh google token", async () => {
      dbMock.where.mockResolvedValue([
        {
          id: 1,
          type: "oauth2",
          serviceProvider: ServiceProvider.GOOGLE,
          clientId: "cid",
          clientSecret: "sec",
          refreshToken: "refresh",
        },
      ]);

      await service.refreshToken(1);

      expect(oauth2ClientMock.refreshAccessToken).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
    });
  });
});
