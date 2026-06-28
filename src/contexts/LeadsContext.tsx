import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { leads as mockLeads } from '@/lib/mockData';
import api from '@/lib/api';
import { connectGoogleAccount, createSpreadsheet, appendLeads, isGoogleSheetsProduction } from '@/services/googleSheets';
import type { Lead, LeadPriority, LeadStatus, Channel } from '@/types';

export interface CreateLeadInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  channel: Channel;
  priority: LeadPriority;
  status: LeadStatus;
  aiScore: number;
  value: number;
  notes?: string;
}

export type SheetsSyncStatus = 'idle' | 'syncing' | 'synced' | 'failed';

export interface SheetsSyncRecord {
  id: string;
  time: string;
  rowsSynced: number;
  status: 'success' | 'failure';
  message?: string;
}

interface LeadsContextValue {
  leads: Lead[];
  addLead: (input: CreateLeadInput) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  syncToSheets: () => Promise<void>;
  syncLoading: boolean;
  syncStatus: SheetsSyncStatus;
  lastSyncAt: string | null;
  totalSyncedRows: number;
  syncHistory: SheetsSyncRecord[];
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SheetsSyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [totalSyncedRows, setTotalSyncedRows] = useState(0);
  const [syncHistory, setSyncHistory] = useState<SheetsSyncRecord[]>([]);

  const STORAGE_KEY = 'omniflow_google_sheets_sync';

  const persistSyncState = useCallback(
    (history: SheetsSyncRecord[], lastSync: string | null, totalRows: number, status: SheetsSyncStatus) => {
      const payload = { history, lastSync, totalRows, status };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },
    [],
  );

  const loadStoredSyncState = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        history: SheetsSyncRecord[];
        lastSync: string | null;
        totalRows: number;
        status: SheetsSyncStatus;
      };
      setSyncHistory(parsed.history ?? []);
      setLastSyncAt(parsed.lastSync ?? null);
      setTotalSyncedRows(parsed.totalRows ?? 0);
      setSyncStatus(parsed.status ?? 'idle');
    } catch {
      // ignore invalid storage data
    }
  }, []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Lead[]>('/leads?limit=200');
      setLeads(data ?? []);
    } catch {
      // Fallback to mock data if API is unavailable
      setLeads(mockLeads as Lead[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLeads();
    loadStoredSyncState();
  }, [loadLeads, loadStoredSyncState]);

  const formatSentiment = (score: number) => {
    if (score >= 75) return 'Positive';
    if (score >= 45) return 'Neutral';
    return 'Negative';
  };

  const createSheetRows = useCallback((items: Lead[]) => {
    return items.map((lead) => [
      lead.name,
      lead.company,
      lead.email,
      lead.phone,
      `${lead.aiScore}`,
      lead.priority,
      formatSentiment(lead.aiScore),
      lead.channel,
      'Unassigned',
      lead.createdAt,
    ]);
  }, []);

  const downloadCsv = useCallback((headers: string[], rows: string[][], fileName: string) => {
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const createSyncRecord = useCallback(
    (rowsSynced: number, status: SheetsSyncRecord['status'], message?: string) => {
      return {
        id: `sync-${Date.now()}`,
        time: new Date().toLocaleString('en-US', { hour12: false }),
        rowsSynced,
        status,
        message,
      } as SheetsSyncRecord;
    },
    [],
  );

  const syncToSheets = useCallback(async () => {
    const currentLeads = leads;
    if (currentLeads.length === 0) {
      toast.error('No leads available to sync.');
      return;
    }

    setSyncLoading(true);
    setSyncStatus('syncing');

    const headerRow = [
      'Name',
      'Company',
      'Email',
      'Phone',
      'Lead Score',
      'Status',
      'Sentiment',
      'Source Channel',
      'Assigned Agent',
      'Created Date',
    ];
    const rows = createSheetRows(currentLeads);

    try {
      if (isGoogleSheetsProduction()) {
        const connection = await connectGoogleAccount();
        if (!connection.connected) {
          throw new Error('Google account connection failed');
        }
        const spreadsheet = await createSpreadsheet('OmniFlow Lead Sync');
        await appendLeads(spreadsheet.spreadsheetId, [headerRow, ...rows]);
      } else {
        downloadCsv(headerRow, rows, 'omniFlow-leads-sync.csv');
      }

      const record = createSyncRecord(rows.length, 'success');
      const nextHistory = [record, ...syncHistory].slice(0, 10);
      setSyncHistory(nextHistory);
      setLastSyncAt(record.time);
      setTotalSyncedRows(rows.length);
      setSyncStatus('synced');
      persistSyncState(nextHistory, record.time, rows.length, 'synced');
      toast.success(`${rows.length} leads synced to Google Sheets successfully.`);
    } catch (err: unknown) {
      const error = err as Error;
      const record = createSyncRecord(currentLeads.length, 'failure', error.message);
      const nextHistory = [record, ...syncHistory].slice(0, 10);
      setSyncHistory(nextHistory);
      setSyncStatus('failed');
      persistSyncState(nextHistory, lastSyncAt, totalSyncedRows, 'failed');
      toast.error('Google Sheets sync failed', { description: error.message });
    } finally {
      setSyncLoading(false);
    }
  }, [createSheetRows, createSyncRecord, downloadCsv, lastSyncAt, leads, persistSyncState, syncHistory, totalSyncedRows]);

  const addLead = useCallback((input: CreateLeadInput): Lead => {
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      channel: input.channel,
      priority: input.priority,
      status: input.status,
      aiScore: input.aiScore,
      value: input.value,
      notes: input.notes,
      createdAt: new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  }, []);

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)),
    );
  }, []);

  return (
    <LeadsContext.Provider
      value={{
        leads,
        addLead,
        updateLead,
        loading,
        error,
        refetch: loadLeads,
        syncToSheets,
        syncLoading,
        syncStatus,
        lastSyncAt,
        totalSyncedRows,
        syncHistory,
      }}
    >
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeadsContext() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error('useLeadsContext must be used within LeadsProvider');
  return ctx;
}
