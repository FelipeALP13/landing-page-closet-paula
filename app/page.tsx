import { Storefront } from "@/components/storefront";
import { getStoreData } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getStoreData();
  return <Storefront {...data} mode="home" />;
}
