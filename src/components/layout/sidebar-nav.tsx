"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  {
    href: "/",
    label: "今日概览",
    subLabel: "Dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/rivers",
    label: "河流与分布",
    subLabel: "Apps",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: "/timeline",
    label: "时间线叙事",
    subLabel: "Timeline",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "/badges",
    label: "成就徽章墙",
    subLabel: "Badges",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  },
  {
    href: "/wallpaper",
    label: "自定义壁纸",
    subLabel: "Wallpaper",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "设置",
    subLabel: "Settings",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

// 模拟当前运行中的应用列表（真实 Electron 环境中由主进程注入）
const MOCK_RUNNING_APPS = [
  { name: "VS Code", emoji: "💻", seconds: 7200, category: "work" },
  { name: "微信", emoji: "💬", seconds: 3480, category: "social" },
  { name: "Chrome", emoji: "🌐", seconds: 2640, category: "tool" },
  { name: "腾讯会议", emoji: "🎙️", seconds: 900, category: "work" },
  { name: "网易云音乐", emoji: "🎵", seconds: 600, category: "entertainment" },
  { name: "哔哩哔哩", emoji: "📺", seconds: 480, category: "entertainment" },
  { name: "Figma", emoji: "🎨", seconds: 360, category: "work" },
];

const CATEGORY_DOT: Record<string, string> = {
  work: "#7E97A6",
  social: "#D36E52",
  entertainment: "#E6AF2E",
  tool: "#9CB48A",
  other: "#B8A898",
};

function formatDur(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function RunningAppsPanel() {
  const [expanded, setExpanded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [liveApp, setLiveApp] = useState<string | null>(null);

  // Tauri 环境：每 2 秒轮询真实前台应用；浏览器：用模拟数据轮换
  useEffect(() => {
    import("@/lib/tauri-bridge").then(({ isTauri, getActiveApp }) => {
      if (isTauri) {
        const poll = async () => {
          const app = await getActiveApp();
          if (app) setLiveApp(app.appName);
        };
        poll();
        const t = setInterval(poll, 2000);
        return () => clearInterval(t);
      } else {
        const t = setInterval(() => {
          setActiveIdx((i) => (i + 1) % MOCK_RUNNING_APPS.length);
        }, 4000);
        return () => clearInterval(t);
      }
    });
  }, []);

  // 当前显示：Tauri 下用真实应用名，浏览器下用模拟
  const current = liveApp
    ? { name: liveApp, emoji: "💻", seconds: 0, category: "work" }
    : MOCK_RUNNING_APPS[activeIdx];
  const SHOW_COUNT = 3;

  return (
    <div className="px-3 pt-3 border-t border-[var(--app-border)]">
      {/* 当前活跃应用 —— 始终显示 */}
      <div className="mb-2">
        <p className="text-[9px] text-[var(--app-text-muted)] uppercase tracking-wider mb-1.5">
          当前活跃
        </p>
        <motion.div
          key={current.name}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--app-primary)]/10 border border-[var(--app-primary)]/20"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* 呼吸动画指示点 */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--app-primary)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--app-primary)]" />
          </span>
          <span className="text-sm leading-none">{current.emoji}</span>
          <span className="text-[11px] font-medium text-[var(--app-text)] truncate flex-1">{current.name}</span>
          <span className="text-[9px] text-[var(--app-text-muted)] shrink-0">{formatDur(current.seconds)}</span>
        </motion.div>
      </div>

      {/* 运行中列表 */}
      <div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-between w-full mb-1.5 group"
        >
          <p className="text-[9px] text-[var(--app-text-muted)] uppercase tracking-wider">
            运行中 · {MOCK_RUNNING_APPS.length} 个
          </p>
          <motion.svg
            className="w-3 h-3 text-[var(--app-text-muted)]"
            fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            viewBox="0 0 24 24"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path d="m6 9 6 6 6-6" />
          </motion.svg>
        </button>

        {/* 折叠时显示前3个 */}
        <div className="space-y-0.5">
          {(expanded ? MOCK_RUNNING_APPS : MOCK_RUNNING_APPS.slice(0, SHOW_COUNT)).map((app, i) => (
            <motion.div
              key={app.name}
              className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-[var(--sidebar-hover)] transition-colors"
              initial={expanded && i >= SHOW_COUNT ? { opacity: 0, height: 0 } : false}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.15, delay: i >= SHOW_COUNT ? (i - SHOW_COUNT) * 0.04 : 0 }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_DOT[app.category] ?? "#B8A898" }}
              />
              <span className="text-xs leading-none">{app.emoji}</span>
              <span className="text-[10px] text-[var(--app-text-secondary)] truncate flex-1">{app.name}</span>
              <span className="text-[9px] text-[var(--app-text-muted)] shrink-0 tabular-nums">{formatDur(app.seconds)}</span>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {!expanded && MOCK_RUNNING_APPS.length > SHOW_COUNT && (
            <motion.button
              onClick={() => setExpanded(true)}
              className="mt-1 w-full text-[9px] text-[var(--app-text-muted)] hover:text-[var(--app-primary)] transition-colors text-center py-0.5"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              +{MOCK_RUNNING_APPS.length - SHOW_COUNT} 个更多
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {/* 桌面侧边栏 */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col z-20 py-6" style={{ backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", backgroundColor: "var(--sidebar-bg)", borderRight: "1px solid var(--sidebar-border)" }}>
        {/* Logo */}
        <div className="px-5 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--app-primary)] flex items-center justify-center text-white shadow-sm rotate-[-3deg]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--app-text)]" style={{ fontFamily: "var(--font-heading)" }}>ScreenLog</h1>
            <span className="text-[9px] uppercase tracking-wider text-[var(--app-text-muted)] block">Quiet Observer</span>
          </div>
        </div>

        {/* 导航项 */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[var(--app-primary)] text-white"
                      : "text-[var(--app-text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--app-text)]"
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className={isActive ? "text-white" : "text-[var(--app-text-muted)]"}>{item.icon}</span>
                  <div>
                    <div className="text-xs font-medium leading-tight">{item.label}</div>
                    <div className={`text-[9px] leading-tight ${isActive ? "text-white/70" : "text-[var(--app-text-muted)]"}`}>{item.subLabel}</div>
                  </div>
                  {isActive && (
                    <motion.div
                      className="ml-auto w-1 h-4 rounded-full bg-white/50"
                      layoutId="nav-indicator"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* 底部：当前运行应用面板 */}
        <RunningAppsPanel />
      </aside>

      {/* 移动端底部导航栏 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <motion.div
                  className={`flex flex-col items-center justify-center py-2 gap-1 ${
                    isActive ? "text-[var(--app-primary)]" : "text-[var(--app-text-muted)]"
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  {item.icon}
                  <span className="text-[9px] leading-none">{item.subLabel}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
