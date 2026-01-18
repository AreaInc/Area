import { Test, TestingModule } from "@nestjs/testing";
import { WorkflowsService } from "./workflows.service";
import { TemporalClientService } from "../temporal/temporal-client.service";
import { TriggerRegistryService } from "../registries/trigger-registry.service";
import { ActionRegistryService } from "../registries/action-registry.service";
import { DRIZZLE } from "../../db/drizzle.module";
import { BadRequestException } from "@nestjs/common";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

describe("WorkflowsService", () => {
  let service: WorkflowsService;
  let dbMock: any;
  let temporalClientMock: any;
  let triggerRegistryMock: any;
  let actionRegistryMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    temporalClientMock = {
      startAutomationWorkflow: jest.fn(),
    };

    triggerRegistryMock = {
      get: jest.fn(),
    };

    actionRegistryMock = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        {
          provide: DRIZZLE,
          useValue: dbMock,
        },
        {
          provide: TemporalClientService,
          useValue: temporalClientMock,
        },
        {
          provide: TriggerRegistryService,
          useValue: triggerRegistryMock,
        },
        {
          provide: ActionRegistryService,
          useValue: actionRegistryMock,
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createWorkflow", () => {
    const userId = "user-1";
    const createDto = {
      name: "Test Workflow",
      trigger: {
        provider: "gmail",
        triggerId: "receive-email",
        config: { from: "test@example.com" },
      },
      action: {
        provider: "discord",
        actionId: "send-message",
        config: { message: "Hello" },
      },
    };

    it("should create a workflow successfully", async () => {
      // Mocks
      const triggerMock = { validateConfig: jest.fn().mockResolvedValue(true) };
      const actionMock = { validateInput: jest.fn().mockResolvedValue(true) };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      actionRegistryMock.get.mockReturnValue(actionMock);
      dbMock.returning.mockResolvedValue([
        { id: 1, ...createDto, userId, isActive: false },
      ]);

      const result = await service.createWorkflow(userId, createDto);

      expect(triggerRegistryMock.get).toHaveBeenCalledWith(
        "gmail",
        "receive-email",
      );
      expect(actionRegistryMock.get).toHaveBeenCalledWith(
        "discord",
        "send-message",
      );
      expect(triggerMock.validateConfig).toHaveBeenCalled();
      expect(actionMock.validateInput).toHaveBeenCalled();
      expect(dbMock.insert).toHaveBeenCalled();
      expect(result).toHaveProperty("id");
    });

    it("should throw BadRequestException if trigger not found", async () => {
      triggerRegistryMock.get.mockReturnValue(null);
      await expect(service.createWorkflow(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("activateWorkflow", () => {
    const userId = "user-1";
    const workflowId = 1;
    const workflow = {
      id: workflowId,
      userId,
      isActive: false,
      triggerProvider: "gmail",
      triggerId: "receive-email",
      actionProvider: "discord",
      actionId: "send-message",
      triggerConfig: {},
      actionConfig: {},
    };

    it("should activate valid workflow", async () => {
      dbMock.where.mockResolvedValue([workflow]); // getWorkflowById
      const triggerMock = {
        validateConfig: jest.fn().mockResolvedValue(true),
        register: jest.fn().mockResolvedValue(undefined),
      };
      const actionMock = { validateInput: jest.fn().mockResolvedValue(true) };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      actionRegistryMock.get.mockReturnValue(actionMock);

      await service.activateWorkflow(userId, workflowId);

      expect(dbMock.update).toHaveBeenCalled(); // Update isActive=true
      expect(triggerMock.register).toHaveBeenCalled();
    });

    it("should throw BadRequestException if already active", async () => {
      dbMock.where.mockResolvedValue([{ ...workflow, isActive: true }]);
      await expect(
        service.activateWorkflow(userId, workflowId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
