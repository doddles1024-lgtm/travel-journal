import { patchAudioContext } from './volumeStore';
patchAudioContext();

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import SnowRider from './SnowRider';
import { SnowRiderErrorBoundary } from './SnowRiderErrorBoundary';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

// Suppress "Failed to fetch" from Unity analytics (postUserData) and similar so the game still runs
function isFetchRelatedError(msg: unknown): boolean {
  const s = typeof msg === 'string' ? msg : (msg && typeof (msg as Error).message === 'string' ? (msg as Error).message : String(msg));
  return (
    s.includes('Failed to fetch') ||
    s.includes('NetworkError') ||
    s.includes('Network request failed')
  );
}

// Swallow "Failed to fetch" for non–Unity-asset URLs (e.g. postUserData) so the game still runs
const originalFetch = window.fetch;
window.fetch = function (...args: Parameters<typeof fetch>) {
  const input = args[0];
  const url = (typeof input === 'string' ? input : (input as Request)?.url ?? '').toLowerCase();
  const isUnityAsset = url.includes('/build/') || url.includes('.unityweb') || url.includes('.json');
  return originalFetch.apply(this, args).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!isUnityAsset && isFetchRelatedError(msg)) {
      return new Response(null, { status: 204, statusText: 'No Content' });
    }
    throw err;
  }) as ReturnType<typeof fetch>;
};

// Unity/script loading errors - suppress overlay and logs
function isSuppressedError(message: string): boolean {
  const m = message || '';
  return (
    m === 'Script error.' ||
    m.includes("Unexpected token '<'") ||
    m.includes('Unexpected token') ||
    m.includes('has already been declared') ||
    m.includes('ChunkLoadError') ||
    m.includes('Loading chunk') ||
    m.includes('postUserData') ||
    m.includes('loadScript') ||
    isFetchRelatedError(m)
  );
}

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = function (...args: unknown[]) {
  const first = args[0];
  const msg =
    typeof first === 'string'
      ? first
      : first && typeof (first as Error).message === 'string'
        ? (first as Error).message
        : args.map((a) => String(a)).join(' ');
  if (isSuppressedError(msg) || (first && isSuppressedError((first as Error).message))) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = function (...args: unknown[]) {
  const msg = args.map((a) => (typeof a === 'string' ? a : (a as Error)?.message ?? String(a))).join(' ');
  if (isSuppressedError(msg) || msg.includes('postUserData') || msg.includes('Unity load error')) return;
  originalConsoleWarn.apply(console, args);
};

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason === 'object') {
    const errorMessage = (event.reason as Error).message || String(event.reason);
    if (isSuppressedError(errorMessage)) {
      event.preventDefault();
      return;
    }
  }
});

// Capture phase so we run before React's overlay and can stop "Script error." from cross-origin Unity scripts
window.addEventListener(
  'error',
  (event) => {
    const msg = event.message || (event.error && (event.error as Error).message) || '';
    if (isSuppressedError(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
    if (
      event.error &&
      event.error instanceof TypeError &&
      isFetchRelatedError(event.error.message)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
    return true;
  },
  true
);

window.addEventListener('error', (event) => {
  if (
    event.error &&
    event.error instanceof TypeError &&
    isFetchRelatedError(event.error.message)
  ) {
    event.preventDefault();
    return false;
  }
  return true;
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/snowrider" element={<SnowRiderErrorBoundary><SnowRider /></SnowRiderErrorBoundary>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
