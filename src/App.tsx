import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/hooks/useTheme';
import { TenantProvider } from '@/contexts/TenantContext';
import { LeadsProvider } from '@/contexts/LeadsContext';
import { AppointmentsProvider } from '@/contexts/AppointmentsContext';
import { ConversationsProvider } from '@/contexts/ConversationsContext';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/routes/login';
import { DashboardPage } from '@/routes/_app/dashboard';
import { InboxPage } from '@/routes/_app/inbox';
import { LeadsPage } from '@/routes/_app/leads';
import { AnalyticsPage } from '@/routes/_app/analytics';
import { AutomationsPage } from '@/routes/_app/automations';
import { VoicePage } from '@/routes/_app/voice';
import { SettingsPage } from '@/routes/_app/settings';
import { CampaignsPage } from '@/routes/_app/campaigns';
import { NotificationsPage } from '@/routes/_app/notifications';
import { NotFoundPage } from '@/routes/__root';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { CampaignsProvider } from '@/contexts/CampaignsContext';
import { AiStatusProvider } from '@/contexts/AiStatusContext';
import { CrmRecommendationsProvider } from '@/contexts/CrmRecommendationsContext';
import { AiActivityPage } from '@/routes/_app/ai-activity';

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthed = typeof window !== 'undefined' && localStorage.getItem('omniflow_auth');
  return isAuthed ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <TenantProvider>
        <LeadsProvider>
        <CampaignsProvider>
        <AppointmentsProvider>
        <BrowserRouter>
          <NotificationsProvider>
          <AiStatusProvider>
          <CrmRecommendationsProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inbox" element={
              <ConversationsProvider limit={50}>
                <InboxPage />
              </ConversationsProvider>
            } />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="automations" element={<AutomationsPage />} />
            <Route path="voice" element={<VoicePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="ai-activity" element={<AiActivityPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster theme="dark" position="top-right" richColors closeButton />
          </CrmRecommendationsProvider>
          </AiStatusProvider>
          </NotificationsProvider>
        </BrowserRouter>
        </AppointmentsProvider>
      </CampaignsProvider>
    </LeadsProvider>
  </TenantProvider>
    </ThemeProvider>
  );
}

export default App;
