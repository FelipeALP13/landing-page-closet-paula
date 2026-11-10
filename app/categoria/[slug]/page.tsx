import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Storefront } from "@/components/storefront";
import { getCategory } from "@/lib/categories";
import { getStoreData } from "@/lib/store-data";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return {
    title: `${category.label} | Closet Paula Miranda`,
    description: `${category.description} Consulte valores e disponibilidade pelo WhatsApp.`,
    alternates: { canonical: `/categoria/${category.slug}` },
    openGraph: { title: `${category.label} | Closet Paula Miranda`, description: category.description, images: [category.image] },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const data = await getStoreData();
  return <Storefront {...data} mode="category" categorySlug={slug} />;
}
