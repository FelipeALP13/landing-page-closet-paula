"use client";

import Link from "next/link";
import { useState } from "react";
import { getCategory } from "@/lib/categories";
import type { StoreProduct } from "@/lib/store-data";
import { formatPrice, productPath, productSizes, whatsappLink } from "@/lib/store-info";
import { ExternalArrow, ProductCard, ResponsiveImage } from "./store-ui";

type Props = {
  product: StoreProduct;
  related: StoreProduct[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  preferredSize: string;
  origin: string;
};

export function ProductDetail({ product, related, selectedIds, onToggle, preferredSize, origin }: Props) {
  const photos = [product.imageUrl, ...product.gallery];
  const [photoIndex, setPhotoIndex] = useState(0);
  const [chosenSize, setChosenSize] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  const category = getCategory(product.category);
  const knownSizes = product.sizes.length > 0;
  const isAvailable = (size: string) => !knownSizes || product.sizes.includes(size);
  // Usa o tamanho que a cliente já escolheu no site, se esta peça tiver esse tamanho.
  const size = chosenSize || (preferredSize && isAvailable(preferredSize) ? preferredSize : "");
  const selected = selectedIds.includes(product.id);
  const pageUrl = `${origin}${productPath(product.id)}`;

  const message = `Olá! Quero esta peça do site da Closet Paula Miranda:\n${product.name} (${product.sku})${size ? `\nTamanho: ${size}` : ""}\n${pageUrl}\n\nPoderia confirmar ${product.price ? "" : "o valor, "}a disponibilidade e as opções de entrega ou retirada?`;

  async function share() {
    const data = { title: `${product.name} | Closet Paula Miranda`, url: pageUrl };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(pageUrl);
      setShareStatus("Link copiado!");
    } catch (error) {
      if ((error as Error).name !== "AbortError") setShareStatus("Não foi possível compartilhar. Copie o endereço da página.");
    }
  }

  return (
    <>
      <nav className="breadcrumb" aria-label="Você está em">
        <Link href="/">Início</Link><span aria-hidden="true">/</span>
        {category && <><Link href={`/categoria/${category.slug}`}>{category.label}</Link><span aria-hidden="true">/</span></>}
        <span aria-current="page">{product.name}</span>
      </nav>

      <section className="product-detail">
        <div className="product-gallery">
          <div className="product-main-photo">
            <ResponsiveImage src={photos[photoIndex]} sizes="(max-width: 860px) 100vw, 55vw" alt={`${product.name}${photos.length > 1 ? ` — foto ${photoIndex + 1} de ${photos.length}` : ""}`} eager />
            <span>{product.tag}</span>
          </div>
          {photos.length > 1 && (
            <div className="product-thumbs" role="group" aria-label="Fotos da peça">
              {photos.map((photo, index) => <button key={photo + index} className={index === photoIndex ? "active" : ""} aria-pressed={index === photoIndex} aria-label={`Ver foto ${index + 1}`} onClick={() => setPhotoIndex(index)}><ResponsiveImage src={photo} sizes="90px" alt="" /></button>)}
            </div>
          )}
        </div>

        <div className="product-info">
          <p className="eyebrow">{category?.label}</p>
          <h1>{product.name}</h1>
          <p className="product-price">{formatPrice(product.price)}</p>
          <p className="product-description">{product.description}</p>

          <div className="product-sizes">
            <h2 id="tamanhos-label">Tamanho{size && <span>: {size}</span>}</h2>
            <div role="group" aria-labelledby="tamanhos-label">
              {productSizes.map(value => <button key={value} className={size === value ? "active" : ""} aria-pressed={size === value} disabled={!isAvailable(value)} aria-label={isAvailable(value) ? value : `${value} (indisponível)`} onClick={() => setChosenSize(value)}>{value}</button>)}
            </div>
            <small>{knownSizes ? "Tamanhos riscados estão esgotados no momento." : "A equipe confirma modelagem, medidas e disponibilidade."}</small>
          </div>

          <div className="product-actions">
            <a className="button whatsapp" href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">Quero esta peça <ExternalArrow /></a>
            <button className="button outline" onClick={() => onToggle(product.id)} aria-pressed={selected}>{selected ? "♥ Na sua seleção" : "♡ Adicionar à seleção"}</button>
          </div>
          <button className="share-button" onClick={share}>Compartilhar esta peça</button>
          {shareStatus && <p className="share-status" role="status">{shareStatus}</p>}

          {product.details && <div className="product-details-text"><h2>Detalhes da peça</h2><p>{product.details}</p></div>}

          <ul className="product-perks">
            <li>Atendimento humano pelo WhatsApp</li>
            <li>Retirada na loja em São José dos Campos</li>
            <li>Envio combinado com a equipe</li>
            <li><Link href="/informacoes#trocas">Trocas e direito de arrependimento</Link></li>
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section className="products-section related-products">
          <div className="section-head"><div><p className="eyebrow">Vitrine CPM</p><h2>Combina com você</h2></div><p>Outras peças da coleção para completar o look.</p></div>
          <div className="product-grid">{related.map(item => <ProductCard key={item.id} product={item} selected={selectedIds.includes(item.id)} onToggle={onToggle} sizes="(max-width: 680px) 50vw, 25vw" />)}</div>
        </section>
      )}
    </>
  );
}
