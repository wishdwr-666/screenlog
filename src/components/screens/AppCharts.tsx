"use client";
import { motion } from "framer-motion";

interface AppTotal {
  appName: string;
  processName: string;
  category: string;
  totalSeconds: number;
  sessionCount: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  work: "#7E97A6",
  social: "#D36E52",
  entertainment: "#E6AF2E",
  tool: "#9CB48A",
  other: "#B8A898",
};

const CATEGORY_LABELS: Record<string, string> = {
  work: "工作",
  social: "社交",
  entertainment: "娱乐",
  tool: "工具",
  other: "其他",
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface AppDonutProps {
  apps: AppTotal[];
  totalSeconds: number;
}

export function AppDonutChart({ apps, totalSeconds }: AppDonutProps) {
  const top = apps.slice(0, 6);
  const othersTotal = apps.slice(6).reduce((s, a) => s + a.totalSeconds, 0);

  const segments = [
    ...top.map((a) => ({
      label: a.appName,
      seconds: a.totalSeconds,
      color: CATEGORY_COLORS[a.category] ?? "#B8A898",
    })),
    ...(othersTotal > 0 ? [{ label: "其他", seconds: othersTotal, color: "#D9D2C2" }] : []),
  ];

  let cumulative = 0;
  const cx = 60, cy = 60, r = 48, ir = 32;
  const circumference = 2 * Math.PI * r;

  const slices = segments.map((seg) => {
    const pct = totalSeconds > 0 ? seg.seconds / totalSeconds : 0;
    const offset = cumulative;
    cumulative += pct;
    return { ...seg, pct, offset };
  });

  const topApp = apps[0];

  return (
    <div className="flex items-center gap-4">
      {/* 环形图 SVG */}
      <div className="relative shrink-0">
        <svg viewBox="0 0 120 120" className="w-28 h-28">
          {slices.map((s, i) => (
            <motion.circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={r - ir}
              strokeDasharray={`${s.pct * circumference} ${circumference}`}
              strokeDashoffset={`${-s.offset * circumference}`}
              transform={`rotate(-90 ${cx} ${cy})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            />
          ))}
          {/* 中心文字 */}
          <text x={cx} y={cy - 6} textAnchor="middle" className="fill-[var(--app-text)] text-xs font-bold" style={{ fontFamily: "var(--font-heading)", fontSize: "10px" }}>
            {topApp?.appName?.slice(0, 3) ?? "—"}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontFamily: "var(--font-interface)", fontSize: "8px" }} className="fill-[var(--app-text-muted)]">
            最常用
          </text>
        </svg>
      </div>

      {/* 应用列表 */}
      <div className="flex-1 space-y-1.5 min-w-0">
        {top.slice(0, 4).map((app) => {
          const pct = totalSeconds > 0 ? Math.round(app.totalSeconds / totalSeconds * 100) : 0;
          return (
            <motion.div
              key={app.processName}
              className="flex items-center gap-2 min-w-0"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[app.category] ?? "#B8A898" }}
              />
              <span className="text-xs text-[var(--app-text)] truncate flex-1 min-w-0">{app.appName}</span>
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-12 h-1 rounded-full bg-[var(--app-border)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[app.category] ?? "#B8A898" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[9px] text-[var(--app-text-muted)] w-6 text-right">{pct}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface AppRiverMiniProps {
  apps: AppTotal[];
}

// 小型堆叠条形图（用于 Dashboard 预览）
export function AppStackedBar({ apps }: AppRiverMiniProps) {
  const total = apps.reduce((s, a) => s + a.totalSeconds, 0);
  return (
    <div className="flex h-4 rounded-full overflow-hidden gap-px">
      {apps.slice(0, 7).map((app) => {
        const pct = total > 0 ? (app.totalSeconds / total) * 100 : 0;
        return (
          <motion.div
            key={app.processName}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[app.category] ?? "#B8A898" }}
            title={`${app.appName}: ${formatDuration(app.totalSeconds)}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export { CATEGORY_COLORS, CATEGORY_LABELS, formatDuration };
export type { AppTotal };
