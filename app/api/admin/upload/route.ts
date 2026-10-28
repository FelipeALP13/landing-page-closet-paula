import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getMasterUser } from "@/app/admin-auth";

const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(request: Request) {
  const user = await getMasterUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!env.BUCKET) return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  const productId = String(form.get("productId") || "product").replace(/[^a-z0-9-]/gi, "").slice(0, 60);
  if (!(file instanceof File) || !types[file.type] || file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  const key = `products/${productId}-${Date.now()}.${types[file.type]}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" }, customMetadata: { uploadedBy: user.userId } });
  return NextResponse.json({ url: `/media/${key}` });
}
