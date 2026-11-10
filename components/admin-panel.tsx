"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { campaignStatus, isSafeLink, maxAnnouncements, parseAnnouncements, type Announcement } from "@/lib/campaign";
import { categories, categoryDescriptionKey, categoryImageKey } from "@/lib/categories";
import { compressImage } from "@/lib/compress-image";
import { AdminGuide } from "./admin-guide";
import type { ClickStats } from "@/lib/click-stats";
import type { StoreContent, StoreProduct } from "@/lib/store-data";
import { formatDocument, formatPhone, normalizeDocument, normalizeWhatsapp, productPath, productSizes, sanitizeStoreInfoValue, type StoreInfoKey } from "@/lib/store-info";

// Campos da seção "Dados da loja". O nome da loja e a assinatura do desenvolvedor não são editáveis.
const storeFields: { key: StoreInfoKey; label: string; placeholder?: string; error: string; hint?: (value: string) => string }[] = [
  { key: "storeWhatsapp", label: "WhatsApp da loja", placeholder: "(12) 99719-6086", error: "Número inválido. Use DDD + número, ex.: (12) 99719-6086.", hint: value => { const n = normalizeWhatsapp(value); return n ? `Aparece como ${formatPhone(n)}` : ""; } },
  { key: "storeAddress", label: "Endereço", placeholder: "Rua Planura, 204", error: "Endereço inválido." },
  { key: "storeCity", label: "Cidade e estado", placeholder: "São José dos Campos — SP", error: "Cidade inválida." },
  { key: "storeHours1", label: "Horário (linha 1)", placeholder: "Seg a sex: 09h às 18h", error: "Texto inválido." },
  { key: "storeHours2", label: "Horário (linha 2)", placeholder: "Sábado: 09h às 15h", error: "Texto inválido." },
  { key: "storeInstagram", label: "Link do Instagram", placeholder: "https://www.instagram.com/…", error: "Use o link completo do perfil, começando com https://www.instagram.com/" },
  { key: "storeFacebook", label: "Link do Facebook", placeholder: "https://www.facebook.com/…", error: "Use o link completo da página, começando com https://www.facebook.com/" },
  { key: "storeLegalName", label: "Razão social ou nome completo", placeholder: "Como está no CNPJ ou CPF", error: "Texto inválido." },
  { key: "storeDocument", label: "CNPJ ou CPF", placeholder: "Só números ou com pontuação", error: "CNPJ/CPF inválido. Confira os números.", hint: value => { const d = normalizeDocument(value); return d ? `Aparece como ${formatDocument(d)}` : ""; } },
  { key: "storeEmail", label: "E-mail de atendimento", placeholder: "contato@…", error: "E-mail inválido." },
];

const maxGalleryPhotos = 8;
const featuredCount = 4;

type Props = { content: StoreContent; products: StoreProduct[]; userName: string; signOutPath: string; clickStats: ClickStats };

export function AdminPanel({ content: initialContent, products: initialProducts, userName, signOutPath, clickStats }: Props) {
  const [content, setContent] = useState(initialContent);
  const [products, setProducts] = useState(initialProducts);
  // Peças criadas no painel que ainda não foram salvas no banco.
  const [unsavedIds, setUnsavedIds] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState<AdminTab>("resumo");

  // A aba aberta fica no endereço (#pecas, #avisos…), para continuar nela ao recarregar a página.
  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1) as AdminTab;
      if (adminTabs.some(item => item.id === hash)) setTab(hash);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function changeTab(next: AdminTab) {
    setTab(next);
    setStatus("");
    window.history.replaceState(null, "", `#${next}`);
    window.scrollTo({ top: 0 });
  }
  const [announcementList, setAnnouncementList] = useState<Announcement[]>(() => parseAnnouncements(initialContent));

  const isUnsaved = (id: string) => unsavedIds.includes(id);
  const liveStatus = campaignStatus(content);

  function updateAnnouncement(index: number, field: keyof Announcement, value: string) {
    setAnnouncementList(current => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  async function saveAnnouncements() {
    const filled = announcementList.filter(item => item.text.trim());
    const badLink = filled.find(item => item.link.trim() && !isSafeLink(item.link.trim()));
    if (badLink) { setStatus(`O link de "${badLink.text}" não é válido. Use um endereço que comece com https:// ou com / (página do site).`); return; }
    const value = JSON.stringify(filled.map(item => ({ text: item.text.trim(), link: item.link.trim() })));
    setStatus("Salvando avisos…");
    const response = await fetch("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ announcements: value }) });
    if (response.ok) setContent(current => ({ ...current, announcements: value }));
    setStatus(response.ok ? "Avisos publicados." : "Não foi possível salvar os avisos.");
  }

  const [storeErrors, setStoreErrors] = useState<Partial<Record<StoreInfoKey, string>>>({});
  const legalMissing = !content.storeLegalName.trim() || !content.storeDocument.trim() || !content.storeEmail.trim();

  async function saveStoreInfo(event: React.FormEvent) {
    event.preventDefault();
    // Confere tudo antes de enviar; o servidor confere de novo.
    const errors: Partial<Record<StoreInfoKey, string>> = {};
    const values: Partial<Record<StoreInfoKey, string>> = {};
    for (const field of storeFields) {
      const clean = sanitizeStoreInfoValue(field.key, content[field.key]);
      if (clean === null) errors[field.key] = field.error;
      else values[field.key] = clean;
    }
    setStoreErrors(errors);
    if (Object.keys(errors).length) { setStatus("Confira os campos marcados em vermelho em Dados da loja."); return; }
    setStatus("Salvando dados da loja…");
    const response = await fetch("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    if (!response.ok) { setStatus("Não foi possível salvar os dados da loja."); return; }
    const { rejected = [] } = await response.json() as { rejected?: string[] };
    setContent(current => ({ ...current, ...values }));
    setStatus(rejected.length ? "Alguns dados não foram aceitos. Confira os campos e tente de novo." : "Dados da loja atualizados em todo o site.");
  }

  async function toggleShowPrices(show: boolean) {
    const value = show ? "1" : "";
    const previous = content.showPrices;
    setContent(current => ({ ...current, showPrices: value }));
    const response = await fetch("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ showPrices: value }) }).catch(() => null);
    if (!response?.ok) {
      // Volta a caixa ao estado anterior, para o painel não mostrar algo diferente do site.
      setContent(current => ({ ...current, showPrices: previous }));
      setStatus("Não foi possível salvar a opção de preços.");
      return;
    }
    setStatus(show ? "Preços visíveis no site." : "Preços ocultos: o site mostra \"Valor sob consulta\".");
  }

  async function saveCampaign(event: React.FormEvent) {
    event.preventDefault();
    if (content.campaignLink && !isSafeLink(content.campaignLink)) { setStatus("O link do botão não é válido. Use um endereço que comece com https:// ou com / (página do site)."); return; }
    if (content.campaignStart && content.campaignEnd && content.campaignEnd < content.campaignStart) { setStatus("A data de fim é antes da data de início."); return; }
    await saveContentKeys(["campaignEnabled", "campaignTitle", "campaignText", "campaignButton", "campaignLink", "campaignStart", "campaignEnd"], "Campanha salva.");
  }
  // Posição de cada peça visível na vitrine: as primeiras aparecem em "Destaques" na página inicial.
  const visibleOrder = products.filter(product => product.active && !isUnsaved(product.id)).map(product => product.id);

  // Grava só os campos da seção que está sendo salva; o que está em edição em outras abas não vai junto.
  async function saveContentKeys(keys: readonly (keyof StoreContent)[], successMessage: string) {
    setStatus("Salvando…");
    const values = Object.fromEntries(keys.map(key => [key, content[key]]));
    const response = await fetch("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
    if (!response.ok) { setStatus("Não foi possível salvar. Tente de novo."); return false; }
    const { rejected = [] } = await response.json() as { rejected?: string[] };
    if (rejected.length) {
      setStatus(`Algumas alterações não foram aceitas: ${rejected.map(key => contentLabels[key] ?? key).join(", ")}. Confira e tente de novo.`);
      return false;
    }
    setStatus(successMessage);
    return true;
  }

  async function saveAppearance(event: React.FormEvent) {
    event.preventDefault();
    await saveContentKeys(editableContentKeys, "Cores e títulos publicados.");
  }

  async function saveSitePhotoTexts(event: React.FormEvent) {
    event.preventDefault();
    await saveContentKeys(["heroBadge", ...categories.map(category => categoryDescriptionKey(category.slug))], "Selo e descrições publicados.");
  }

  // Fotos do site (página inicial, categorias, loja): publicadas assim que o envio termina.
  async function uploadSiteImage(key: keyof StoreContent, label: string, original?: File) {
    if (!original) return;
    setStatus("Otimizando a foto…");
    const file = await compressImage(original);
    setStatus(`Enviando ${label.toLowerCase()} (${formatSize(file.size)})…`);
    const body = new FormData();
    body.set("file", file);
    body.set("productId", `site-${String(key)}`);
    const upload = await fetch("/api/admin/upload", { method: "POST", body });
    if (!upload.ok) { setStatus("Não foi possível enviar a imagem. Use uma foto JPG, PNG ou WebP."); return; }
    const { url } = await upload.json() as { url: string };
    setContent(current => ({ ...current, [key]: url }));
    const response = await fetch("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ [key]: url }) });
    setStatus(response.ok ? `${label} atualizada no site.` : `A foto foi enviada, mas não foi possível publicá-la.`);
  }

  function sitePhotoField(key: keyof StoreContent, label: string) {
    return (
      <div className="site-photo">
        <img src={content[key]} alt="" />
        <label><span>{label}</span><input type="file" accept="image/*" onChange={event => { uploadSiteImage(key, label, event.target.files?.[0]); event.target.value = ""; }} /></label>
      </div>
    );
  }

  async function saveOrder(list: StoreProduct[]) {
    const ids = list.filter(product => !isUnsaved(product.id)).map(product => product.id);
    const response = await fetch("/api/admin/products", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids }) });
    return response.ok;
  }

  async function saveProduct(product: StoreProduct) {
    if (!product.name.trim()) { setStatus("Dê um nome para a peça antes de salvar."); return; }
    if (!product.imageUrl) { setStatus(`Envie a foto principal de ${product.name} antes de salvar.`); return; }

    // Peça nova ganha o endereço definitivo a partir do nome (ex.: /produto/vestido-floral-k3d9).
    const wasUnsaved = isUnsaved(product.id);
    let toSave = wasUnsaved ? { ...product, id: `${slugify(product.name)}-${product.id.slice(-4)}` } : product;

    setStatus(`Salvando ${toSave.name}…`);
    const put = (item: StoreProduct) => fetch("/api/admin/products", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...item, isNew: wasUnsaved }) });
    let response = await put(toSave);
    // Endereço já usado por outra peça: tenta com outro final, sem sobrescrever a existente.
    for (let attempt = 0; response.status === 409 && attempt < 3; attempt++) {
      toSave = { ...toSave, id: `${slugify(product.name)}-${Math.random().toString(36).slice(2, 6)}` };
      response = await put(toSave);
    }
    if (!response.ok) { setStatus(`Não foi possível salvar ${toSave.name}.`); return; }
    const result = await response.json() as { detailsSaved?: boolean };

    if (wasUnsaved) {
      const stillUnsaved = unsavedIds.filter(id => id !== product.id);
      const nextList = withOrder(products.map(item => item.id === product.id ? toSave : item), stillUnsaved);
      setProducts(nextList);
      setUnsavedIds(stillUnsaved);
      // Salva a ordem com a peça nova já no lugar dela.
      await fetch("/api/admin/products", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids: nextList.filter(item => !stillUnsaved.includes(item.id)).map(item => item.id) }) });
    }
    setStatus(result.detailsSaved === false
      ? `${toSave.name} salvo, mas preço, tamanhos, detalhes e fotos extras não foram gravados: o banco ainda não tem a tabela product_details.`
      : wasUnsaved ? `Peça "${toSave.name}" criada e publicada.` : `${toSave.name} atualizado.`);
  }

  // "main" troca a foto principal; "gallery" acrescenta uma foto extra.
  async function uploadImage(product: StoreProduct, target: "main" | "gallery", original?: File) {
    if (!original) return;
    if (target === "gallery" && product.gallery.length >= maxGalleryPhotos) { setStatus(`Cada peça pode ter até ${maxGalleryPhotos} fotos extras.`); return; }
    setStatus("Otimizando a foto…");
    const file = await compressImage(original);
    setStatus(`Enviando foto (${formatSize(file.size)})…`);
    const body = new FormData();
    body.set("file", file);
    body.set("productId", product.id);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    if (!response.ok) { setStatus("Não foi possível enviar a imagem. Use uma foto JPG, PNG ou WebP."); return; }
    const result = await response.json() as { url: string };
    const updated = target === "main" ? { ...product, imageUrl: result.url } : { ...product, gallery: [...product.gallery, result.url] };
    setProducts(current => current.map(item => item.id === product.id ? updated : item));
    // Peça nova só vai para o banco quando a dona clicar em Salvar.
    if (isUnsaved(product.id)) setStatus("Foto enviada. Preencha os dados e clique em Salvar peça.");
    else await saveProduct(updated);
  }

  function updateProduct<K extends keyof StoreProduct>(id: string, field: K, value: StoreProduct[K]) {
    setProducts(current => current.map(product => product.id === id ? { ...product, [field]: value } : product));
  }

  function toggleSize(product: StoreProduct, size: string) {
    const sizes = product.sizes.includes(size) ? product.sizes.filter(item => item !== size) : [...product.sizes, size];
    updateProduct(product.id, "sizes", productSizes.filter(item => sizes.includes(item)));
  }

  function addProduct() {
    const id = `nova-${Math.random().toString(36).slice(2, 6)}`;
    const nextSku = Math.max(0, ...products.map(product => Number(product.sku.match(/\d+/)?.[0] ?? 0))) + 1;
    const product: StoreProduct = {
      id, sku: `CPM-${String(nextSku).padStart(2, "0")}`, name: "", category: categories[0].slug, tag: "Novidade",
      description: "", imageUrl: "", keywords: "", occasions: ["dia", "especial"], sortOrder: 0, active: true,
      price: "", sizes: [], gallery: [], details: "", onSale: false, salePrice: "", soldOut: false,
    };
    // Peças novas entram no topo: aparecem primeiro na vitrine.
    setProducts(current => [product, ...current]);
    setUnsavedIds(current => [...current, id]);
    setStatus("Nova peça criada no topo da lista. Envie a foto, preencha os dados e clique em Salvar peça.");
    requestAnimationFrame(() => document.getElementById(`admin-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function removeProduct(product: StoreProduct) {
    const label = product.name || "esta peça nova";
    if (!window.confirm(`Excluir ${label}? A peça sai da loja e não dá para desfazer.`)) return;
    if (isUnsaved(product.id)) {
      setProducts(current => current.filter(item => item.id !== product.id));
      setUnsavedIds(current => current.filter(id => id !== product.id));
      setStatus("Peça descartada.");
      return;
    }
    setStatus(`Excluindo ${label}…`);
    const response = await fetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, { method: "DELETE" });
    if (!response.ok) { setStatus(`Não foi possível excluir ${label}.`); return; }
    setProducts(current => current.filter(item => item.id !== product.id));
    setStatus(`Peça "${label}" excluída.`);
  }

  async function moveProduct(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= products.length) return;
    const swapped = [...products];
    [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
    const nextList = withOrder(swapped, unsavedIds);
    setProducts(nextList);
    setStatus("Salvando a nova ordem…");
    setStatus(await saveOrder(nextList) ? "Ordem atualizada." : "Não foi possível salvar a ordem.");
  }

  return (
    <main className="admin-page">
      <header className="admin-header"><Link className="brand" href="/"><small>Closet</small><strong>Paula Miranda</strong></Link><div><span>Master: {userName}</span><Link href="/" target="_blank">Ver loja <AdminExternalArrow /></Link><a href={signOutPath} target="_top">Sair</a></div></header>
      {tab === "resumo" && <div className="admin-title"><p className="eyebrow">Painel master</p><h1>Edite a loja sem mexer no código.</h1><p>Altere cores, títulos, categorias e fotos. Créditos técnicos e a assinatura do desenvolvedor são protegidos e não aparecem neste painel.</p></div>}
      <AdminTabs active={tab} onChange={changeTab} legalMissing={legalMissing} productCount={products.length} />
      {status && <output className="admin-status" aria-live="polite">{status}</output>}
      {tab === "resumo" && (
      <section className="admin-section">
        <div>
          <p className="eyebrow">Resumo / Últimos {clickStats.days} dias</p><h2>Interesse no WhatsApp</h2>
          <button type="button" className="admin-guide-hint" onClick={() => changeTab("ajuda")}>Primeira vez no painel? Veja o guia de uso →</button>
          <p className="admin-help">Quantas vezes as clientes tocaram nos botões de WhatsApp do site. A contagem é anônima: não identifica quem tocou.</p>
        </div>
        {!clickStats.available ? <p className="admin-help">A contagem ainda não está ativa: o banco precisa da tabela whatsapp_clicks (migração 0002).</p> : (
          <div className="click-stats">
            <div className="click-totals">
              <div><strong>{clickStats.total}</strong><span>toques no total</span></div>
              <div><strong>{clickStats.total - clickStats.general}</strong><span>em peças</span></div>
              <div><strong>{clickStats.general}</strong><span>contato geral</span></div>
            </div>
            {clickStats.byProduct.length ? (
              <ol className="click-ranking">
                {clickStats.byProduct.slice(0, 10).map(row => {
                  const product = products.find(item => item.id === row.productId);
                  const top = clickStats.byProduct[0].clicks || 1;
                  return (
                    <li key={row.productId}>
                      {product?.imageUrl ? <img src={product.imageUrl} alt="" /> : <span className="click-ranking-empty" />}
                      <div><strong>{product?.name ?? "Peça excluída"}</strong><span className="click-bar" style={{ width: `${Math.max(4, row.clicks / top * 100)}%` }} /></div>
                      <b>{row.clicks}</b>
                    </li>
                  );
                })}
              </ol>
            ) : <p className="admin-help">Nenhuma peça recebeu toques ainda neste período.</p>}
          </div>
        )}
      </section>
      )}
      {tab === "inicio" && <section className="admin-section"><div><p className="eyebrow">Página inicial / Aparência</p><h2>Cores e títulos</h2><p className="admin-help">Somente os campos comerciais autorizados podem ser alterados.</p></div><form className="content-form" onSubmit={saveAppearance}>{editableContentKeys.map(key => { const value = content[key]; const isColor = colorContentKeys.has(key); return <label className={isColor ? "color-field" : undefined} key={key}><span>{contentLabels[key]}</span>{isColor ? <div><input type="color" value={value} onChange={event => setContent(current => ({ ...current, [key]: event.target.value }))} /><input value={value} pattern="#[0-9a-fA-F]{6}" onChange={event => setContent(current => ({ ...current, [key]: event.target.value }))} /></div> : value.length > 80 ? <textarea value={value} onChange={event => setContent(current => ({ ...current, [key]: event.target.value }))} /> : <input value={value} onChange={event => setContent(current => ({ ...current, [key]: event.target.value }))} />}</label>; })}<button className="button dark" type="submit">Salvar aparência e textos</button></form></section>}
      {tab === "pecas" && (
      <section className="admin-section products-admin">
        <div>
          <p className="eyebrow">Peças / Catálogo</p><h2>Peças</h2>
          <p className="admin-help">A ordem desta lista é a ordem da vitrine. As {featuredCount} primeiras peças visíveis aparecem em Destaques na página inicial.</p>
          <button className="button dark admin-add" type="button" onClick={addProduct}>+ Nova peça</button>
          <label className="show-prices-toggle">
            <input type="checkbox" checked={content.showPrices === "1"} onChange={event => toggleShowPrices(event.target.checked)} />
            <span><strong>Mostrar preços no site</strong><small>{content.showPrices === "1" ? "Os preços cadastrados aparecem na vitrine." : "Desligado: todas as peças mostram \"Valor sob consulta\" e o valor é passado pelo WhatsApp."}</small></span>
          </label>
        </div>
        <div className="admin-products">{products.map((product, index) => {
          const unsaved = isUnsaved(product.id);
          const position = visibleOrder.indexOf(product.id);
          return (
            <article key={product.id} id={`admin-${product.id}`} className={unsaved ? "unsaved" : undefined}>
              {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <div className="admin-photo-empty">Sem foto ainda</div>}
              <div className="admin-product-fields">
                <div className="wide admin-product-bar">
                  <span className="admin-badge">{unsaved ? "Nova · não salva" : !product.active ? "Oculta" : position < featuredCount ? `Destaque #${position + 1}` : `Vitrine #${position + 1}`}</span>
                  <div>
                    <button type="button" onClick={() => moveProduct(index, -1)} disabled={index === 0} aria-label={`Subir ${product.name}`}>↑</button>
                    <button type="button" onClick={() => moveProduct(index, 1)} disabled={index === products.length - 1} aria-label={`Descer ${product.name}`}>↓</button>
                    <button type="button" className="admin-delete" onClick={() => removeProduct(product)}>Excluir</button>
                  </div>
                </div>
                <label><span>Foto principal</span><input type="file" accept="image/*" onChange={event => { uploadImage(product, "main", event.target.files?.[0]); event.target.value = ""; }} /></label>
                <label><span>Nome</span><input value={product.name} placeholder="Ex.: Vestido Floral Midi" onChange={event => updateProduct(product.id, "name", event.target.value)} /></label>
                <label><span>Categoria</span><select value={product.category} onChange={event => updateProduct(product.id, "category", event.target.value)}>{categories.map(category => <option key={category.slug} value={category.slug}>{category.label}</option>)}</select></label>
                <label><span>Chamada</span><input value={product.tag} onChange={event => updateProduct(product.id, "tag", event.target.value)} /></label>
                <label><span>Preço{content.showPrices !== "1" && " (oculto no site)"}</span><input value={product.price} placeholder="Ex.: 189,90 (vazio = sob consulta)" onChange={event => updateProduct(product.id, "price", event.target.value)} /></label>
                <div className="wide admin-status-flags">
                  <label><input type="checkbox" checked={product.onSale} onChange={event => updateProduct(product.id, "onSale", event.target.checked)} /><span>Em promoção</span></label>
                  {product.onSale && <label className="sale-price"><span>Preço promocional {content.showPrices !== "1" && "(oculto no site)"}</span><input value={product.salePrice} placeholder="Ex.: 149,90" onChange={event => updateProduct(product.id, "salePrice", event.target.value)} /></label>}
                  <label><input type="checkbox" checked={product.soldOut} onChange={event => updateProduct(product.id, "soldOut", event.target.checked)} /><span>Esgotada (botão vira “Avise-me quando voltar”)</span></label>
                </div>
                <fieldset className="admin-sizes"><legend>Tamanhos disponíveis</legend><div>{productSizes.map(size => <label key={size}><input type="checkbox" checked={product.sizes.includes(size)} onChange={() => toggleSize(product, size)} />{size}</label>)}</div><small>Nenhum marcado = a equipe confirma pelo WhatsApp.</small></fieldset>
                <label className="wide"><span>Descrição curta</span><textarea value={product.description} onChange={event => updateProduct(product.id, "description", event.target.value)} /></label>
                <label className="wide"><span>Detalhes da peça (tecido, medidas, cuidados)</span><textarea value={product.details} placeholder={"Ex.: Tecido: viscose\nComprimento: 120 cm\nLavar à mão"} onChange={event => updateProduct(product.id, "details", event.target.value)} /></label>
                <label className="wide"><span>Palavras para a busca</span><input value={product.keywords} placeholder="Ex.: floral verde midi festa" onChange={event => updateProduct(product.id, "keywords", event.target.value)} /></label>
                <div className="wide admin-gallery">
                  <span>Fotos extras ({product.gallery.length}/{maxGalleryPhotos})</span>
                  <div>{product.gallery.map(photo => <figure key={photo}><img src={photo} alt="" /><button type="button" aria-label="Remover foto" onClick={() => updateProduct(product.id, "gallery", product.gallery.filter(item => item !== photo))}>×</button></figure>)}</div>
                  {product.gallery.length < maxGalleryPhotos && <input type="file" accept="image/*" aria-label="Adicionar foto extra" onChange={event => { uploadImage(product, "gallery", event.target.files?.[0]); event.target.value = ""; }} />}
                </div>
                <label className="active-field"><input type="checkbox" checked={product.active} onChange={event => updateProduct(product.id, "active", event.target.checked)} /><span>Peça visível na loja</span></label>
                <div className="wide admin-product-buttons"><button className="button dark" type="button" onClick={() => saveProduct(product)}>{unsaved ? "Salvar peça" : "Salvar alterações"}</button>{!unsaved && <Link className="button outline" href={productPath(product.id)} target="_blank">Ver página da peça <AdminExternalArrow /></Link>}</div>
              </div>
            </article>
          );
        })}</div>
      </section>
      )}
      {tab === "inicio" && (
      <section className="admin-section">
        <div>
          <p className="eyebrow">Página inicial / Fotos</p><h2>Início, categorias e loja</h2>
          <p className="admin-help">As fotos são otimizadas automaticamente e publicadas assim que terminam de enviar. Textos só são publicados ao clicar em Salvar.</p>
        </div>
        <form className="site-photos" onSubmit={saveSitePhotoTexts}>
          <div className="site-photos-row">
            {sitePhotoField("heroImage", "Foto principal da página inicial")}
            <div className="site-photo-text">
              <label><span>Selo sobre a foto principal</span><textarea value={content.heroBadge} placeholder={"Ex.: Nova\ncoleção"} onChange={event => setContent(current => ({ ...current, heroBadge: event.target.value }))} /></label>
              <small>Cada linha aparece numa linha do selo. Deixe vazio para esconder o selo.</small>
            </div>
            {sitePhotoField("storeImage", "Foto da seção da loja")}
          </div>
          <h3>Categorias</h3>
          <div className="site-categories">{categories.map(category => {
            const imageKey = categoryImageKey(category.slug);
            const descriptionKey = categoryDescriptionKey(category.slug);
            return (
              <div key={category.slug} className="site-category">
                {sitePhotoField(imageKey, `Foto de ${category.label}`)}
                <label><span>Descrição de {category.label}</span><textarea value={content[descriptionKey]} onChange={event => setContent(current => ({ ...current, [descriptionKey]: event.target.value }))} /></label>
              </div>
            );
          })}</div>
          <button className="button dark" type="submit">Salvar selo e descrições</button>
        </form>
      </section>
      )}
      {tab === "avisos" && (
      <section className="admin-section">
        <div>
          <p className="eyebrow">Avisos / Faixa e campanha</p><h2>Faixa do topo e banner</h2>
          <p className="admin-help">Os avisos aparecem um por vez na faixa rosa do topo, trocando a cada 5 segundos. O banner de campanha aparece na página inicial, logo abaixo da foto principal.</p>
        </div>
        <div className="announcements-admin">
          <h3>Avisos da faixa do topo</h3>
          {announcementList.map((item, index) => (
            <div key={index} className="announcement-row">
              <label><span>Aviso {index + 1}</span><input value={item.text} maxLength={160} placeholder="Ex.: Frete grátis em São José dos Campos" onChange={event => updateAnnouncement(index, "text", event.target.value)} /></label>
              <label><span>Link (opcional)</span><input value={item.link} placeholder="Ex.: /categoria/vestidos ou https://…" onChange={event => updateAnnouncement(index, "link", event.target.value)} /></label>
              <button type="button" aria-label={`Remover aviso ${index + 1}`} onClick={() => setAnnouncementList(current => current.filter((_, i) => i !== index))}>×</button>
            </div>
          ))}
          <div className="admin-product-buttons">
            {announcementList.length < maxAnnouncements && <button className="button outline" type="button" onClick={() => setAnnouncementList(current => [...current, { text: "", link: "" }])}>+ Adicionar aviso</button>}
            <button className="button dark" type="button" onClick={saveAnnouncements}>Salvar avisos</button>
          </div>

          <h3>Banner de campanha</h3>
          <form className="campaign-admin" onSubmit={saveCampaign}>
            <p className={`campaign-state ${liveStatus}`}>{{ off: "Desligada", scheduled: `Agendada: começa em ${formatDate(content.campaignStart)}`, live: content.campaignEnd ? `No ar até ${formatDate(content.campaignEnd)}` : "No ar agora", ended: `Encerrada em ${formatDate(content.campaignEnd)}` }[liveStatus]}</p>
            <label className="active-field"><input type="checkbox" checked={content.campaignEnabled === "1"} onChange={event => setContent(current => ({ ...current, campaignEnabled: event.target.checked ? "1" : "" }))} /><span>Mostrar campanha no site</span></label>
            <div className="campaign-admin-grid">
              {sitePhotoField("campaignImage", "Foto da campanha")}
              <div className="campaign-admin-fields">
                <label><span>Título</span><input value={content.campaignTitle} maxLength={120} onChange={event => setContent(current => ({ ...current, campaignTitle: event.target.value }))} /></label>
                <label><span>Texto</span><textarea value={content.campaignText} maxLength={400} onChange={event => setContent(current => ({ ...current, campaignText: event.target.value }))} /></label>
                <label><span>Texto do botão</span><input value={content.campaignButton} maxLength={40} onChange={event => setContent(current => ({ ...current, campaignButton: event.target.value }))} /></label>
                <label><span>Link do botão</span><input value={content.campaignLink} placeholder="Ex.: /categoria/vestidos" onChange={event => setContent(current => ({ ...current, campaignLink: event.target.value }))} /></label>
                <div className="campaign-dates">
                  <label><span>Começa em (opcional)</span><input type="date" value={content.campaignStart} onChange={event => setContent(current => ({ ...current, campaignStart: event.target.value }))} /></label>
                  <label><span>Termina em (opcional)</span><input type="date" value={content.campaignEnd} onChange={event => setContent(current => ({ ...current, campaignEnd: event.target.value }))} /></label>
                </div>
                <small>Sem datas, a campanha fica no ar enquanto estiver ligada. Com datas, ela aparece e some sozinha (horário de Brasília).</small>
              </div>
            </div>
            <button className="button dark" type="submit">Salvar campanha</button>
          </form>
        </div>
      </section>
      )}
      {tab === "ajuda" && <AdminGuide onOpenTab={changeTab} />}
      {tab === "loja" && (
      <section className="admin-section">
        <div>
          <p className="eyebrow">Loja / Dados</p><h2>Contato e dados legais</h2>
          <p className="admin-help">Aparecem no rodapé, na seção da loja, na página de informações e em todos os botões de WhatsApp do site.</p>
          {legalMissing && <p className="admin-warning">Razão social (ou nome completo), CPF/CNPJ e e-mail são obrigatórios por lei para vender pela internet. Preencha antes de divulgar o site.</p>}
        </div>
        <form className="store-info-form" onSubmit={saveStoreInfo} noValidate>
          {storeFields.map(field => (
            <label key={field.key} className={storeErrors[field.key] ? "has-error" : undefined}>
              <span>{field.label}</span>
              <input value={content[field.key]} type={field.key === "storeEmail" ? "email" : "text"} inputMode={field.key === "storeWhatsapp" || field.key === "storeDocument" ? "numeric" : undefined} placeholder={field.placeholder} onChange={event => { const value = event.target.value; setContent(current => ({ ...current, [field.key]: value })); setStoreErrors(current => ({ ...current, [field.key]: "" })); }} />
              {storeErrors[field.key] ? <small className="field-error">{storeErrors[field.key]}</small> : field.hint && <small>{field.hint(content[field.key])}</small>}
            </label>
          ))}
          <button className="button dark" type="submit">Salvar dados da loja</button>
        </form>
      </section>
      )}
    </main>
  );
}

// Numera as peças salvas na ordem da lista (1, 2, 3…), igual ao servidor ao salvar a ordem.
function withOrder(list: StoreProduct[], unsavedIds: string[]) {
  let position = 0;
  return list.map(product => unsavedIds.includes(product.id) ? product : { ...product, sortOrder: ++position });
}

// "Vestido Floral Midi" → "vestido-floral-midi"
function slugify(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "peca";
}

// "2026-12-24" → "24/12/2026"
function formatDate(value: string) {
  return value ? value.split("-").reverse().join("/") : "";
}

function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

const adminTabs = [
  { id: "resumo", label: "Resumo" },
  { id: "pecas", label: "Peças" },
  { id: "inicio", label: "Página inicial" },
  { id: "avisos", label: "Avisos" },
  { id: "loja", label: "Loja" },
  { id: "ajuda", label: "Ajuda" },
] as const;

type AdminTab = (typeof adminTabs)[number]["id"];

function AdminTabs({ active, onChange, legalMissing, productCount }: { active: AdminTab; onChange: (tab: AdminTab) => void; legalMissing: boolean; productCount: number }) {
  const navRef = useRef<HTMLElement>(null);
  // No celular a barra rola para o lado: mantém a aba ativa visível.
  // Rola só a barra (scrollIntoView empurraria a página inteira para o lado).
  useEffect(() => {
    const nav = navRef.current;
    const button = nav?.querySelector<HTMLElement>("button.active");
    if (nav && button) nav.scrollLeft = button.offsetLeft - (nav.clientWidth - button.offsetWidth) / 2;
  }, [active]);
  return (
    <nav ref={navRef} className="admin-tabs" aria-label="Seções do painel">
      {adminTabs.map(item => (
        <button key={item.id} type="button" className={active === item.id ? "active" : undefined} aria-current={active === item.id ? "page" : undefined} onClick={() => onChange(item.id)}>
          {item.label}
          {item.id === "pecas" && <small>{productCount}</small>}
          {item.id === "loja" && legalMissing && <span className="admin-tab-alert" title="Faltam dados obrigatórios">!</span>}
        </button>
      ))}
    </nav>
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
  themeAccent: "Cor de destaque",
  themeBackground: "Cor do fundo",
  themeSurface: "Cor das áreas suaves",
  // Usados só nas mensagens de campo recusado.
  heroBadge: "Selo da foto principal",
  campaignTitle: "Título da campanha",
  campaignText: "Texto da campanha",
  campaignButton: "Texto do botão",
  campaignLink: "Link do botão",
  campaignStart: "Data de início",
  campaignEnd: "Data de fim",
};

const editableContentKeys: (keyof StoreContent)[] = [
  "heroEyebrow",
  "heroTitle",
  "heroAccent",
  "heroDescription",
  "curadoriaTitle",
  "curadoriaDescription",
  "themeAccent",
  "themeBackground",
  "themeSurface",
];

const colorContentKeys = new Set<keyof StoreContent>(["themeAccent", "themeBackground", "themeSurface"]);
