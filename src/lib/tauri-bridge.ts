/**
 * tauri-bridge.ts
 *
 * 统一数据入口：
 *   - Tauri 环境（打包后的桌面 App）→ 调用 Rust IPC，返回真实采集数据
 *   - 浏览器预览环境 → 走 Next.js API（模拟数据），UI 效果完整展示
 *
 * 用法：所有屏幕组件只 import 这个文件，不直接调用 fetch 或 invoke。
 */

// 运行时判断是否在 Tauri 桌面环境中
export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

let _invoke: InvokeFn | null = null;
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!_invoke) {
    const mod = await import("@tauri-apps/api/core");
    _invoke = mod.invoke as InvokeFn;
  }
  return _invoke<T>(cmd, args);
}

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export interface DailyStat {
  totalSeconds: number;
  activeSeconds: number;
  sessionCount: number;
  fragmentScore: number;
  humorQuip: string;
}

export interface AppTotal {
  appName: string;
  processName: string;
  category: string;
  totalSeconds: number;
  sessionCount: number;
}

export interface TimelineEvent {
  id: number;
  appName: string;
  processName: string;
  category: string;
  windowTitle: string;
  startedAt: number;
  endedAt: number | null;
  durationSeconds: number;
  isIdle: boolean;
}

export interface HeatmapData {
  heatmap: Record<string, number[]>;
}

export interface ActiveApp {
  appName: string;
  processName: string;
  windowTitle: string;
  exePath: string;
  pid: number;
}

// ─── API 函数 ─────────────────────────────────────────────────────────────────

/** 今日统计（大数字 + 冷幽默文案） */
export async function getTodayStats(date?: string): Promise<{ stat: DailyStat; appTotals: AppTotal[]; date: string }> {
  if (isTauri) {
    const [statsRaw, totals] = await Promise.all([
      invoke<{ stat: DailyStat; date: string }>("get_today_stats"),
      invoke<AppTotal[]>("get_app_totals", { date }),
    ]);
    return { ...statsRaw, appTotals: totals };
  }
  const d = date ?? new Date().toISOString().split("T")[0];
  const res = await fetch(`/api/stats/daily?date=${d}&mode=today`);
  return res.json();
}

/** 热力图（近 N 天） */
export async function getHeatmap(days = 14): Promise<HeatmapData> {
  if (isTauri) {
    return invoke<HeatmapData>("get_heatmap", { days });
  }
  const res = await fetch(`/api/stats/daily?mode=heatmap&days=${days}`);
  return res.json();
}

/** 时间线事件列表 */
export async function getTimeline(date?: string): Promise<TimelineEvent[]> {
  if (isTauri) {
    return invoke<TimelineEvent[]>("get_timeline", { date });
  }
  const d = date ?? new Date().toISOString().split("T")[0];
  const res = await fetch(`/api/sessions?date=${d}`);
  const data = await res.json();
  return data.sessions ?? [];
}

/** 成就列表 */
export async function getAchievements(): Promise<unknown[]> {
  if (isTauri) {
    return invoke<unknown[]>("get_achievements");
  }
  const res = await fetch("/api/achievements");
  const data = await res.json();
  return data.achievements ?? [];
}

/** 应用标签（分类设置） */
export async function getLabels(): Promise<unknown[]> {
  if (isTauri) {
    return invoke<unknown[]>("get_labels");
  }
  const res = await fetch("/api/labels");
  const data = await res.json();
  return data.labels ?? [];
}

/** 当前前台应用（实时，侧边栏运行中展示用） */
export async function getActiveApp(): Promise<ActiveApp | null> {
  if (isTauri) {
    const r = await invoke<{ app: ActiveApp | null }>("get_active_app");
    return r.app;
  }
  // 浏览器环境：返回 null，侧边栏用模拟数据展示
  return null;
}

/** 当前空闲秒数 */
export async function getIdleSeconds(): Promise<number> {
  if (isTauri) {
    return invoke<number>("get_idle_seconds");
  }
  return 0;
}
