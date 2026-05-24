import { NextRequest, NextResponse } from "next/server";
import { isConnected } from "@/lib/db/client";
import { getDefaultLabels } from "@/lib/mock-data";

export async function GET() {
  if (!isConnected) {
    return NextResponse.json({ labels: getDefaultLabels() });
  }

  try {
    const { getAllLabels } = await import("@/lib/db/queries/app-sessions");
    const labels = await getAllLabels();
    if (labels.length === 0) {
      return NextResponse.json({ labels: getDefaultLabels() });
    }
    return NextResponse.json({ labels });
  } catch {
    return NextResponse.json({ labels: getDefaultLabels() });
  }
}

export async function POST(req: NextRequest) {
  if (!isConnected) {
    return NextResponse.json({ error: "数据库不可用" }, { status: 503 });
  }

  try {
    const { upsertLabel } = await import("@/lib/db/queries/app-sessions");
    const body = await req.json();
    const result = await upsertLabel({
      processName: body.processName,
      appName: body.appName,
      category: body.category,
      isProductivity: body.isProductivity ?? false,
      isBlackhole: body.isBlackhole ?? false,
    });
    return NextResponse.json({ label: result[0] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
