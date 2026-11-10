import type { Metadata } from "next";
import { Storefront } from "@/components/storefront";
import { hasSizeChart, parseSizeChart } from "@/lib/size-chart";
import { getStoreData } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getStoreData();
  const published = hasSizeChart(parseSizeChart(content.sizeChart));
  return {
    title: "Tabela de medidas | Closet Paula Miranda",
    description: "Medidas de busto, cintura e quadril de cada tamanho da Closet Paula Miranda.",
    alternates: { canonical: "/medidas" },
    // Sem tabela publicada, a página não deve aparecer no Google.
    ...(!published && { robots: { index: false, follow: true } }),
  };
}

export default async function SizesPage() {
  const data = await getStoreData();
  return <Storefront {...data} mode="sizes" />;
}
