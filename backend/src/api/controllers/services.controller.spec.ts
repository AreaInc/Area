import { Test, TestingModule } from "@nestjs/testing";
import { ServicesController } from "./services.controller";
import { ServicesService } from "../../services/services/services.service";
import { ActionRegistryService } from "../../services/registries/action-registry.service";
import { ServiceProvider } from "../../common/types/enums";
import { HttpException } from "@nestjs/common";
import { AuthGuard } from "../guards/auth.guard";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

jest.mock("../guards/auth.guard", () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe("ServicesController", () => {
  let controller: ServicesController;
  let servicesServiceMock: any;
  let actionRegistryMock: any;

  beforeEach(async () => {
    servicesServiceMock = {
      getAllServices: jest.fn().mockResolvedValue([]),
      getService: jest.fn(),
    };

    actionRegistryMock = {
      getByProvider: jest.fn().mockReturnValue([]),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        { provide: ServicesService, useValue: servicesServiceMock },
        { provide: ActionRegistryService, useValue: actionRegistryMock },
        {
          provide: "CACHE_MANAGER",
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  describe("getAllServices", () => {
    it("should return services with actions", async () => {
      servicesServiceMock.getAllServices.mockResolvedValue([
        { id: 1, provider: "gmail", name: "Gmail" },
      ]);
      actionRegistryMock.getByProvider.mockReturnValue([
        {
          id: "send-email",
          name: "Send",
          description: "Desc",
          inputSchema: {},
          outputSchema: {},
        },
      ]);

      const result = await controller.getAllServices();
      expect(result).toHaveLength(1);
      expect(result[0].actions).toHaveLength(1);
      expect(result[0].actions[0].type).toBe("send_email");
    });
  });

  describe("getService", () => {
    it("should return service details", async () => {
      servicesServiceMock.getService.mockResolvedValue({
        id: 1,
        provider: "gmail",
      });
      const result = await controller.getService("gmail");
      expect(result.id).toBe(1);
    });

    it("should throw if service not found", async () => {
      servicesServiceMock.getService.mockResolvedValue(null);
      await expect(controller.getService("gmail")).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe("getServiceActions", () => {
    it("should return actions", async () => {
      actionRegistryMock.getByProvider.mockReturnValue([
        { id: "send-email", inputSchema: {}, outputSchema: {} },
      ]);
      const result = await controller.getServiceActions("gmail");
      expect(result).toHaveLength(1);
    });

    it("should throw if no actions and no service", async () => {
      actionRegistryMock.getByProvider.mockReturnValue([]);
      servicesServiceMock.getService.mockResolvedValue(null);
      await expect(controller.getServiceActions("gmail")).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe("getAction", () => {
    it("should return action details", async () => {
      actionRegistryMock.get.mockReturnValue({
        id: "send-email",
        inputSchema: {},
        outputSchema: {},
      });
      const result = await controller.getAction("gmail", "send-email");
      expect(result.id).toBe("send-email");
    });

    it("should throw if action not found", async () => {
      actionRegistryMock.get.mockReturnValue(null);
      expect(() => controller.getAction("gmail", "unknown")).toThrow(
        HttpException,
      );
    });
  });
});
