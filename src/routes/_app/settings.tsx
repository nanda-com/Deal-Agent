import { useEffect, useState } from 'react';
import { Check, RefreshCw, AlertCircle, Settings2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui-kit/Card';
import { Skeleton } from '@/components/ui-kit/Skeleton';
import { channelMeta } from '@/types';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { WorkspaceManager } from '@/components/workspace/WorkspaceManager';
import type { WorkspaceSettings } from '@/types';

export function SettingsPage() {
  const { data: settings, loading, error, refetch } = useSettings();
  const { update: saveSettings, loading: saving } = useUpdateSettings();
  const [form, setForm] = useState<WorkspaceSettings | null>(null);

  useEffect(() => {
    if (settings && !form) {
      setForm(settings);
    }
  }, [settings, form]);

  const handleSave = async () => {
    if (!form) return;
    const result = await saveSettings(form);
    if (result) {
      setForm(result);
      toast.success('Settings saved');
    } else {
      toast.error('Failed to save settings');
    }
  };

  if (loading && !settings) {
    return (
      <div className="space-y-6 max-w-4xl animate-fade-in">
        <div className="glass rounded-3xl p-6 space-y-4">
          <Skeleton className="h-5 w-28" />
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-64" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-32">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <p className="mt-4 text-sm text-rose-300 font-medium">Failed to load settings</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <button onClick={refetch} className="mt-4 px-4 h-10 rounded-xl glass text-sm hover:bg-white/10 transition">Try again</button>
        </div>
      </div>
    );
  }

  const s = form ?? settings ?? {
    workspaceName: 'Acme Inc',
    timezone: 'Asia/Kolkata (IST)',
    businessHours: '9:00 — 19:00',
    defaultLanguage: 'English',
    aiPersona: 'You are Nova, the friendly AI assistant for Acme Inc. Be concise, warm and proactive. Always offer to book a demo when intent is high. Never invent pricing — defer to the catalog.',
    aiModel: 'gemini-2.5-pro',
    channels: { whatsapp: true, instagram: true, facebook: true, linkedin: true, web: true },
    integrations: ['HubSpot CRM', 'Google Sheets', 'Salesforce', 'Slack', 'Stripe', 'Calendly'],
  } as WorkspaceSettings;
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Workspace, channels, AI persona and integrations.</p>
      </div>

      <section className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">Workspace</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Workspace name" value={s.workspaceName} onChange={(v) => setForm((f) => f ? { ...f, workspaceName: v } : f)} />
          <Field label="Timezone" value={s.timezone} onChange={(v) => setForm((f) => f ? { ...f, timezone: v } : f)} />
          <Field label="Business hours" value={s.businessHours} onChange={(v) => setForm((f) => f ? { ...f, businessHours: v } : f)} />
          <Field label="Default language" value={s.defaultLanguage} onChange={(v) => setForm((f) => f ? { ...f, defaultLanguage: v } : f)} />
        </div>

        {/* Workspace Manager (Multi-Tenant) */}
        <div className="mt-6 pt-5 border-t border-border/60">
          <WorkspaceManager />
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h3 className="font-semibold mb-1">Connected channels</h3>
        <p className="text-xs text-muted-foreground mb-4">Manage where OmniFlow listens and replies.</p>
        <div className="space-y-2">
          {Object.entries(channelMeta).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-3 p-3 rounded-xl glass">
              <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
              <div className="flex-1 font-medium text-sm">{meta.label}</div>
              <Badge tone="success"><Check className="w-3 h-3" /> Connected</Badge>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h3 className="font-semibold mb-1">AI persona (Gemini)</h3>
        <p className="text-xs text-muted-foreground mb-4">How your AI introduces itself and responds.</p>
        <textarea
          value={s.aiPersona}
          onChange={(e) => setForm((f) => f ? { ...f, aiPersona: e.target.value } : f)}
          rows={5}
          className="w-full rounded-xl bg-white/5 border border-border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <div className="mt-3 flex gap-2 flex-wrap text-xs">
          <Badge tone="primary">Tone: Friendly</Badge>
          <Badge>Model: gemini-2.5-pro</Badge>
          <Badge>Fallback: canned</Badge>
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h3 className="font-semibold mb-4">Integrations</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {['HubSpot CRM', 'Google Sheets', 'Salesforce', 'Slack', 'Stripe', 'Calendly'].map((integration) => (
            <div key={integration} className="flex items-center justify-between p-3 rounded-xl glass">
              <span className="text-sm font-medium">{integration}</span>
              <button onClick={() => toast.success(`${integration} connected`)} className="text-xs px-3 py-1.5 rounded-lg grad-primary text-white">
                Connect
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button onClick={refetch} className="h-11 px-6 rounded-xl glass text-sm font-medium">
          <RefreshCw className="w-4 h-4 inline mr-1.5" />
          Reset
        </button>
        <button onClick={handleSave} disabled={saving} className="h-11 px-6 rounded-xl grad-primary text-white font-semibold disabled:opacity-60">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full h-10 rounded-xl bg-white/5 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </label>
  );
}
