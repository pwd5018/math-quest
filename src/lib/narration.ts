/** Stable content keys make edited directions fall back instead of playing stale audio. */
export function narrationKey(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
export function spokenDirections(text: string) {
  return text
    .replace(/(\d+)\s*×\s*(\d+)/g, "$1 times $2")
    .replace(/(\d+)\s*÷\s*(\d+)/g, "$1 divided by $2")
    .replace(/\s*\+\s*/g, " plus ")
    .replace(/\s*=\s*/g, " equals ");
}
/** Cancellation also invalidates a pending play rejection or network error. */
let activeRecording: (() => void) | null = null;
export function stopLessonNarration() {
  activeRecording?.();
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}
export function startRecordedNarration(
  url: string,
  onEnd: () => void,
  onFail: () => void,
) {
  activeRecording?.();
  const audio = new Audio(url);
  audio.volume = 0.65;
  let stopped = false;
  const stop = () => {
    if (activeRecording === stop) activeRecording = null;
    stopped = true;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  };
  const fail = () => {
    if (!stopped) {
      stop();
      onFail();
    }
  };
  audio.onended = () => {
    if (!stopped) {
      stop();
      onEnd();
    }
  };
  audio.onerror = fail;
  activeRecording = stop;
  try {
    void audio.play().catch(fail);
  } catch {
    fail();
  }
  return stop;
}
