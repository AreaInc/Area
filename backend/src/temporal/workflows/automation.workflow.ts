/**
 * Automation Workflow
 *
 * This is the main Temporal workflow that orchestrates trigger → action execution.
 * Each workflow execution represents one trigger firing and executing one action.
 */

import { proxyActivities, log } from "@temporalio/workflow";
import type * as activities from "../activities";

// Proxy activities with timeout configuration
const { sendEmailActivity, readEmailActivity } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: "5 minutes",
  retry: {
    initialInterval: "1s",
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

/**
 * Workflow input structure
 */
export interface AutomationWorkflowInput {
  // Workflow metadata
  workflowId: number;
  userId: string;

  // Trigger information
  triggerProvider: string;
  triggerId: string;
  triggerData: Record<string, any>;

  // Action information
  actionProvider: string;
  actionId: string;
  actionConfig: Record<string, any>;
  actionCredentialsId?: number;
}

/**
 * Workflow output structure
 */
export interface AutomationWorkflowOutput {
  success: boolean;
  actionResult: any;
  error?: string;
}

/**
 * Main automation workflow
 *
 * This workflow:
 * 1. Receives trigger data
 * 2. Executes the configured action
 * 3. Returns the result
 */
export async function automationWorkflow(
  input: AutomationWorkflowInput,
): Promise<AutomationWorkflowOutput> {
  log.info("Starting automation workflow", {
    workflowId: input.workflowId,
    trigger: `${input.triggerProvider}:${input.triggerId}`,
    action: `${input.actionProvider}:${input.actionId}`,
  });

  try {
    // Execute the action based on provider and action ID
    const activityKey = `${input.actionProvider}:${input.actionId}`;

    let actionResult: any;

    // Route to the appropriate activity
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
