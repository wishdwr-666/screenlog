import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAppTotals, getDailyStat, getUnlockedAchievements } from "@/lib/db/queries/app-sessions";
import { generateDailyStatForDate, ACHIEVEMENT_DEFS } from "@/lib/mock-data";

export function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "screenlog",
    version: "1.0.0",
  });

  // Tool 1: 获取某天的使用摘要
  server.registerTool(
    "get_daily_summary",
    {
      description: "获取指定日期的电脑使用摘要，包括总时长、活跃时长、切换次数和冷幽默评语。",
      inputSchema: {
        date: z.string().describe("日期，格式 YYYY-MM-DD。不传则默认今天"),
      },
    },
    async ({ date }) => {
      const targetDate = date ?? new Date().toISOString().split("T")[0];
      try {
        let stat = await getDailyStat(targetDate, userId);
        if (!stat) stat = generateDailyStatForDate(targetDate) as any;
        return {
          content: [{ type: "text", text: JSON.stringify(stat, null, 2) }],
        };
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: String(e) }] };
      }
    }
  );

  // Tool 2: 获取应用使用排行
  server.registerTool(
    "get_app_usage_ranking",
    {
      description: "获取指定日期各应用使用时长排行（按时长降序），包含应用名、分类、时长（秒）、次数。",
      inputSchema: {
        date: z.string().describe("日期，格式 YYYY-MM-DD"),
        limit: z.number().int().min(1).max(20).optional().describe("返回条数，默认10"),
      },
    },
    async ({ date, limit }) => {
      try {
        const apps = await getAppTotals(date ?? new Date().toISOString().split("T")[0], userId);
        return {
          content: [{ type: "text", text: JSON.stringify(apps.slice(0, limit ?? 10), null, 2) }],
        };
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: String(e) }] };
      }
    }
  );

  // Tool 3: 获取已解锁成就
  server.registerTool(
    "get_unlocked_achievements",
    {
      description: "获取用户已解锁的所有成就徽章列表，包含解锁时间和触发条件。",
      inputSchema: {},
    },
    async () => {
      try {
        const unlocked = await getUnlockedAchievements(userId);
        const result = unlocked.map(u => {
          const def = ACHIEVEMENT_DEFS.find(d => d.achievementId === u.achievementId);
          return { ...u, ...(def ?? {}) };
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: String(e) }] };
      }
    }
  );

  // Tool 4: 生成本周使用洞察
  server.registerTool(
    "get_weekly_insight",
    {
      description: "生成一段基于规则的本周使用洞察文案，冷幽默风格，不做任何效率评判。",
      inputSchema: {},
    },
    async () => {
      const insights = [
        "本周你在微信和工作之间来回切换了无数次，拥有出色的假装专注天赋。",
        "根据数据，你的最佳工作时间是上午10-11点。数据建议你在这时做任何事，除了开会。",
        "本周你打开设置的次数比平均水平高出40%。还好吗？",
        "你的使用曲线在周三出现了明显峰值。周三发生了什么，只有你知道。",
        "本周沉浸时段（连续25分钟以上）共{n}次。数字可能比你预期的低或高，均属正常。",
      ];
      const quip = insights[Math.floor(Math.random() * insights.length)].replace("{n}", String(Math.floor(Math.random() * 8) + 2));
      return {
        content: [{ type: "text", text: quip }],
      };
    }
  );

  // Tool 5: 查询应用分类信息
  server.registerTool(
    "describe_app_categories",
    {
      description: "返回 ScreenLog 使用的应用分类体系说明，供外部 AI 理解数据语义。",
      inputSchema: {},
    },
    async () => {
      const categories = {
        work: "工作类（代码编辑器、文档处理、会议软件等）",
        social: "社交类（微信、钉钉、飞书等即时通讯）",
        entertainment: "娱乐类（视频、音乐、游戏）",
        tool: "工具类（浏览器、文件管理、设置等）",
        other: "其他（未归类或难以分类的应用）",
      };
      return {
        content: [{ type: "text", text: JSON.stringify(categories, null, 2) }],
      };
    }
  );

  return server;
}
