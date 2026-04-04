import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tbh.css';
import { initTelemetry } from './core/telemetry';

initTelemetry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
