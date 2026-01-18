import { Test, TestingModule } from "@nestjs/testing";
import { WorkflowsService } from "./workflows.service";
import { TemporalClientService } from "../temporal/temporal-client.service";
import { TriggerRegistryService } from "../registries/trigger-registry.service";
import { ActionRegistryService } from "../registries/action-registry.service";
import { DRIZZLE } from "../../db/drizzle.module";
import { BadRequestException, NotFoundException, Logger } from "@nestjs/common";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
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
  ];
  methods.forEach((m) => {
    query[m] = jest.fn().mockReturnValue(query);
  });
  return query;
};

describe("WorkflowsService", () => {
  let service: WorkflowsService;
  let dbMock: any;
  let temporalClientMock: any;
  let triggerRegistryMock: any;
  let actionRegistryMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockImplementation(() => createQueryMock([])),
      insert: jest.fn().mockImplementation(() => createQueryMock([])),
      update: jest.fn().mockImplementation(() => createQueryMock([])),
      delete: jest.fn().mockImplementation(() => createQueryMock([])),
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

  afterEach(() => {
    jest.clearAllMocks();
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
      const triggerMock = { validateConfig: jest.fn().mockResolvedValue(true) };
      const actionMock = { validateInput: jest.fn().mockResolvedValue(true) };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      actionRegistryMock.get.mockReturnValue(actionMock);
      dbMock.insert.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, ...createDto, userId, isActive: false }]),
      );

      const result = await service.createWorkflow(userId, createDto);

      expect(triggerRegistryMock.get).toHaveBeenCalled();
      expect(dbMock.insert).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it("should create workflow with empty configs successfully", async () => {
      const dto = {
        ...createDto,
        trigger: { ...createDto.trigger, config: {} },
        action: { ...createDto.action, config: {} },
      };
      triggerRegistryMock.get.mockReturnValue({});
      actionRegistryMock.get.mockReturnValue({});
      dbMock.insert.mockImplementationOnce(() => createQueryMock([{ id: 1 }]));
      await service.createWorkflow(userId, dto);
      expect(dbMock.insert).toHaveBeenCalled();
    });

    it("should throw BadRequestException if trigger not found", async () => {
      triggerRegistryMock.get.mockReturnValue(null);
      await expect(service.createWorkflow(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if action not found", async () => {
      triggerRegistryMock.get.mockReturnValue({});
      actionRegistryMock.get.mockReturnValue(null);
      await expect(service.createWorkflow(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw if trigger validation fails in create", async () => {
      triggerRegistryMock.get.mockReturnValue({
        validateConfig: jest.fn().mockRejectedValue(new Error("Fail")),
      });
      actionRegistryMock.get.mockReturnValue({});
      await expect(service.createWorkflow(userId, createDto)).rejects.toThrow(
        "Invalid trigger configuration",
      );
    });

    it("should throw if action validation fails in create", async () => {
      triggerRegistryMock.get.mockReturnValue({
        validateConfig: jest.fn().mockResolvedValue(true),
      });
      actionRegistryMock.get.mockReturnValue({
        validateInput: jest.fn().mockRejectedValue(new Error("Fail")),
      });
      await expect(service.createWorkflow(userId, createDto)).rejects.toThrow(
        "Invalid action configuration",
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
      triggerConfig: { credentialsId: 10 },
      actionConfig: {},
      actionCredentialsId: 20,
    };

    it("should activate valid workflow", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([workflow]));
      const triggerMock = {
        validateConfig: jest.fn().mockResolvedValue(true),
        register: jest.fn().mockResolvedValue(undefined),
      };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      actionRegistryMock.get.mockReturnValue({ validateInput: jest.fn() });

      await service.activateWorkflow(userId, workflowId);
      expect(triggerMock.register).toHaveBeenCalledWith(
        workflowId,
        workflow.triggerConfig,
        10,
      );
    });

    it("should activate with actionCredentialsId if trigger doesn't have one", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ ...workflow, triggerConfig: {} }]),
      );
      const triggerMock = { validateConfig: jest.fn(), register: jest.fn() };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      actionRegistryMock.get.mockReturnValue({ validateInput: jest.fn() });

      await service.activateWorkflow(userId, workflowId);
      expect(triggerMock.register).toHaveBeenCalledWith(workflowId, {}, 20);
    });

    it("should activate with undefined credentials if none provided", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([
          { ...workflow, triggerConfig: {}, actionCredentialsId: null },
        ]),
      );
      const triggerMock = { validateConfig: jest.fn(), register: jest.fn() };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      actionRegistryMock.get.mockReturnValue({ validateInput: jest.fn() });

      await service.activateWorkflow(userId, workflowId);
      expect(triggerMock.register).toHaveBeenCalledWith(
        workflowId,
        {},
        undefined,
      );
    });

    it("should throw if trigger validation fails", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([workflow]));
      triggerRegistryMock.get.mockReturnValue({
        validateConfig: jest.fn().mockRejectedValue("Fail String"),
      });
      actionRegistryMock.get.mockReturnValue({ validateInput: jest.fn() });
      await expect(
        service.activateWorkflow(userId, workflowId),
      ).rejects.toThrow("Invalid trigger configuration");
    });

    it("should throw if action validation fails", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([workflow]));
      triggerRegistryMock.get.mockReturnValue({ validateConfig: jest.fn() });
      actionRegistryMock.get.mockReturnValue({
        validateInput: jest.fn().mockRejectedValue(new Error("Fail")),
      });
      await expect(
        service.activateWorkflow(userId, workflowId),
      ).rejects.toThrow("Invalid action configuration");
    });

    it("should throw if trigger not found", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([workflow]));
      triggerRegistryMock.get.mockReturnValue(null);
      await expect(
        service.activateWorkflow(userId, workflowId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw if action not found", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([workflow]));
      triggerRegistryMock.get.mockReturnValue({});
      actionRegistryMock.get.mockReturnValue(null);
      await expect(
        service.activateWorkflow(userId, workflowId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should deactivate workflow and rethrow if trigger registration fails", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([workflow]));
      const triggerMock = {
        validateConfig: jest.fn(),
        register: jest.fn().mockRejectedValue(new Error("Fail")),
      };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      actionRegistryMock.get.mockReturnValue({ validateInput: jest.fn() });
      await expect(
        service.activateWorkflow(userId, workflowId),
      ).rejects.toThrow("Fail");
    });

    it("should throw NotFoundException if workflow not found", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([]));
      await expect(
        service.activateWorkflow(userId, workflowId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if already active", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, isActive: true }]),
      );
      await expect(
        service.activateWorkflow(userId, workflowId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deactivateWorkflow", () => {
    it("should deactivate successfully", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([
          {
            id: 1,
            userId: "u",
            isActive: true,
            triggerProvider: "p",
            triggerId: "t",
          },
        ]),
      );
      const triggerMock = { unregister: jest.fn() };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      await service.deactivateWorkflow("u", 1);
      expect(triggerMock.unregister).toHaveBeenCalledWith(1);
    });

    it("should deactivate successfully even if trigger not found", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([
          {
            id: 1,
            userId: "u",
            isActive: true,
            triggerProvider: "p",
            triggerId: "t",
          },
        ]),
      );
      triggerRegistryMock.get.mockReturnValue(null);
      await service.deactivateWorkflow("u", 1);
      expect(dbMock.update).toHaveBeenCalled();
    });

    it("should throw if already inactive", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: false }]),
      );
      await expect(service.deactivateWorkflow("u", 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("executeWorkflow", () => {
    const workflow = {
      id: 1,
      userId: "u",
      triggerProvider: "p",
      triggerId: "t",
      actionProvider: "ap",
      actionId: "ai",
      actionConfig: {},
    };
    it("should start temporal workflow and insert log", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([workflow]));
      temporalClientMock.startAutomationWorkflow.mockResolvedValue({
        workflowId: "tid",
      });
      dbMock.insert.mockImplementationOnce(() =>
        createQueryMock([{ id: 100 }]),
      );
      await service.executeWorkflow("u", 1);
      expect(dbMock.insert).toHaveBeenCalled();
    });

    it("should use firstExecutionRunId if present", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([workflow]));
      temporalClientMock.startAutomationWorkflow.mockResolvedValue({
        workflowId: "tid",
        firstExecutionRunId: "rid",
      });
      dbMock.insert.mockImplementationOnce(() =>
        createQueryMock([{ id: 100 }]),
      );
      await service.executeWorkflow("u", 1, { data: "test" });
      const queryMock = dbMock.insert.mock.results[0].value;
      expect(queryMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          temporalWorkflowId: "tid",
          temporalRunId: "rid",
        }),
      );
    });
  });

  describe("getUserWorkflows", () => {
    it("should list workflows", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([]));
      const res = await service.getUserWorkflows("u");
      expect(res).toEqual([]);
    });
  });

  describe("updateWorkflow", () => {
    it("should update successfully", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: false }]),
      );
      dbMock.update.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, name: "New" }]),
      );
      const res = await service.updateWorkflow("u", 1, {
        name: "New",
        description: "Desc",
      });
      expect(res.name).toBe("New");
    });

    it("should update trigger and action successfully", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: false }]),
      );
      dbMock.update.mockImplementationOnce(() => createQueryMock([{ id: 1 }]));
      triggerRegistryMock.get.mockReturnValue({ validateConfig: jest.fn() });
      actionRegistryMock.get.mockReturnValue({ validateInput: jest.fn() });
      await service.updateWorkflow("u", 1, {
        trigger: { provider: "p", triggerId: "t", config: {} },
        action: {
          provider: "ap",
          actionId: "ai",
          config: { credentialsId: 30 },
        },
      });
      expect(dbMock.update).toHaveBeenCalled();
    });

    it("should throw if active", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: true }]),
      );
      await expect(service.updateWorkflow("u", 1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw if trigger not found", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: false }]),
      );
      triggerRegistryMock.get.mockReturnValue(null);
      await expect(
        service.updateWorkflow("u", 1, {
          trigger: { provider: "p", triggerId: "t", config: {} },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw if action not found", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: false }]),
      );
      actionRegistryMock.get.mockReturnValue(null);
      await expect(
        service.updateWorkflow("u", 1, {
          action: { provider: "p", actionId: "a", config: {} },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw if trigger validation fails", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: false }]),
      );
      triggerRegistryMock.get.mockReturnValue({
        validateConfig: jest.fn().mockRejectedValue("Fail String"),
      });
      await expect(
        service.updateWorkflow("u", 1, {
          trigger: { provider: "p", triggerId: "t", config: {} },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw if action validation fails", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: false }]),
      );
      actionRegistryMock.get.mockReturnValue({
        validateInput: jest.fn().mockRejectedValue(new Error("Fail")),
      });
      await expect(
        service.updateWorkflow("u", 1, {
          action: { provider: "p", actionId: "a", config: {} },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw if update returns empty", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: false }]),
      );
      dbMock.update.mockImplementationOnce(() => createQueryMock([]));
      await expect(service.updateWorkflow("u", 1, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("deleteWorkflow", () => {
    it("should delete successfully", async () => {
      jest
        .spyOn(service, "getWorkflowById")
        .mockResolvedValueOnce({ id: 1, userId: "u", isActive: true } as any);
      jest
        .spyOn(service, "deactivateWorkflow")
        .mockResolvedValueOnce({ success: true });
      await service.deleteWorkflow("u", 1);
      expect(dbMock.delete).toHaveBeenCalled();
    });
  });

  describe("loadActiveWorkflows", () => {
    it("should load and register", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([
          {
            id: 1,
            triggerProvider: "p",
            triggerId: "t",
            triggerConfig: { credentialsId: 10 },
          },
        ]),
      );
      const triggerMock = { register: jest.fn() };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      await service.loadActiveWorkflows();
      expect(triggerMock.register).toHaveBeenCalledWith(
        1,
        { credentialsId: 10 },
        10,
      );
    });

    it("should use actionCredentialsId if trigger doesn't have one on startup", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([
          {
            id: 1,
            triggerProvider: "p",
            triggerId: "t",
            triggerConfig: {},
            actionCredentialsId: 20,
          },
        ]),
      );
      const triggerMock = { register: jest.fn() };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      await service.loadActiveWorkflows();
      expect(triggerMock.register).toHaveBeenCalledWith(1, {}, 20);
    });

    it("should register on startup even with no credentials", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([
          { id: 1, triggerProvider: "p", triggerId: "t", triggerConfig: {} },
        ]),
      );
      const triggerMock = { register: jest.fn() };
      triggerRegistryMock.get.mockReturnValue(triggerMock);
      await service.loadActiveWorkflows();
      expect(triggerMock.register).toHaveBeenCalledWith(1, {}, undefined);
    });

    it("should warn if trigger not found on startup", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([
          { id: 1, triggerProvider: "p", triggerId: "t", triggerConfig: {} },
        ]),
      );
      triggerRegistryMock.get.mockReturnValue(null);
      const spy = jest.spyOn(Logger.prototype, "warn").mockImplementation();
      await service.loadActiveWorkflows();
      expect(spy).toHaveBeenCalled();
    });

    it("should log error if registration fails on startup", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([
          { id: 1, triggerProvider: "p", triggerId: "t", triggerConfig: {} },
        ]),
      );
      triggerRegistryMock.get.mockReturnValue({
        register: jest.fn().mockRejectedValue("Fail String"),
      });
      const spy = jest.spyOn(Logger.prototype, "error").mockImplementation();
      await service.loadActiveWorkflows();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("getWorkflowExecutions", () => {
    it("should return executions", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u" }]),
      );
      dbMock.select.mockImplementationOnce(() => createQueryMock([]));
      const res = await service.getWorkflowExecutions("u", 1);
      expect(res).toEqual([]);
    });
  });

  describe("triggerWorkflowExecution", () => {
    it("should execute successfully", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: true }]),
      );
      jest.spyOn(service, "executeWorkflow").mockResolvedValueOnce({} as any);
      await service.triggerWorkflowExecution(1, {});
      expect(service.executeWorkflow).toHaveBeenCalled();
    });

    it("should throw if not found", async () => {
      dbMock.select.mockImplementationOnce(() => createQueryMock([]));
      await expect(service.triggerWorkflowExecution(1, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw if not active", async () => {
      dbMock.select.mockImplementationOnce(() =>
        createQueryMock([{ id: 1, userId: "u", isActive: false }]),
      );
      await expect(service.triggerWorkflowExecution(1, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
