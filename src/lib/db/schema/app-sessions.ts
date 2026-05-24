import { pgTable, serial, text, integer, timestamp, boolean, real, varchar } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

// 应用使用事件（每次前台应用切换时记录一条）
export const appSessions = pgTable("app_sessions", {
  id: serial("id").primaryKey(),
  appName: text("app_name").notNull(),        // 应用名称，如 "VS Code"
  processName: text("process_name").notNull(), // 进程名，如 "Code.exe"
  windowTitle: text("window_title"),           // 窗口标题（可选）
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),              // null 表示仍在使用
  durationSeconds: integer("duration_seconds").default(0),
  isIdle: boolean("is_idle").default(false),   // 是否为挂机状态
  isLocked: boolean("is_locked").default(false), // 是否为锁屏状态
  onBattery: boolean("on_battery").default(false), // 是否使用电池
  category: text("category").default("other"), // 工作/学习/娱乐/社交/工具/其他
  date: text("date").notNull(),                // YYYY-MM-DD 格式，便于按天查询
  userId: text("user_id"),
});

export type AppSession = InferSelectModel<typeof appSessions>;

// 应用分类与标签（用户自定义）
export const appLabels = pgTable("app_labels", {
  id: serial("id").primaryKey(),
  processName: text("process_name").notNull().unique(),
  appName: text("app_name").notNull(),
  category: text("category").notNull().default("other"),
  isProductivity: boolean("is_productivity").default(false),
  isBlackhole: boolean("is_blackhole").default(false),
  iconEmoji: text("icon_emoji"),               // 用于展示的 emoji 图标备用
  userId: text("user_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AppLabel = InferSelectModel<typeof appLabels>;

// 每日聚合统计（缓存，加速 Dashboard 加载）
export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),                // YYYY-MM-DD
  totalSeconds: integer("total_seconds").default(0),
  activeSeconds: integer("active_seconds").default(0),
  sessionCount: integer("session_count").default(0),
  immersionCount: integer("immersion_count").default(0), // 连续使用25分钟+的片段数
  fragmentScore: real("fragment_score").default(0),      // 碎片化评分 0-100
  topApps: text("top_apps"),                  // JSON 序列化的 top3 应用
  humorQuip: text("humor_quip"),              // 当日冷幽默文案
  userId: text("user_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DailyStat = InferSelectModel<typeof dailyStats>;

// 成就记录
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  achievementId: text("achievement_id").notNull(), // 成就唯一标识
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  triggeredBy: text("triggered_by"),               // 触发条件描述
  userId: text("user_id"),
});

export type Achievement = InferSelectModel<typeof achievements>;

// 壁纸历史记录
export const wallpaperHistory = pgTable("wallpaper_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  url: text("url").notNull(),
  key: text("key"),
  name: text("name"),                           // 原始文件名
  usedAt: timestamp("used_at").notNull().defaultNow(),
});

export type WallpaperHistory = InferSelectModel<typeof wallpaperHistory>;
