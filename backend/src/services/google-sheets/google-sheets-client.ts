import { google } from "googleapis";

type OAuth2Client = any;
type Sheets = any;
type Drive = any;

export interface GoogleSheetsCredentials {
    data: {
        accessToken?: string;
        refreshToken?: string;
        expiresAt?: number;
    };
    clientId?: string;
    clientSecret?: string;
}

export class GoogleSheetsClient {
    private oauth2Client: OAuth2Client;
    private sheets: Sheets;
    private drive: Drive;

    constructor(credentials: GoogleSheetsCredentials) {
        this.oauth2Client = new google.auth.OAuth2(
            credentials.clientId || process.env.GOOGLE_CLIENT_ID,
            credentials.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
        );

        const data = credentials.data;
        this.oauth2Client.setCredentials({
            access_token: data.accessToken,
            refresh_token: data.refreshToken,
            expiry_date: data.expiresAt,
        });

        this.sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
        this.drive = google.drive({ version: "v3", auth: this.oauth2Client });
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
            this.sheets = google.sheets({ version: "v4", auth: this.oauth2Client });
            this.drive = google.drive({ version: "v3", auth: this.oauth2Client });
        }
    }

    async createSpreadsheet(title: string) {
        await this.refreshTokenIfNeeded();
        const response = await this.sheets.spreadsheets.create({
            requestBody: {
                properties: { title },
            },
        });
        return {
            spreadsheetId: response.data.spreadsheetId,
            spreadsheetUrl: response.data.spreadsheetUrl,
            title: response.data.properties?.title,
        };
    }

    async appendRow(spreadsheetId: string, sheetName: string | undefined, values: any[]) {
        await this.refreshTokenIfNeeded();
        let finalSheetName = sheetName;
        if (!finalSheetName) {
            try {
                const metadata = await this.sheets.spreadsheets.get({
                    spreadsheetId,
                    fields: 'sheets.properties.title'
                });
                finalSheetName = metadata.data.sheets?.[0]?.properties?.title || 'Sheet1';
            } catch {
                finalSheetName = 'Sheet1';
            }
        }

        const range = `${finalSheetName}!A:Z`;
        const response = await this.sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values],
            },
        });
        return response.data;
    }

    async updateCell(spreadsheetId: string, range: string, value: any) {
        await this.refreshTokenIfNeeded();
        const response = await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[value]],
            },
        });
        return response.data;
    }

    async readRange(spreadsheetId: string, range: string) {
        await this.refreshTokenIfNeeded();
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.data;
    }

    async createSheet(spreadsheetId: string, sheetTitle: string) {
        await this.refreshTokenIfNeeded();
        const response = await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: { title: sheetTitle },
                    },
                }],
            },
        });
        return {
            spreadsheetId,
            sheetTitle,
            sheetId: response.data.replies?.[0]?.addSheet?.properties?.sheetId,
        };
    }

    async clearRange(spreadsheetId: string, range: string) {
        await this.refreshTokenIfNeeded();
        const response = await this.sheets.spreadsheets.values.clear({
            spreadsheetId,
            range,
            requestBody: {},
        });
        return response.data;
    }

    async duplicateSheet(spreadsheetId: string, newTitle: string) {
        await this.refreshTokenIfNeeded();
        // duplicateSheet is actually copying the FILE (spreadsheet) in area_a_copier logic, NOT duplicating a tab.
        // Logic: `this.driveBaseUrl}/files/${spreadsheetId}/copy`
        const response = await this.drive.files.copy({
            fileId: spreadsheetId,
            requestBody: {
                name: newTitle,
            },
        });
        return {
            originalSpreadsheetId: spreadsheetId,
            newSpreadsheetId: response.data.id,
            newTitle: response.data.name,
        };
    }

    async findReplace(spreadsheetId: string, find: string, replacement: string, sheetId?: number) {
        await this.refreshTokenIfNeeded();
        const response = await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    findReplace: {
                        find,
                        replacement,
                        allSheets: !sheetId,
                        sheetId,
                    }
                }]
            }
        });
        return {
            replacements: response.data.replies?.[0]?.findReplace?.occurrencesChanged || 0
        };
    }

    async sortRange(spreadsheetId: string, range: string, sortColumn: string | undefined, ascending: boolean, sheetId: number = 0) {
        await this.refreshTokenIfNeeded();
        const { startRow, endRow, startCol, endCol } = this.parseRange(range);
        let sortColumnIndex: number;
        if (sortColumn) {
            sortColumnIndex = this.columnLetterToIndex(sortColumn);
        } else {
            sortColumnIndex = startCol;
        }

        const response = await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    sortRange: {
                        range: {
                            sheetId,
                            startRowIndex: startRow,
                            endRowIndex: endRow,
                            startColumnIndex: startCol,
                            endColumnIndex: endCol,
                        },
                        sortSpecs: [{
                            dimensionIndex: sortColumnIndex,
                            sortOrder: ascending ? 'ASCENDING' : 'DESCENDING',
                        }],
                    },
                }],
            }
        });
        return response.data;
    }

    private a1ToIndex(a1: string): { row: number; col: number } {
        const match = a1.match(/^([A-Z]+)(\d+)$/);
        if (!match) throw new Error(`Invalid A1 notation: ${a1}`);
        const colLetters = match[1];
        const rowNumber = parseInt(match[2], 10);
        let col = 0;
        for (let i = 0; i < colLetters.length; i++) {
            col = col * 26 + (colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        col -= 1;
        return { row: rowNumber - 1, col };
    }

    private parseRange(range: string) {
        const parts = range.split(':');
        if (parts.length !== 2) throw new Error(`Invalid range format: ${range}`);
        const start = this.a1ToIndex(parts[0]);
        const end = this.a1ToIndex(parts[1]);
        return {
            startRow: start.row,
            endRow: end.row + 1,
            startCol: start.col,
            endCol: end.col + 1
        };
    }

    private columnLetterToIndex(letter: string): number {
        let col = 0;
        for (let i = 0; i < letter.length; i++) {
            col = col * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        return col - 1;
    }
}
