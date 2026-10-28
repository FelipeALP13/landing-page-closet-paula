"use client";

import { useState } from "react";
import { categories } from "@/lib/categories";
import type { StoreContent, StoreProduct } from "@/lib/store-data";

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
    setStatus(response.ok ? `${product.name} atualizado.` : `Não foi possível atualizar ${product.name}.`);
  }

  async function uploadImage(product: StoreProduct, file?: File) {
    if (!file) return;
    setStatus(`Enviando foto de ${product.name}…`);
    const body = new FormData();
    body.set("file", file);
    body.set("productId", product.id);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    if (!response.ok) { setStatus("Não foi possível enviar a imagem."); return; }
    const result = await response.json() as { url: string };
    const updated = { ...product, imageUrl: result.url };
    setProducts(current => current.map(item => item.id === product.id ? updated : item));
    await saveProduct(updated);
  }

  function updateProduct(id: string, field: keyof StoreProduct, value: string | boolean) {
    setProducts(current => current.map(product => product.id === id ? { ...product, [field]: value } : product));
  }

  return (
    <main className="admin-page">
      <header className="admin-header"><a className="brand" href="/"><small>Closet</small><strong>Paula Miranda</strong></a><div><span>Master: {userName}</span><a href="/" target="_blank">Ver loja ↗</a><a href={signOutPath} target="_top">Sair</a></div></header>
      <div className="admin-title"><p className="eyebrow">Painel master</p><h1>Edite a loja sem mexer no código.</h1><p>Altere as frases principais e substitua as fotos dos produtos. As mudanças são salvas para todos os visitantes.</p></div>
      {status && <output className="admin-status" aria-live="polite">{status}</output>}
      <section className="admin-section"><div><p className="eyebrow">01 / Conteúdo</p><h2>Frases do site</h2></div><form className="content-form" onSubmit={savePhrases}>{Object.entries(content).map(([key, value]) => <label key={key}><span>{contentLabels[key] || key}</span>{value.length > 80 ? <textarea value={value} onChange={event => setContent(current => ({ ...current, [key]: event.target.value }))} /> : <input value={value} onChange={event => setContent(current => ({ ...current, [key]: event.target.value }))} />}</label>)}<button className="button dark" type="submit">Salvar todos os textos</button></form></section>
      <section className="admin-section products-admin"><div><p className="eyebrow">02 / Catálogo</p><h2>Fotos e produtos</h2></div><div className="admin-products">{products.map(product => <article key={product.id}><img src={product.imageUrl} alt="" /><div className="admin-product-fields"><label><span>Foto</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => uploadImage(product, event.target.files?.[0])} /></label><label><span>Nome</span><input value={product.name} onChange={event => updateProduct(product.id, "name", event.target.value)} /></label><label><span>Categoria</span><select value={product.category} onChange={event => updateProduct(product.id, "category", event.target.value)}>{categories.map(category => <option key={category.slug} value={category.slug}>{category.label}</option>)}</select></label><label><span>Chamada</span><input value={product.tag} onChange={event => updateProduct(product.id, "tag", event.target.value)} /></label><label><span>Descrição</span><textarea value={product.description} onChange={event => updateProduct(product.id, "description", event.target.value)} /></label><label className="active-field"><input type="checkbox" checked={product.active} onChange={event => updateProduct(product.id, "active", event.target.checked)} /><span>Produto visível na loja</span></label><button className="button dark" type="button" onClick={() => saveProduct(product)}>Salvar produto</button></div></article>)}</div></section>
    </main>
  );
}

const contentLabels: Record<string, string> = {
  heroEyebrow: "Linha acima do título",
  heroTitle: "Título principal",
  heroAccent: "Parte destacada do título",
  heroDescription: "Descrição principal",
  curadoriaTitle: "Título da Curadoria CPM",
  curadoriaDescription: "Descrição da Curadoria CPM",
  announcement: "Faixa de avisos",
};
