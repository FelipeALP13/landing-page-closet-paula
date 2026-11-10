import { NextResponse } from "next/server";
import { getMasterUser } from "@/app/admin-auth";
import { getCategory } from "@/lib/categories";
import { env } from "cloudflare:workers";
import { deleteProduct, productExists, reorderProducts, saveProduct, type StoreProduct } from "@/lib/store-data";
import { productSizes } from "@/lib/store-info";
import { isProductId, isSiteImage } from "@/lib/validation";

export async function PUT(request: Request) {
  const user = await getMasterUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const product = await request.json() as Partial<StoreProduct> & { isNew?: boolean };
  if (!isProductId(product.id) || !product.name || !getCategory(String(product.category)) || !isSiteImage(product.imageUrl)) return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  // Peça nova nunca sobrescreve outra com o mesmo endereço; o painel tenta de novo com outro final.
  if (product.isNew && await productExists(product.id)) return NextResponse.json({ error: "id_taken" }, { status: 409 });
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
  const photos = await deleteProduct(id);
  // Apaga do armazenamento as fotos que foram enviadas pelo painel para esta peça.
  if (env.BUCKET) {
    const keys = photos.filter(url => url.startsWith("/media/")).map(url => url.slice("/media/".length));
    await Promise.all(keys.map(key => env.BUCKET!.delete(key).catch(error => console.error("Photo not deleted", key, error))));
  }
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
