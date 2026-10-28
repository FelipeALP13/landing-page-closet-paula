import { NextResponse } from "next/server";
import { getMasterUser } from "@/app/admin-auth";
import { saveContent, type StoreContent } from "@/lib/store-data";

export async function PUT(request: Request) {
  const user = await getMasterUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const values = await request.json() as Partial<StoreContent>;
  await saveContent(values, user.userId);
  return NextResponse.json({ ok: true });
}
