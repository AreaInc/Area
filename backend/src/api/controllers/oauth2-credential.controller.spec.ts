import { Test, TestingModule } from "@nestjs/testing";
import { OAuth2CredentialController } from "./oauth2-credential.controller";
import { OAuth2Service } from "../../services/oauth2/oauth2.service";
import { AuthGuard } from "../guards/auth.guard";
import { BadRequestException } from "@nestjs/common";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

jest.mock("../guards/auth.guard", () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe("OAuth2CredentialController", () => {
  let controller: OAuth2CredentialController;
  let oauth2ServiceMock: any;

  beforeEach(async () => {
    oauth2ServiceMock = {
      listCredentials: jest.fn(),
      getAuthUrl: jest.fn(),
      handleCallback: jest.fn(),
      createCredential: jest.fn(),
      getCredential: jest.fn(),
      deleteCredentials: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuth2CredentialController],
      providers: [{ provide: OAuth2Service, useValue: oauth2ServiceMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<OAuth2CredentialController>(
      OAuth2CredentialController,
    );
  });

  describe("listCredentials", () => {
    it("should return credentials", async () => {
      const req = { user: { id: "user1" } };
      oauth2ServiceMock.listCredentials.mockResolvedValue([]);
      const result = await controller.listCredentials(req as any);
      expect(result).toEqual([]);
    });
  });

  describe("initiateAuth", () => {
    it("should redirect", async () => {
      const req = { user: { id: "user1" } };
      const res = { redirect: jest.fn() };
      oauth2ServiceMock.getAuthUrl.mockResolvedValue({
        authUrl: "http://test",
      });

      await controller.initiateAuth("1", undefined, req as any, res as any);
      expect(res.redirect).toHaveBeenCalledWith("http://test");
    });
  });

  describe("getCallbackUrl", () => {
    it("should return callback url", () => {
      const result = controller.getCallbackUrl();
      expect(result).toHaveProperty("callbackUrl");
    });
  });

  describe("handleCallback", () => {
    it("should handle success", async () => {
      const res = { redirect: jest.fn() };
      oauth2ServiceMock.handleCallback.mockResolvedValue({
        success: true,
        credentialId: 1,
      });
      await controller.handleCallback("code", "state", res as any);
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("success=true"),
      );
    });

    it("should handle error", async () => {
      const res = { redirect: jest.fn() };
      oauth2ServiceMock.handleCallback.mockResolvedValue({ success: false });
      await controller.handleCallback("code", "state", res as any);
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("success=false"),
      );
    });
  });

  describe("createCredential", () => {
    it("should create credential", async () => {
      const req = { user: { id: "user1" } };
      oauth2ServiceMock.createCredential.mockResolvedValue({ id: 1 });
      const result = await controller.createCredential({} as any, req as any);
      expect(result.id).toBe(1);
    });
  });

  describe("deleteCredentials", () => {
    it("should delete credential", async () => {
      const req = { user: { id: "user1" } };
      oauth2ServiceMock.deleteCredentials.mockResolvedValue(undefined);
      const result = await controller.deleteCredentials("1", req as any);
      expect(result.success).toBe(true);
    });
  });

  describe("getCredential", () => {
    it("should get credential", async () => {
      const req = { user: { id: "user1" } };
      oauth2ServiceMock.getCredential.mockResolvedValue({ id: 1 });
      const result = await controller.getCredential("1", req as any);
      expect(result.id).toBe(1);
    });
  });
});
