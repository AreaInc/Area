import { Injectable } from "@nestjs/common";
import {
  IAction,
  ActionMetadata,
} from "../../../common/types/action.interface";

@Injectable()
export class SendEmailAction implements IAction {
  id = "send-email";
  name = "Send Email";
  description = "Send an email via Gmail";
  serviceProvider = "gmail";
  requiresCredentials = true;

  inputSchema = {
    type: "object",
    required: ["to", "subject", "body"],
    properties: {
      to: {
        type: "string",
        description:
          "Recipient email address. Supports template variables: {{variableName}}",
        example: "user@example.com",
      },
      subject: {
        type: "string",
        description:
          "Email subject. Supports template variables: {{variableName}}",
        example: "New email from {{from}}",
      },
      body: {
        type: "string",
        description:
          "Email body content. Supports template variables: {{variableName}}",
        example: "You received an email with subject: {{subject}}",
      },
      cc: {
        type: "array",
        items: { type: "string" },
        description: "CC recipients (optional)",
      },
      bcc: {
        type: "array",
        items: { type: "string" },
        description: "BCC recipients (optional)",
      },
      isHtml: {
        type: "boolean",
        description: "Whether the body is HTML (default: false)",
        default: false,
      },
    },
  };

  outputSchema = {
    type: "object",
    properties: {
      messageId: {
        type: "string",
        description: "Gmail message ID",
      },
      threadId: {
        type: "string",
        description: "Gmail thread ID",
      },
      success: {
        type: "boolean",
        description: "Whether the email was sent successfully",
      },
      error: {
        type: "string",
        description: "Error message if the action failed",
      },
    },
  };

  async validateInput(config: Record<string, any>): Promise<boolean> {
    if (!config.to || typeof config.to !== "string") {
      throw new Error('Invalid "to" field: must be a non-empty string');
    }

    if (!config.subject || typeof config.subject !== "string") {
      throw new Error('Invalid "subject" field: must be a non-empty string');
    }

    if (!config.body || typeof config.body !== "string") {
      throw new Error('Invalid "body" field: must be a non-empty string');
    }

    if (config.cc && !Array.isArray(config.cc)) {
      throw new Error('Invalid "cc" field: must be an array');
    }

    if (config.bcc && !Array.isArray(config.bcc)) {
      throw new Error('Invalid "bcc" field: must be an array');
    }

    if (config.isHtml !== undefined && typeof config.isHtml !== "boolean") {
      throw new Error('Invalid "isHtml" field: must be a boolean');
    }

    return true;
  }

  getMetadata(): ActionMetadata {
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
