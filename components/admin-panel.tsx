"use client";

import Link from "next/link";
import { useState } from "react";
import { categories } from "@/lib/categories";
import type { StoreContent, StoreProduct } from "@/lib/store-data";
import { productPath, productSizes } from "@/lib/store-info";

const maxGalleryPhotos = 8;

type Props = { content: StoreContent; products: StoreProduct[]; userName: string; signOutPath: string };

export function AdminPanel({ content: initialContent, products: initialProducts, userName, signOutPath }: Props) {
  const [content, setContent] = useState(initialContent);
  const [products, setProducts] = useState(initialProducts);
  const [status, setStatus] = useState("");

  async function savePhrases(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Salvando textos…");
    const response = await fetch("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(content) });
    setStatus(response.ok ? "Textos publicados com sucesso." : "Não foi possível salvar os textos.");
  }

  async function saveProduct(product: StoreProduct) {
    setStatus(`Salvando ${product.name}…`);
    const response = await fetch("/api/admin/products", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(product) });
    if (!response.ok) { setStatus(`Não foi possível atualizar ${product.name}.`); return; }
    const result = await response.json() as { detailsSaved?: boolean };
    setStatus(result.detailsSaved === false
      ? `${product.name} salvo, mas preço, tamanhos, detalhes e fotos extras não foram gravados: o banco ainda não tem a tabela product_details.`
      : `${product.name} atualizado.`);
  }

  // "main" troca a foto principal; "gallery" acrescenta uma foto extra.
  async function uploadImage(product: StoreProduct, target: "main" | "gallery", file?: File) {
    if (!file) return;
    if (target === "gallery" && product.gallery.length >= maxGalleryPhotos) { setStatus(`Cada produto pode ter até ${maxGalleryPhotos} fotos extras.`); return; }
    setStatus(`Enviando foto de ${product.name}…`);
    const body = new FormData();
    body.set("file", file);
    body.set("productId", product.id);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    if (!response.ok) { setStatus("Não foi possível enviar a imagem. Use JPG, PNG ou WebP de até 8 MB."); return; }
    const result = await response.json() as { url: string };
    const updated = target === "main" ? { ...product, imageUrl: result.url } : { ...product, gallery: [...product.gallery, result.url] };
    setProducts(current => current.map(item => item.id === product.id ? updated : item));
    await saveProduct(updated);
  }

  function updateProduct<K extends keyof StoreProduct>(id: string, field: K, value: StoreProduct[K]) {
    setProducts(current => current.map(product => product.id === id ? { ...product, [field]: value } : product));
  }

  function toggleSize(product: StoreProduct, size: string) {
    const sizes = product.sizes.includes(size) ? product.sizes.filter(item => item !== size) : [...product.sizes, size];
    updateProduct(product.id, "sizes", productSizes.filter(item => sizes.includes(item)));
  }

  return (
    <main className="admin-page">
      <header className="admin-header"><Link className="brand" href="/"><small>Closet</small><strong>Paula Miranda</strong></Link><div><span>Master: {userName}</span><Link href="/" target="_blank">Ver loja <AdminExternalArrow /></Link><a href={signOutPath} target="_top">Sair</a></div></header>
      <div className="admin-title"><p className="eyebrow">Painel master</p><h1>Edite a loja sem mexer no código.</h1><p>Altere cores, títulos, categorias e fotos. Créditos técnicos e a assinatura do desenvolvedor são protegidos e não aparecem neste painel.</p></div>
      {status && <output className="admin-status" aria-live="polite">{status}</output>}
      <section className="admin-section"><div><p className="eyebrow">01 / Aparência</p><h2>Cores e títulos</h2><p className="admin-help">Somente os campos comerciais autorizados podem ser alterados.</p></div><form className="content-form" onSubmit={savePhrases}>{editableContentKeys.map(key => { const value = content[key]; const isColor = colorContentKeys.has(key); return <label className={isColor ? "color-field" : undefined} key={key}><span>{contentLabels[key]}</span>{isColor ? <div><input type="color" value={value} onChange={event => setContent(current => ({ ...current, [key]: event.target.value }))} /><input value={value} pattern="#[0-9a-fA-F]{6}" onChange={event => setContent(current => ({ ...current, [key]: event.target.value }))} /></div> : value.length > 80 ? <textarea value={value} onChange={event => setContent(current => ({ ...current, [key]: event.target.value }))} /> : <input value={value} onChange={event => setContent(current => ({ ...current, [key]: event.target.value }))} />}</label>; })}<button className="button dark" type="submit">Salvar aparência e textos</button></form></section>
      <section className="admin-section products-admin"><div><p className="eyebrow">02 / Catálogo</p><h2>Fotos e produtos</h2></div><div className="admin-products">{products.map(product => (
        <article key={product.id}>
          <img src={product.imageUrl} alt="" />
          <div className="admin-product-fields">
            <label><span>Foto principal</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => uploadImage(product, "main", event.target.files?.[0])} /></label>
            <label><span>Nome</span><input value={product.name} onChange={event => updateProduct(product.id, "name", event.target.value)} /></label>
            <label><span>Categoria</span><select value={product.category} onChange={event => updateProduct(product.id, "category", event.target.value)}>{categories.map(category => <option key={category.slug} value={category.slug}>{category.label}</option>)}</select></label>
            <label><span>Chamada</span><input value={product.tag} onChange={event => updateProduct(product.id, "tag", event.target.value)} /></label>
            <label><span>Preço</span><input value={product.price} placeholder="Ex.: 189,90 (vazio = sob consulta)" onChange={event => updateProduct(product.id, "price", event.target.value)} /></label>
            <fieldset className="admin-sizes"><legend>Tamanhos disponíveis</legend><div>{productSizes.map(size => <label key={size}><input type="checkbox" checked={product.sizes.includes(size)} onChange={() => toggleSize(product, size)} />{size}</label>)}</div><small>Nenhum marcado = a equipe confirma pelo WhatsApp.</small></fieldset>
            <label className="wide"><span>Descrição curta</span><textarea value={product.description} onChange={event => updateProduct(product.id, "description", event.target.value)} /></label>
            <label className="wide"><span>Detalhes da peça (tecido, medidas, cuidados)</span><textarea value={product.details} placeholder={"Ex.: Tecido: viscose\nComprimento: 120 cm\nLavar à mão"} onChange={event => updateProduct(product.id, "details", event.target.value)} /></label>
            <div className="wide admin-gallery">
              <span>Fotos extras ({product.gallery.length}/{maxGalleryPhotos})</span>
              <div>{product.gallery.map(photo => <figure key={photo}><img src={photo} alt="" /><button type="button" aria-label="Remover foto" onClick={() => updateProduct(product.id, "gallery", product.gallery.filter(item => item !== photo))}>×</button></figure>)}</div>
              {product.gallery.length < maxGalleryPhotos && <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Adicionar foto extra" onChange={event => { uploadImage(product, "gallery", event.target.files?.[0]); event.target.value = ""; }} />}
            </div>
            <label className="active-field"><input type="checkbox" checked={product.active} onChange={event => updateProduct(product.id, "active", event.target.checked)} /><span>Produto visível na loja</span></label>
            <div className="wide admin-product-buttons"><button className="button dark" type="button" onClick={() => saveProduct(product)}>Salvar produto</button><Link className="button outline" href={productPath(product.id)} target="_blank">Ver página da peça <AdminExternalArrow /></Link></div>
          </div>
        </article>
      ))}</div></section>
    </main>
  );
}

function AdminExternalArrow() {
  return <svg className="external-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>;
}

const contentLabels: Record<string, string> = {
  heroEyebrow: "Linha acima do título",
  heroTitle: "Título principal",
  heroAccent: "Parte destacada do título",
  heroDescription: "Descrição principal",
  curadoriaTitle: "Título da Curadoria CPM",
  curadoriaDescription: "Descrição da Curadoria CPM",
  announcement: "Faixa de avisos",
  themeAccent: "Cor de destaque",
  themeBackground: "Cor do fundo",
  themeSurface: "Cor das áreas suaves",
};

const editableContentKeys: (keyof StoreContent)[] = [
  "heroEyebrow",
  "heroTitle",
  "heroAccent",
  "heroDescription",
  "curadoriaTitle",
  "curadoriaDescription",
  "announcement",
  "themeAccent",
  "themeBackground",
  "themeSurface",
];

const colorContentKeys = new Set<keyof StoreContent>(["themeAccent", "themeBackground", "themeSurface"]);
