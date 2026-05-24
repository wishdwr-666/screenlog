"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { HeatmapChart } from "@/components/screens/HeatmapChart";
import { AppDonutChart } from "@/components/screens/AppCharts";
import { getMoodEmoji } from "@/lib/dashboard-data";
import type { AppTotal } from "@/components/screens/AppCharts";
import { getTodayStats, getHeatmap } from "@/lib/tauri-bridge";

interface DailyStat {
  totalSeconds: number;
  activeSeconds: number;
  sessionCount: number;
  fragmentScore: number;
  humorQuip: string;
}

interface DashboardData {
  stat: DailyStat;
  appTotals: AppTotal[];
  date: string;
}

export function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [heatmapData, setHeatmapData] = useState<Record<string, number[]>>({});

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [todayData, heatData] = await Promise.all([
          getTodayStats(today),
          getHeatmap(14),
        ]);
        setData(todayData);
        setHeatmapData(heatData.heatmap ?? {});
      } catch { /* 静默 */ } finally { setLoading(false); }
    }
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="p-4 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-svh px-6">
      <p className="text-sm text-[var(--app-text-muted)]">暂无数据</p>
    </div>
  );

  const { stat, appTotals } = data;
  const h = Math.floor(stat.activeSeconds / 3600);
  const m = Math.floor((stat.activeSeconds % 3600) / 60);
  const mood = getMoodEmoji(stat.activeSeconds);

  return (
    <div className="relative min-h-svh pb-20 md:pb-0">
      <div className="absolute inset-0 pointer-events-none paper-texture opacity-80 z-0" />
      <div className="relative z-10 w-full p-4 space-y-5">

        {/* 头部 */}
        <header className="flex items-center justify-between mt-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--app-primary)] flex items-center justify-center text-white shadow-sm rotate-[-3deg]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>ScreenLog</h1>
              <span className="text-[9px] uppercase tracking-wider text-[var(--app-text-muted)] block">Quiet Observer</span>
            </div>
          </div>
          <Link href="/settings">
            <button aria-label="设置" className="p-2 hover:bg-[var(--sidebar-hover)] rounded-lg transition-colors text-[var(--app-text-muted)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </Link>
        </header>

        {/* 今日心情贴纸 */}
        <motion.div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 rotate-[1deg] shadow-sm relative overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full text-xs rotate-[15deg] font-bold text-[var(--app-warning)]" style={{ backgroundColor: "color-mix(in srgb, var(--app-warning) 20%, transparent)" }}>✨</div>
          <div className="text-[10px] text-[var(--app-text-muted)] mb-1 uppercase tracking-widest">Today&apos;s Mood</div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{mood.emoji}</span>
            <div>
              <h3 className="text-sm font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>{mood.title}</h3>
              <p className="text-[10px] text-[var(--app-text-muted)] mt-0.5">活跃 {h}h {m}m / 切换 {stat.sessionCount} 次</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-dashed border-[var(--app-border)] text-xs text-[var(--app-text-secondary)] leading-relaxed italic" style={{ fontFamily: "var(--font-heading)" }}>
            &ldquo;{mood.quote}&rdquo;
          </div>
        </motion.div>

        {/* 快速统计 */}
        <motion.div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 shadow-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h4 className="text-[10px] font-bold tracking-wider text-[var(--app-text-muted)] uppercase mb-3">Today Readouts</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-[var(--app-text-muted)] block mb-1">⏱ 今日活跃</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[var(--app-primary)]" style={{ fontFamily: "var(--font-heading)" }}>{String(h).padStart(2,"0")}</span>
                <span className="text-xs text-[var(--app-text)]">h</span>
                <span className="text-xl font-bold text-[var(--app-primary)]" style={{ fontFamily: "var(--font-heading)" }}>{String(m).padStart(2,"0")}</span>
                <span className="text-[10px] text-[var(--app-text)]">m</span>
              </div>
            </div>
            <div className="border-l border-dashed border-[var(--app-border)] pl-4">
              <span className="text-[10px] text-[var(--app-text-muted)] block mb-1">⚡ 碎散跳转</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[var(--app-warning)]" style={{ fontFamily: "var(--font-heading)" }}>{stat.sessionCount}</span>
                <span className="text-[10px] text-[var(--app-text-secondary)]">次</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 冷幽默卡 */}
        <motion.div className="bg-[var(--card-warm)] border-2 border-dashed border-[var(--card-warm-border)] rounded-2xl p-4 shadow-sm transform rotate-[-0.5deg]" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[var(--app-primary)] text-white rounded text-[8px] uppercase tracking-wider">轻度社交中毒</div>
          <span className="text-xs font-bold text-[var(--app-primary)] block mb-1.5" style={{ fontFamily: "var(--font-heading)" }}>手帐提要：</span>
          <p className="text-[13px] text-[var(--app-text)] leading-relaxed italic" style={{ fontFamily: "var(--font-heading)" }}>&ldquo;{stat.humorQuip}&rdquo;</p>
          <div className="mt-3 pt-2 border-t border-[var(--app-border)] flex items-center justify-between text-[9px] text-[var(--app-text-muted)]">
            <span>源: 手帐守护灵</span><span>绝对客观</span>
          </div>
        </motion.div>

        {/* 热力图 */}
        {Object.keys(heatmapData).length > 0 && (
          <motion.div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 shadow-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h4 className="text-[10px] font-bold tracking-wider text-[var(--app-text-muted)] uppercase mb-3">近14天热力图</h4>
            <HeatmapChart data={heatmapData} days={14} />
          </motion.div>
        )}

        {/* 应用分布 */}
        {appTotals.length > 0 && (
          <motion.div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 shadow-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h4 className="text-[10px] font-bold tracking-wider text-[var(--app-text-muted)] uppercase mb-3">今日应用分布</h4>
            <AppDonutChart apps={appTotals} totalSeconds={stat.activeSeconds} />
          </motion.div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
