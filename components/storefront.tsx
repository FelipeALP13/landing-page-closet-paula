"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { categories, resolveCategories, resolveCategory } from "@/lib/categories";
import { productPath, productSizes, resolveStoreInfo, whatsappLink, type StoreInfo } from "@/lib/store-info";
import type { StoreContent, StoreProduct } from "@/lib/store-data";
import { ProductDetail } from "./product-detail";
import { parseAnnouncements } from "@/lib/campaign";
import { trackWhatsAppClick } from "@/lib/track-click";
import { AnnouncementBar } from "./announcement-bar";
import { parseCustomerPhotos } from "@/lib/customer-photos";
import { hasSizeChart, parseSizeChart } from "@/lib/size-chart";
import { CampaignBanner, CustomerGallery, ExternalArrow, ProductCard, ResponsiveImage, SizeChartTable } from "./store-ui";

const quizCategories: Record<string, string> = { vestidos: "vestidos", tops: "croppeds e blusas", jeans: "jeans e calças", conjuntos: "look completo" };
const quizOccasions: Record<string, string> = { dia: "dia a dia", trabalho: "trabalho", especial: "sair ou ocasião especial" };
const sizes = productSizes;

type Theme = "light" | "dark";
type Props = { content: StoreContent; products: StoreProduct[]; mode: "home" | "category" | "info" | "product" | "sizes"; categorySlug?: string; productId?: string; origin?: string; showCampaign?: boolean };

export function Storefront({ content, products, mode, categorySlug, productId, origin = "", showCampaign = false }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [size, setSize] = useState("");
  const [search, setSearch] = useState("");
  const [quizStep, setQuizStep] = useState(0);
  const [quiz, setQuiz] = useState({ category: "", occasion: "", size: "" });
  const [recommendations, setRecommendations] = useState<StoreProduct[]>([]);
  const [theme, setTheme] = useState<Theme>("light");
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [dataCleared, setDataCleared] = useState(false);

  // Dados da loja (WhatsApp, endereço, horários…) vêm do painel.
  const info = resolveStoreInfo(content);
  // Preços só aparecem se a dona ligar "Mostrar preços no site" no painel.
  const showPrices = content.showPrices === "1";
  const customerPhotos = parseCustomerPhotos(content.customerPhotos);
  // Tabela de medidas: só aparece quando a dona preencheu alguma medida no painel.
  const sizeChart = parseSizeChart(content.sizeChart);
  const showSizeChart = hasSizeChart(sizeChart);
  const wa = (message?: string) => whatsappLink(info.whatsappNumber, message);

  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const selectionTriggerRef = useRef<HTMLButtonElement>(null);
  const selectionCloseRef = useRef<HTMLButtonElement>(null);

  // O navegador só é lido depois da hidratação, para o HTML do servidor e do cliente baterem.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cpm-selection") || "[]");
      if (Array.isArray(saved)) setSelected(saved.filter(id => typeof id === "string"));
      setSize(localStorage.getItem("cpm-size") || "");
    } catch {}
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) {
      setSearch(initialQuery);
      requestAnimationFrame(() => document.getElementById("vitrine")?.scrollIntoView());
    }
    setStorageLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      localStorage.setItem("cpm-selection", JSON.stringify(selected));
      if (size) localStorage.setItem("cpm-size", size);
    } catch {}
  }, [selected, size, storageLoaded]);

  const closePanels = useCallback(() => {
    if (menuOpen) menuTriggerRef.current?.focus();
    if (selectionOpen) selectionTriggerRef.current?.focus();
    setMenuOpen(false);
    setSelectionOpen(false);
  }, [menuOpen, selectionOpen]);

  // Esc fecha os painéis, a página de trás não rola e o foco vai para o botão de fechar.
  const panelOpen = menuOpen || selectionOpen;
  useEffect(() => {
    if (!panelOpen) return;
    (menuOpen ? menuCloseRef : selectionCloseRef).current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanels();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen, menuOpen, closePanels]);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("cpm-theme", next); } catch {}
    setTheme(next);
  }

  function clearLocalData() {
    try {
      localStorage.removeItem("cpm-selection");
      localStorage.removeItem("cpm-size");
      localStorage.removeItem("cpm-theme");
    } catch {}
    setSelected([]);
    setSize("");
    setDataCleared(true);
  }

  // Fotos e descrições das categorias podem ser trocadas no painel.
  const resolvedCategories = resolveCategories(content);
  const category = categorySlug ? resolveCategory(categorySlug, content) : undefined;
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const visibleProducts = useMemo(() => {
    const base = mode === "category" ? products.filter(product => product.category === categorySlug) : products;
    const filtered = query ? base.filter(product => normalize(`${product.name} ${product.keywords} ${product.category}`).includes(normalize(query))) : base;
    return mode === "home" && !query ? filtered.slice(0, 4) : filtered;
  }, [products, mode, categorySlug, query]);

  const currentProduct = productId ? products.find(product => product.id === productId) : undefined;
  // Sugestões da página de produto: primeiro a mesma categoria, depois o resto da coleção.
  const relatedProducts = useMemo(() => {
    if (!currentProduct) return [];
    const others = products.filter(product => product.id !== currentProduct.id);
    return [...others.filter(product => product.category === currentProduct.category), ...others.filter(product => product.category !== currentProduct.category)].slice(0, 4);
  }, [products, currentProduct]);

  // Conta (de forma anônima) todo toque em link de WhatsApp. Links de peça trazem o id em data-track-product.
  function handleWhatsAppClick(event: React.MouseEvent) {
    const link = (event.target as Element).closest?.('a[href^="https://wa.me/"]');
    if (!link) return;
    const ids = (link.getAttribute("data-track-product") || "").split(",").filter(Boolean);
    if (ids.length) ids.forEach(id => trackWhatsAppClick(id));
    else trackWhatsAppClick();
  }

  // Botão fixo: na página de uma peça, já leva o nome dela na mensagem.
  const floatingMessage = currentProduct
    ? `Olá! Vim pelo site da Closet Paula Miranda e tenho uma dúvida sobre a peça ${currentProduct.name} (${currentProduct.sku}).`
    : "Olá! Vim pelo site da Closet Paula Miranda e gostaria de ajuda.";

  // Na vitrine a busca filtra na hora; nas outras páginas leva para a página inicial com o termo.
  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "home" || mode === "category") {
      document.getElementById("vitrine")?.scrollIntoView({ behavior: "smooth" });
    } else if (search.trim()) {
      window.location.href = `/?q=${encodeURIComponent(search.trim())}`;
    }
  }

  const selectedProducts = selected.map(id => products.find(product => product.id === id)).filter(Boolean) as StoreProduct[];
  const checkoutMessage = `Olá! Montei esta seleção no site da Closet Paula Miranda:\n${selectedProducts.map((product, index) => `${index + 1}. ${product.name} (${product.sku})`).join("\n")}\n\nMeu tamanho mais comum é ${size || "a confirmar"}. Gostaria de confirmar valores, medidas, disponibilidade e entrega ou retirada.`;

  function toggleProduct(id: string) {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }

  function answerQuiz(key: "category" | "occasion" | "size", value: string) {
    const next = { ...quiz, [key]: value };
    setQuiz(next);
    if (key !== "size") {
      setQuizStep(step => step + 1);
      return;
    }
    setSize(value);
    const ranked = products.map((product, index) => ({
      product,
      index,
      score: ((next.category === "tops" ? ["croppeds", "blusas"].includes(product.category) : product.category === next.category) ? 8 : 0) + (product.occasions.includes(next.occasion) ? 4 : 0) - (product.soldOut ? 20 : 0),
    })).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 3).map(item => item.product);
    setRecommendations(ranked);
    setQuizStep(3);
  }

  const recommendationMessage = recommendations.length
    ? `Olá! Fiz a Curadoria CPM e recebi estas recomendações:\n${recommendations.map((product, index) => `${index + 1}. ${product.name} (${product.sku})`).join("\n")}\n\nEu procuro ${quizCategories[quiz.category]} para ${quizOccasions[quiz.occasion]}. Meu tamanho mais comum é ${quiz.size}. Gostaria de confirmar valores e disponibilidade.`
    : "";

  // As cores do painel valem para o modo claro; o modo escuro usa a paleta própria do CSS.
  const themeStyle = {
    "--rose": content.themeAccent,
    "--brand-paper": content.themeBackground,
    "--brand-sand": content.themeSurface,
  } as CSSProperties;

  const productsTitle = query ? `Resultados para “${search.trim()}”` : mode === "home" ? "Destaques da coleção" : category?.label;
  const productsDescription = query
    ? `${visibleProducts.length} ${visibleProducts.length === 1 ? "peça encontrada" : "peças encontradas"}.`
    : mode === "home" ? "Conheça algumas escolhas e entre nas categorias para ver a coleção organizada." : `Peças selecionadas em ${category?.label.toLowerCase()}.`;

  return (
    <div className="site-shell" style={themeStyle} onClick={handleWhatsAppClick}>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <AnnouncementBar items={parseAnnouncements(content)} />
      <header className="header">
        <button ref={menuTriggerRef} className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu" aria-expanded={menuOpen} aria-controls="menu-lateral"><span /><span /></button>
        <Link className="brand" href="/"><small>Closet</small><strong>Paula Miranda</strong></Link>
        <form className="search" role="search" onSubmit={submitSearch}>
          <label htmlFor="busca" className="sr-only">Buscar peças</label>
          <input id="busca" type="search" enterKeyHint="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Olá, o que você procura?" />
          <button type="submit" aria-label="Buscar"><SearchIcon /></button>
        </form>
        <button className="theme-toggle" onClick={toggleTheme} aria-pressed={theme === "dark"} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}>{theme === "dark" ? <SunIcon /> : <MoonIcon />}</button>
        <button ref={selectionTriggerRef} className="selection-link" onClick={() => setSelectionOpen(true)} aria-expanded={selectionOpen} aria-controls="minha-selecao">Seleção <b aria-label={`${selected.length} ${selected.length === 1 ? "peça" : "peças"}`}>{selected.length}</b></button>
      </header>

      <div className={`menu-backdrop ${menuOpen ? "open" : ""}`} onClick={closePanels} />
      <aside id="menu-lateral" className={`side-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen} inert={!menuOpen} aria-label="Menu">
        <div className="side-menu-head"><Link className="brand" href="/"><small>Closet</small><strong>Paula Miranda</strong></Link><button ref={menuCloseRef} onClick={closePanels} aria-label="Fechar menu">×</button></div>
        <nav>
          <Link className="menu-feature" href="/#curadoria" onClick={() => setMenuOpen(false)}>✦ Curadoria CPM <span aria-hidden="true">›</span></Link>
          {categories.map(item => <Link key={item.slug} href={`/categoria/${item.slug}`}>{item.label}<span aria-hidden="true">›</span></Link>)}
          <Link href="/#loja" onClick={() => setMenuOpen(false)}>Nossa loja<span aria-hidden="true">›</span></Link>
          <Link href="/informacoes">Compra, trocas e privacidade<span aria-hidden="true">›</span></Link>
          <a href={wa()} target="_blank" rel="noopener noreferrer">Falar no WhatsApp<span><ExternalArrow /></span></a>
        </nav>
      </aside>

      <main id="conteudo">
        {mode === "home" && (
          <>
            <section className="hero">
              <div className="hero-copy"><p className="eyebrow">{content.heroEyebrow}</p><h1>{content.heroTitle}<br /><em>{content.heroAccent}</em></h1><p>{content.heroDescription}</p><div><a className="button dark" href="#curadoria">Descobrir meu look</a><a className="text-link" href="#categorias">Comprar por categoria <DownRightArrow /></a></div></div>
              <div className="hero-media"><ResponsiveImage src={content.heroImage} sizes="(max-width: 680px) 100vw, 56vw" alt="Look em destaque da coleção Closet Paula Miranda" eager priority />{content.heroBadge.trim() && <span aria-hidden="true">{content.heroBadge.trim().split("\n").map((line, index) => <span key={index}>{line}<br /></span>)}✦</span>}</div>
            </section>
            {showCampaign && <CampaignBanner title={content.campaignTitle} text={content.campaignText} button={content.campaignButton} link={content.campaignLink} image={content.campaignImage} />}
            <section className="category-section" id="categorias"><div className="section-head"><div><p className="eyebrow">Escolha seu mood</p><h2>Compre por categoria</h2></div><p>Cada categoria abre uma página própria, com apenas as peças que você procura.</p></div><div className="category-cards">{resolvedCategories.map(item => <Link key={item.slug} href={`/categoria/${item.slug}`}><ResponsiveImage src={item.image} sizes="(max-width: 980px) 50vw, 33vw" alt="" /><span><strong>{item.label}</strong><small aria-hidden="true">Ver categoria <ExternalArrow /></small></span></Link>)}</div></section>
            <section className="curadoria" id="curadoria"><div className="curadoria-copy"><p className="eyebrow">Exclusividade Closet Paula Miranda</p><h2>{content.curadoriaTitle}</h2><p>{content.curadoriaDescription}</p><ul><li>Sem cadastro</li><li>Recomendação personalizada</li><li>Atendimento humano no WhatsApp</li></ul></div><div className="quiz" aria-live="polite"><div className="quiz-progress"><span>{quizStep < 3 ? `0${quizStep + 1} / 03` : "RECOMENDAÇÃO PRONTA"}</span>{quizStep > 0 && quizStep < 3 && <button className="quiz-back" onClick={() => setQuizStep(step => step - 1)}>← Voltar</button>}</div>{quizStep === 0 && <QuizOptions title="O que você está procurando hoje?" options={[["vestidos", "Um vestido"], ["tops", "Cropped ou blusa"], ["jeans", "Jeans ou calça"], ["conjuntos", "Um look completo"]]} onSelect={value => answerQuiz("category", value)} />}{quizStep === 1 && <QuizOptions title="Para qual momento você quer esse look?" options={[["dia", "Dia a dia"], ["trabalho", "Trabalho"], ["especial", "Sair ou ocasião especial"]]} onSelect={value => answerQuiz("occasion", value)} />}{quizStep === 2 && <div><h3>Qual tamanho devemos considerar?</h3><div className="size-grid">{sizes.map(value => <button key={value} onClick={() => answerQuiz("size", value)}>{value}</button>)}</div><small>A equipe confirma modelagem, medidas e disponibilidade.{showSizeChart && <> <Link href="/medidas">Ver tabela de medidas</Link></>}</small></div>}{quizStep === 3 && <div className="quiz-result"><span>Sua Curadoria CPM</span><h3>Seu caminho de estilo está pronto.</h3><p>Selecionamos três opções para {quizOccasions[quiz.occasion]}, considerando o tamanho {quiz.size}.</p><div>{recommendations.map(product => <Link href={productPath(product.id)} key={product.id}><article><ResponsiveImage src={product.imageUrl} sizes="(max-width: 680px) 33vw, 20vw" alt="" /><strong>{product.name}</strong></article></Link>)}</div><a className="button whatsapp" href={wa(recommendationMessage)} target="_blank" rel="noopener noreferrer">Levar ao WhatsApp <ExternalArrow /></a><button className="restart" onClick={() => { setQuizStep(0); setRecommendations([]); }}>Refazer curadoria</button></div>}</div></section>
          </>
        )}

        {mode === "category" && (
          <section className="category-hero"><div><p className="eyebrow">Closet Paula Miranda / Categoria</p><h1>{category?.label}</h1><p>{category?.description}</p></div>{category && <ResponsiveImage src={category.image} sizes="(max-width: 680px) 100vw, 50vw" alt="" eager />}</section>
        )}

        {mode === "product" && currentProduct && (
          <ProductDetail product={currentProduct} related={relatedProducts} selectedIds={selected} onToggle={toggleProduct} preferredSize={size} origin={origin} whatsappNumber={info.whatsappNumber} showPrices={showPrices} sizeChart={showSizeChart ? sizeChart : undefined} />
        )}

        {mode === "sizes" && (
          <section className="info-page sizes-page">
            <header><p className="eyebrow">Atendimento</p><h1>Tabela de <em>medidas.</em></h1></header>
            {showSizeChart ? <SizeChartTable chart={sizeChart} /> : <p className="sizes-empty">A tabela de medidas ainda não foi publicada.</p>}
            <p className="sizes-help">Ficou em dúvida entre dois tamanhos? A equipe ajuda a escolher pelo WhatsApp.</p>
            <a className="button whatsapp" href={wa("Olá! Estou com dúvida sobre qual tamanho escolher. Pode me ajudar?")} target="_blank" rel="noopener noreferrer">Tirar dúvida de tamanho <ExternalArrow /></a>
          </section>
        )}

        {mode === "info" && <InfoContent info={info} onClearData={clearLocalData} dataCleared={dataCleared} />}

        {(mode === "home" || mode === "category") && (
          <section className="products-section" id="vitrine"><div className="section-head"><div><p className="eyebrow">Vitrine CPM</p><h2>{productsTitle}</h2></div><p>{productsDescription}</p></div>{visibleProducts.length ? <div className="product-grid">{visibleProducts.map(product => <ProductCard key={product.id} whatsappNumber={info.whatsappNumber} showPrices={showPrices} product={product} selected={selected.includes(product.id)} onToggle={toggleProduct} sizes="(max-width: 680px) 50vw, (max-width: 980px) 33vw, 25vw" />)}</div> : query ? <div className="empty-category"><span aria-hidden="true">✦</span><h3>Nada encontrado</h3><p>Não encontramos peças para essa busca. Tente outra palavra ou peça ajuda para a equipe.</p><button className="button dark" onClick={() => setSearch("")}>Limpar busca</button></div> : <div className="empty-category"><span aria-hidden="true">✦</span><h3>Novidades chegando</h3><p>Esta categoria já está preparada. Enquanto as fotos não chegam, a equipe pode mostrar as opções disponíveis pelo WhatsApp.</p><a className="button whatsapp" href={wa(`Olá! Gostaria de ver as opções disponíveis em ${category?.label}.`)} target="_blank" rel="noopener noreferrer">Ver opções no WhatsApp <ExternalArrow /></a></div>}</section>
        )}

        {mode === "home" && customerPhotos.length > 0 && <CustomerGallery photos={customerPhotos} instagramUrl={info.instagramUrl} />}

        {mode !== "info" && mode !== "sizes" && (
          <section className="store" id="loja"><ResponsiveImage src={content.storeImage} sizes="(max-width: 680px) 100vw, 50vw" alt="Loja Closet Paula Miranda, na Rua Planura, 204" /><div><p className="eyebrow">Visite a gente</p><h2>Seu closet,<br /><em>bem de perto.</em></h2><p>{info.addressLine} — {info.cityLine}</p><p>{info.hours[0]}<br />{info.hours[1]}</p><a href={wa("Olá! Gostaria de combinar uma visita à loja.")} target="_blank" rel="noopener noreferrer">Combinar uma visita <ExternalArrow /></a></div></section>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><small>Closet</small><strong>Paula Miranda</strong><p>Para mulheres autênticas, elegantes e despojadas.</p><a className="footer-whatsapp" href={wa()} target="_blank" rel="noopener noreferrer">Falar com a equipe <ExternalArrow /></a></div>
          <nav aria-label="Categorias"><h2>Compre</h2>{categories.map(item => <Link key={item.slug} href={`/categoria/${item.slug}`}>{item.label}</Link>)}</nav>
          <nav aria-label="Atendimento"><h2>Atendimento</h2><Link href="/#curadoria">Curadoria CPM</Link><Link href="/informacoes#compra">Como funciona a compra</Link><Link href="/informacoes#trocas">Trocas e arrependimento</Link><Link href="/informacoes#privacidade">Privacidade</Link>{showSizeChart && <Link href="/medidas">Tabela de medidas</Link>}<a href={info.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a><a href={info.facebookUrl} target="_blank" rel="noopener noreferrer">Facebook</a></nav>
          <div className="footer-store"><h2>Visite a loja</h2><p>{info.addressLine}<br />{info.cityLine}</p><p>{info.hours[0]}<br />{info.hours[1]}</p><p>WhatsApp {info.whatsappDisplay}</p><a href={info.mapsUrl} target="_blank" rel="noopener noreferrer">Abrir no mapa <ExternalArrow /></a></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} {info.legalName || info.name}{info.document && ` • ${info.document}`}</span><span>Vitrine online • Valores e disponibilidade sob consulta</span><span className="developer-credit">Desenvolvido por Felipe Lucena</span></div>
      </footer>

      <div className={`selection-backdrop ${selectionOpen ? "open" : ""}`} onClick={closePanels} />
      <aside id="minha-selecao" className={`selection-drawer ${selectionOpen ? "open" : ""}`} aria-hidden={!selectionOpen} inert={!selectionOpen} aria-label="Minha seleção">
        <header><div><small>Sua sacola de ideias</small><h2>Minha seleção</h2></div><button ref={selectionCloseRef} onClick={closePanels} aria-label="Fechar seleção">×</button></header>
        <div className="selection-items">{selectedProducts.length ? selectedProducts.map(product => <article key={product.id}><ResponsiveImage src={product.imageUrl} sizes="75px" alt="" /><div><Link href={productPath(product.id)} onClick={() => setSelectionOpen(false)}><strong>{product.name}</strong></Link><small>{product.sku}</small></div><button onClick={() => toggleProduct(product.id)} aria-label={`Remover ${product.name} da seleção`}>×</button></article>) : <div className="selection-empty"><span aria-hidden="true">♡</span><h3>Sua seleção está vazia</h3><p>Toque no coração das peças que você gostou.</p></div>}</div>
        {selectedProducts.length > 0 && <div className="selection-footer"><span id="tamanho-label">Seu tamanho mais comum</span><div role="group" aria-labelledby="tamanho-label">{sizes.map(value => <button className={size === value ? "active" : ""} aria-pressed={size === value} key={value} onClick={() => setSize(value)}>{value}</button>)}</div>{size ? <a className="button whatsapp" data-track-product={selectedProducts.map(product => product.id).join(",")} href={wa(checkoutMessage)} target="_blank" rel="noopener noreferrer">Consultar no WhatsApp <ExternalArrow /></a> : <button className="button whatsapp" disabled>Selecione o tamanho</button>}</div>}
      </aside>

      {!panelOpen && (
        <a className="whatsapp-float" href={wa(floatingMessage)} data-track-product={currentProduct?.id} target="_blank" rel="noopener noreferrer" aria-label="Falar com a loja no WhatsApp">
          <WhatsAppIcon /><span>Fale com a gente</span>
        </a>
      )}
    </div>
  );
}

function InfoContent({ info, onClearData, dataCleared }: { info: StoreInfo; onClearData: () => void; dataCleared: boolean }) {
  const wa = () => whatsappLink(info.whatsappNumber);
  const legalParts = [info.legalName || `${info.name} (nome fantasia)`, info.document && `CPF/CNPJ ${info.document}`, `${info.addressLine}, ${info.cityLine}`, `WhatsApp ${info.whatsappDisplay}`, info.email && `E-mail ${info.email}`].filter(Boolean);
  return (
    <section className="info-page">
      <header><p className="eyebrow">Informações</p><h1>Compra, trocas<br /><em>e privacidade.</em></h1></header>
      <section id="compra"><span>01</span><div><h2>Como funciona a compra</h2><p>Este site funciona como vitrine e organizador de preferências. A seleção não reserva peças nem conclui automaticamente uma compra.</p><p>Antes do pedido, a equipe confirma pelo WhatsApp as características da peça, tamanho, preço total, estoque, formas de pagamento, eventual frete e prazo de entrega ou retirada. O pedido só é concluído depois da apresentação dessas condições e da sua concordância.</p></div></section>
      <section id="trocas"><span>02</span><div><h2>Trocas e direito de arrependimento</h2><h3>Trocas voluntárias</h3><p>Condições adicionais de troca por tamanho, cor ou preferência serão informadas pela equipe antes da compra e registradas no comprovante. Essas condições complementam, sem restringir, os direitos previstos em lei.</p><h3>Vício ou defeito</h3><p>Solicitações relacionadas a vício ou defeito seguem integralmente os prazos e garantias previstos pelo Código de Defesa do Consumidor.</p><h3>Compras à distância</h3><p>Nas compras concluídas fora da loja, você pode exercer o direito de arrependimento em até 7 dias, contados da compra ou do recebimento do produto, conforme o art. 49 do Código de Defesa do Consumidor.</p><p>Para solicitar atendimento, fale com a loja pelo WhatsApp <a href={wa()} target="_blank" rel="noopener noreferrer">{info.whatsappDisplay}</a>.</p></div></section>
      <section id="privacidade"><span>03</span><div><h2>Privacidade</h2><p>O site não pede cadastro, não exibe anúncios e não usa ferramentas externas de análise. As peças que você marca, o tamanho escolhido e a preferência de tema ficam guardados apenas neste navegador, para manter sua seleção entre visitas.</p><p>Para saber quais peças despertam mais interesse, o site conta quantas vezes cada botão de WhatsApp é tocado. Essa contagem é anônima: guarda só o número de toques por peça e por dia, sem cookies e sem nenhum dado sobre quem tocou.</p><p>Ao tocar em um botão de WhatsApp, o site apenas prepara uma mensagem. Nada é enviado até você confirmar no WhatsApp; a partir daí, a conversa também segue as políticas do WhatsApp/Meta.</p><p>A hospedagem pode manter registros técnicos necessários para segurança e funcionamento do site.</p><button className="button dark" onClick={onClearData}>Apagar minha seleção deste navegador</button>{dataCleared && <p role="status" className="info-status">Pronto: sua seleção, tamanho e tema foram apagados deste navegador.</p>}</div></section>
      <aside className="info-legal"><h2>Identificação da loja</h2><p>{legalParts.join(" • ")}</p></aside>
    </section>
  );
}

// Minúsculas e sem acentos, para "laco" encontrar "Laço".
function normalize(value: string) {
  return value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function QuizOptions({ title, options, onSelect }: { title: string; options: string[][]; onSelect: (value: string) => void }) {
  return <div><h3>{title}</h3><div className="quiz-options">{options.map(([value, label], index) => <button key={value} onClick={() => onSelect(value)}><span>0{index + 1}</span><strong>{label}</strong></button>)}</div></div>;
}


function DownRightArrow() {
  return <svg className="external-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m7 7 10 10" /><path d="M17 7v10H7" /></svg>;
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

function MoonIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>;
}

function SunIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" /></svg>;
}
