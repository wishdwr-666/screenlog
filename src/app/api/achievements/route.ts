import { NextResponse } from "next/server";
import { isConnected } from "@/lib/db/client";
import { ACHIEVEMENT_DEFS } from "@/lib/mock-data";

export async function GET() {
  if (!isConnected) {
    return NextResponse.json({ achievements: getMockAchievements() });
  }

  try {
    const { getUnlockedAchievements } = await import("@/lib/db/queries/app-sessions");
    const unlocked = await getUnlockedAchievements();
    const effectiveUnlocked = unlocked.length === 0 ? getMockUnlocked() : unlocked;

    const all = ACHIEVEMENT_DEFS.map((def) => {
      const record = effectiveUnlocked.find((u: { achievementId: string }) => u.achievementId === def.achievementId);
      return {
        ...def,
        unlocked: !!record,
        unlockedAt: record?.unlockedAt ?? null,
        triggeredBy: record?.triggeredBy ?? null,
      };
    });

    return NextResponse.json({ achievements: all });
  } catch {
    return NextResponse.json({ achievements: getMockAchievements() });
  }
}

function getMockUnlocked() {
  return [
    {
      achievementId: "streak_7",
      triggeredBy: "连续使用了7天",
      unlockedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
    {
      achievementId: "tool_collector",
      triggeredBy: "今天打开了 23 个不同应用",
      unlockedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    },
    {
      achievementId: "holiday_worker",
      triggeredBy: "元旦那天打开了钉钉",
      unlockedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
    },
  ];
}

function getMockAchievements() {
  return ACHIEVEMENT_DEFS.map((def, i) => ({
    ...def,
    unlocked: i < 3,
    unlockedAt: i < 3 ? new Date(Date.now() - i * 5 * 24 * 3600 * 1000) : null,
    triggeredBy: i < 3 ? "已解锁" : null,
  }));
}
