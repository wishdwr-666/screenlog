"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface WallpaperState {
  url: string | null;
  opacity: number;
  blur: number;
}

export interface WallpaperHistoryItem {
  id: number;
  url: string;
  key: string | null;
  name: string | null;
  usedAt: string;
}

interface WallpaperContextValue {
  wallpaper: WallpaperState;
  history: WallpaperHistoryItem[];
  uploading: boolean;
  upload: (file: File) => Promise<void>;
  applyFromHistory: (item: WallpaperHistoryItem) => void;
  update: (patch: Partial<Omit<WallpaperState, "url">>) => void;
  remove: () => void;
  refreshHistory: () => void;
}

const WallpaperContext = createContext<WallpaperContextValue>({
  wallpaper: { url: null, opacity: 0.18, blur: 0 },
  history: [],
  uploading: false,
  upload: async () => {},
  applyFromHistory: () => {},
  update: () => {},
  remove: () => {},
  refreshHistory: () => {},
});

const LS_KEY = "screenlog-wallpaper";
const LS_HISTORY_KEY = "screenlog-wallpaper-history";
let localIdCounter = Date.now();

function loadFromLS(): WallpaperState {
  if (typeof window === "undefined") return { url: null, opacity: 0.18, blur: 0 };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { url: null, opacity: 0.18, blur: 0 };
}
function saveToLS(s: WallpaperState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

function loadHistoryFromLS(): WallpaperHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}
function saveHistoryToLS(h: WallpaperHistoryItem[]) {
  try { localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(h)); } catch {}
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const [wallpaper, setWallpaper] = useState<WallpaperState>({ url: null, opacity: 0.18, blur: 0 });
  const [history, setHistory] = useState<WallpaperHistoryItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const refreshHistory = useCallback(() => {
    const local = loadHistoryFromLS();
    if (local.length > 0) setHistory(local);

    fetch("/api/wallpaper")
      .then(r => r.json())
      .then(data => {
        if (data.wallpaper?.url) {
          const s: WallpaperState = {
            url: data.wallpaper.url,
            opacity: data.wallpaper.opacity ?? 0.18,
            blur: data.wallpaper.blur ?? 0,
          };
          setWallpaper(s); saveToLS(s);
        }
        if (Array.isArray(data.history) && data.history.length > 0) {
          const merged = mergeHistory(data.history, local);
          setHistory(merged);
          saveHistoryToLS(merged);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const local = loadFromLS();
    if (local.url) setWallpaper(local);
    refreshHistory();
  }, [refreshHistory]);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const localDataUrl = await readFileAsDataURL(file);
      const localState: WallpaperState = { url: localDataUrl, opacity: wallpaper.opacity, blur: wallpaper.blur };
      setWallpaper(localState);
      saveToLS(localState);

      const localItem: WallpaperHistoryItem = {
        id: localIdCounter++,
        url: localDataUrl,
        key: null,
        name: file.name,
        usedAt: new Date().toISOString(),
      };
      setHistory(prev => {
        const next = [localItem, ...prev.filter(h => h.url !== localDataUrl)];
        saveHistoryToLS(next);
        return next;
      });

      await fetch("/api/wallpaper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: localDataUrl, opacity: wallpaper.opacity, blur: wallpaper.blur, name: file.name }),
      }).catch(() => {});
    } finally {
      setUploading(false);
    }
  }, [wallpaper.opacity, wallpaper.blur]);

  const applyFromHistory = useCallback((item: WallpaperHistoryItem) => {
    const newState: WallpaperState = { url: item.url, opacity: wallpaper.opacity, blur: wallpaper.blur };
    setWallpaper(newState); saveToLS(newState);
    setHistory(prev => {
      const next = [{ ...item, usedAt: new Date().toISOString() }, ...prev.filter(h => h.id !== item.id)];
      saveHistoryToLS(next);
      return next;
    });
    fetch("/api/wallpaper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: item.url, key: item.key, opacity: newState.opacity, blur: newState.blur, skipHistory: true }),
    }).catch(() => {});
  }, [wallpaper.opacity, wallpaper.blur]);

  const update = useCallback((patch: Partial<Omit<WallpaperState, "url">>) => {
    setWallpaper(prev => {
      const next = { ...prev, ...patch };
      saveToLS(next);
      fetch("/api/wallpaper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: next.url, opacity: next.opacity, blur: next.blur, skipHistory: true }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const remove = useCallback(() => {
    const reset: WallpaperState = { url: null, opacity: 0.18, blur: 0 };
    setWallpaper(reset); saveToLS(reset);
    fetch("/api/wallpaper", { method: "DELETE" }).catch(() => {});
  }, []);

  return (
    <WallpaperContext.Provider value={{ wallpaper, history, uploading, upload, applyFromHistory, update, remove, refreshHistory }}>
      {wallpaper.url && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(${wallpaper.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            opacity: wallpaper.opacity,
            filter: wallpaper.blur > 0 ? `blur(${wallpaper.blur}px)` : undefined,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </WallpaperContext.Provider>
  );
}

function mergeHistory(remote: WallpaperHistoryItem[], local: WallpaperHistoryItem[]): WallpaperHistoryItem[] {
  const seen = new Set<string>();
  const result: WallpaperHistoryItem[] = [];
  for (const item of [...remote, ...local]) {
    if (!seen.has(item.url)) { seen.add(item.url); result.push(item); }
  }
  return result.slice(0, 50);
}


export function useWallpaper() {
  return useContext(WallpaperContext);
}
