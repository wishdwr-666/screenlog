import { desc, eq, gte, lte, and, sql } from "drizzle-orm";
import { db } from "../client";
import { appSessions, appLabels, dailyStats, achievements } from "../schema/app-sessions";

// ─── 会话查询 ───────────────────────────────────────────────────────────────

export async function getSessionsByDate(date: string, userId?: string) {
  if (!db) throw new Error("Database not connected");
  return db
    .select()
    .from(appSessions)
    .where(
      and(
        eq(appSessions.date, date),
        userId ? eq(appSessions.userId, userId) : undefined
      )
    )
    .orderBy(appSessions.startTime);
}

export async function getSessionsByDateRange(
  startDate: string,
  endDate: string,
  userId?: string
) {
  if (!db) throw new Error("Database not connected");
  return db
    .select()
    .from(appSessions)
    .where(
      and(
        gte(appSessions.date, startDate),
        lte(appSessions.date, endDate),
        userId ? eq(appSessions.userId, userId) : undefined
      )
    )
    .orderBy(appSessions.startTime);
}

// 获取指定日期各应用使用总时长
export async function getAppTotals(date: string, userId?: string) {
  if (!db) throw new Error("Database not connected");
  return db
    .select({
      appName: appSessions.appName,
      processName: appSessions.processName,
      category: appSessions.category,
      totalSeconds: sql<number>`sum(${appSessions.durationSeconds})`,
      sessionCount: sql<number>`count(*)`,
    })
    .from(appSessions)
    .where(
      and(
        eq(appSessions.date, date),
        eq(appSessions.isIdle, false),
        userId ? eq(appSessions.userId, userId) : undefined
      )
    )
    .groupBy(appSessions.appName, appSessions.processName, appSessions.category)
    .orderBy(desc(sql`sum(${appSessions.durationSeconds})`));
}

// 按小时聚合（用于热力图）
export async function getHourlyActivity(date: string, userId?: string) {
  const sessions = await getSessionsByDate(date, userId);
  const hourly = new Array(24).fill(0);
  for (const s of sessions) {
    if (s.isIdle || s.isLocked || !s.durationSeconds) continue;
    const hour = new Date(s.startTime).getHours();
    hourly[hour] += s.durationSeconds;
  }
  return hourly;
}

// ─── 应用标签查询 ──────────────────────────────────────────────────────────

export async function getAllLabels(userId?: string) {
  if (!db) throw new Error("Database not connected");
  return db
    .select()
    .from(appLabels)
    .where(userId ? eq(appLabels.userId, userId) : undefined)
    .orderBy(appLabels.appName);
}

export async function upsertLabel(data: {
  processName: string;
  appName: string;
  category: string;
  isProductivity?: boolean;
  isBlackhole?: boolean;
  userId?: string;
}) {
  if (!db) throw new Error("Database not connected");
  return db
    .insert(appLabels)
    .values({ ...data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appLabels.processName,
      set: {
        appName: data.appName,
        category: data.category,
        isProductivity: data.isProductivity ?? false,
        isBlackhole: data.isBlackhole ?? false,
        updatedAt: new Date(),
      },
    })
    .returning();
}

// ─── 每日统计 ──────────────────────────────────────────────────────────────

export async function getDailyStat(date: string, userId?: string) {
  if (!db) throw new Error("Database not connected");
  const rows = await db
    .select()
    .from(dailyStats)
    .where(
      and(
        eq(dailyStats.date, date),
        userId ? eq(dailyStats.userId, userId) : undefined
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertDailyStat(data: {
  date: string;
  totalSeconds: number;
  activeSeconds: number;
  sessionCount: number;
  immersionCount: number;
  fragmentScore: number;
  topApps: string;
  humorQuip: string;
  userId?: string;
}) {
  if (!db) throw new Error("Database not connected");
  return db
    .insert(dailyStats)
    .values({ ...data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [dailyStats.date],
      set: { ...data, updatedAt: new Date() },
    })
    .returning();
}

export async function getRecentDailyStats(days: number, userId?: string) {
  if (!db) throw new Error("Database not connected");
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return db
    .select()
    .from(dailyStats)
    .where(
      and(
        gte(dailyStats.date, dates[0]),
        userId ? eq(dailyStats.userId, userId) : undefined
      )
    )
    .orderBy(dailyStats.date);
}

// ─── 成就查询 ──────────────────────────────────────────────────────────────

export async function getUnlockedAchievements(userId?: string) {
  if (!db) throw new Error("Database not connected");
  return db
    .select()
    .from(achievements)
    .where(userId ? eq(achievements.userId, userId) : undefined)
    .orderBy(desc(achievements.unlockedAt));
}

export async function unlockAchievement(achievementId: string, triggeredBy: string, userId?: string) {
  if (!db) throw new Error("Database not connected");
  // 防止重复解锁
  const existing = await db
    .select()
    .from(achievements)
    .where(
      and(
        eq(achievements.achievementId, achievementId),
        userId ? eq(achievements.userId, userId) : undefined
      )
    )
    .limit(1);
  if (existing.length > 0) return existing[0];

  const rows = await db
    .insert(achievements)
    .values({ achievementId, triggeredBy, userId })
    .returning();
  return rows[0];
}