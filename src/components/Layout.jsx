import { NAV_VIEWS } from '../constants/views';
import { useSettings } from '../contexts/SettingsContext';

function AppTitle({ title }) {
  const parts = title.trim().split(/\s+/);
  if (parts.length <= 1) {
    return (
      <h1>
        <span>{title}</span>
      </h1>
    );
  }
  const last = parts.pop();
  return (
    <h1>
      {parts.join(' ')} <span>{last}</span>
    </h1>
  );
}

export default function Layout({ view, onViewChange, children }) {
  const { getNavLabel, settings } = useSettings();

  return (
    <div className="app-layout">
      <header className="app-header">
        <AppTitle title={settings.app_title || 'TaOrder'} />
        <nav className="nav-tabs">
          {NAV_VIEWS.map((id) => (
            <button
              key={id}
              className={`nav-tab ${view === id ? 'active' : ''}`}
              onClick={() => onViewChange(id)}
            >
              {getNavLabel(id)}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
