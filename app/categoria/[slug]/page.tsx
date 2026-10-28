import { notFound } from "next/navigation";
import { Storefront } from "@/components/storefront";
import { getCategory } from "@/lib/categories";
import { getStoreData } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const data = await getStoreData();
  return <Storefront {...data} mode="category" categorySlug={slug} />;
}
