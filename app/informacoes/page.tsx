import type { Metadata } from "next";
import { Storefront } from "@/components/storefront";
import { getStoreData } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compra, trocas e privacidade | Closet Paula Miranda",
  description: "Como funciona a compra pelo WhatsApp, trocas, direito de arrependimento e privacidade na Closet Paula Miranda.",
  alternates: { canonical: "/informacoes" },
};

export default async function InfoPage() {
  const data = await getStoreData();
  return <Storefront {...data} mode="info" />;
}
