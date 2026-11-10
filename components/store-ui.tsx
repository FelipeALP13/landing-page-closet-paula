import Link from "next/link";
import { getCategory } from "@/lib/categories";
import type { StoreProduct } from "@/lib/store-data";
import { formatPrice, productPath, whatsappLink } from "@/lib/store-info";

type ProductCardProps = { product: StoreProduct; selected: boolean; onToggle: (id: string) => void; sizes: string };

export function ProductCard({ product, selected, onToggle, sizes }: ProductCardProps) {
  return (
    <article className="product-card">
      <div>
        <Link href={productPath(product.id)} className="product-card-image" tabIndex={-1} aria-hidden="true"><ResponsiveImage src={product.imageUrl} sizes={sizes} alt="" /></Link>
        <span>{product.tag}</span>
        <button onClick={() => onToggle(product.id)} aria-pressed={selected} aria-label={`${selected ? "Remover" : "Adicionar"} ${product.name} ${selected ? "da" : "à"} seleção`}>{selected ? "♥" : "♡"}</button>
      </div>
      <small>{getCategory(product.category)?.label}</small>
      <h3><Link href={productPath(product.id)}>{product.name}</Link></h3>
      <p>{formatPrice(product.price)}</p>
      <a href={whatsappLink(`Olá! Gostei de uma peça no site: ${product.name} (${product.sku}). Poderia me informar ${product.price ? "" : "o valor, "}as medidas e se ela está disponível?`)} target="_blank" rel="noopener noreferrer">Consultar no WhatsApp <ExternalArrow /></a>
    </article>
  );
}

export function ResponsiveImage({ src, sizes, alt, eager = false }: { src: string; sizes: string; alt: string; eager?: boolean }) {
  // As fotos da pasta /assets têm versão de 480 px; imagens enviadas pelo painel usam só o arquivo original.
  const small = src.match(/^(\/assets\/look-\d+)-960\.webp$/)?.[1];
  return <img src={src} srcSet={small ? `${small}-480.webp 480w, ${src} 960w` : undefined} sizes={small ? sizes : undefined} alt={alt} loading={eager ? undefined : "lazy"} decoding="async" />;
}

export function ExternalArrow() {
  return <svg className="external-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>;
}
