import { useStore } from './store/useStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DispatchPage } from './pages/DispatchPage';
import { MapPage } from './pages/MapPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppShell } from './components/layout/AppShell';

function App() {
  const { token, currentView } = useStore();

  if (!token) {
    return <Login />;
  }

  // Render correct page view inside AppShell layout
  const renderPageView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'map':
        return <MapPage />;
      case 'resources':
        return <ResourcesPage />;
      case 'dispatch':
        return <DispatchPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppShell>
      {renderPageView()}
    </AppShell>
  );
}

export default App;
