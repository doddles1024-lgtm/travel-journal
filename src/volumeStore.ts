/**
 * Global volume store and Web Audio patch.
 * Patch runs before Unity loads so Unity's AudioContext uses our gain node.
 */

const STORAGE_KEY = 'siteVolume';

function getStored(): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v != null) {
      const n = parseFloat(v);
      if (n >= 0 && n <= 1) return n;
    }
  } catch {}
  return 1;
}

export let globalVolume = getStored();
const gainNodes: GainNode[] = [];

export function setGlobalVolume(v: number): void {
  globalVolume = Math.max(0, Math.min(1, v));
  gainNodes.forEach((g) => {
    g.gain.value = globalVolume;
  });
}

export function registerGainNode(gain: GainNode): void {
  gainNodes.push(gain);
  gain.gain.value = globalVolume;
}

export function getStoredVolume(): number {
  return getStored();
}

export function persistVolume(v: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(v));
  } catch {}
}

/** Patch AudioContext so Unity's audio goes through our gain. Must run before Unity loads. */
export function patchAudioContext(): void {
  if (typeof window === 'undefined') return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const Original = Ctx;
  const Wrapper = function (
    this: AudioContext,
    options?: AudioContextOptions
  ): AudioContext {
    const ctx = new Original(options);
    const gain = ctx.createGain();
    gain.gain.value = globalVolume;
    gain.connect(ctx.destination);
    registerGainNode(gain);
    try {
      Object.defineProperty(ctx, 'destination', {
        get: () => gain,
        configurable: true,
        enumerable: true,
      });
    } catch {
      /* destination may be non-configurable */
    }
    return ctx;
  };
  Wrapper.prototype = Original.prototype;
  (window as unknown as { AudioContext: typeof AudioContext }).AudioContext = Wrapper as unknown as typeof AudioContext;
  if ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) {
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext = Wrapper as unknown as typeof AudioContext;
  }
}
