import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'

// MUI Drawer (and other animated components) can trigger this benign browser
// quirk during resize-observer callbacks inside animation frames. It is a
// false-positive: no layout is broken and it never occurs in production builds.
// Suppressing it here keeps the dev overlay clean.
window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
