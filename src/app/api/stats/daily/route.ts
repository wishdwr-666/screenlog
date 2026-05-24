import { NextRequest, NextResponse } from "next/server";
import { getHourlyActivity, getAppTotals, getDailyStat } from "@/lib/db/queries/app-sessions";
import { generateDailyStatForDate, generateRecentStats } from "@/lib/mock-data";
import { isConnected } from "@/lib/db/client";

// GET /api/stats/daily?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const mode = searchParams.get("mode") ?? "today"; // today | week | heatmap

  try {
    // 如果数据库未连接，直接返回模拟数据
    if (!isConnected) {
      if (mode === "heatmap") {
        const days = parseInt(searchParams.get("days") ?? "14", 10);
        const heatmapData: Record<string, number[]> = {};
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dt = d.toISOString().split("T")[0];
          heatmapData[dt] = generateMockHeatmapHourly();
        }
        return NextResponse.json({ heatmap: heatmapData });
      }
      if (mode === "week") {
        return NextResponse.json({ stats: generateRecentStats(7) });
      }
      const mockStat = generateDailyStatForDate(date);
      return NextResponse.json({
        stat: mockStat,
        appTotals: getMockAppTotals(mockStat.totalSeconds ?? 28800),
        date,
      });
    }

    if (mode === "heatmap") {
      const days = parseInt(searchParams.get("days") ?? "14", 10);
      const heatmapData: Record<string, number[]> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dt = d.toISOString().split("T")[0];
        const hourly = await getHourlyActivity(dt);
        if (hourly.every((v) => v === 0)) {
          heatmapData[dt] = generateMockHeatmapHourly();
        } else {
          heatmapData[dt] = hourly;
        }
      }
      return NextResponse.json({ heatmap: heatmapData });
    }

    if (mode === "week") {
      const stats = generateRecentStats(7);
      return NextResponse.json({ stats });
    }

    let stat = await getDailyStat(date);
    const appTotals = await getAppTotals(date);

    if (!stat) {
      stat = generateDailyStatForDate(date) as any;
    }

    return NextResponse.json({
      stat,
      appTotals: appTotals.length > 0 ? appTotals : getMockAppTotals(stat?.totalSeconds ?? 28800),
      date,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    const mockStat = generateDailyStatForDate(date);
    return NextResponse.json({
      stat: mockStat,
      appTotals: getMockAppTotals(mockStat.totalSeconds ?? 28800),
      date,
    });
  }
}

function generateMockHeatmapHourly(): number[] {
  return new Array(24).fill(0).map((_, h) => {
    if (h >= 9 && h <= 22) return Math.floor(Math.random() * 3600);
    if (h >= 0 && h <= 3) return Math.floor(Math.random() * 600);
    return 0;
  });
}

function getMockAppTotals(totalSeconds: number) {
  return [
    { appName: "微信", processName: "WeChat", category: "social", totalSeconds: Math.floor(totalSeconds * 0.28), sessionCount: 47 },
    { appName: "VS Code", processName: "Code", category: "work", totalSeconds: Math.floor(totalSeconds * 0.22), sessionCount: 8 },
    { appName: "Chrome", processName: "chrome", category: "tool", totalSeconds: Math.floor(totalSeconds * 0.18), sessionCount: 24 },
    { appName: "腾讯会议", processName: "wemeet", category: "work", totalSeconds: Math.floor(totalSeconds * 0.12), sessionCount: 3 },
    { appName: "网易云音乐", processName: "cloudmusic", category: "entertainment", totalSeconds: Math.floor(totalSeconds * 0.08), sessionCount: 2 },
    { appName: "哔哩哔哩", processName: "bilibili", category: "entertainment", totalSeconds: Math.floor(totalSeconds * 0.07), sessionCount: 5 },
    { appName: "设置", processName: "Settings", category: "other", totalSeconds: Math.floor(totalSeconds * 0.05), sessionCount: 12 },
  ];
}
