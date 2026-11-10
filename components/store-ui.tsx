import Link from "next/link";
import { isExternalLink } from "@/lib/campaign";
import { getCategory } from "@/lib/categories";
import type { CustomerPhoto } from "@/lib/customer-photos";
import type { StoreProduct } from "@/lib/store-data";
import { priceView, productBadge, productPath, productWhatsappMessage, whatsappLink, type PriceView } from "@/lib/store-info";

type ProductCardProps = { product: StoreProduct; selected: boolean; onToggle: (id: string) => void; sizes: string; whatsappNumber: string; showPrices: boolean };

export function ProductCard({ product, selected, onToggle, sizes, whatsappNumber, showPrices }: ProductCardProps) {
  const badge = productBadge(product);
  return (
    <article className={`product-card${product.soldOut ? " sold-out" : ""}`}>
      <div>
        <Link href={productPath(product.id)} className="product-card-image" tabIndex={-1} aria-hidden="true"><ResponsiveImage src={product.imageUrl} sizes={sizes} alt="" /></Link>
        {badge && <span className={badge.className}>{badge.text}</span>}
        <button onClick={() => onToggle(product.id)} aria-pressed={selected} aria-label={`${selected ? "Remover" : "Adicionar"} ${product.name} ${selected ? "da" : "à"} seleção`}>{selected ? "♥" : "♡"}</button>
      </div>
      <small>{getCategory(product.category)?.label}</small>
      <h3><Link href={productPath(product.id)}>{product.name}</Link></h3>
      <PriceTag view={priceView(product, showPrices)} />
      <a data-track-product={product.id} href={whatsappLink(whatsappNumber, productWhatsappMessage(product, showPrices))} target="_blank" rel="noopener noreferrer">{product.soldOut ? "Avise-me quando voltar" : "Consultar no WhatsApp"} <ExternalArrow /></a>
    </article>
  );
}

// Preço (ou "Valor sob consulta"). Na promoção com preços visíveis, mostra "de" riscado e "por".
export function PriceTag({ view, className = "" }: { view: PriceView; className?: string }) {
  if (!view.original) return <p className={className}>{view.current}</p>;
  return <p className={`${className} price-sale`}><s aria-label={`De ${view.original}`}>{view.original}</s> <strong aria-label={`por ${view.current}`}>{view.current}</strong></p>;
}

// Seção "Elas usam": clientes reais usando peças da loja (fotos enviadas pela dona, com autorização).
export function CustomerGallery({ photos, instagramUrl }: { photos: CustomerPhoto[]; instagramUrl: string }) {
  return (
    <section className="customer-gallery" aria-labelledby="elas-usam-titulo">
      <div className="section-head">
        <div><p className="eyebrow">Clientes reais</p><h2 id="elas-usam-titulo">Elas usam</h2></div>
        <p>Clientes da Closet Paula Miranda com as peças da loja.{instagramUrl && <> Veja mais no <a href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram <ExternalArrow /></a></>}</p>
      </div>
      <ul>
        {photos.map((photo, index) => (
          <li key={photo.image + index}>
            <ResponsiveImage src={photo.image} sizes="(max-width: 680px) 70vw, 25vw" alt={photo.caption ? `Cliente da loja: ${photo.caption}` : "Cliente usando peça da Closet Paula Miranda"} />
            {photo.caption && <span>{photo.caption}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

type CampaignProps = { title: string; text: string; button: string; link: string; image: string };

// Banner de campanha da página inicial (configurado no painel, com datas de início e fim).
export function CampaignBanner({ title, text, button, link, image }: CampaignProps) {
  const external = isExternalLink(link);
  const cta = button && link
    ? external ? <a className="button dark" href={link} target="_blank" rel="noopener noreferrer">{button} <ExternalArrow /></a>
      : <Link className="button dark" href={link}>{button}</Link>
    : null;
  return (
    <section className="campaign" aria-label={title}>
      {image && <ResponsiveImage src={image} sizes="(max-width: 680px) 100vw, 45vw" alt="" />}
      <div>
        <p className="eyebrow">Campanha</p>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
        {cta}
      </div>
    </section>
  );
}

export function ResponsiveImage({ src, sizes, alt, eager = false, priority = false }: { src: string; sizes: string; alt: string; eager?: boolean; priority?: boolean }) {
  // As fotos da pasta /assets têm versão de 480 px; imagens enviadas pelo painel usam só o arquivo original.
  const small = src.match(/^(\/assets\/look-\d+)-960\.webp$/)?.[1];
  return <img src={src} srcSet={small ? `${small}-480.webp 480w, ${src} 960w` : undefined} sizes={small ? sizes : undefined} alt={alt} loading={eager ? undefined : "lazy"} decoding="async" fetchPriority={priority ? "high" : undefined} />;
}

export function ExternalArrow() {
  return <svg className="external-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>;
}
