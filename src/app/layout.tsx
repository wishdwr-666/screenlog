import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/utils/utils";
import { Toaster } from "@/components/ui/sonner";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { WallpaperProvider } from "@/components/wallpaper/WallpaperProvider";
import { UIEffectsProvider } from "@/components/ui-effects/UIEffectsProvider";

const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: "ScreenLog — Quiet Observer",
  description: "记录你用了什么、用了多久，用有趣的可视化让数据好玩起来。",
  openGraph: {
    title: "ScreenLog",
    description: "ScreenLog 是一个纯本地的电脑使用时间观察工具，不设目标、不弹提醒、不评判。自动采集前台应用使用时长，通过热力图、河流图和叙事时间轴三种视角呈现你的使用习惯。生成冷幽默式每日/每周文案总结，解锁基于已发生行为的趣味成就徽章。所有数据本地存储，支持离线导出 HTML/PDF 报告。让你像翻手...",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ScreenLog",
    description: "ScreenLog 是一个纯本地的电脑使用时间观察工具，不设目标、不弹提醒、不评判。自动采集前台应用使用时长，通过热力图、河流图和叙事时间轴三种视角呈现你的使用习惯。生成冷幽默式每日/每周文案总结，解锁基于已发生行为的趣味成就徽章。所有数据本地存储，支持离线导出 HTML/PDF 报告。让你像翻手...",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("h-full antialiased")}>
      <body className="min-h-svh flex flex-col md:flex-row bg-[var(--app-bg)]">
        <WallpaperProvider>
          <UIEffectsProvider>
          {/* 桌面侧边栏导航（md+显示） */}
          <SidebarNav />
          {/* 主内容区 */}
          <main className="flex-1 min-h-svh md:ml-56 relative">
            {children}
          </main>
          <Toaster />
          </UIEffectsProvider>
        </WallpaperProvider>
      </body>
    </html>
  );
}
