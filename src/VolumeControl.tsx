import { useEffect, useState } from 'react';
import {
  getStoredVolume,
  persistVolume,
  setGlobalVolume,
} from './volumeStore';

function applyVolumeToPage(volume: number): void {
  setGlobalVolume(volume);
  document.querySelectorAll('audio, video').forEach((el) => {
    (el as HTMLMediaElement).volume = volume;
  });
}

function setStoredVolume(v: number): void {
  persistVolume(v);
  window.dispatchEvent(new CustomEvent('volumechange', { detail: v }));
}

export function VolumeControl() {
  const [volume, setVolume] = useState(() => getStoredVolume());

  useEffect(() => {
    applyVolumeToPage(volume);
  }, [volume]);

  useEffect(() => {
    const observer = new MutationObserver(() => applyVolumeToPage(volume));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [volume]);

  useEffect(() => {
    const handler = () => setVolume(getStoredVolume());
    window.addEventListener('volumechange', handler);
    return () => window.removeEventListener('volumechange', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setStoredVolume(v);
    applyVolumeToPage(v);
  };

  const handleMute = () => {
    const next = volume > 0 ? 0 : 1;
    setVolume(next);
    setStoredVolume(next);
    applyVolumeToPage(next);
  };

  const percent = Math.round(volume * 100);

  return (
    <div className="volume-control">
      <button
        type="button"
        className="volume-btn"
        onClick={handleMute}
        title={volume === 0 ? 'Unmute' : 'Mute'}
        aria-label={volume === 0 ? 'Unmute' : 'Mute'}
      >
        {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
      </button>
      <div className="volume-slider-wrap">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleChange}
          className="volume-slider"
          title={`${percent}%`}
          aria-label="Volume"
        />
        <span className="volume-percent">{percent}%</span>
      </div>
    </div>
  );
}
