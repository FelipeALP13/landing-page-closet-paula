import { Storefront } from "@/components/storefront";
import { campaignStatus } from "@/lib/campaign";
import { getStoreData } from "@/lib/store-data";
import { resolveStoreInfo } from "@/lib/store-info";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getStoreData();
  const info = resolveStoreInfo(data.content);
  // "São José dos Campos — SP" → cidade e estado separados.
  const [city, region] = info.cityLine.split(/\s[—–-]\s/);

  // Dados estruturados para o Google mostrar endereço e contato da loja.
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: info.name,
    image: data.content.storeImage,
    telephone: `+${info.whatsappNumber}`,
    address: { "@type": "PostalAddress", streetAddress: info.addressLine, addressLocality: city, ...(region && { addressRegion: region }), addressCountry: "BR" },
    sameAs: [info.instagramUrl, info.facebookUrl].filter(Boolean),
    ...(info.email && { email: info.email }),
    ...(info.legalName && { legalName: info.legalName }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness).replace(/</g, "\\u003c") }} />
      <Storefront {...data} mode="home" showCampaign={campaignStatus(data.content) === "live"} />
    </>
  );
}
