export interface GoogleSheetsConnection {
  connected: boolean;
  provider: 'google';
}

export interface SpreadsheetInfo {
  spreadsheetId: string;
  url: string;
  title: string;
}

const isProductionConfigured = import.meta.env.VITE_GOOGLE_SHEETS_ENABLED === 'true';

export async function connectGoogleAccount(): Promise<GoogleSheetsConnection> {
  if (!isProductionConfigured) {
    return { connected: false, provider: 'google' };
  }

  // Production integration placeholder.
  // Replace with actual OAuth / Google credential flow.
  return { connected: true, provider: 'google' };
}

export async function createSpreadsheet(title: string): Promise<SpreadsheetInfo> {
  if (!isProductionConfigured) {
    throw new Error('Google Sheets integration is not configured');
  }

  // Production integration placeholder.
  return {
    spreadsheetId: `gsheet-${Date.now()}`,
    url: `https://docs.google.com/spreadsheets/d/${encodeURIComponent(`gsheet-${Date.now()}`)}`,
    title,
  };
}

export async function appendLeads(spreadsheetId: string, rows: string[][]): Promise<void> {
  if (!isProductionConfigured) {
    throw new Error('Google Sheets integration is not configured');
  }

  // Production integration placeholder.
  return;
}

export async function updateLead(leadId: string, rowId: string): Promise<void> {
  if (!isProductionConfigured) {
    throw new Error('Google Sheets integration is not configured');
  }

  // Production integration placeholder.
  return;
}

export function isGoogleSheetsProduction(): boolean {
  return isProductionConfigured;
}
