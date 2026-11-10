import { NextResponse } from "next/server";
import { getMasterUser } from "@/app/admin-auth";
import { saveProduct, type StoreProduct } from "@/lib/store-data";
import { productSizes } from "@/lib/store-info";

// Só aceita imagens do próprio site: fotos fixas (/assets) ou enviadas pelo painel (/media).
function isSiteImage(value: unknown): value is string {
  return typeof value === "string" && /^\/(assets|media)\/[\w./-]+$/.test(value) && !value.includes("..");
}

export async function PUT(request: Request) {
  const user = await getMasterUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const product = await request.json() as Partial<StoreProduct>;
  if (!product.id || !product.name || !product.category || !isSiteImage(product.imageUrl)) return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  const detailsSaved = await saveProduct({
    id: String(product.id).slice(0, 80),
    sku: String(product.sku ?? "").slice(0, 40),
    name: String(product.name).slice(0, 160),
    category: String(product.category).slice(0, 40),
    tag: String(product.tag ?? "").slice(0, 80),
    description: String(product.description ?? "").slice(0, 800),
    imageUrl: product.imageUrl.slice(0, 500),
    keywords: String(product.keywords ?? "").slice(0, 500),
    occasions: Array.isArray(product.occasions) ? product.occasions.map(String).slice(0, 10) : [],
    sortOrder: Number.isFinite(product.sortOrder) ? Number(product.sortOrder) : 0,
    active: Boolean(product.active),
    price: String(product.price ?? "").trim().slice(0, 40),
    sizes: Array.isArray(product.sizes) ? productSizes.filter(size => product.sizes!.includes(size)) : [],
    gallery: Array.isArray(product.gallery) ? product.gallery.filter(isSiteImage).slice(0, 8) : [],
    details: String(product.details ?? "").slice(0, 2000),
  }, user.userId);
  return NextResponse.json({ ok: true, detailsSaved });
}
