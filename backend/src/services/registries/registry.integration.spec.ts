import { ActionRegistryService } from "./action-registry.service";
import { TriggerRegistryService } from "./trigger-registry.service";
import { SendEmailAction } from "../gmail/actions/send-email.action";
import { ReceiveEmailTrigger } from "../gmail/triggers/receive-email.trigger";
import { IAction } from "../../common/types/action.interface";
import { ITrigger, TriggerType } from "../../common/types/trigger.interface";

class DiscordWebhookAction implements IAction {
  id = "send-webhook";
  name = "Send Discord Webhook";
  description = "Post a message to a Discord webhook URL";
  serviceProvider = "discord";
  requiresCredentials = false;

  inputSchema = {
    type: "object",
    required: ["webhookUrl", "content"],
    properties: {
      webhookUrl: { type: "string" },
      content: { type: "string" },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      delivered: { type: "boolean" },
      status: { type: "number" },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    if (!config.webhookUrl || typeof config.webhookUrl !== "string") {
      throw new Error("webhookUrl is required");
    }
    if (!config.content || typeof config.content !== "string") {
      throw new Error("content is required");
    }
    return true;
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      serviceProvider: this.serviceProvider,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      requiresCredentials: this.requiresCredentials,
    };
  }
}

class PublicWebhookTrigger implements ITrigger {
  id = "incoming-webhook";
  name = "Public Webhook";
  description = "Fire workflows from any HTTP POST";
  serviceProvider = "webhook";
  triggerType = TriggerType.WEBHOOK;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["path"],
    properties: {
      path: { type: "string" },
      secret: { type: "string" },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      payload: { type: "object" },
      headers: { type: "object" },
    },
  };

  private registrations = new Map<number, Record<string, any>>();

  async register(workflowId: number, config: Record<string, any>) {
    this.registrations.set(workflowId, config);
  }

  async unregister(workflowId: number) {
    this.registrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>) {
    if (!config.path || typeof config.path !== "string") {
      throw new Error("path is required");
    }
    return true;
  }

  isRegistered(workflowId: number) {
    return this.registrations.has(workflowId);
  }
}

class ScheduledTrigger implements ITrigger {
  id = "every-hour";
  name = "Every hour";
  description = "Run on a fixed schedule";
  serviceProvider = "scheduler";
  triggerType = TriggerType.SCHEDULED;
  requiresCredentials = false;

  configSchema = {
    type: "object",
    required: ["cron"],
    properties: {
      cron: { type: "string" },
    },
  };

  outputSchema = { type: "object", properties: {} };

  private registrations = new Set<number>();

  async register(workflowId: number, config: Record<string, any>) {
    if (!config.cron) {
      throw new Error("cron expression required");
    }
    this.registrations.add(workflowId);
  }

  async unregister(workflowId: number) {
    this.registrations.delete(workflowId);
  }

  async validateConfig(config: Record<string, any>) {
    if (!config.cron || typeof config.cron !== "string") {
      throw new Error("cron expression required");
    }
    return true;
  }

  isRegistered(workflowId: number) {
    return this.registrations.has(workflowId);
  }
}

describe("Action and Trigger registry integration", () => {
  let actionRegistry: ActionRegistryService;
  let triggerRegistry: TriggerRegistryService;
  let gmailAction: SendEmailAction;
  let gmailTrigger: ReceiveEmailTrigger;

  beforeEach(() => {
    actionRegistry = new ActionRegistryService();
    triggerRegistry = new TriggerRegistryService();
    gmailAction = new SendEmailAction();
    gmailTrigger = new ReceiveEmailTrigger();
  });

  it("registers Gmail definitions and exposes consistent metadata", async () => {
    triggerRegistry.register(gmailTrigger);
    actionRegistry.register(gmailAction);

    const triggerMetadata = triggerRegistry.getAllMetadata();
    const actionMetadata = actionRegistry.getAllMetadata();

    expect(triggerRegistry.has("gmail", "receive-email")).toBe(true);
    expect(actionRegistry.has("gmail", "send-email")).toBe(true);

    expect(triggerMetadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "receive-email",
          serviceProvider: "gmail",
          triggerType: TriggerType.EVENT,
          configSchema: expect.any(Object),
          outputSchema: expect.any(Object),
        }),
      ]),
    );

    expect(actionMetadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "send-email",
          serviceProvider: "gmail",
          inputSchema: expect.any(Object),
          outputSchema: expect.any(Object),
        }),
      ]),
    );

    await expect(
      gmailTrigger.validateConfig({ from: 123 as any }),
    ).rejects.toThrow(/from/);
    await expect(
      gmailAction.validateInput({
        to: "user@example.com",
        subject: "Hello",
        body: "World",
      }),
    ).resolves.toBe(true);
  });

  it("tracks workflow registrations for Gmail receive-email trigger", async () => {
    await gmailTrigger.register(1, { from: "boss@example.com" });
    await gmailTrigger.register(2, { subject: "invoice" });

    const matches = gmailTrigger.getMatchingWorkflows({
      from: "Boss@example.com",
      subject: "Invoice payment",
    });

    expect(matches).toEqual(expect.arrayContaining([1, 2]));

    await gmailTrigger.unregister(1);
    const matchesAfterUnregister = gmailTrigger.getMatchingWorkflows({
      from: "boss@example.com",
      subject: "invoice pending",
    });

    expect(matchesAfterUnregister).toEqual(expect.arrayContaining([2]));
    expect(matchesAfterUnregister).not.toContain(1);
  });

  it("handles webhook-style and scheduled providers alongside Gmail", async () => {
    const discordAction = new DiscordWebhookAction();
    const webhookTrigger = new PublicWebhookTrigger();
    const scheduledTrigger = new ScheduledTrigger();

    actionRegistry.register(gmailAction);
    actionRegistry.register(discordAction);
    triggerRegistry.register(gmailTrigger);
    triggerRegistry.register(webhookTrigger);
    triggerRegistry.register(scheduledTrigger);

    const webhookConfig = { path: "/hooks/public", secret: "token" };
    await expect(webhookTrigger.validateConfig(webhookConfig)).resolves.toBe(
      true,
    );
    await webhookTrigger.register(42, webhookConfig);
    expect(webhookTrigger.isRegistered(42)).toBe(true);

    await expect(
      scheduledTrigger.validateConfig({ cron: "0 * * * *" }),
    ).resolves.toBe(true);
    await scheduledTrigger.register(7, { cron: "0 * * * *" });
    expect(scheduledTrigger.isRegistered(7)).toBe(true);

    await expect(
      discordAction.validateInput({
        webhookUrl: "https://discord.test/webhook",
        content: "hello",
      }),
    ).resolves.toBe(true);

    const discordActions = actionRegistry.getByProvider("discord");
    const webhookTriggers = triggerRegistry.getByProvider("webhook");
    const schedulerTriggers = triggerRegistry.getByProvider("scheduler");

    expect(discordActions).toHaveLength(1);
    expect(webhookTriggers).toHaveLength(1);
    expect(schedulerTriggers).toHaveLength(1);
  });

  it("unregisters triggers cleanly so providers can be swapped or disabled", async () => {
    const webhookTrigger = new PublicWebhookTrigger();
    triggerRegistry.register(webhookTrigger);
    expect(triggerRegistry.has("webhook", "incoming-webhook")).toBe(true);

    await webhookTrigger.register(9, { path: "/hooks/x" });
    expect(webhookTrigger.isRegistered(9)).toBe(true);

    await webhookTrigger.unregister(9);
    expect(webhookTrigger.isRegistered(9)).toBe(false);

    triggerRegistry.unregister("webhook", "incoming-webhook");
    expect(triggerRegistry.has("webhook", "incoming-webhook")).toBe(false);
  });
});
