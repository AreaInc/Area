import { google, calendar_v3 } from "googleapis";

type OAuth2Client = any;
type Calendar = calendar_v3.Calendar;

interface GoogleCalendarCredentials {
  data: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };
  clientId?: string;
  clientSecret?: string;
}

export class GoogleCalendarClient {
  private oauth2Client: OAuth2Client;
  private calendar: Calendar;

  constructor(credentials: GoogleCalendarCredentials) {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId || process.env.GOOGLE_CLIENT_ID,
      credentials.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
    );

    const data = credentials.data as {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    };
    this.oauth2Client.setCredentials({
      access_token: data.accessToken,
      refresh_token: data.refreshToken,
      expiry_date: data.expiresAt,
    });

    this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
  }

  async refreshTokenIfNeeded(): Promise<void> {
    try {
      const tokenInfo = await this.oauth2Client.getAccessToken();
      if (!tokenInfo.token) {
        throw new Error("No access token");
      }
    } catch {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      this.calendar = google.calendar({
        version: "v3",
        auth: this.oauth2Client,
      });
    }
  }

  async listEvents(params: {
    calendarId?: string;
    maxResults?: number;
    timeMin?: string;
    singleEvents?: boolean;
    orderBy?: string;
    syncToken?: string;
  }) {
    await this.refreshTokenIfNeeded();
    const response = await this.calendar.events.list({
      calendarId: params.calendarId || "primary",
      maxResults: params.maxResults || 10,
      timeMin: params.timeMin || new Date().toISOString(),
      singleEvents: params.singleEvents ?? true,
      orderBy: params.orderBy || "startTime",
      syncToken: params.syncToken,
    });

    return {
      events: response.data.items || [],
      nextSyncToken: response.data.nextSyncToken,
      nextPageToken: response.data.nextPageToken,
    };
  }

  async createEvent(params: {
    calendarId?: string;
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: string[];
  }) {
    await this.refreshTokenIfNeeded();

    const requestBody: calendar_v3.Schema$Event = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: params.start,
      end: params.end,
    };

    if (params.attendees) {
      requestBody.attendees = params.attendees.map((email) => ({ email }));
    }

    const response = await this.calendar.events.insert({
      calendarId: params.calendarId || "primary",
      requestBody,
    });

    return response.data;
  }

  async deleteEvent(params: { calendarId?: string; eventId: string }) {
    await this.refreshTokenIfNeeded();
    await this.calendar.events.delete({
      calendarId: params.calendarId || "primary",
      eventId: params.eventId,
    });
  }

  async updateEvent(params: {
    calendarId?: string;
    eventId: string;
    summary?: string;
    description?: string;
    location?: string;
    start?: { dateTime: string; timeZone?: string };
    end?: { dateTime: string; timeZone?: string };
  }) {
    await this.refreshTokenIfNeeded();

    // First get the event to merge changes
    const currentEvent = await this.calendar.events.get({
      calendarId: params.calendarId || "primary",
      eventId: params.eventId,
    });

    const requestBody: calendar_v3.Schema$Event = {
      ...currentEvent.data,
      summary: params.summary ?? currentEvent.data.summary,
      description: params.description ?? currentEvent.data.description,
      location: params.location ?? currentEvent.data.location,
      start: params.start ?? currentEvent.data.start,
      end: params.end ?? currentEvent.data.end,
    };

    const response = await this.calendar.events.update({
      calendarId: params.calendarId || "primary",
      eventId: params.eventId,
      requestBody,
    });

    return response.data;
  }

  async quickAdd(params: { calendarId?: string; text: string }) {
    await this.refreshTokenIfNeeded();
    const response = await this.calendar.events.quickAdd({
      calendarId: params.calendarId || "primary",
      text: params.text,
    });
    return response.data;
  }
}
