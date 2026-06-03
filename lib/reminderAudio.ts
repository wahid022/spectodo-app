let ctx: AudioContext | null = null;
let beepInterval: ReturnType<typeof setInterval> | null = null;
let autoStopHandle: ReturnType<typeof setTimeout> | null = null;

function ensureRunning(): Promise<AudioContext> {
  if (!ctx) ctx = new AudioContext();
  return ctx.state === "running"
    ? Promise.resolve(ctx)
    : ctx.resume().then(() => ctx!);
}

function playBeep(context: AudioContext): void {
  try {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.7, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.8);
  } catch {}
}

// Called once on mount — registers persistent listeners so the AudioContext
// is always resumed on user interaction or tab focus, not just on first click.
export function initAudio(): void {
  if (typeof window === "undefined") return;
  const resume = () => {
    if (ctx?.state === "suspended") ctx.resume();
  };
  // Capture phase so this runs before any button click handlers
  document.addEventListener("click", resume, true);
  document.addEventListener("keydown", resume, true);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resume();
  });
}

export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
}

export function playAlarm(): void {
  if (typeof window === "undefined") return;
  if (beepInterval !== null) return;

  ensureRunning().then((context) => {
    if (beepInterval !== null) return;
    playBeep(context);
    beepInterval = setInterval(() => {
      ensureRunning().then(playBeep);
    }, 1500);
  });

  if (autoStopHandle !== null) clearTimeout(autoStopHandle);
  autoStopHandle = setTimeout(stopAlarm, 5 * 60 * 1000);
}

export function stopAlarm(): void {
  if (beepInterval !== null) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
  if (autoStopHandle !== null) {
    clearTimeout(autoStopHandle);
    autoStopHandle = null;
  }
}
