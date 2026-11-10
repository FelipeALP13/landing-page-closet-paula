import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Storefront } from "@/components/storefront";
import { getCategory } from "@/lib/categories";
import { getRequestOrigin } from "@/lib/request-origin";
import { getProduct } from "@/lib/store-data";
import { parsePrice, priceView, productPath, storeName } from "@/lib/store-info";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const { product, content } = await getProduct(safeDecode(id));
  if (!product) return { title: "Peça não encontrada | Closet Paula Miranda" };
  const title = `${product.name} | Closet Paula Miranda`;
  const status = product.soldOut ? "Esgotada no momento" : priceView(product, content.showPrices === "1").current;
  const description = `${product.description} ${status}. Atendimento pelo WhatsApp e retirada em São José dos Campos.`;
  return {
    title,
    description,
    alternates: { canonical: productPath(product.id) },
    openGraph: { title, description, images: [{ url: product.imageUrl, alt: product.name }], type: "website" },
  };
}

export default async function ProductPage({ params }: Params) {
  const { id } = await params;
  const { product, products, content } = await getProduct(safeDecode(id));
  if (!product) notFound();
  const origin = await getRequestOrigin();

  // Dados estruturados para o Google. O preço só entra se a loja mostra preços e o valor é numérico.
  const showPrices = content.showPrices === "1";
  const price = showPrices ? parsePrice(product.onSale && product.salePrice.trim() ? product.salePrice : product.price) : null;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    category: getCategory(product.category)?.label,
    image: [product.imageUrl, ...product.gallery].map(url => `${origin}${url}`),
    brand: { "@type": "Brand", name: storeName },
    ...(price !== null && {
      offers: { "@type": "Offer", price: price.toFixed(2), priceCurrency: "BRL", availability: product.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", url: `${origin}${productPath(product.id)}` },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }} />
      <Storefront content={content} products={products} mode="product" productId={product.id} origin={origin} />
    </>
  );
}
