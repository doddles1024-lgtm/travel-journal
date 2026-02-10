import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import SnowRider from './SnowRider';
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

// Intercept fetch so Unity/analytics failures don't throw and trigger the error overlay
const originalFetch = window.fetch;
window.fetch = function (...args: Parameters<typeof fetch>) {
  return originalFetch.apply(this, args).catch((err: unknown) => {
    if (isFetchRelatedError(err instanceof Error ? err.message : String(err))) {
      // Return a no-op response so callers (e.g. postUserData) don't throw
      return new Response(null, { status: 204, statusText: 'No Content' });
    }
    throw err;
  }) as ReturnType<typeof fetch>;
};

// Cross-origin scripts (e.g. Unity from jsdelivr) trigger generic "Script error." - suppress so overlay doesn't show
function isSuppressedError(message: string): boolean {
  return (
    message === 'Script error.' ||
    isFetchRelatedError(message)
  );
}

const originalConsoleError = console.error;
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
    if (event.message === 'Script error.') {
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
        <Route path="/snowrider" element={<SnowRider />} />
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
