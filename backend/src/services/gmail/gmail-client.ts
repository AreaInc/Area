import { google } from "googleapis";

type OAuth2Client = any;
type Gmail = any;

interface GmailCredentials {
  data: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };
}

interface GmailMessagePart {
  body?: {
    data?: string;
    attachmentId?: string;
    size?: number;
  };
  mimeType?: string;
  filename?: string;
  parts?: GmailMessagePart[];
}

interface GmailMessage {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string | number;
  payload?: {
    headers?: Array<{ name?: string; value?: string }>;
    parts?: GmailMessagePart[];
  } & GmailMessagePart;
}

export class GmailClient {
  private oauth2Client: OAuth2Client;
  private gmail: Gmail;

  constructor(credentials: GmailCredentials) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    const data = credentials.data as {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.oauth2Client.setCredentials({
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      expiry_date: data.expiresAt,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  async refreshTokenIfNeeded(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const tokenInfo = await this.oauth2Client.getAccessToken();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!tokenInfo.token) {
        throw new Error("No access token");
      }
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.oauth2Client.setCredentials(credentials);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
    }
  }

  async sendEmail(params: {
    to: string;
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<{ messageId: string; threadId: string }> {
    await this.refreshTokenIfNeeded();

    const to = params.to;
    const cc = params.cc?.join(", ") || "";
    const bcc = params.bcc?.join(", ") || "";
    const subject = params.subject;
    const body = params.body;

    const email = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : "",
      bcc ? `Bcc: ${bcc}` : "",
      `Subject: ${subject}`,
      `Content-Type: ${params.isHtml ? "text/html" : "text/plain"}; charset=utf-8`,
      "",
      body,
    ]
      .filter((line) => line !== "")
      .join("\n");

    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const response = await this.gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      messageId: (response.data?.id as string | undefined) || "",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      threadId: (response.data?.threadId as string | undefined) || "",
    };
  }

  async listMessages(params: {
    query?: string;
    maxResults?: number;
    labelIds?: string[];
  }): Promise<{ messages: Array<{ id?: string }>; totalCount: number }> {
    await this.refreshTokenIfNeeded();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const response = await this.gmail.users.messages.list({
      userId: "me",
      q: params.query,
      maxResults: params.maxResults || 10,
      labelIds: params.labelIds,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const responseData = response.data as
      | {
          messages?: Array<{ id?: string }>;
          resultSizeEstimate?: number;
        }
      | undefined;
    const messages = responseData?.messages || [];
    const totalCount = responseData?.resultSizeEstimate || 0;

    return { messages, totalCount };
  }

  async getMessage(messageId: string): Promise<GmailMessage> {
    await this.refreshTokenIfNeeded();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const response = await this.gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return response.data as GmailMessage;
  }

  getMessageDetails(message: GmailMessage): {
    id: string;
    threadId: string;
    snippet: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    body: string;
    htmlBody: string;
    attachments: Array<{
      filename: string;
      mimeType: string;
      size: number;
      attachmentId: string;
    }>;
  } {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => {
      const header = headers.find(
        (h) => h.name?.toLowerCase() === name.toLowerCase(),
      );
      return header?.value || "";
    };

    const from = getHeader("From");
    const to = getHeader("To");
    const subject = getHeader("Subject");
    const date = getHeader("Date");

    let body = "";
    let htmlBody = "";

    const extractBody = (part: GmailMessagePart): void => {
      if (part.body?.data) {
        try {
          const content = Buffer.from(part.body.data, "base64url").toString(
            "utf-8",
          );
          if (
            part.mimeType === "text/html" ||
            part.mimeType?.includes("html")
          ) {
            htmlBody = content;
          } else if (
            part.mimeType === "text/plain" ||
            part.mimeType?.includes("plain")
          ) {
            body = content;
          }
        } catch {
          try {
            const content = Buffer.from(part.body.data, "base64").toString(
              "utf-8",
            );
            if (
              part.mimeType === "text/html" ||
              part.mimeType?.includes("html")
            ) {
              htmlBody = content;
            } else if (
              part.mimeType === "text/plain" ||
              part.mimeType?.includes("plain")
            ) {
              body = content;
            }
          } catch {
            // Ignore decoding errors
          }
        }
      }
      if (part.parts) {
        part.parts.forEach(extractBody);
      }
    };

    if (message.payload) {
      extractBody(message.payload);
    }

    const attachments: Array<{
      filename: string;
      mimeType: string;
      size: number;
      attachmentId: string;
    }> = [];

    const extractAttachments = (part: GmailMessagePart): void => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || "application/octet-stream",
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId,
        });
      }
      if (part.parts) {
        part.parts.forEach(extractAttachments);
      }
    };

    if (message.payload) {
      extractAttachments(message.payload);
    }

    return {
      id: message.id || "",
      threadId: message.threadId || "",
      snippet: message.snippet || "",
      from,
      to,
      subject,
      date:
        date ||
        new Date(
          (message.internalDate as number | undefined) || Date.now(),
        ).toISOString(),
      body,
      htmlBody,
      attachments,
    };
  }
}
