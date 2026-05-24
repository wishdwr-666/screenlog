import { NextRequest, NextResponse } from "next/server";
import { isConnected } from "@/lib/db/client";
import { wallpaperHistory } from "@/lib/db/schema/app-sessions";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  if (!isConnected) {
    return NextResponse.json({ wallpaper: null, history: [] });
  }

  try {
    const { db } = await import("@/lib/db/client");
    
    if (!db) {
      return NextResponse.json({ wallpaper: null, history: [] });
    }

    const history = await db
      .select()
      .from(wallpaperHistory)
      .orderBy(desc(wallpaperHistory.usedAt))
      .limit(50);

    return NextResponse.json({
      wallpaper: null,
      history,
    });
  } catch {
    return NextResponse.json({ wallpaper: null, history: [] });
  }
}

export async function POST(request: NextRequest) {
  if (!isConnected) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.json();
  const { url, key, opacity, blur, name, skipHistory } = body as {
    url?: string;
    key?: string;
    opacity?: number;
    blur?: number;
    name?: string;
    skipHistory?: boolean;
  };

  try {
    const { db } = await import("@/lib/db/client");
    
    if (!db) {
      return NextResponse.json({ ok: true });
    }

    if (url && !skipHistory) {
      const existing = await db
        .select({ id: wallpaperHistory.id })
        .from(wallpaperHistory)
        .where(eq(wallpaperHistory.url, url))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(wallpaperHistory)
          .set({ usedAt: new Date() })
          .where(eq(wallpaperHistory.id, existing[0].id));
      } else {
        await db.insert(wallpaperHistory).values({
          userId: "local-user",
          url,
          key: key ?? null,
          name: name ?? "壁纸",
          usedAt: new Date(),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}