"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CATEGORY_COLORS, CATEGORY_LABELS, formatDuration } from "@/components/screens/AppCharts";
import type { AppTotal } from "@/components/screens/AppCharts";

interface AppGroup {
  totalSeconds: number;
  appTotals: AppTotal[];
}

const CATEGORY_ORDER = ["work", "social", "entertainment", "tool", "other"];

export function RiversScreen() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<AppTotal[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(`/api/stats/daily?date=${today}&mode=today`);
        const data = await res.json();
        setApps(data.appTotals ?? []);
        setTotalSeconds(data.stat?.activeSeconds ?? 0);
      } catch { /* 静默 */ } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const filtered = filter === "all" ? apps : apps.filter((a) => a.category === filter);
  const categories = [...new Set(apps.map((a) => a.category))];

  // 生成模拟河流 SVG 路径
  function getRiverPath(index: number, total: number): string {
    const yBase = 100 - (index / total) * 80;
    const pts = [0, 60, 130, 200, 260, 300];
    const y = pts.map((x, i) => {
      const wave = Math.sin((x / 300) * Math.PI * 2 + index) * 15;
      return `${x} ${Math.max(5, yBase + wave)}`;
    });
    const bottom = "L 300 100 L 0 100 Z";
    return `M ${y[0]} Q ${y[1]}, ${y[2]} T ${y[3]} T ${y[4]} ${bottom}`;
  }

  const riverColors = ["#9CB48A", "#D36E52", "#7E97A6", "#E6AF2E", "#B8A898"];
  const topApps = apps.slice(0, 4);

  return (
    <div className="relative min-h-svh pb-20 md:pb-0">
      <div className="absolute inset-0 pointer-events-none paper-texture opacity-80 z-0" />

      {/* 页面头部 */}
      <header className="relative z-10 flex items-center p-4 border-b border-[var(--app-border)] bg-[var(--app-surface)]/80 backdrop-blur-sm sticky top-0">
        <Link href="/">
          <button aria-label="返回" className="p-2 -ml-2 rounded-full hover:bg-[var(--app-border)] text-[var(--app-text)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </Link>
        <h1 className="flex-1 text-center pr-8 text-base font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>河流分布</h1>
      </header>

      <div className="relative z-10 w-full p-4 space-y-6 pb-12">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-24 w-full rounded-2xl"/>)}</div>
        ) : (
          <>
            {/* 河流图 */}
            <motion.div
              className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 shadow-sm"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>时序消长面积</h3>
                <p className="text-[10px] text-[var(--app-text-muted)] mt-1">彩色带越宽，说明它们当时霸占你的大脑精力越多。</p>
              </div>
              <div className="h-[160px] w-full bg-[var(--card-warm)] rounded-xl relative overflow-hidden border border-[var(--card-warm-border)]">
                {/* 网格线 */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-6 opacity-30">
                  <div className="w-full border-t border-dashed border-[var(--card-warm-border)]" />
                  <div className="w-full border-t border-dashed border-[var(--card-warm-border)]" />
                </div>
                {/* SVG 河流曲线 */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                  {topApps.map((app, i) => (
                    <motion.path
                      key={app.processName}
                      d={getRiverPath(i, topApps.length)}
                      fill={riverColors[i] ?? "#B8A898"}
                      fillOpacity={0.75 + i * 0.03}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.12, duration: 0.5 }}
                    />
                  ))}
                </svg>
                {/* 标注贴纸 */}
                <div className="absolute top-5 left-[15%] bg-[var(--app-surface)] border border-[var(--card-warm-border)] px-1.5 py-0.5 rounded text-[8px] shadow-sm transform rotate-[-3deg]">专注峰值</div>
                <div className="absolute bottom-8 right-[15%] bg-[var(--app-surface)] border border-[var(--card-warm-border)] px-1.5 py-0.5 rounded text-[8px] shadow-sm">社交打岔</div>
                {/* X轴时间标签 */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-[var(--app-text-muted)] px-3 pb-1.5 border-t border-[var(--app-border)] bg-[var(--card-warm)]/80">
                  <span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span>
                </div>
              </div>
            </motion.div>

            {/* 分类筛选 */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <FilterPill active={filter === "all"} label="全部" onClick={() => setFilter("all")} />
              {categories.map((cat) => (
                <FilterPill key={cat} active={filter === cat} label={CATEGORY_LABELS[cat] ?? cat}
                  onClick={() => setFilter(cat)} color={CATEGORY_COLORS[cat]} />
              ))}
            </div>

            {/* 应用列表 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--app-text)] ml-1" style={{ fontFamily: "var(--font-heading)" }}>高频应用足迹</h3>
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-[var(--app-text-muted)] text-sm">该分类暂无记录</div>
              ) : (
                filtered.map((app, i) => {
                  const pct = totalSeconds > 0 ? Math.round(app.totalSeconds / totalSeconds * 100) : 0;
                  const color = CATEGORY_COLORS[app.category] ?? "#B8A898";
                  const catLabel = CATEGORY_LABELS[app.category] ?? app.category;
                  return (
                    <motion.div
                      key={app.processName}
                      className="border border-[var(--app-border)] rounded-2xl p-3 bg-[var(--app-surface)] hover:border-[var(--app-primary)] transition-colors"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: color + "20" }}>
                            {getAppEmoji(app.category)}
                          </div>
                          <div>
                            <h4 className="text-[13px] font-bold text-[var(--app-text)]">{app.appName}</h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color, backgroundColor: color + "20", border: `1px solid ${color}40` }}>{catLabel}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-[var(--app-text)]">{formatDuration(app.totalSeconds)}</span>
                          <span className="text-[9px] block text-[var(--app-text-muted)]">{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--app-border)] rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterPill({ active, label, onClick, color }: { active: boolean; label: string; onClick: () => void; color?: string }) {
  return (
    <motion.button
      onClick={onClick}
      className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-medium transition-colors border ${active ? "bg-[var(--app-primary)] text-white border-[var(--app-primary)]" : "bg-[var(--app-surface)] text-[var(--app-text-secondary)] border-[var(--app-border)] hover:border-[var(--app-primary)]"}`}
      whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
  );
}

function getAppEmoji(category: string): string {
  const map: Record<string, string> = { work: "💼", social: "💬", entertainment: "🎬", tool: "🔧", other: "📦" };
  return map[category] ?? "📱";
}
