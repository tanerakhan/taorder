import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, NAV_SETTING_KEYS } from '../constants/settingsDefaults';
import { getTaorder } from '../utils/taorder';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTaorder().settings.getAll();
      setSettings(data);
    } catch (err) {
      setSettings(DEFAULT_SETTINGS);
      setError(err.message || 'Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (updates) => {
    const data = await getTaorder().settings.setMany(updates);
    setSettings(data);
    setError(null);
    return data;
  };

  const resetSettings = async () => {
    const data = await getTaorder().settings.reset();
    setSettings(data);
    setError(null);
    return data;
  };

  const getNavLabel = (viewId) => {
    const key = NAV_SETTING_KEYS[viewId];
    return (key && settings[key]) || DEFAULT_SETTINGS[key] || viewId;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        loadSettings,
        saveSettings,
        resetSettings,
        getNavLabel,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings SettingsProvider içinde kullanılmalı');
  }
  return ctx;
}
