import { NextRequest, NextResponse } from "next/server";
import { getSessionsByDate } from "@/lib/db/queries/app-sessions";
import { isConnected } from "@/lib/db/client";

// GET /api/sessions?date=YYYY-MM-DD
// 返回叙事时间轴所需的会话序列
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  try {
    // 如果数据库未连接，返回模拟数据
    if (!isConnected) {
      return NextResponse.json({ sessions: generateMockTimeline(date) });
    }

    const sessions = await getSessionsByDate(date);

    if (sessions.length === 0) {
      return NextResponse.json({ sessions: generateMockTimeline(date) });
    }

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ sessions: generateMockTimeline(date) });
  }
}

function generateMockTimeline(date: string) {
  const base = new Date(date);
  const timeline = [
    { appName: "开机", processName: "system", startTime: new Date(base.getTime()).setHours(9, 5), durationSeconds: 60, category: "system", isIdle: false },
    { appName: "微信", processName: "WeChat", startTime: new Date(base.getTime()).setHours(9, 6), durationSeconds: 840, category: "social", isIdle: false },
    { appName: "Word", processName: "WINWORD", startTime: new Date(base.getTime()).setHours(9, 20), durationSeconds: 7440, category: "work", isIdle: false },
    { appName: "Chrome", processName: "chrome", startTime: new Date(base.getTime()).setHours(11, 24), durationSeconds: 1200, category: "tool", isIdle: false },
    { appName: "微信", processName: "WeChat", startTime: new Date(base.getTime()).setHours(11, 44), durationSeconds: 300, category: "social", isIdle: false },
    { appName: "外卖平台", processName: "takeout", startTime: new Date(base.getTime()).setHours(12, 0), durationSeconds: 480, category: "other", isIdle: false },
    { appName: "午休离开", processName: "idle", startTime: new Date(base.getTime()).setHours(12, 8), durationSeconds: 4200, category: "idle", isIdle: true },
    { appName: "腾讯会议", processName: "wemeet", startTime: new Date(base.getTime()).setHours(13, 18), durationSeconds: 5400, category: "work", isIdle: false },
    { appName: "VS Code", processName: "Code", startTime: new Date(base.getTime()).setHours(14, 48), durationSeconds: 12240, category: "work", isIdle: false },
    { appName: "微信", processName: "WeChat", startTime: new Date(base.getTime()).setHours(18, 12), durationSeconds: 360, category: "social", isIdle: false },
    { appName: "哔哩哔哩", processName: "bilibili", startTime: new Date(base.getTime()).setHours(20, 0), durationSeconds: 3600, category: "entertainment", isIdle: false },
    { appName: "VS Code", processName: "Code", startTime: new Date(base.getTime()).setHours(21, 0), durationSeconds: 5400, category: "work", isIdle: false },
    { appName: "网易云音乐", processName: "cloudmusic", startTime: new Date(base.getTime()).setHours(22, 30), durationSeconds: 1800, category: "entertainment", isIdle: false },
  ];
  return timeline;
}
