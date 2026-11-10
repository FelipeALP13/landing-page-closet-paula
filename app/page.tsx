import { Storefront } from "@/components/storefront";
import { campaignStatus } from "@/lib/campaign";
import { getStoreData } from "@/lib/store-data";
import { storeInfo } from "@/lib/store-info";

export const dynamic = "force-dynamic";

// Dados estruturados para o Google mostrar endereço, horário e contato da loja.
const localBusiness = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: storeInfo.name,
  image: "/assets/look-11-960.webp",
  telephone: `+${storeInfo.whatsappNumber}`,
  address: { "@type": "PostalAddress", streetAddress: storeInfo.addressLine, addressLocality: "São José dos Campos", addressRegion: "SP", addressCountry: "BR" },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "15:00" },
  ],
  sameAs: [storeInfo.instagramUrl, storeInfo.facebookUrl],
};

export default async function Home() {
  const data = await getStoreData();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness).replace(/</g, "\\u003c") }} />
      <Storefront {...data} mode="home" showCampaign={campaignStatus(data.content) === "live"} />
    </>
  );
}
