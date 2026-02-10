import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Use working fork (drippy-cat repo can return HTML/404)
const UNITY_BASE = 'https://cdn.jsdelivr.net/gh/itsvijaysingh/Snow-Rider3D@main';
const STYLE_URL = `${UNITY_BASE}/TemplateData/style.css`;
const PROGRESS_SCRIPT = `${UNITY_BASE}/TemplateData/UnityProgress.js`;
const LOADER_SCRIPT = `${UNITY_BASE}/Build/UnityLoader.js`;
const BUILD_JSON = `${UNITY_BASE}/Build/SnowRider3D-gd-1.json`;

declare global {
  interface Window {
    UnityProgress?: (instance: unknown, progress: string) => void;
    UnityLoader?: {
      instantiate: (
        containerId: string,
        buildUrl: string,
        options: {
          onProgress: (instance: unknown, progress: string) => void;
          Module?: { onRuntimeInitialized: () => void };
        }
      ) => unknown;
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function SnowRider() {
  const gameInstanceRef = useRef<unknown>(null);
  const styleRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    const container = document.getElementById('gameContainer');
    if (!container) return;

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = STYLE_URL;
    document.head.appendChild(style);
    styleRef.current = style;

    loadScript(PROGRESS_SCRIPT)
      .then(() => loadScript(LOADER_SCRIPT))
      .then(() => {
        if (!window.UnityLoader || !window.UnityProgress) return;
        const instance = window.UnityLoader.instantiate('gameContainer', BUILD_JSON, {
          onProgress: window.UnityProgress,
          Module: {
            onRuntimeInitialized: function () {
              if (window.UnityProgress) {
                window.UnityProgress(instance, 'complete');
              }
            },
          },
        });
        gameInstanceRef.current = instance;
      })
      .catch((err) => console.error('Unity load error:', err));

    return () => {
      if (styleRef.current?.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
      }
      const scripts = document.querySelectorAll(
        `script[src="${PROGRESS_SCRIPT}"], script[src="${LOADER_SCRIPT}"]`
      );
      scripts.forEach((s) => s.remove());
      gameInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="snowrider-page">
      <Link to="/" className="snowrider-back">
        ← Back to Quick Links
      </Link>
      <div className="webgl-content">
        <div id="gameContainer" style={{ width: '100%', height: '100%', margin: 'auto' }} />
      </div>
    </div>
  );
}

export default SnowRider;
