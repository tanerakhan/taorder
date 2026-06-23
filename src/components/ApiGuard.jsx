import { useEffect, useState } from 'react';
import { getTaorder, isTaorderReady } from '../utils/taorder';
import './ApiGuard.css';

export default function ApiGuard({ children }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (isTaorderReady()) {
      setStatus('ready');
      return;
    }
    setStatus('error');
  }, []);

  if (status === 'checking') {
    return null;
  }

  if (status === 'error') {
    let message = 'TaOrder API bağlantısı kurulamadı.';
    try {
      getTaorder();
    } catch (err) {
      message = err.message;
    }

    return (
      <div className="api-guard">
        <div className="api-guard-card">
          <h2>Bağlantı Hatası</h2>
          <p>{message}</p>
          <ol>
            <li>Açık TaOrder penceresini tamamen kapatın</li>
            <li>Terminalde <code>npm run dev</code> çalıştırın</li>
            <li>Tarayıcıda localhost:5173 açmayın — Electron penceresini kullanın</li>
          </ol>
        </div>
      </div>
    );
  }

  return children;
}
