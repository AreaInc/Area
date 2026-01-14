import { ActionRegistryService } from "./action-registry.service";
import { TriggerRegistryService } from "./trigger-registry.service";
import { SendEmailAction } from "../gmail/actions/send-email.action";
import { ReceiveEmailTrigger } from "../gmail/triggers/receive-email.trigger";
import { SendDiscordWebhookAction } from "../discord/actions/send-webhook.action";
import { PublicWebhookTrigger } from "../webhook/triggers/public-webhook.trigger";
import { CronTrigger } from "../scheduler/triggers/cron.trigger";
import { TriggerType } from "../../common/types/trigger.interface";

describe("Action and Trigger registry integration", () => {
  let actionRegistry: ActionRegistryService;
  let triggerRegistry: TriggerRegistryService;
  let gmailAction: SendEmailAction;
  let gmailTrigger: ReceiveEmailTrigger;
  let mockWorkflowService: { triggerWorkflowExecution: jest.Mock };

  beforeEach(() => {
    actionRegistry = new ActionRegistryService();
    triggerRegistry = new TriggerRegistryService();
    gmailAction = new SendEmailAction();
    gmailTrigger = new ReceiveEmailTrigger();
    mockWorkflowService = {
      triggerWorkflowExecution: jest.fn(),
    };
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
    const discordAction = new SendDiscordWebhookAction();
    const webhookTrigger = new PublicWebhookTrigger();
    const scheduledTrigger = new CronTrigger(
      mockWorkflowService as any,
    );

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

    const cronConfig = { cron: "0 * * * *" };
    await expect(scheduledTrigger.validateConfig(cronConfig)).resolves.toBe(
      true,
    );
    await scheduledTrigger.register(7, cronConfig);
    expect(scheduledTrigger.isRegistered(7)).toBe(true);
    await scheduledTrigger.unregister(7);

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
