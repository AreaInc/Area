import { Test, TestingModule } from "@nestjs/testing";
import { WorkflowsV2Controller } from "./workflows-v2.controller";
import { WorkflowsService } from "../../services/workflows/workflows.service";
import { TriggerRegistryService } from "../../services/registries/trigger-registry.service";
import { ActionRegistryService } from "../../services/registries/action-registry.service";
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

describe("WorkflowsV2Controller", () => {
  let controller: WorkflowsV2Controller;
  let workflowsServiceMock: any;
  let triggerRegistryMock: any;
  let actionRegistryMock: any;

  beforeEach(async () => {
    workflowsServiceMock = {
      createWorkflow: jest.fn(),
      getUserWorkflows: jest.fn(),
      getWorkflowById: jest.fn(),
      updateWorkflow: jest.fn(),
      deleteWorkflow: jest.fn(),
      activateWorkflow: jest.fn(),
      deactivateWorkflow: jest.fn(),
      executeWorkflow: jest.fn(),
      getWorkflowExecutions: jest.fn(),
    };

    triggerRegistryMock = {
      getAllMetadata: jest.fn().mockReturnValue([]),
    };

    actionRegistryMock = {
      getAllMetadata: jest.fn().mockReturnValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowsV2Controller],
      providers: [
        { provide: WorkflowsService, useValue: workflowsServiceMock },
        { provide: TriggerRegistryService, useValue: triggerRegistryMock },
        { provide: ActionRegistryService, useValue: actionRegistryMock },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<WorkflowsV2Controller>(WorkflowsV2Controller);
  });

  describe("createWorkflow", () => {
    it("should create workflow", async () => {
      const req = { user: { id: "user1" } };
      const dto = {
        name: "test",
        trigger: { provider: "gmail", triggerId: "email", config: {} },
        action: { provider: "discord", actionId: "msg", config: {} },
      };
      workflowsServiceMock.createWorkflow.mockResolvedValue({ id: 1 });

      const result = await controller.createWorkflow(req as any, dto as any);
      expect(result).toEqual({ id: 1 });
      expect(workflowsServiceMock.createWorkflow).toHaveBeenCalled();
    });

    it("should throw if no user", async () => {
      const req = { user: null };
      await expect(
        controller.createWorkflow(req as any, {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getUserWorkflows", () => {
    it("should return workflows", async () => {
      const req = { user: { id: "user1" } };
      workflowsServiceMock.getUserWorkflows.mockResolvedValue([]);
      const result = await controller.getUserWorkflows(req as any);
      expect(result).toEqual([]);
    });
  });

  describe("getWorkflow", () => {
    it("should return workflow", async () => {
      const req = { user: { id: "user1" } };
      workflowsServiceMock.getWorkflowById.mockResolvedValue({ id: 1 });
      const result = await controller.getWorkflow(req as any, "1");
      expect(result.id).toBe(1);
    });
  });

  describe("updateWorkflow", () => {
    it("should update workflow", async () => {
      const req = { user: { id: "user1" } };
      workflowsServiceMock.updateWorkflow.mockResolvedValue({ id: 1 });
      const result = await controller.updateWorkflow(
        req as any,
        "1",
        {} as any,
      );
      expect(result).toEqual({ id: 1 });
    });
  });

  describe("deleteWorkflow", () => {
    it("should delete workflow", async () => {
      const req = { user: { id: "user1" } };
      workflowsServiceMock.deleteWorkflow.mockResolvedValue({ success: true });
      const result = await controller.deleteWorkflow(req as any, "1");
      expect(result.success).toBe(true);
    });
  });

  describe("activateWorkflow", () => {
    it("should activate workflow", async () => {
      const req = { user: { id: "user1" } };
      workflowsServiceMock.activateWorkflow.mockResolvedValue({
        success: true,
      });
      const result = await controller.activateWorkflow(req as any, "1");
      expect(result.success).toBe(true);
    });
  });

  describe("deactivateWorkflow", () => {
    it("should deactivate workflow", async () => {
      const req = { user: { id: "user1" } };
      workflowsServiceMock.deactivateWorkflow.mockResolvedValue({
        success: true,
      });
      const result = await controller.deactivateWorkflow(req as any, "1");
      expect(result.success).toBe(true);
    });
  });

  describe("executeWorkflow", () => {
    it("should execute workflow", async () => {
      const req = { user: { id: "user1" } };
      workflowsServiceMock.executeWorkflow.mockResolvedValue({ id: "exec1" });
      const result = await controller.executeWorkflow(req as any, "1", {
        triggerData: {},
      });
      expect(result.id).toBe("exec1");
    });
  });

  describe("getWorkflowExecutions", () => {
    it("should return executions", async () => {
      const req = { user: { id: "user1" } };
      workflowsServiceMock.getWorkflowExecutions.mockResolvedValue([]);
      const result = await controller.getWorkflowExecutions(req as any, "1");
      expect(result).toEqual([]);
    });
  });

  describe("metadata", () => {
    it("should get available triggers", async () => {
      const result = await controller.getAvailableTriggers();
      expect(result).toEqual([]);
    });
    it("should get available actions", async () => {
      const result = await controller.getAvailableActions();
      expect(result).toEqual([]);
    });
  });
});
