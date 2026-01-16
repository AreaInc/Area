import { proxyActivities, log } from "@temporalio/workflow";
import type * as activities from "../activities";

const {
  sendEmailActivity,
  readEmailActivity,
  sendDiscordWebhookActivity,
  sendTelegramMessageActivity,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 minutes",
  retry: {
    initialInterval: "1s",
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

export interface AutomationWorkflowInput {
  workflowId: number;
  userId: string;

  triggerProvider: string;
  triggerId: string;
  triggerData: Record<string, any>;

  actionProvider: string;
  actionId: string;
  actionConfig: Record<string, any>;
  actionCredentialsId?: number;
}

export interface AutomationWorkflowOutput {
  success: boolean;
  actionResult: any;
  error?: string;
}

export async function automationWorkflow(
  input: AutomationWorkflowInput,
): Promise<AutomationWorkflowOutput> {
  log.info("Starting automation workflow", {
    workflowId: input.workflowId,
    trigger: `${input.triggerProvider}:${input.triggerId}`,
    action: `${input.actionProvider}:${input.actionId}`,
  });

  try {
    const activityKey = `${input.actionProvider}:${input.actionId}`;

    let actionResult: any;

    switch (activityKey) {
      case "gmail:send-email":
        if (!input.actionCredentialsId) {
          throw new Error("Credentials required for send-email action");
        }

        actionResult = await sendEmailActivity({
          ...input.actionConfig,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
          triggerData: input.triggerData,
        } as any);
        break;

      case "gmail:read-email":
        if (!input.actionCredentialsId) {
          throw new Error("Credentials required for read-email action");
        }

        actionResult = await readEmailActivity({
          ...input.actionConfig,
          credentialId: input.actionCredentialsId,
          userId: input.userId,
        });
        break;

      case "discord:send-webhook":
        actionResult = await sendDiscordWebhookActivity({
          webhookUrl: input.actionConfig.webhookUrl,
          content: input.actionConfig.content,
          triggerData: input.triggerData,
        });
        break;

      case "telegram:send-message":
        actionResult = await sendTelegramMessageActivity({
          botToken: input.actionConfig.botToken,
          chatId: input.actionConfig.chatId,
          text: input.actionConfig.text,
          parseMode: input.actionConfig.parseMode,
          disableWebPagePreview: input.actionConfig.disableWebPagePreview,
          disableNotification: input.actionConfig.disableNotification,
          triggerData: input.triggerData,
        });
        break;

      default:
        throw new Error(`Unsupported action: ${activityKey}`);
    }

    log.info("Automation workflow completed successfully", {
      workflowId: input.workflowId,
      actionResult,
    });

    return {
      success: true,
      actionResult,
    };
  } catch (error) {
    log.error("Automation workflow failed", {
      workflowId: input.workflowId,
      error: error.message,
    });

    return {
      success: false,
      actionResult: null,
      error: error.message || "Unknown error",
    };
  }
}
