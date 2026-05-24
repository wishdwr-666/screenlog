"use client";
import {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from "react";

export interface EnvSettings {
  uiOpacity: number;           // 0.3–1.0，整体UI透明度
  nightMode: boolean;          // 夜间护眼模式
  rainEnabled: boolean;        // 雨滴动画
  rainIntensity: "light" | "moderate" | "heavy";
}

interface EnvContextValue {
  settings: EnvSettings;
  update: (patch: Partial<EnvSettings>) => void;
}

const DEFAULTS: EnvSettings = {
  uiOpacity: 1,
  nightMode: false,
  rainEnabled: false,
  rainIntensity: "moderate",
};

const EnvContext = createContext<EnvContextValue>({
  settings: DEFAULTS,
  update: () => {},
});

const LS_KEY = "screenlog-env-v2";

function loadSettings(): EnvSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

export function DynamicEnvironment({ children }: { children?: React.ReactNode }) {
  const [settings, setSettings] = useState<EnvSettings>(DEFAULTS);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => { setSettings(loadSettings()); }, []);

  const update = useCallback((patch: Partial<EnvSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // ── 透明度 + 夜间模式 → CSS 变量注入
  useEffect(() => {
    const root = document.documentElement;
    const op = settings.uiOpacity;
    const night = settings.nightMode;

    // 毛玻璃背景色（透明度受 uiOpacity 控制）
    if (night) {
      root.style.setProperty("--glass-bg",       `rgba(28, 24, 18, ${0.82 * op})`);
      root.style.setProperty("--glass-border",   "rgba(255,255,255,0.08)");
      root.style.setProperty("--app-surface",    `rgba(32, 27, 20, ${op})`);
      root.style.setProperty("--app-bg",         "#1a1510");
      root.style.setProperty("--app-text",       "#E8DFC8");
      root.style.setProperty("--app-text-secondary", "#B5A882");
      root.style.setProperty("--app-text-muted", "#7A6E57");
      root.style.setProperty("--app-border",     "rgba(255,255,255,0.10)");
      root.style.setProperty("--sidebar-bg",     `rgba(24, 20, 14, ${0.72 * op})`);
      root.style.setProperty("--sidebar-border", "rgba(255,255,255,0.08)");
      root.style.setProperty("--sidebar-hover",  "rgba(255,255,255,0.06)");
      root.style.setProperty("--card-warm",             "rgba(38, 32, 22, 0.90)");
      root.style.setProperty("--card-warm-border",      "rgba(255,255,255,0.12)");
      root.style.setProperty("--badge-locked-bg",       "rgba(45, 38, 28, 0.85)");
      root.style.setProperty("--badge-locked-border",   "rgba(255,255,255,0.10)");
      root.style.setProperty("--badge-locked-icon-bg",  "rgba(80, 70, 55, 0.80)");
      root.style.setProperty("--badge-locked-emoji-bg", "rgba(55, 48, 36, 0.80)");
      root.style.setProperty("--heatmap-zero",          "rgba(55, 48, 36, 0.60)");
      root.style.setProperty("--skeleton-from",         "#2A2520");
      root.style.setProperty("--skeleton-mid",          "#332D26");
      root.style.setProperty("--chip-green-bg",         "rgba(20, 83, 45, 0.40)");
      root.style.setProperty("--chip-green-text",       "#86efac");
      root.style.setProperty("--chip-red-bg",           "rgba(127, 29, 29, 0.40)");
      root.style.setProperty("--chip-red-text",         "#fca5a5");
    } else {
      root.style.setProperty("--glass-bg",       `rgba(253, 248, 225, ${0.72 * op})`);
      root.style.setProperty("--glass-border",   `rgba(224, 200, 130, ${0.5 * op})`);
      root.style.setProperty("--app-surface",    `rgba(252, 250, 242, ${op})`);
      root.style.setProperty("--app-bg",         "#FDF9F0");
      root.style.setProperty("--app-text",       "#2B2A27");
      root.style.setProperty("--app-text-secondary", "#5D5749");
      root.style.setProperty("--app-text-muted", "#8E836A");
      root.style.setProperty("--app-border",     "#E3D9C1");
      root.style.setProperty("--sidebar-bg",     `rgba(253, 248, 225, ${0.45 * op})`);
      root.style.setProperty("--sidebar-border", `rgba(224, 200, 130, ${0.35 * op})`);
      root.style.setProperty("--sidebar-hover",  "rgba(243, 237, 224, 0.8)");
      root.style.setProperty("--card-warm",             "#FAF3DF");
      root.style.setProperty("--card-warm-border",      "#C5BCA3");
      root.style.setProperty("--badge-locked-bg",       "#EAE4D6");
      root.style.setProperty("--badge-locked-border",   "#DFD9C9");
      root.style.setProperty("--badge-locked-icon-bg",  "#8B8470");
      root.style.setProperty("--badge-locked-emoji-bg", "#D6CDBA");
      root.style.setProperty("--heatmap-zero",          "#EDE8DC");
      root.style.setProperty("--skeleton-from",         "#EDE8DC");
      root.style.setProperty("--skeleton-mid",          "#F7F2E8");
      root.style.setProperty("--chip-green-bg",         "#dcfce7");
      root.style.setProperty("--chip-green-text",       "#15803d");
      root.style.setProperty("--chip-red-bg",           "#fee2e2");
      root.style.setProperty("--chip-red-text",         "#b91c1c");
    }
    root.style.setProperty("--glass-blur", "14px");
    root.style.setProperty("--ui-opacity", String(op));
  }, [settings.uiOpacity, settings.nightMode]);

  // ── 雨滴 Canvas（全屏，z-index 高于所有内容）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !settings.rainEnabled) {
      cancelAnimationFrame(rafRef.current);
      if (canvas) {
        const ctx2 = canvas.getContext("2d");
        if (ctx2) ctx2.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cvs = canvas;
    const c = ctx;

    type Drop = { x: number; y: number; len: number; speed: number; opacity: number; angle: number; w: number };
    const intensity = settings.rainIntensity;

    function newDrop(randomY = false): Drop {
      const heavy = intensity === "heavy", light = intensity === "light";
      const angle = (heavy ? -0.22 : -0.08) + (Math.random() - 0.5) * 0.1;
      const len = light ? 8 + Math.random() * 10 : heavy ? 18 + Math.random() * 22 : 12 + Math.random() * 16;
      return {
        x: Math.random() * cvs.width,
        y: randomY ? Math.random() * cvs.height : -len,
        len, angle,
        opacity: (light ? 0.13 : heavy ? 0.25 : 0.19) * (0.6 + Math.random() * 0.4),
        speed: light ? 4 + Math.random() * 3 : heavy ? 11 + Math.random() * 6 : 7 + Math.random() * 4,
        w: light ? 0.6 : heavy ? 1.3 : 1.0,
      };
    }

    function resize() {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
    }
    resize();
    const countPer = intensity === "light" ? 14 : intensity === "heavy" ? 5 : 9;
    let drops: Drop[] = Array.from({ length: Math.floor(window.innerWidth / countPer) }, () => newDrop(true));

    function draw() {
      c.clearRect(0, 0, cvs.width, cvs.height);
      drops.forEach((d, i) => {
        const dx = Math.sin(d.angle) * d.len;
        const dy = Math.cos(d.angle) * d.len;
        const g = c.createLinearGradient(d.x, d.y, d.x + dx, d.y + dy);
        g.addColorStop(0, `rgba(180,205,235,0)`);
        g.addColorStop(1, `rgba(180,205,235,${d.opacity})`);
        c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + dx, d.y + dy);
        c.strokeStyle = g; c.lineWidth = d.w; c.lineCap = "round"; c.stroke();
        d.x += Math.sin(d.angle) * d.speed; d.y += d.speed;
        if (d.y > cvs.height + d.len) drops[i] = newDrop(false);
      });
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [settings.rainEnabled, settings.rainIntensity]);

  return (
    <EnvContext.Provider value={{ settings, update }}>
      {children}
      {/* 雨滴层：fixed + 全屏 + 最高层级，覆盖侧边栏和内容区 */}
      {settings.rainEnabled && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 9990 }}
          aria-hidden="true"
        />
      )}
    </EnvContext.Provider>
  );
}

export function useEnv() { return useContext(EnvContext); }
