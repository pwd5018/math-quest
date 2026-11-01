import { useEffect, useRef, useState } from "react";
import {
  lessonById,
  observeLesson,
  restoreJournal,
  type LessonJournal,
  type LessonObservation,
} from "./lessons";
import { restoreConceptNote, type ConceptNote } from "./concepts";
export type LessonCloud = {
  journal: LessonJournal;
  legacy: ConceptNote[];
  available: boolean;
  record: (
    id: string,
    kind: keyof LessonObservation,
    eventId: string,
  ) => Promise<void>;
  importNotes: (
    journal: LessonJournal,
    deviceId: string,
    legacy: ConceptNote,
  ) => Promise<void>;
};
type Pending = { id: string; lesson: string; kind: keyof LessonObservation };
export function restorePending(raw: unknown): Pending[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 1000)
    .filter(
      (p): p is Pending =>
        p &&
        typeof p.id === "string" &&
        /^[A-Za-z0-9-]{1,140}$/.test(p.id) &&
        !!lessonById(p.lesson) &&
        ["explored", "supported", "independent"].includes(p.kind),
    );
}
function read(key: string) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
export function useLessonJournal(scope: string, cloud?: LessonCloud) {
  const localKey = `math-quest-lessons-v2:${scope}`,
    pendingKey = `${localKey}:pending`,
    deviceKey = `${localKey}:migration`;
  const [local, setLocal] = useState(() => restoreJournal(read(localKey)));
  const [legacyLocal] = useState(() =>
    restoreConceptNote(read(`math-quest-concepts-v1:${scope}`)),
  );
  const [pending, setPending] = useState(() =>
    restorePending(read(pendingKey)),
  );
  const [migrated, setMigrated] = useState(false),
    [retry, setRetry] = useState(0);
  const [storageError, setStorageError] = useState(""),
    [importError, setImportError] = useState(""),
    [saveError, setSaveError] = useState("");
  const cloudRef = useRef(cloud);
  cloudRef.current = cloud;
  useEffect(() => {
    if (!cloud?.available || migrated) return;
    let cancelled = false;
    async function migrate() {
      try {
        let deviceId = localStorage.getItem(deviceKey);
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem(deviceKey, deviceId);
        }
        await cloudRef.current!.importNotes(local, deviceId, legacyLocal);
        if (!cancelled) {
          setMigrated(true);
          setImportError("");
        }
      } catch {
        if (!cancelled)
          setImportError(
            "Earlier device notes haven’t synced yet. They are still saved on this device.",
          );
      }
    }
    void migrate();
    return () => {
      cancelled = true;
    };
  }, [cloud?.available, retry]);
  useEffect(() => {
    if (!cloud?.available || !pending.length) return;
    let cancelled = false;
    const first = pending[0];
    void cloudRef
      .current!.record(first.lesson, first.kind, first.id)
      .then(() => {
        if (cancelled) return;
        setSaveError("");
        setPending((current) => {
          const next = current.filter((p) => p.id !== first.id);
          try {
            localStorage.setItem(pendingKey, JSON.stringify(next));
          } catch {
            setStorageError(
              "This browser couldn’t update its saved sync queue.",
            );
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled)
          setSaveError(
            "Some learning notes haven’t synced. Reconnect and retry; queued notes are kept on this device.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [cloud?.available, pending, retry]);
  function record(id: string, kind: keyof LessonObservation) {
    if (!cloud) {
      const next = observeLesson(local, id, kind);
      setLocal(next);
      try {
        localStorage.setItem(localKey, JSON.stringify(next));
        setStorageError("");
      } catch {
        setStorageError("Learning notes couldn’t be saved on this device.");
      }
      return;
    }
    const event = { id: crypto.randomUUID(), lesson: id, kind };
    setPending((current) => {
      if (current.length >= 1000) {
        setStorageError(
          "The learning sync queue is full. Retry syncing before recording more notes.",
        );
        return current;
      }
      const next = [...current, event];
      try {
        localStorage.setItem(pendingKey, JSON.stringify(next));
        setStorageError("");
      } catch {
        setStorageError(
          "This browser can’t save the sync queue. Keep this page open and retry syncing before leaving.",
        );
      }
      return next;
    });
  }
  const legacy = cloud?.legacy.length
    ? cloud.legacy.reduce(
        (sum, n) => ({
          visits: Math.min(9999, sum.visits + n.visits),
          completed: Math.min(9999, sum.completed + n.completed),
          multiplication:
            sum.multiplication === "independent" ||
            n.multiplication === "independent"
              ? "independent"
              : sum.multiplication === "with-help" ||
                  n.multiplication === "with-help"
                ? "with-help"
                : "not-tried",
          sharing:
            sum.sharing === "independent" || n.sharing === "independent"
              ? "independent"
              : sum.sharing === "with-help" || n.sharing === "with-help"
                ? "with-help"
                : "not-tried",
        }),
        restoreConceptNote(null),
      )
    : legacyLocal;
  return {
    journal: cloud ? cloud.journal : local,
    legacy,
    record,
    warning: [storageError, importError, saveError].filter(Boolean).join(" "),
    pending: pending.length,
    migrated,
    available: cloud?.available ?? true,
    retry: () => setRetry((n) => n + 1),
  };
}
