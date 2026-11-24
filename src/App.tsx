import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { NotificationToastStack } from './components/NotificationToastStack';
import { LoginView } from './views/LoginView';
import { AccessGateView } from './views/AccessGateView';
import { BackOfficeView } from './views/BackOfficeView';
import { DashboardView } from './views/DashboardView';
import { RepairsView } from './views/RepairsView';
import { ProjectsView } from './views/ProjectsView';
import { CorsView } from './views/CorsView';
import { EquipmentView } from './views/EquipmentView';
import { QuotationsView } from './views/QuotationsView';
import { ProfileView } from './views/ProfileView';
import { TrainingView } from './views/TrainingView';
import { testFirestoreConnection } from './firebase';

export const AppContent: React.FC = () => {
  const { accessState, currentView } = useApp();
  const [quotaExceeded, setQuotaExceeded] = React.useState(false);

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  useEffect(() => {
    testFirestoreConnection().catch((err) => {
      console.warn("Firebase connection test:", err);
    });
  }, []);

  if (accessState === 'signed_out') {
    return <LoginView />;
  }

  // Signed in but not (yet) approved: no data, only the access-request screen.
  if (accessState !== 'approved') {
    return <AccessGateView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <Header />
      <NotificationToastStack />
      <div className="flex-1 flex flex-row min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] w-full">
        <BottomNav />
        <main className="flex-1 min-w-0 max-w-[1440px] w-full mx-auto px-2.5 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-6 overflow-x-hidden">
          {currentView === 'dashboard' && <DashboardView />}
          {(currentView === 'repairs' || currentView === 'repair_details') && (
            <RepairsView />
          )}
          {(currentView === 'projects' || currentView === 'project_details') && (
            <ProjectsView />
          )}
          {currentView === 'cors' && <CorsView />}
          {currentView === 'equipment' && <EquipmentView />}
          {(currentView === 'quotations' ||
            currentView === 'quotation_details') && <QuotationsView />}
          {currentView === 'training' && <TrainingView />}
          {currentView === 'profile' && <ProfileView />}
          {currentView === 'backoffice' && <BackOfficeView />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
