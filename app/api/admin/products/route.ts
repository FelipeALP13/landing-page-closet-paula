import { NextResponse } from "next/server";
import { getMasterUser } from "@/app/admin-auth";
import { getCategory } from "@/lib/categories";
import { deleteProduct, reorderProducts, saveProduct, type StoreProduct } from "@/lib/store-data";
import { isSiteImage } from "@/lib/site-image";
import { productSizes } from "@/lib/store-info";

// O id vira o endereço da peça (/produto/id), então só letras minúsculas, números e hífen.
function isProductId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
}

export async function PUT(request: Request) {
  const user = await getMasterUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const product = await request.json() as Partial<StoreProduct>;
  if (!isProductId(product.id) || !product.name || !getCategory(String(product.category)) || !isSiteImage(product.imageUrl)) return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  const detailsSaved = await saveProduct({
    id: product.id,
    sku: String(product.sku ?? "").slice(0, 40),
    name: String(product.name).slice(0, 160),
    category: String(product.category),
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
    onSale: Boolean(product.onSale),
    salePrice: String(product.salePrice ?? "").trim().slice(0, 40),
    soldOut: Boolean(product.soldOut),
  }, user.userId);
  return NextResponse.json({ ok: true, detailsSaved });
}

export async function DELETE(request: Request) {
  const user = await getMasterUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!isProductId(id)) return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
}

// Recebe a lista de ids na nova ordem.
export async function PATCH(request: Request) {
  const user = await getMasterUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { ids } = await request.json() as { ids?: unknown };
  if (!Array.isArray(ids) || ids.length > 500 || !ids.every(isProductId)) return NextResponse.json({ error: "invalid_order" }, { status: 400 });
  await reorderProducts(ids, user.userId);
  return NextResponse.json({ ok: true });
}
