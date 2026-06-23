import { useState } from 'react';
import { VIEWS } from './constants/views';
import { SettingsProvider } from './contexts/SettingsContext';
import ApiGuard from './components/ApiGuard';
import Layout from './components/Layout';
import Toast from './components/Toast';
import MenuListPage from './pages/MenuListPage';
import MenuAddPage from './pages/MenuAddPage';
import TableManagerPage from './pages/TableManagerPage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [view, setView] = useState(VIEWS.menuList);
  const [editItem, setEditItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  const refresh = () => setRefreshKey((k) => k + 1);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleEditMenu = (item) => {
    setEditItem(item);
    setView(VIEWS.menuAdd);
  };

  const handleEditDone = () => {
    setEditItem(null);
    setView(VIEWS.menuList);
    refresh();
  };

  return (
    <ApiGuard>
      <SettingsProvider>
      <Layout
        view={view}
        onViewChange={(v) => {
          if (v !== VIEWS.menuAdd) setEditItem(null);
          setView(v);
        }}
      >
        {view === VIEWS.menuList && (
          <MenuListPage onEdit={handleEditMenu} onShowToast={showToast} />
        )}
        {view === VIEWS.menuAdd && (
          <MenuAddPage
            editItem={editItem}
            onShowToast={showToast}
            onEditDone={handleEditDone}
          />
        )}
        {view === VIEWS.tables && <TableManagerPage onShowToast={showToast} />}
        {view === VIEWS.orders && (
          <OrdersPage refreshKey={refreshKey} onRefresh={refresh} onShowToast={showToast} />
        )}
        {view === VIEWS.settings && <SettingsPage onShowToast={showToast} />}
      </Layout>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      </SettingsProvider>
    </ApiGuard>
  );
}
