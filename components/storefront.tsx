"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, getCategory } from "@/lib/categories";
import type { StoreContent, StoreProduct } from "@/lib/store-data";

const whatsappBase = "https://wa.me/5512997196086";
const quizCategories: Record<string, string> = { vestidos: "vestidos", tops: "croppeds e blusas", jeans: "jeans e calças", conjuntos: "look completo" };
const quizOccasions: Record<string, string> = { dia: "dia a dia", trabalho: "trabalho", especial: "sair ou ocasião especial" };

type Props = { content: StoreContent; products: StoreProduct[]; mode: "home" | "category"; categorySlug?: string };

export function Storefront({ content, products, mode, categorySlug }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [size, setSize] = useState("");
  const [search, setSearch] = useState("");
  const [quizStep, setQuizStep] = useState(0);
  const [quiz, setQuiz] = useState({ category: "", occasion: "", size: "" });
  const [recommendations, setRecommendations] = useState<StoreProduct[]>([]);

  useEffect(() => {
    try {
      setSelected(JSON.parse(localStorage.getItem("cpm-selection") || "[]"));
      setSize(localStorage.getItem("cpm-size") || "");
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cpm-selection", JSON.stringify(selected));
      if (size) localStorage.setItem("cpm-size", size);
    } catch {}
  }, [selected, size]);

  const category = categorySlug ? getCategory(categorySlug) : undefined;
  const visibleProducts = useMemo(() => {
    const base = mode === "category" ? products.filter(product => product.category === categorySlug) : products;
    const query = search.trim().toLocaleLowerCase("pt-BR");
    const filtered = query ? base.filter(product => `${product.name} ${product.keywords}`.toLocaleLowerCase("pt-BR").includes(query)) : base;
    return mode === "home" && !query ? filtered.slice(0, 4) : filtered;
  }, [products, mode, categorySlug, search]);

  const selectedProducts = selected.map(id => products.find(product => product.id === id)).filter(Boolean) as StoreProduct[];
  const checkoutMessage = selectedProducts.length
    ? `Olá! Montei esta seleção no site da Closet Paula Miranda:\n${selectedProducts.map((product, index) => `${index + 1}. ${product.name} (${product.sku})`).join("\n")}\n\nMeu tamanho mais comum é ${size || "a confirmar"}. Gostaria de confirmar valores, medidas, disponibilidade e entrega ou retirada.`
    : "Olá! Vim pelo site da Closet Paula Miranda e gostaria de ajuda para escolher um look.";

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
      score: ((next.category === "tops" ? ["croppeds", "blusas"].includes(product.category) : product.category === next.category) ? 8 : 0) + (product.occasions.includes(next.occasion) ? 4 : 0),
    })).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 3).map(item => item.product);
    setRecommendations(ranked);
    setQuizStep(3);
  }

  const recommendationMessage = recommendations.length
    ? `Olá! Fiz a Curadoria CPM e recebi estas recomendações:\n${recommendations.map((product, index) => `${index + 1}. ${product.name} (${product.sku})`).join("\n")}\n\nEu procuro ${quizCategories[quiz.category]} para ${quizOccasions[quiz.occasion]}. Meu tamanho mais comum é ${quiz.size}. Gostaria de confirmar valores e disponibilidade.`
    : "";

  return (
    <div className="site-shell">
      <div className="announcement">{content.announcement}</div>
      <header className="header">
        <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><span /><span /></button>
        <a className="brand" href="/"><small>Closet</small><strong>Paula Miranda</strong></a>
        <label className="search"><span className="sr-only">Buscar</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Olá, o que você procura?" /><b>⌕</b></label>
        <a className="account-link" href="/conta"><span className="account-icon">○</span><span>Minha conta</span></a>
        <button className="selection-link" onClick={() => setSelectionOpen(true)}>Seleção <b>{selected.length}</b></button>
      </header>

      <div className={`menu-backdrop ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
      <aside className={`side-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <div className="side-menu-head"><a href="/conta"><span className="person-icon">○</span><strong>Minha conta</strong></a><button onClick={() => setMenuOpen(false)} aria-label="Fechar menu">×</button></div>
        <nav><a className="menu-feature" href="/#curadoria">✦ Curadoria CPM <span>›</span></a>{categories.map(item => <a key={item.slug} href={`/categoria/${item.slug}`}>{item.label}<span>›</span></a>)}<a href="/#loja">Nossa loja<span>›</span></a><a href={whatsappBase} target="_blank" rel="noreferrer">Falar no WhatsApp<span>↗</span></a></nav>
      </aside>

      <main>
        {mode === "home" ? (
          <>
            <section className="hero">
              <div className="hero-copy"><p className="eyebrow">{content.heroEyebrow}</p><h1>{content.heroTitle}<br /><em>{content.heroAccent}</em></h1><p>{content.heroDescription}</p><div><a className="button dark" href="#curadoria">Descobrir meu look</a><a className="text-link" href="#categorias">Comprar por categoria ↘</a></div></div>
              <div className="hero-media"><img src="/assets/look-06-960.webp" alt="Vestido amarelo da Closet Paula Miranda" /><span>Nova<br />coleção<br />✦</span></div>
            </section>
            <section className="category-section" id="categorias"><div className="section-head"><div><p className="eyebrow">Escolha seu mood</p><h2>Compre por categoria</h2></div><p>Cada categoria abre uma página própria, com apenas as peças que você procura.</p></div><div className="category-cards">{categories.map(item => <a key={item.slug} href={`/categoria/${item.slug}`}><img src={item.image} alt="" /><span><strong>{item.label}</strong><small>Ver categoria ↗</small></span></a>)}</div></section>
            <section className="curadoria" id="curadoria"><div className="curadoria-copy"><p className="eyebrow">Exclusividade Closet Paula Miranda</p><h2>{content.curadoriaTitle}</h2><p>{content.curadoriaDescription}</p><ul><li>Sem cadastro</li><li>Recomendação personalizada</li><li>Atendimento humano no WhatsApp</li></ul></div><div className="quiz"><div className="quiz-progress">{quizStep < 3 ? `0${quizStep + 1} / 03` : "RECOMENDAÇÃO PRONTA"}</div>{quizStep === 0 && <QuizOptions title="O que você está procurando hoje?" options={[["vestidos","Um vestido"],["tops","Cropped ou blusa"],["jeans","Jeans ou calça"],["conjuntos","Um look completo"]]} onSelect={value => answerQuiz("category", value)} />}{quizStep === 1 && <QuizOptions title="Para qual momento você quer esse look?" options={[["dia","Dia a dia"],["trabalho","Trabalho"],["especial","Sair ou ocasião especial"]]} onSelect={value => answerQuiz("occasion", value)} />}{quizStep === 2 && <div><h3>Qual tamanho devemos considerar?</h3><div className="size-grid">{["PP","P","M","G","GG"].map(value => <button key={value} onClick={() => answerQuiz("size", value)}>{value}</button>)}</div><small>A equipe confirma modelagem, medidas e disponibilidade.</small></div>}{quizStep === 3 && <div className="quiz-result"><span>Sua Curadoria CPM</span><h3>Seu caminho de estilo está pronto.</h3><p>Selecionamos três opções para {quizOccasions[quiz.occasion]}, considerando o tamanho {quiz.size}.</p><div>{recommendations.map(product => <article key={product.id}><img src={product.imageUrl} alt="" /><strong>{product.name}</strong></article>)}</div><a className="button whatsapp" href={`${whatsappBase}?text=${encodeURIComponent(recommendationMessage)}`} target="_blank" rel="noreferrer">Levar ao WhatsApp ↗</a><button className="restart" onClick={() => { setQuizStep(0); setRecommendations([]); }}>Refazer curadoria</button></div>}</div></section>
          </>
        ) : (
          <section className="category-hero"><div><p className="eyebrow">Closet Paula Miranda / Categoria</p><h1>{category?.label}</h1><p>{category?.description}</p></div><img src={category?.image} alt="" /></section>
        )}

        <section className="products-section"><div className="section-head"><div><p className="eyebrow">Vitrine CPM</p><h2>{mode === "home" ? "Destaques da coleção" : category?.label}</h2></div><p>{mode === "home" ? "Conheça algumas escolhas e entre nas categorias para ver a coleção organizada." : `Peças selecionadas em ${category?.label.toLowerCase()}.`}</p></div>{visibleProducts.length ? <div className="product-grid">{visibleProducts.map(product => <article className="product-card" key={product.id}><div><img src={product.imageUrl} alt={product.name} /><span>{product.tag}</span><button onClick={() => toggleProduct(product.id)} aria-label={`${selected.includes(product.id) ? "Remover" : "Adicionar"} ${product.name}`}>{selected.includes(product.id) ? "♥" : "♡"}</button></div><small>{getCategory(product.category)?.label}</small><h3>{product.name}</h3><p>Valor sob consulta</p><a href={`${whatsappBase}?text=${encodeURIComponent(`Olá! Vi ${product.name} (${product.sku}) no site e gostaria de confirmar valor, medidas e disponibilidade.`)}`} target="_blank" rel="noreferrer">Consultar no WhatsApp ↗</a></article>)}</div> : <div className="empty-category"><span>✦</span><h3>Novidades chegando</h3><p>Esta categoria já está preparada. Enquanto as fotos não chegam, a equipe pode mostrar as opções disponíveis pelo WhatsApp.</p><a className="button whatsapp" href={`${whatsappBase}?text=${encodeURIComponent(`Olá! Gostaria de ver as opções disponíveis em ${category?.label}.`)}`} target="_blank" rel="noreferrer">Ver opções no WhatsApp ↗</a></div>}</section>

        <section className="store" id="loja"><img src="/assets/look-11-960.webp" alt="Fachada da Closet Paula Miranda" /><div><p className="eyebrow">Visite a gente</p><h2>Seu closet,<br /><em>bem de perto.</em></h2><p>Rua Planura, 204 — São José dos Campos, SP</p><p>Seg a sex: 09h às 18h<br />Sábado: 09h às 15h</p><a href={whatsappBase} target="_blank" rel="noreferrer">Combinar uma visita ↗</a></div></section>
      </main>

      <footer><div className="footer-brand"><small>Closet</small><strong>Paula Miranda</strong><p>Para mulheres autênticas, elegantes e despojadas.</p></div><nav>{categories.slice(0,4).map(item => <a key={item.slug} href={`/categoria/${item.slug}`}>{item.label}</a>)}</nav><nav><a href="/conta">Minha conta</a><a href={whatsappBase}>WhatsApp</a><a href="https://www.instagram.com/closetpaulamiranda/">Instagram</a></nav></footer>

      <div className={`selection-backdrop ${selectionOpen ? "open" : ""}`} onClick={() => setSelectionOpen(false)} />
      <aside className={`selection-drawer ${selectionOpen ? "open" : ""}`}><header><div><small>Sua sacola de ideias</small><h2>Minha seleção</h2></div><button onClick={() => setSelectionOpen(false)}>×</button></header><div className="selection-items">{selectedProducts.length ? selectedProducts.map(product => <article key={product.id}><img src={product.imageUrl} alt="" /><div><strong>{product.name}</strong><small>{product.sku}</small></div><button onClick={() => toggleProduct(product.id)}>×</button></article>) : <div className="selection-empty"><span>♡</span><h3>Sua seleção está vazia</h3><p>Toque no coração das peças que você gostou.</p></div>}</div>{selectedProducts.length > 0 && <div className="selection-footer"><span>Seu tamanho mais comum</span><div>{["PP","P","M","G","GG"].map(value => <button className={size === value ? "active" : ""} key={value} onClick={() => setSize(value)}>{value}</button>)}</div><a className={`button whatsapp ${!size ? "disabled" : ""}`} href={size ? `${whatsappBase}?text=${encodeURIComponent(checkoutMessage)}` : "#"} target={size ? "_blank" : undefined} rel="noreferrer">{size ? "Consultar no WhatsApp ↗" : "Selecione o tamanho"}</a></div>}</aside>
    </div>
  );
}

function QuizOptions({ title, options, onSelect }: { title: string; options: string[][]; onSelect: (value: string) => void }) {
  return <div><h3>{title}</h3><div className="quiz-options">{options.map(([value, label], index) => <button key={value} onClick={() => onSelect(value)}><span>0{index + 1}</span><strong>{label}</strong></button>)}</div></div>;
}
