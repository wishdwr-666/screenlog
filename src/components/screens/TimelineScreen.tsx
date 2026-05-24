"use client";
import { useEffect, useState } from "react";
import { getTimeline } from "@/lib/tauri-bridge";
import { motion } from "framer-motion";
import Link from "next/link";
import { CATEGORY_COLORS, CATEGORY_LABELS, formatDuration } from "@/components/screens/AppCharts";

interface SessionEvent {
  appName: string;
  processName: string;
  startedAt: number;
  startTime?: string | Date; // legacy compat
  durationSeconds: number;
  category: string;
  isIdle: boolean;
  windowTitle?: string;
}

function formatTime(date: string | Date | number | undefined): string {
  if (!date) return "--:--";
  const d = typeof date === "number" ? new Date(date) : typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

const COLD_HUMOR: Record<string, (app: string, dur: number) => string> = {
  WeChat: (_, d) => `雷打不动点开微信。${d > 600 ? "待了这么久，无一条消息与你有关。" : "看了一眼，关上了。"}`,
  Code: (_, d) => d > 1500 ? "沉浸工作阶段。完成了模块构建，颈椎开始发出警告。" : "打开了编辑器，调整了字体大小，又关上了。",
  chrome: () => "浏览器打开，一个标签页变成了十二个。",
  bilibili: () => "说只看一个视频，结果两小时过去了。",
  wemeet: () => "会议进行中。摄像头关着，你在摸鱼。",
  Settings: (_, d) => d > 1200 ? "在设置里待了很久，是遇到 bug 了吗？" : "点进了设置，又不知道要改什么，退出了。",
  idle: () => "检测到离开或发呆状态，不纳入使用统计。",
  system: () => "新的一天开始了。屏幕亮起，检测到你带有一丝不情愿。",
};

function getHumorText(processName: string, appName: string, durationSeconds: number): string {
  const fn = COLD_HUMOR[processName];
  if (fn) return fn(appName, durationSeconds);
  const catPhrases: Record<string, string> = {
    work: "安静地做了些工作相关的事情，具体内容不便打扰。",
    social: "社交时间到。切换频率说明你很受欢迎，或者你很闲。",
    entertainment: "娱乐时段。你有权利不解释。",
    tool: "使用了一个工具，也许解决了某个问题。",
    other: "在某个地方停留了一会儿，踪迹不明。",
  };
  return catPhrases[processName] ?? "在这里停留了一段时间。";
}

function getEventEmoji(category: string, processName: string): string {
  const map: Record<string, string> = {
    system: "⚡", WeChat: "💬", DingTalk: "💼", Lark: "💼",
    Code: "💻", WINWORD: "📝", cloudmusic: "🎵", bilibili: "📺",
    wemeet: "🎙️", Settings: "⚙️", chrome: "🌐", takeout: "🥡", idle: "☁️",
  };
  if (map[processName]) return map[processName];
  const catMap: Record<string, string> = { work: "💼", social: "💬", entertainment: "🎬", tool: "🔧", other: "📦" };
  return catMap[category] ?? "📱";
}

const IMMERSION_THRESHOLD = 25 * 60; // 25分钟算沉浸

export function TimelineScreen() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SessionEvent[]>([]);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const sessions = await getTimeline(today);
        setEvents(sessions);
      } catch { /* 静默 */ } finally { setLoading(false); }
    }
    fetchTimeline();
  }, []);

  const totalEvents = events.length;
  const immersionEvents = events.filter(e => !e.isIdle && e.durationSeconds >= IMMERSION_THRESHOLD);

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
        <h1 className="flex-1 text-center pr-8 text-base font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>手帐轨迹</h1>
      </header>

      <div className="relative z-10 w-full p-4 space-y-4 pb-12">
        {/* 简介 */}
        <p className="text-[11px] text-[var(--app-text-muted)] leading-relaxed">
          客观无声的电脑使用手帐：不为效率评奖，仅还原细碎的切换节点与敲击惯性。
        </p>

        {/* 统计小贴 */}
        {!loading && totalEvents > 0 && (
          <motion.div
            className="flex items-center gap-3 bg-[var(--card-warm)] border border-dashed border-[var(--card-warm-border)] rounded-xl px-4 py-2.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <span className="text-xl">📖</span>
            <p className="text-[11px] text-[var(--app-text)] leading-relaxed" style={{ fontFamily: "var(--font-heading)" }}>
              今天共有 <strong className="text-[var(--app-primary)]">{totalEvents}</strong> 个应用切换节点，
              其中 <strong className="text-[var(--app-success)]">{immersionEvents.length}</strong> 段心流沉浸时刻（25分钟以上）。
            </p>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-20 w-full rounded-2xl"/>)}</div>
        ) : (
          /* 时间轴 */
          <div className="relative pl-5 border-l border-[var(--app-border)] space-y-6 ml-3">
            {events.map((event, i) => {
              const isImmersion = !event.isIdle && event.durationSeconds >= IMMERSION_THRESHOLD;
              const color = CATEGORY_COLORS[event.category] ?? "#B8A898";
              const emoji = getEventEmoji(event.category, event.processName);
              const humor = getHumorText(event.processName, event.appName, event.durationSeconds);
              const catLabel = CATEGORY_LABELS[event.category] ?? event.category;

              return (
                <motion.div
                  key={i}
                  className={`relative ${isImmersion ? "-m-2 p-2 rounded-2xl border border-[var(--app-success)]/30" : ""}`}
                  style={isImmersion ? { backgroundColor: "color-mix(in srgb, var(--app-success) 5%, transparent)" } : {}}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {/* 时间轴节点 */}
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full border-2 ${isImmersion ? "ml-4" : ""}`}
                    style={{
                      left: isImmersion ? "-27px" : "-27px",
                      backgroundColor: isImmersion ? "var(--app-success)" : event.isIdle ? "var(--app-border)" : color,
                      borderColor: isImmersion ? "#7F9371" : event.isIdle ? "var(--app-border)" : color + "80",
                    }}
                  />

                  {/* 时间标签 */}
                  <div className={`flex flex-wrap items-center gap-2 mb-1 ${isImmersion ? "ml-4 mt-1" : ""}`}>
                    <span className="text-xs font-bold text-[var(--app-primary)]">{formatTime(event.startedAt ?? event.startTime ?? 0)}</span>
                    <span className="text-[9px] bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-text-secondary)] px-1.5 py-0.5 rounded">
                      持续 {formatDuration(event.durationSeconds)}
                    </span>
                    {isImmersion && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold text-[var(--app-success)]" style={{ backgroundColor: "color-mix(in srgb, var(--app-success) 20%, transparent)" }}>
                        心流专注时段
                      </span>
                    )}
                    {event.isIdle && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded text-[var(--app-text-muted)] bg-[var(--app-border)]/40">
                        离开/发呆
                      </span>
                    )}
                  </div>

                  {/* 事件卡片 */}
                  <div className={`bg-[var(--app-surface)] hover:bg-[var(--sidebar-hover)] border border-[var(--card-warm-border)] rounded-xl p-3 transition-colors ${isImmersion ? "ml-4" : ""}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{emoji}</span>
                      <h4 className="font-bold text-[13px] text-[var(--app-text)]">{event.appName}</h4>
                      <span className="text-[8px] text-[var(--app-text-muted)] uppercase">/ {catLabel}</span>
                    </div>
                    <p className="text-[11px] text-[var(--app-text-secondary)] leading-relaxed italic" style={{ fontFamily: "var(--font-heading)" }}>
                      {humor}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {events.length === 0 && (
              <div className="text-center py-8 text-[var(--app-text-muted)] text-sm">
                今日暂无记录
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
