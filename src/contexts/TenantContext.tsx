import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { tenants as tenantList, getTenantDataset } from '@/lib/mockData';
import type { AuditLogEntry, TenantInfo, TenantRole } from '@/types';

interface TenantContextValue {
  tenants: TenantInfo[];
  tenantId: string;
  tenant: TenantInfo;
  role: TenantRole;
  currentTenantData: ReturnType<typeof getTenantDataset>;
  selectTenant: (id: string) => void;
  auditLog: AuditLogEntry[];
  trackAuditEvent: (event: string, details: string) => void;
  saasMetrics: {
    totalTenants: number;
    activeTenants: number;
    MRR: number;
    ARR: number;
    tenantGrowth: number;
  };
}

const TenantContext = createContext<TenantContextValue | null>(null);
const SELECTED_TENANT_KEY = 'omniflow_tenant';
const AUDIT_LOG_KEY = 'omniflow_audit';

function getSavedTenantId() {
  if (typeof window === 'undefined') return tenantList[0].id;
  const stored = localStorage.getItem(SELECTED_TENANT_KEY);
  return tenantList.some((tenant) => tenant.id === stored) ? (stored as string) : tenantList[0].id;
}

function loadAuditLog(tenantId: string): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${AUDIT_LOG_KEY}.${tenantId}`);
    return raw ? (JSON.parse(raw) as AuditLogEntry[]) : [];
  } catch {
    return [];
  }
}

function persistAuditLog(tenantId: string, auditLog: AuditLogEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${AUDIT_LOG_KEY}.${tenantId}`, JSON.stringify(auditLog));
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<string>(getSavedTenantId);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    setAuditLog(loadAuditLog(tenantId));
  }, [tenantId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SELECTED_TENANT_KEY, tenantId);
  }, [tenantId]);

  const tenant = useMemo(
    () => tenantList.find((item) => item.id === tenantId) ?? tenantList[0],
    [tenantId],
  );

  const currentTenantData = useMemo(() => getTenantDataset(tenant.id), [tenant.id]);

  const trackAuditEvent = useCallback(
    (event: string, details: string) => {
      const entry: AuditLogEntry = {
        id: `audit-${Date.now()}`,
        event,
        details,
        time: new Date().toLocaleString('en-US', { hour12: false }),
      };
      setAuditLog((prev) => {
        const next = [entry, ...prev].slice(0, 30);
        persistAuditLog(tenant.id, next);
        return next;
      });
    },
    [tenant.id],
  );

  const selectTenant = useCallback((id: string) => {
    if (!tenantList.some((item) => item.id === id)) return;
    setTenantId(id);
  }, []);

  const saasMetrics = useMemo(
    () => ({
      totalTenants: tenantList.length,
      activeTenants: tenantList.length,
      MRR: tenantList.reduce((sum, item) => sum + item.mrr, 0),
      ARR: tenantList.reduce((sum, item) => sum + item.arr, 0),
      tenantGrowth: Math.round(tenantList.reduce((sum, item) => sum + item.growth, 0) / tenantList.length),
    }), [],
  );

  return (
    <TenantContext.Provider
      value={{
        tenants: tenantList,
        tenantId,
        tenant,
        role: tenant.role,
        currentTenantData,
        selectTenant,
        auditLog,
        trackAuditEvent,
        saasMetrics,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenantContext must be used within TenantProvider');
  return ctx;
}
