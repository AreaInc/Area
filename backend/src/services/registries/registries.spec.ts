import { Test, TestingModule } from "@nestjs/testing";
import { TriggerRegistryService } from "./trigger-registry.service";
import { ActionRegistryService } from "./action-registry.service";
import { TriggerType } from "../../common/types/trigger.interface";

describe("RegistryServices", () => {
  let triggerRegistry: TriggerRegistryService;
  let actionRegistry: ActionRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TriggerRegistryService, ActionRegistryService],
    }).compile();

    triggerRegistry = module.get<TriggerRegistryService>(
      TriggerRegistryService,
    );
    actionRegistry = module.get<ActionRegistryService>(ActionRegistryService);
  });

  describe("TriggerRegistryService", () => {
    const mockTrigger: any = {
      id: "t1",
      name: "Trigger 1",
      description: "Desc",
      serviceProvider: "test",
      triggerType: TriggerType.POLLING,
      requiresCredentials: true,
      configSchema: {},
      outputSchema: {},
    };

    it("should register and retrieve a trigger", () => {
      triggerRegistry.register(mockTrigger);
      expect(triggerRegistry.get("test", "t1")).toEqual(mockTrigger);
      expect(triggerRegistry.has("test", "t1")).toBe(true);
    });

    it("should return undefined for missing trigger", () => {
      expect(triggerRegistry.get("test", "missing")).toBeUndefined();
    });

    it("should return all triggers", () => {
      triggerRegistry.register(mockTrigger);
      expect(triggerRegistry.getAll()).toContain(mockTrigger);
    });

    it("should filter by provider", () => {
      triggerRegistry.register(mockTrigger);
      triggerRegistry.register({
        ...mockTrigger,
        id: "t2",
        serviceProvider: "other",
      });

      const result = triggerRegistry.getByProvider("test");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t1");
    });

    it("should return metadata", () => {
      triggerRegistry.register(mockTrigger);
      const meta = triggerRegistry.getMetadata("test", "t1");
      expect(meta).toBeDefined();
      expect(meta?.id).toBe("t1");
    });

    it("should unregister a trigger", () => {
      triggerRegistry.register(mockTrigger);
      triggerRegistry.unregister("test", "t1");
      expect(triggerRegistry.has("test", "t1")).toBe(false);
    });
  });

  describe("ActionRegistryService", () => {
    const mockAction: any = {
      id: "a1",
      name: "Action 1",
      description: "Desc",
      serviceProvider: "test",
      requiresCredentials: true,
      configSchema: {},
      getMetadata: jest.fn().mockReturnValue({ id: "a1", name: "Action 1" }),
    };

    it("should register and retrieve an action", () => {
      actionRegistry.register(mockAction);
      expect(actionRegistry.get("test", "a1")).toEqual(mockAction);
      expect(actionRegistry.has("test", "a1")).toBe(true);
    });

    it("should return undefined for missing action", () => {
      expect(actionRegistry.get("test", "missing")).toBeUndefined();
    });

    it("should return all actions", () => {
      actionRegistry.register(mockAction);
      expect(actionRegistry.getAll()).toContain(mockAction);
    });

    it("should filter by provider", () => {
      actionRegistry.register(mockAction);
      actionRegistry.register({
        ...mockAction,
        id: "a2",
        serviceProvider: "other",
      });

      const result = actionRegistry.getByProvider("test");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("a1");
    });

    it("should return metadata", () => {
      actionRegistry.register(mockAction);
      const meta = actionRegistry.getMetadata("test", "a1");
      expect(meta).toBeDefined();
      expect(meta?.id).toBe("a1");
    });
  });
});
