import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const boot = async () => {
  if (import.meta.env.VITE_UI_ONLY === 'true') {
    const { installMockApi } = await import('./data/mockApi.js');
    installMockApi();
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

boot();
