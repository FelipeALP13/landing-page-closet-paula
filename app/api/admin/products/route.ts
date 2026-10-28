import { NextResponse } from "next/server";
import { getMasterUser } from "@/app/admin-auth";
import { saveProduct, type StoreProduct } from "@/lib/store-data";

export async function PUT(request: Request) {
  const user = await getMasterUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const product = await request.json() as StoreProduct;
  if (!product.id || !product.name || !product.category || !product.imageUrl) return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  await saveProduct({
    ...product,
    id: String(product.id).slice(0, 80),
    sku: String(product.sku).slice(0, 40),
    name: String(product.name).slice(0, 160),
    category: String(product.category).slice(0, 40),
    tag: String(product.tag).slice(0, 80),
    description: String(product.description).slice(0, 800),
    imageUrl: String(product.imageUrl).slice(0, 500),
    keywords: String(product.keywords).slice(0, 500),
    occasions: Array.isArray(product.occasions) ? product.occasions.map(String).slice(0, 10) : [],
    sortOrder: Number.isFinite(product.sortOrder) ? product.sortOrder : 0,
    active: Boolean(product.active),
  }, user.userId);
  return NextResponse.json({ ok: true });
}
