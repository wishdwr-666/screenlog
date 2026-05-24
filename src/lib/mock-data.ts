// 模拟数据生成层 —— 由于本地 Electron 数据采集在 Web 环境无法真实运行，
// 提供模拟数据以完整展示可视化效果

import type { AppSession, AppLabel, DailyStat, Achievement } from "@/lib/db/schema/app-sessions";

// ─── 应用库 ────────────────────────────────────────────────────────────────

const APP_CATALOG = [
  { appName: "微信", processName: "WeChat", category: "social" },
  { appName: "VS Code", processName: "Code", category: "work" },
  { appName: "Chrome", processName: "chrome", category: "tool" },
  { appName: "Word", processName: "WINWORD", category: "work" },
  { appName: "腾讯会议", processName: "wemeet", category: "work" },
  { appName: "网易云音乐", processName: "cloudmusic", category: "entertainment" },
  { appName: "哔哩哔哩", processName: "bilibili", category: "entertainment" },
  { appName: "钉钉", processName: "DingTalk", category: "work" },
  { appName: "Figma", processName: "Figma", category: "work" },
  { appName: "飞书", processName: "Lark", category: "work" },
  { appName: "网易游戏", processName: "Game", category: "entertainment" },
  { appName: "外卖平台", processName: "takeout", category: "other" },
  { appName: "设置", processName: "Settings", category: "other" },
];

// ─── 生成单日会话数据 ──────────────────────────────────────────────────────

export function generateDailySessions(date: string): Partial<AppSession>[] {
  const sessions: Partial<AppSession>[] = [];
  let startHour = 9;
  const totalMinutes = 14 * 60; // 模拟 9:00 ~ 23:00
  let accumulatedMinutes = 0;

  while (accumulatedMinutes < totalMinutes) {
    const app = APP_CATALOG[Math.floor(Math.random() * APP_CATALOG.length)];
    const durationMinutes = Math.floor(Math.random() * 60) + 5; // 5-65分钟
    const startTime = new Date(date);
    startTime.setHours(startHour, accumulatedMinutes % 60, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);

    sessions.push({
      appName: app.appName,
      processName: app.processName,
      windowTitle: `${app.appName} - 工作中`,
      startTime,
      endTime,
      durationSeconds: durationMinutes * 60,
      isIdle: Math.random() < 0.1, // 10% 概率为空闲
      isLocked: false,
      onBattery: Math.random() < 0.3,
      category: app.category,
      date,
    });

    accumulatedMinutes += durationMinutes;
    startHour = Math.floor(9 + accumulatedMinutes / 60);
  }

  return sessions;
}

// ─── 生成单日汇总统计 ──────────────────────────────────────────────────────

export function generateDailyStatForDate(date: string): Partial<DailyStat> {
  const totalSeconds = Math.floor(Math.random() * 8 * 3600 + 4 * 3600); // 4-12小时
  const activeSeconds = Math.floor(totalSeconds * 0.75);
  const sessionCount = Math.floor(Math.random() * 100) + 30;
  const immersionCount = Math.floor(Math.random() * 5);
  const fragmentScore = Math.floor(Math.random() * 40 + 30); // 30-70

  const topApps = JSON.stringify([
    { appName: "微信", seconds: Math.floor(totalSeconds * 0.3) },
    { appName: "VS Code", seconds: Math.floor(totalSeconds * 0.25) },
    { appName: "Chrome", seconds: Math.floor(totalSeconds * 0.2) },
  ]);

  const quips = [
    "今天你打开了微信 47 次，平均每 20 分钟一次。",
    "周三下午是你效率最高的时候，连续用 VS Code 3 小时 24 分钟。",
    "你有一个习惯：每天开机先打开浏览器，持续了 17 天。",
    "今天你在'设置'里待了 45 分钟，是遇到什么 bug 了吗？",
    "这周晚上10点后还在用电脑的天数：5天，小心发际线。",
  ];
  const humorQuip = quips[Math.floor(Math.random() * quips.length)];

  return {
    date,
    totalSeconds,
    activeSeconds,
    sessionCount,
    immersionCount,
    fragmentScore,
    topApps,
    humorQuip,
    updatedAt: new Date(),
  };
}

// ─── 生成最近 N 天数据 ─────────────────────────────────────────────────────

export function generateRecentStats(days: number): Partial<DailyStat>[] {
  const stats: Partial<DailyStat>[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    stats.push(generateDailyStatForDate(date));
  }
  return stats;
}

// ─── 应用标签预设 ──────────────────────────────────────────────────────────

export function getDefaultLabels(): Partial<AppLabel>[] {
  return APP_CATALOG.map((app) => ({
    processName: app.processName,
    appName: app.appName,
    category: app.category,
    isProductivity: app.category === "work",
    isBlackhole: app.category === "entertainment",
    updatedAt: new Date(),
  }));
}

// ─── 成就定义 ──────────────────────────────────────────────────────────────

export const ACHIEVEMENT_DEFS = [
  {
    achievementId: "owl",
    title: "猫头鹰",
    description: "凌晨4点还在用电脑",
    emoji: "🦉",
  },
  {
    achievementId: "streak_7",
    title: "连续7天使用电脑",
    description: "记录向",
    emoji: "🔥",
  },
  {
    achievementId: "switch_master",
    title: "手速达人",
    description: "本周切换应用超5000次",
    emoji: "⚡",
  },
  {
    achievementId: "tool_collector",
    title: "工具收藏家",
    description: "单日使用超过20个不同应用",
    emoji: "🧰",
  },
  {
    achievementId: "holiday_worker",
    title: "劳模",
    description: "节假日打开工作软件",
    emoji: "💼",
  },
  {
    achievementId: "persistent",
    title: "坚持不懈",
    description: "应用崩溃后5秒内重新打开",
    emoji: "💪",
  },
];

export function getLockedAchievements(unlockedIds: string[]) {
  return ACHIEVEMENT_DEFS.filter((a) => !unlockedIds.includes(a.achievementId));
}

export function getUnlockedAchievements(unlockedIds: string[]) {
  return ACHIEVEMENT_DEFS.filter((a) => unlockedIds.includes(a.achievementId));
}

// ─── 生成模拟解锁成就 ──────────────────────────────────────────────────────

export function generateMockAchievements(): Partial<Achievement>[] {
  // 随机解锁 2-4 个成就
  const count = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...ACHIEVEMENT_DEFS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((def) => ({
    achievementId: def.achievementId,
    triggeredBy: `模拟触发: ${def.description}`,
    unlockedAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000),
  }));
}
