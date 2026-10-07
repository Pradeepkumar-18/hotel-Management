import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import './dashboard.css';
import { ToastProvider } from './ui-feedback';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider><BrowserRouter><App /></BrowserRouter></ToastProvider>
  </React.StrictMode>,
);
