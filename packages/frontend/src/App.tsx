import { useAuthStore } from '@/stores/authStore';
import { LoginPage } from '@/features/auth/LoginPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkspacePage } from '@/features/workspace/WorkspacePage';
import { PWAUpdatePrompt, InstallPrompt, OfflineIndicator } from '@/components/pwa';

export default function App() {
  const token = useAuthStore((s) => s.token);

  return (
    <>
      <OfflineIndicator />
      <PWAUpdatePrompt />
      <InstallPrompt />
      {token ? (
        <AppLayout>
          <WorkspacePage />
        </AppLayout>
      ) : (
        <LoginPage />
      )}
    </>
  );
}
