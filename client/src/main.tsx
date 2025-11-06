import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
console.log('[webrtc-client] Booting application...');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


