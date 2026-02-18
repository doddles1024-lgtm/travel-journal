import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { VolumeControl } from './VolumeControl';

// jsDelivr only - raw GitHub blocks CORS fetch from localhost in normal browsers
const UNITY_BASE = 'https://cdn.jsdelivr.net/gh/itsvijaysingh/Snow-Rider3D@main';
const getUrls = () => ({
  style: `${UNITY_BASE}/TemplateData/style.css`,
  progress: `${UNITY_BASE}/TemplateData/UnityProgress.js`,
  loader: `${UNITY_BASE}/Build/UnityLoader.js`,
  build: `${UNITY_BASE}/Build/SnowRider3D-gd-1.json`,
});

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

/** Load script via script tag - no CORS (works in normal browsers unlike fetch from raw GitHub). */
function loadScript(src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function SnowRider() {
  const gameInstanceRef = useRef<unknown>(null);
  const styleRef = useRef<HTMLLinkElement | null>(null);
  const scriptElsRef = useRef<HTMLScriptElement[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    scriptElsRef.current = [];
    const container = document.getElementById('gameContainer');
    if (!container) return;

    const urls = getUrls();
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = urls.style;
    document.head.appendChild(style);
    styleRef.current = style;

    let cancelled = false;

    const run = async () => {
      if (window.UnityProgress && window.UnityLoader) {
        // Already loaded (e.g. from Strict Mode remount), skip to instantiate
      } else {
        if (!window.UnityProgress) scriptElsRef.current.push(await loadScript(urls.progress));
        if (!window.UnityLoader) scriptElsRef.current.push(await loadScript(urls.loader));
      }
      if (cancelled || !window.UnityLoader || !window.UnityProgress) return;
      const buildUrl = urls.build;
      const instance = window.UnityLoader.instantiate('gameContainer', buildUrl, {
        onProgress: window.UnityProgress,
        Module: {
          onRuntimeInitialized: function () {
            if (window.UnityProgress) window.UnityProgress(instance, 'complete');
          },
        },
      });
      gameInstanceRef.current = instance;
    };

    run().catch((err) => {
      setLoadError(err instanceof Error ? err.message : 'Failed to load game');
    });

    return () => {
      cancelled = true;
      if (styleRef.current?.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
      }
      scriptElsRef.current.forEach((s) => s.parentNode?.removeChild(s));
      scriptElsRef.current = [];
      gameInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="snowrider-page">
      <div className="snowrider-top-bar">
        <Link to="/" className="snowrider-back">
          ← Back to Quick Links
        </Link>
        <VolumeControl />
      </div>
      {loadError && (
        <div className="snowrider-error">
          {loadError}
          <br />
          <small>Try refreshing or check your connection.</small>
        </div>
      )}
      <div className="webgl-content">
        <div id="gameContainer" style={{ width: '100%', height: '100%', margin: 'auto' }} />
      </div>
    </div>
  );
}

export default SnowRider;
